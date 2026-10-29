const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All account routes require a valid JWT
router.use(authMiddleware);

// GET /api/account/summary
router.get('/summary', async (req, res) => {
  // Join accounts table with users to get name + account details
  const { data: account, error } = await supabase
    .from('accounts')
    .select('account_number, account_type, balance, currency, users(name)')
    .eq('user_id', req.user.id)
    .single();

  if (error || !account) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  res.json({
    accountNumber: account.account_number,
    accountType: account.account_type,
    balance: account.balance,
    currency: account.currency,
    name: account.users.name,
  });
});

// GET /api/account/transactions
router.get('/transactions', async (req, res) => {
  // Get the account_id for this user first
  const { data: account, error: accError } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', req.user.id)
    .single();

  if (accError || !account) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  // Fetch transactions ordered by most recent
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, type, description, amount, balance_after, created_at')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false });

  if (txError) {
    return res.status(500).json({ message: 'Failed to fetch transactions.' });
  }

  // Normalise field names to match what the frontend already expects
  const normalised = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    description: tx.description,
    amount: tx.amount,
    balance: tx.balance_after,
    date: tx.created_at,
  }));

  res.json({ transactions: normalised });
});

// POST /api/account/transfer
router.post('/transfer', async (req, res) => {
  const { toAccountNumber, amount, description } = req.body;

  if (!toAccountNumber || !amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid recipient account number and amount are required.' });
  }

  const transferAmount = parseFloat(Number(amount).toFixed(2));

  // 1. Get sender's account
  const { data: senderAccount, error: senderErr } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', req.user.id)
    .single();

  if (senderErr || !senderAccount) {
    return res.status(404).json({ message: 'Sender account not found.' });
  }

  if (parseFloat(senderAccount.balance) < transferAmount) {
    return res.status(400).json({ message: 'Insufficient funds.' });
  }

  // 2. Get recipient's account
  const { data: recipientAccount, error: recipientErr } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('account_number', toAccountNumber.trim())
    .single();

  if (recipientErr || !recipientAccount) {
    return res.status(404).json({ message: 'Recipient account not found.' });
  }

  if (recipientAccount.id === senderAccount.id) {
    return res.status(400).json({ message: 'Cannot transfer to your own account.' });
  }

  const senderNewBalance   = parseFloat((parseFloat(senderAccount.balance)    - transferAmount).toFixed(2));
  const recipientNewBalance = parseFloat((parseFloat(recipientAccount.balance) + transferAmount).toFixed(2));
  const note = description?.trim() || 'Transfer';

  // 3. Deduct from sender
  const { error: deductErr } = await supabase
    .from('accounts')
    .update({ balance: senderNewBalance })
    .eq('id', senderAccount.id);

  if (deductErr) {
    return res.status(500).json({ message: 'Transfer failed. Please try again.' });
  }

  // 4. Credit recipient
  const { error: creditErr } = await supabase
    .from('accounts')
    .update({ balance: recipientNewBalance })
    .eq('id', recipientAccount.id);

  if (creditErr) {
    // Rollback sender deduction
    await supabase
      .from('accounts')
      .update({ balance: senderAccount.balance })
      .eq('id', senderAccount.id);
    return res.status(500).json({ message: 'Transfer failed. Please try again.' });
  }

  // 5. Record transactions for both sides
  await supabase.from('transactions').insert([
    {
      account_id:    senderAccount.id,
      type:          'debit',
      description:   `Transfer to ${toAccountNumber.trim()} — ${note}`,
      amount:        transferAmount,
      balance_after: senderNewBalance,
    },
    {
      account_id:    recipientAccount.id,
      type:          'credit',
      description:   `Transfer from ${note}`,
      amount:        transferAmount,
      balance_after: recipientNewBalance,
    },
  ]);

  res.json({
    message: 'Transfer successful.',
    newBalance: senderNewBalance,
  });
});

// ── Helper: debit account + record transaction ──────────────
async function debitAccount(accountId, currentBalance, amount, description) {
  const newBalance = parseFloat((parseFloat(currentBalance) - amount).toFixed(2));

  const { error: updateErr } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId);

  if (updateErr) return { error: updateErr };

  await supabase.from('transactions').insert({
    account_id:    accountId,
    type:          'debit',
    description,
    amount,
    balance_after: newBalance,
  });

  return { newBalance };
}

// POST /api/account/deposit
router.post('/deposit', async (req, res) => {
  const { amount, source } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Enter a valid deposit amount.' });
  }

  const depositAmount = parseFloat(Number(amount).toFixed(2));

  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', req.user.id)
    .single();

  if (accErr || !account) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  const newBalance = parseFloat((parseFloat(account.balance) + depositAmount).toFixed(2));

  await supabase.from('accounts').update({ balance: newBalance }).eq('id', account.id);

  await supabase.from('transactions').insert({
    account_id:    account.id,
    type:          'credit',
    description:   `Deposit${source ? ` — ${source}` : ''}`,
    amount:        depositAmount,
    balance_after: newBalance,
  });

  res.json({ message: 'Deposit successful.', newBalance });
});

// POST /api/account/bills
router.post('/bills', async (req, res) => {
  const { billType, accountRef, amount } = req.body;

  if (!billType || !accountRef || !amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Bill type, reference, and amount are required.' });
  }

  const billAmount = parseFloat(Number(amount).toFixed(2));

  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', req.user.id)
    .single();

  if (accErr || !account) return res.status(404).json({ message: 'Account not found.' });
  if (parseFloat(account.balance) < billAmount) return res.status(400).json({ message: 'Insufficient funds.' });

  const { newBalance, error } = await debitAccount(
    account.id, account.balance, billAmount,
    `${billType} Payment — Ref: ${accountRef}`
  );

  if (error) return res.status(500).json({ message: 'Payment failed. Please try again.' });

  res.json({ message: 'Bill payment successful.', newBalance });
});

// POST /api/account/airtime
router.post('/airtime', async (req, res) => {
  const { phoneNumber, network, amount } = req.body;

  if (!phoneNumber || !network || !amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Phone number, network, and amount are required.' });
  }

  const airtimeAmount = parseFloat(Number(amount).toFixed(2));

  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', req.user.id)
    .single();

  if (accErr || !account) return res.status(404).json({ message: 'Account not found.' });
  if (parseFloat(account.balance) < airtimeAmount) return res.status(400).json({ message: 'Insufficient funds.' });

  const { newBalance, error } = await debitAccount(
    account.id, account.balance, airtimeAmount,
    `Airtime — ${network} ${phoneNumber}`
  );

  if (error) return res.status(500).json({ message: 'Airtime purchase failed. Please try again.' });

  res.json({ message: 'Airtime purchased successfully.', newBalance });
});

// POST /api/account/data
router.post('/data', async (req, res) => {
  const { phoneNumber, network, plan, amount } = req.body;

  if (!phoneNumber || !network || !plan || !amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Phone number, network, plan, and amount are required.' });
  }

  const dataAmount = parseFloat(Number(amount).toFixed(2));

  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', req.user.id)
    .single();

  if (accErr || !account) return res.status(404).json({ message: 'Account not found.' });
  if (parseFloat(account.balance) < dataAmount) return res.status(400).json({ message: 'Insufficient funds.' });

  const { newBalance, error } = await debitAccount(
    account.id, account.balance, dataAmount,
    `Data — ${network} ${plan} → ${phoneNumber}`
  );

  if (error) return res.status(500).json({ message: 'Data purchase failed. Please try again.' });

  res.json({ message: 'Data purchased successfully.', newBalance });
});

module.exports = router;
