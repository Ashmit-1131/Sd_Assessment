import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../App';

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [effort, setEffort] = useState(0);
  const [due, setDue] = useState('');
  const { logout } = useContext(AuthContext);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const startEdit = (t) => {
    setEditing(t.id);
    setTitle(t.title);
    setDesc(t.description || '');
    setEffort(t.effortDays || 0);
    setDue(t.dueDate || '');
  };

  const saveEdit = async () => {
    try {
      await api.put(`/tasks/${editing}`, { title, description: desc, effortDays: Number(effort), dueDate: due || null });
      await fetchTasks();
      setEditing(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); fetchTasks(); } catch (err) { alert('Delete failed'); }
  };

  const exportExcel = async () => {
    try {
      // Try direct binary
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082'}/api/tasks/export/excel`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      downloadBlob('tasks.xlsx', blob);
    } catch (err) {
      // fallback: base64
      try {
        const r = await api.get('/tasks/export/excel?asBase64=true');
        const b64 = r.data.data;
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob('tasks.xlsx', blob);
      } catch (err2) {
        alert('Export failed');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <div className="flex gap-2">
          <Link to="/tasks/create" className="px-3 py-1 bg-green-600 text-white rounded">New Task</Link>
          <Link to="/tasks/upload" className="px-3 py-1 bg-yellow-500 text-white rounded">Upload</Link>
          <button onClick={exportExcel} className="px-3 py-1 bg-blue-600 text-white rounded">Export to Excel</button>
          <button onClick={() => { logout(); }} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {tasks.map(t => (
            <div key={t.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{t.title}</div>
                <div className="text-sm text-slate-600">{t.description}</div>
                <div className="text-xs text-slate-400">Effort: {t.effortDays} days • Due: {t.dueDate || '—'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(t)} className="px-2 py-1 border rounded">Edit</button>
                <button onClick={() => del(t.id)} className="px-2 py-1 border rounded text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-full max-w-lg">
            <h3 className="font-semibold mb-2">Edit Task</h3>
            <label className="block mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <label className="block mb-1">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <label className="block mb-1">Effort Days</label>
            <input type="number" value={effort} onChange={e => setEffort(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <label className="block mb-1">Due Date</label>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
