import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import styles from './DashboardPage.module.css';
import TransferModal from '../components/TransferModal';
import DepositModal from '../components/DepositModal';
import BillsModal from '../components/BillsModal';
import AirtimeModal from '../components/AirtimeModal';
import DataModal from '../components/DataModal';
import ZenithLogo from '../components/ZenithLogo';

const ACTIONS = [
  { key: 'qr',       icon: '⊞',  label: 'QR Payment' },
  { key: 'transfer', icon: '⇄',  label: 'Transfer'   },
  { key: 'airtime',  icon: '📱', label: 'Airtime/Data'},
  { key: 'bills',    icon: '🧾', label: 'Bills'       },
  { key: 'bvn',      icon: '◎',  label: 'My BVN'     },
  { key: 'card',     icon: '▬',  label: 'Card'        },
  { key: 'settings', icon: '⚙',  label: 'Settings'   },
];

function groupByDate(transactions) {
  const groups = {};
  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    const key = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  return groups;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.get('/account/summary'),
        api.get('/account/transactions'),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data.transactions);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSuccess = (newBalance) => {
    setSummary((prev) => ({ ...prev, balance: newBalance }));
    setActiveModal(null);
    api.get('/account/transactions').then((res) => setTransactions(res.data.transactions));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const copyAccount = () => {
    if (summary?.accountNumber) {
      navigator.clipboard.writeText(summary.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const balance = summary?.balance ?? 0;
  const grouped = groupByDate(transactions);

  return (
    <div className={styles.shell}>
      <div className={styles.phone}>

        {/* ── Status bar ── */}
        <div className={styles.statusBar}>
          <span className={styles.time}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <div className={styles.statusIcons}>
            <span>▲▲▲</span>
            <span>WiFi</span>
            <span>🔋</span>
          </div>
        </div>

        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.logoMark}>
            <ZenithLogo size={44} showText={false} />
          </div>
          <span className={styles.greeting}>Hello, {user?.name?.split(' ')[0]}</span>
          <button className={styles.profileBtn} onClick={handleLogout} title="Sign out">
            <span className={styles.profileIcon}>👤</span>
          </button>
        </header>

        {/* ── Scrollable content ── */}
        <div className={styles.scroll}>

          {loadingData ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {/* ── Balance card ── */}
              <div className={styles.balanceCard}>
                <div className={styles.balanceTop}>
                  <span className={styles.balanceLabel}>My Balance</span>
                  <span className={styles.activeBadge}>Active</span>
                </div>

                <div className={styles.balanceRow}>
                  <span className={styles.balanceAmount}>
                    {balanceVisible ? formatCurrency(balance) : '****'}
                  </span>
                  <button
                    className={styles.eyeBtn}
                    onClick={() => setBalanceVisible((v) => !v)}
                    aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                  >
                    {balanceVisible ? '👁' : '🙈'}
                  </button>
                </div>

                <div className={styles.divider} />

                <div className={styles.accountRow}>
                  <div>
                    <p className={styles.acctDetailLabel}>Account Details</p>
                    <div className={styles.acctNumberRow}>
                      <span className={styles.acctNumber}>{summary?.accountNumber}</span>
                      <button className={styles.copyBtn} onClick={copyAccount} title="Copy">
                        {copied ? '✓' : '⧉'}
                      </button>
                    </div>
                    <p className={styles.acctName}>{user?.name}</p>
                  </div>
                  <div className={styles.acctTypeBlock}>
                    <p className={styles.acctDetailLabel}>Account Type</p>
                    <p className={styles.acctType}>{summary?.accountType}</p>
                  </div>
                </div>
              </div>

              {/* ── Quick Actions ── */}
              <div className={styles.section}>
                <p className={styles.sectionTitle}>Quick Actions</p>
                <div className={styles.actionsGrid}>
                  {ACTIONS.map((a) => (
                    <button
                      key={a.key}
                      className={styles.actionItem}
                      onClick={() => {
                        if (['transfer','deposit','bills','airtime','data'].includes(a.key)) {
                          setActiveModal(a.key);
                        } else if (a.key === 'qr') {
                          setActiveModal('qr');
                        }
                      }}
                    >
                      <div className={styles.actionIcon}>{a.icon}</div>
                      <span className={styles.actionLabel}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Recent Activity ── */}
              <div className={styles.section}>
                <div className={styles.sectionRow}>
                  <p className={styles.sectionTitle}>Recent Activity</p>
                  <button className={styles.viewAll}>View All</button>
                </div>

                {Object.keys(grouped).length === 0 ? (
                  <p className={styles.empty}>No transactions yet.</p>
                ) : (
                  Object.entries(grouped).map(([date, txs]) => (
                    <div key={date}>
                      <p className={styles.dateLabel}>{date}</p>
                      {txs.map((tx) => (
                        <div key={tx.id} className={styles.txRow}>
                          <div className={styles.txAvatar}>
                            <ZenithLogo size={22} showText={false} />
                          </div>
                          <div className={styles.txInfo}>
                            <p className={styles.txDesc}>{tx.description}</p>
                            <p className={styles.txTime}>{formatTime(tx.date)}</p>
                          </div>
                          <p className={tx.type === 'credit' ? styles.txCredit : styles.txDebit}>
                            {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Bottom nav ── */}
        <nav className={styles.bottomNav}>
          {[
            { key: 'overview',  icon: '⌂',  label: 'Overview'  },
            { key: 'transfer',  icon: '⇄',  label: 'Transfer'  },
            { key: 'support',   icon: '🎧', label: 'Support'   },
            { key: 'more',      icon: '≡',  label: 'More'      },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`${styles.navTab} ${activeTab === tab.key ? styles.navTabActive : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'transfer') setActiveModal('transfer');
              }}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Modals ── */}
      {activeModal === 'transfer' && (
        <TransferModal currentBalance={balance} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      )}
      {activeModal === 'deposit' && (
        <DepositModal onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      )}
      {activeModal === 'bills' && (
        <BillsModal currentBalance={balance} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      )}
      {activeModal === 'airtime' && (
        <AirtimeModal currentBalance={balance} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      )}
      {activeModal === 'data' && (
        <DataModal currentBalance={balance} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      )}
      {activeModal === 'qr' && (
        <div className={styles.qrOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.qrBox}>
            <p className={styles.qrTitle}>QR Payment</p>
            <div className={styles.qrCode}>
              <ZenithLogo size={80} showText={true} textColor="#4a4a4a" />
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem' }}>
                {summary?.accountNumber}
              </p>
            </div>
            <button className={styles.qrClose} onClick={() => setActiveModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
