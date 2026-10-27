import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Field, fieldErrors } from '../components/ui.jsx';

export default function ChangePassword({ forced }) {
  const { refresh, logout } = useAuth();
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);
  const fe = fieldErrors(err);
  const submit = async (e) => {
    e.preventDefault(); setErr(null); setDone(false);
    try { await api.post('/auth/change-password', f); setDone(true); setF({ currentPassword: '', newPassword: '' }); await refresh(); } catch (x) { setErr(x); }
  };
  const form = (
    <form className={forced ? 'card auth' : 'card narrow'} onSubmit={submit}>
      <h1>{forced ? 'Choose a new password' : 'Change password'}</h1>
      {forced && <p className="muted">You signed in with a temporary password. Set your own to continue.</p>}
      <Alert>{err && !err.details?.length ? err.message : null}</Alert>
      <Alert kind="ok">{done && !forced ? 'Password updated.' : null}</Alert>
      <Field label={forced ? 'Temporary password' : 'Current password'} error={fe.currentPassword}><input type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} required /></Field>
      <Field label="New password" error={fe.newPassword} hint="At least 8 characters with a letter and a number"><input type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required /></Field>
      <div className="row"><button>Update password</button>{forced && <button type="button" className="ghost" onClick={logout}>Sign out</button>}</div>
    </form>
  );
  return forced ? <div className="center">{form}</div> : form;
}
