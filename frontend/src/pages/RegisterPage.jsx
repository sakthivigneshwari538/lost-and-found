import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Toast from '../components/Toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', full_name: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function validate() {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.full_name || form.full_name.length < 2) errs.full_name = 'Name must be at least 2 characters';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/auth/send-otp', form);
      // Store registration data for OTP page
      sessionStorage.setItem('pending_email', form.email);
      sessionStorage.setItem('pending_name', form.full_name);
      setToast({ message: 'Verification code sent to your email!', type: 'success' });
      setTimeout(() => navigate('/verify-otp'), 1500);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Registration failed. Please try again.';
      setToast({ message: detail, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-indigo-600 mb-8 block text-center">
          Lost & Found
        </Link>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 text-center mb-6">We'll send a verification code to your email</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="register-name">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                className={`input-field ${errors.full_name ? 'border-red-400' : ''}`}
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="register-email">
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                placeholder="you@college.edu"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="register-password">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                className={`input-field ${errors.password ? 'border-red-400' : ''}`}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send Verification Code'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="link">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
