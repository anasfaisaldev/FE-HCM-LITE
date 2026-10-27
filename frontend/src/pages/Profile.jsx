import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Alert, Field, Spinner } from '../components/ui.jsx';
import ChangePassword from './ChangePassword.jsx';

export default function Profile() {
  const [e, setE] = useState(undefined);
  const [f, setF] = useState({ phone: '', address: '' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    api.get('/employees/me').then((r) => { setE(r.data); setF({ phone: r.data.phone || '', address: r.data.address || '' }); }).catch(() => setE(null));
  }, []);
  const save = async (ev) => {
    ev.preventDefault(); setMsg(null); setErr(null);
    try { await api.patch('/employees/me', f); setMsg('Contact details saved.'); } catch (x) { setErr(x.message); }
  };
  if (e === undefined) return <Spinner />;
  return (
    <>
      <h1>My profile</h1>
      <div className="two">
        {e ? (
          <form className="card" onSubmit={save}>
            <h2>{e.name}</h2>
            <p className="muted">{e.employeeCode} · {e.department?.name} · {e.designation?.title}</p>
            <Alert kind="ok">{msg}</Alert><Alert>{err}</Alert>
            <Field label="Phone"><input value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} /></Field>
            <Field label="Address"><textarea rows="3" value={f.address} onChange={(x) => setF({ ...f, address: x.target.value })} /></Field>
            <button>Save changes</button>
          </form>
        ) : <section className="card"><h2>No employee record</h2><p className="muted">This account is not linked to an employee profile.</p></section>}
        <ChangePassword />
      </div>
    </>
  );
}
