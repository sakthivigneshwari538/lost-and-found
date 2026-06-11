import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = sessionStorage.getItem('pending_email');
  const name = sessionStorage.getItem('pending_name');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [shakeError, setShakeError] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no pending email
  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleChange(index, value) {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    // Backspace — go to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setToast({ message: 'Please enter the full 6-digit code', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp_code: code });
      login(res.data.access_token);
      sessionStorage.removeItem('pending_email');
      sessionStorage.removeItem('pending_name');
      setToast({ message: 'Account created successfully!', type: 'success' });
      setTimeout(() => navigate('/', { replace: true }), 1000);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Verification failed';
      setToast({ message: detail, type: 'error' });
      setShakeError(true);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setCountdown(600);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setToast({ message: 'New code sent to your email!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to resend code', type: 'error' });
    } finally {
      setResending(false);
    }
  }

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md animate-fade-in-up">
        <Link to="/" className="text-xl font-bold text-indigo-600 mb-8 block text-center">
          Lost & Found
        </Link>

        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Check your email</h1>
          <p className="text-sm text-gray-500 mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-indigo-600 mb-6">{email}</p>

          <form onSubmit={handleSubmit}>
            {/* OTP Inputs */}
            <div className={`flex justify-center gap-2.5 mb-4 ${shakeError ? 'animate-shake' : ''}`}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Timer */}
            <p className="text-sm text-gray-500 mb-5">
              {countdown > 0 ? (
                <>Code expires in <span className="font-semibold text-indigo-600">{formatTime(countdown)}</span></>
              ) : (
                <span className="text-red-500 font-medium">Code expired</span>
              )}
            </p>

            <button type="submit" className="btn-primary w-full" disabled={loading || countdown <= 0}>
              {loading ? <span className="spinner" /> : 'Verify & Create Account'}
            </button>
          </form>

          <div className="mt-5">
            <button
              onClick={handleResend}
              className="text-sm link bg-transparent border-none cursor-pointer"
              disabled={resending}
            >
              {resending ? 'Sending...' : "Didn't get the code? Resend"}
            </button>
          </div>

          <p className="text-sm text-gray-400 mt-4">
            <Link to="/register" className="link">← Back to registration</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
