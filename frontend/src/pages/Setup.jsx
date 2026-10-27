import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Field, fieldErrors } from '../components/ui.jsx';

export default function Setup() {
  const { refresh } = useAuth();
  const [f, setF] = useState({ companyName: '', name: '', email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const fe = fieldErrors(err);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api.post('/setup', f); await refresh(); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <h1>Set up your company</h1>
        <p className="muted">This creates your company and the first Admin account. It only appears once.</p>
        <Alert>{err && !err.details?.length ? err.message : null}</Alert>
        <Field label="Company name" error={fe.companyName}><input value={f.companyName} onChange={set('companyName')} required /></Field>
        <Field label="Your name" error={fe.name}><input value={f.name} onChange={set('name')} required /></Field>
        <Field label="Admin email" error={fe.email}><input type="email" value={f.email} onChange={set('email')} required /></Field>
        <Field label="Password" error={fe.password} hint="At least 8 characters with a letter and a number"><input type="password" value={f.password} onChange={set('password')} required /></Field>
        <button disabled={busy}>{busy ? 'Creating…' : 'Create company'}</button>
      </form>
    </div>
  );
}
