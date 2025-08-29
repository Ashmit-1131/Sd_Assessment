import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import api from '../api';
import { AuthContext } from '../App';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      login(user, token);
    } catch (error) {
      setErr(error?.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      {err && <div className="bg-red-100 text-red-800 p-2 mb-3 rounded">{err}</div>}
      <form onSubmit={onSubmit}>
        <label className="block mb-2">Email</label>
        <input className="w-full p-2 border rounded mb-3" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="block mb-2">Password</label>
        <input type="password" className="w-full p-2 border rounded mb-4" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded">{loading ? 'Logging...' : 'Login'}</button>
      </form>
      <p className="mt-3">Don't have account? <Link to="/register" className="text-blue-600">Register</Link></p>
    </AuthLayout>
  );
}
