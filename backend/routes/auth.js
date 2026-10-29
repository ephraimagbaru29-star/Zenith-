const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // 1. Look up user by email in Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password_hash')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // 2. Verify password against stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // 3. Fetch account details
  const { data: account } = await supabase
    .from('accounts')
    .select('account_number, account_type')
    .eq('user_id', user.id)
    .single();

  // 4. Sign JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      accountNumber: account?.account_number ?? null,
      accountType: account?.account_type ?? null,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
