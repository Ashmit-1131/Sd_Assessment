import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function UploadTasks(){
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setMsg('Choose a file');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/tasks/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg(res.data.message || 'Uploaded');
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h3 className="text-lg font-semibold mb-3">Upload Tasks (CSV / Excel)</h3>
      {msg && <div className="mb-3">{msg}</div>}
      <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow">
        <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={e => setFile(e.target.files[0])} />
        <div className="mt-4 flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Upload</button>
          <button type="button" onClick={() => navigate('/tasks')} className="px-4 py-2 border rounded">Back</button>
        </div>
      </form>

      <div className="mt-4 text-sm text-slate-600">
        <div>Expected columns (first row): <strong>Task Title, Description, Effort To Complete (In Days), Due Date</strong></div>
      </div>
    </div>
  );
}
