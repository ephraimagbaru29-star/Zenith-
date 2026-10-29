import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import styles from './LoginPage.module.css';
import ZenithLogo from '../components/ZenithLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left panel — branding */}
      <div className={styles.branding}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <ZenithLogo size={52} showText={false} />
            <span className={styles.logoText}>Zenith</span>
          </div>
          <h1 className={styles.tagline}>Banking at the<br />peak of trust.</h1>
          <p className={styles.sub}>
            Secure, modern banking designed around your financial goals.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔒</span>
              <span>Bank-grade security</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⚡</span>
              <span>Instant transfers</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <span>Real-time insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Welcome back</h2>
            <p>Sign in to your Zenith account</p>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@zenith.com"
                value={form.email}
                onChange={handleChange}
                required
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.showToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className={styles.forgotRow}>
              <a href="#" className={styles.forgotLink}>Forgot password?</a>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <span className={styles.spinner} /> : 'Sign In'}
            </button>
          </form>

          <p className={styles.demoHint}>
            Demo credentials: <strong>alex@zenith.com</strong> / <strong>password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
