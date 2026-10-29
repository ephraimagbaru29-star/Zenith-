import React, { useState } from 'react';
import api from '../api/axios';
import modal from './Modal.module.css';

const NETWORKS = ['MTN', 'Airtel', 'Glo', '9mobile', 'Other'];
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function AirtimeModal({ currentBalance, onClose, onSuccess }) {
  const [form, setForm] = useState({ phoneNumber: '', network: '', amount: '' });
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
    if (!form.phoneNumber.trim()) return setError('Enter a phone number.');
    if (!form.network) return setError('Select a network.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    if (Number(form.amount) > currentBalance) return setError('Insufficient funds.');
    setLoading(true);
    try {
      const res = await api.post('/account/airtime', {
        phoneNumber: form.phoneNumber, network: form.network, amount: Number(form.amount),
      });
      setNewBalance(res.data.newBalance);
      setDone(true);
      onSuccess(res.data.newBalance);
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div className={modal.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={modal.box}>
        <div className={modal.header}>
          <h2>📱 Buy Airtime</h2>
          <button className={modal.close} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={modal.success}>
            <div className={modal.successIcon}>✓</div>
            <h3>Airtime Sent!</h3>
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
              <label htmlFor="air-phone">Phone Number</label>
              <input id="air-phone" name="phoneNumber" type="tel"
                placeholder="e.g. 08012345678" value={form.phoneNumber} onChange={handleChange} maxLength={15} />
            </div>

            <div className={modal.field}>
              <label htmlFor="air-network">Network</label>
              <select id="air-network" name="network" value={form.network} onChange={handleChange} className={modal.select}>
                <option value="">Select network...</option>
                {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className={modal.field}>
              <label>Amount (USD)</label>
              <div className={modal.quickAmounts}>
                {QUICK_AMOUNTS.map((a) => (
                  <button key={a} type="button"
                    className={`${modal.quickBtn} ${Number(form.amount) === a ? modal.quickBtnActive : ''}`}
                    onClick={() => { setError(''); setForm((p) => ({ ...p, amount: String(a) })); }}>
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className={modal.amountWrap} style={{ marginTop: '0.5rem' }}>
                <span className={modal.currency}>₦</span>
                <input name="amount" type="number" min="0.01" step="0.01"
                  placeholder="or enter custom amount" value={form.amount} onChange={handleChange} />
              </div>
            </div>

            <div className={modal.actions}>
              <button type="button" className={modal.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={modal.submitBtn} disabled={loading}>
                {loading ? <span className={modal.spinner} /> : 'Buy Airtime'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
