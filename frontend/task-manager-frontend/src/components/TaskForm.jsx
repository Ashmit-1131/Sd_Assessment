import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { validateTask } from '../utils/validate';

export default function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effortDays, setEffortDays] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = { title, description, effortDays: Number(effortDays), dueDate: dueDate || null };
    const v = validateTask(payload);
    if (Object.keys(v).length) return setErrors(v);
    try {
      await api.post('/tasks', payload);
      navigate('/tasks');
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || 'Failed to create task' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Create Task</h2>
        <div>
          <button onClick={() => navigate('/tasks')} className="mr-2 px-3 py-1 bg-slate-200 rounded">Back to list</button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow">
        {errors.submit && <div className="text-red-600 mb-2">{errors.submit}</div>}
        <label className="block mb-2">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded mb-3" />
        {errors.title && <div className="text-red-600 mb-2">{errors.title}</div>}

        <label className="block mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded mb-3" />

        <label className="block mb-2">Effort (days)</label>
        <input type="number" value={effortDays} onChange={e => setEffortDays(e.target.value)} className="w-full p-2 border rounded mb-3" />
        {errors.effortDays && <div className="text-red-600 mb-2">{errors.effortDays}</div>}

        <label className="block mb-2">Due Date</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded mb-3" />
        {errors.dueDate && <div className="text-red-600 mb-2">{errors.dueDate}</div>}

        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
          <button type="button" onClick={() => { setTitle(''); setDescription(''); setEffortDays(0); setDueDate(''); }} className="px-4 py-2 border rounded">Reset</button>
        </div>
      </form>
    </div>
  );
}
