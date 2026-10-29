import React, { useState } from 'react';
import api from '../api/axios';
import styles from './TransferModal.module.css';

export default function TransferModal({ currentBalance, onClose, onSuccess }) {
  const [form, setForm] = useState({ toAccountNumber: '', amount: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.toAccountNumber.trim()) {
      return setError('Please enter a recipient account number.');
    }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      return setError('Please enter a valid amount.');
    }
    if (Number(form.amount) > currentBalance) {
      return setError('Amount exceeds your available balance.');
    }

    setLoading(true);
    try {
      const res = await api.post('/account/transfer', {
        toAccountNumber: form.toAccountNumber,
        amount: Number(form.amount),
        description: form.description,
      });
      setDone(true);
      onSuccess(res.data.newBalance);
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="transfer-title">
        <div className={styles.header}>
          <h2 id="transfer-title">Send Money</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {done ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h3>Transfer Successful!</h3>
            <p>New balance: <strong>{formatCurrency(currentBalance)}</strong></p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.balanceHint}>
              Available: <strong>{formatCurrency(currentBalance)}</strong>
            </div>

            {error && (
              <div className={styles.error} role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="toAccountNumber">Recipient Account Number</label>
              <input
                id="toAccountNumber"
                name="toAccountNumber"
                type="text"
                placeholder="ZNT-XXXX-XXXX"
                value={form.toAccountNumber}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="amount">Amount (NGN)</label>
              <div className={styles.amountWrapper}>
                <span className={styles.currencySymbol}>₦</span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="description">Note <span className={styles.optional}>(optional)</span></label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="e.g. Rent, Lunch, etc."
                value={form.description}
                onChange={handleChange}
                maxLength={60}
              />
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : 'Send Money'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
