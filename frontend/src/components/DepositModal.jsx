import React, { useState } from 'react';
import api from '../api/axios';
import modal from './Modal.module.css';

export default function DepositModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ amount: '', source: '' });
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
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    setLoading(true);
    try {
      const res = await api.post('/account/deposit', { amount: Number(form.amount), source: form.source });
      setNewBalance(res.data.newBalance);
      setDone(true);
      onSuccess(res.data.newBalance);
    } catch (err) {
      setError(err.response?.data?.message || 'Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div className={modal.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={modal.box}>
        <div className={modal.header}>
          <h2>💰 Deposit Funds</h2>
          <button className={modal.close} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={modal.success}>
            <div className={modal.successIcon}>✓</div>
            <h3>Deposit Successful!</h3>
            <p>New balance: <strong>{fmt(newBalance)}</strong></p>
            <button className={modal.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className={modal.error}><span>⚠</span> {error}</div>}

            <div className={modal.field}>
              <label htmlFor="dep-amount">Amount (₦)</label>
              <div className={modal.amountWrap}>
                <span className={modal.currency}>₦</span>
                <input id="dep-amount" name="amount" type="number" min="0.01" step="0.01"
                  placeholder="0.00" value={form.amount} onChange={handleChange} />
              </div>
            </div>

            <div className={modal.field}>
              <label htmlFor="dep-source">Source <span className={modal.opt}>(optional)</span></label>
              <input id="dep-source" name="source" type="text"
                placeholder="e.g. Cash, Cheque, Wire" value={form.source} onChange={handleChange} maxLength={60} />
            </div>

            <div className={modal.actions}>
              <button type="button" className={modal.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={modal.submitBtn} disabled={loading}>
                {loading ? <span className={modal.spinner} /> : 'Deposit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
