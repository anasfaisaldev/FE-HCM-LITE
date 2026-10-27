import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Field } from '../components/ui.jsx';

export default function Login() {
  const { refresh } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api.post('/auth/login', f); await refresh(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <h1>Sign in</h1>
        <Alert>{err}</Alert>
        <Field label="Email"><input type="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Field>
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
