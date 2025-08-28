import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import api from '../api';
import { AuthContext } from '../App';

export default function Register() {
  const { login } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token, user } = res.data;
      login(user, token);
    } catch (error) {
      setErr(error?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      {err && <div className="bg-red-100 text-red-800 p-2 mb-3 rounded">{err}</div>}
      <form onSubmit={onSubmit}>
        <label className="block mb-2">Name</label>
        <input className="w-full p-2 border rounded mb-3" value={name} onChange={e => setName(e.target.value)} />
        <label className="block mb-2">Email</label>
        <input className="w-full p-2 border rounded mb-3" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="block mb-2">Password</label>
        <input type="password" className="w-full p-2 border rounded mb-4" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">Register</button>
      </form>
      <p className="mt-3">Already have account? <Link to="/login" className="text-blue-600">Login</Link></p>
    </AuthLayout>
  );
}
