import React, { useState } from 'react';

const LoginForm = () => {
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(formValues);
    // TODO: wire up login API call
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
        <input
          id="password"
          name="password"
          type="password"
          className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          placeholder="••••••••"
          value={formValues.password}
          onChange={handleChange}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full mt-2 rounded-xl bg-green-500 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 active:scale-95"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;