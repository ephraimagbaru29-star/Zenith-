import React, { useState } from 'react';
import api from '../api/axios';
import modal from './Modal.module.css';

const BILL_TYPES = ['Electricity', 'Water', 'Internet', 'TV Subscription', 'Insurance', 'Other'];

export default function BillsModal({ currentBalance, onClose, onSuccess }) {
  const [form, setForm] = useState({ billType: '', accountRef: '', amount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [newBalance, setNewBalance] = useState(null);

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.billType) return setError('Select a bill type.');
    if (!form.accountRef.trim()) return setError('Enter an account/reference number.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    if (Number(form.amount) > currentBalance) return setError('Insufficient funds.');
    setLoading(true);
    try {
      const res = await api.post('/account/bills', {
        billType: form.billType, accountRef: form.accountRef, amount: Number(form.amount),
      });
      setNewBalance(res.data.newBalance);
      setDone(true);
      onSuccess(res.data.newBalance);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div className={modal.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={modal.box}>
        <div className={modal.header}>
          <h2>🧾 Bills Payment</h2>
          <button className={modal.close} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={modal.success}>
            <div className={modal.successIcon}>✓</div>
            <h3>Payment Successful!</h3>
            <p>New balance: <strong>{fmt(newBalance)}</strong></p>
            <button className={modal.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className={modal.balanceHint}>
              Available: <strong>{fmt(currentBalance)}</strong>
            </div>
            {error && <div className={modal.error}><span>⚠</span> {error}</div>}

            <div className={modal.field}>
              <label htmlFor="bill-type">Bill Type</label>
              <select id="bill-type" name="billType" value={form.billType} onChange={handleChange} className={modal.select}>
                <option value="">Select bill type...</option>
                {BILL_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className={modal.field}>
              <label htmlFor="bill-ref">Account / Meter Number</label>
              <input id="bill-ref" name="accountRef" type="text"
                placeholder="e.g. 12345678" value={form.accountRef} onChange={handleChange} maxLength={40} />
            </div>

            <div className={modal.field}>
              <label htmlFor="bill-amount">Amount (₦)</label>
              <div className={modal.amountWrap}>
                <span className={modal.currency}>₦</span>
                <input id="bill-amount" name="amount" type="number" min="0.01" step="0.01"
                  placeholder="0.00" value={form.amount} onChange={handleChange} />
              </div>
            </div>

            <div className={modal.actions}>
              <button type="button" className={modal.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={modal.submitBtn} disabled={loading}>
                {loading ? <span className={modal.spinner} /> : 'Pay Bill'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
