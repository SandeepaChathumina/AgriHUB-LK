import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const initialFormState = {
    email: '',
    password: '',
  };

  const [formValues, setFormValues] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.message || 'Login failed. Please try again.';
        throw new Error(message);
      }

      const data = await response.json();
      
      login(data.user, data.token);

      setStatus({ type: 'success', message: 'Login successful. Redirecting...' });
      toast.success('Login successful');
      setFormValues(initialFormState);
      
      // Redirect based on role
      const targetRoute = data?.user?.role === 'Admin' ? '/admin-dashboard' : '/dashboard';
      navigate(targetRoute, { replace: true });
      
    } catch (error) {
      const message = error?.message || 'Login failed. Please try again.';
      setStatus({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6 w-full max-w-md" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-800" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          placeholder="you@example.com"
          value={formValues.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-800" htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            placeholder="••••••••"
            value={formValues.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18" />
                <path d="M10.73 10.73a2 2 0 0 0 2.54 2.54" />
                <path d="M9.88 5.12A9.53 9.53 0 0 1 12 5c5 0 9 4 9 7 0 1.22-.55 2.57-1.5 3.82" />
                <path d="M6.61 6.61C4.06 7.9 2 10.36 2 12c0 1.18.57 2.46 1.57 3.65" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {status.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
        >
          {status.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 rounded-xl bg-green-500 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>

      <div className="text-right text-sm text-emerald-700 font-semibold">
        <button type="button" onClick={() => navigate('/forgot-password')} className="underline hover:text-emerald-800">
          Forgot password?
        </button>
      </div>
    </form>
  );
};

export default LoginForm;