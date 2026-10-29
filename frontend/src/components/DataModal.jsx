import React, { useState } from 'react';
import api from '../api/axios';
import modal from './Modal.module.css';

const NETWORKS = ['MTN', 'Airtel', 'Glo', '9mobile', 'Other'];

const DATA_PLANS = {
  MTN:     ['1GB — $2', '2GB — $3.50', '5GB — $7', '10GB — $12', '20GB — $20'],
  Airtel:  ['1GB — $1.80', '3GB — $4', '5GB — $6.50', '10GB — $11', '20GB — $18'],
  Glo:     ['1GB — $1.50', '2GB — $2.80', '5GB — $6', '10GB — $10', '25GB — $20'],
  '9mobile':['500MB — $1', '1.5GB — $2.50', '4.5GB — $6', '10GB — $10'],
  Other:   ['Custom Plan'],
};

function parsePlanPrice(plan) {
  const match = plan.match(/\$(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

export default function DataModal({ currentBalance, onClose, onSuccess }) {
  const [form, setForm] = useState({ phoneNumber: '', network: '', plan: '', amount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [newBalance, setNewBalance] = useState(null);

  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    if (name === 'network') {
      setForm((p) => ({ ...p, network: value, plan: '', amount: '' }));
    } else if (name === 'plan') {
      const price = parsePlanPrice(value);
      setForm((p) => ({ ...p, plan: value, amount: price > 0 ? String(price) : p.amount }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phoneNumber.trim()) return setError('Enter a phone number.');
    if (!form.network) return setError('Select a network.');
    if (!form.plan) return setError('Select a data plan.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    if (Number(form.amount) > currentBalance) return setError('Insufficient funds.');
    setLoading(true);
    try {
      const res = await api.post('/account/data', {
        phoneNumber: form.phoneNumber, network: form.network,
        plan: form.plan, amount: Number(form.amount),
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
  const plans = form.network ? DATA_PLANS[form.network] ?? [] : [];

  return (
    <div className={modal.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={modal.box}>
        <div className={modal.header}>
          <h2>🌐 Buy Data</h2>
          <button className={modal.close} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={modal.success}>
            <div className={modal.successIcon}>✓</div>
            <h3>Data Purchased!</h3>
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
              <label htmlFor="data-phone">Phone Number</label>
              <input id="data-phone" name="phoneNumber" type="tel"
                placeholder="e.g. 08012345678" value={form.phoneNumber} onChange={handleChange} maxLength={15} />
            </div>

            <div className={modal.field}>
              <label htmlFor="data-network">Network</label>
              <select id="data-network" name="network" value={form.network} onChange={handleChange} className={modal.select}>
                <option value="">Select network...</option>
                {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {plans.length > 0 && (
              <div className={modal.field}>
                <label htmlFor="data-plan">Data Plan</label>
                <select id="data-plan" name="plan" value={form.plan} onChange={handleChange} className={modal.select}>
                  <option value="">Select plan...</option>
                  {plans.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <div className={modal.field}>
              <label htmlFor="data-amount">Amount (₦)</label>
              <div className={modal.amountWrap}>
                <span className={modal.currency}>₦</span>
                <input id="data-amount" name="amount" type="number" min="0.01" step="0.01"
                  placeholder="0.00" value={form.amount} onChange={handleChange} />
              </div>
            </div>

            <div className={modal.actions}>
              <button type="button" className={modal.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={modal.submitBtn} disabled={loading}>
                {loading ? <span className={modal.spinner} /> : 'Buy Data'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
