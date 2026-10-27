import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import OrgExtras from './OrgExtras.jsx';
import { Alert, Empty, Field, Spinner, fieldErrors } from '../components/ui.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AddOne({ label, path, field, onAdded }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setErr(null);
    try { await api.post(path, { [field]: v }); setV(''); onAdded(); } catch (x) { setErr(x.message); }
  };
  return (
    <form className="row" onSubmit={submit}>
      <input aria-label={label} placeholder={label} value={v} onChange={(e) => setV(e.target.value)} required />
      <button>Add</button>
      {err && <small className="err">{err}</small>}
    </form>
  );
}

export default function Organization() {
  const { user } = useAuth();
  const canEdit = user.role === 'admin';
  const [org, setOrg] = useState(null);
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = () => api.get('/org').then((r) => {
    setOrg(r.data);
    const c = r.data.company;
    setF({ name: c.name, officeStart: c.officeStart, graceMinutes: c.graceMinutes, weekend: c.weekend, lat: c.geo?.lat ?? '', lng: c.geo?.lng ?? '', radiusMeters: c.geo?.radiusMeters ?? 200, requireCamera: !!c.requireCameraCheckIn });
  });
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    const num = (v) => (v === '' ? null : Number(v));
    try {
      await api.put('/org/settings', { name: f.name, officeStart: f.officeStart, graceMinutes: Number(f.graceMinutes), weekend: f.weekend, requireCameraCheckIn: f.requireCamera, geo: { lat: num(f.lat), lng: num(f.lng), radiusMeters: Number(f.radiusMeters) } });
      setMsg('Settings saved. Changes apply to new records only.'); load();
    } catch (x) { setErr(x); }
  };
  const fe = fieldErrors(err);
  if (!org || !f) return <Spinner />;
  const toggleDay = (d) => setF({ ...f, weekend: f.weekend.includes(d) ? f.weekend.filter((x) => x !== d) : [...f.weekend, d] });

  return (
    <>
      <h1>Organization</h1>
      <div className="two">
        <form className="card" onSubmit={save}>
          <h2>Company rules</h2>
          <Alert kind="ok">{msg}</Alert><Alert>{err && !err.details?.length ? err.message : null}</Alert>
          <fieldset disabled={!canEdit}>
            <Field label="Company name" error={fe.name}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <div className="grid2">
              <Field label="Office start" error={fe.officeStart}><input type="time" value={f.officeStart} onChange={(e) => setF({ ...f, officeStart: e.target.value })} /></Field>
              <Field label="Grace period (minutes)" error={fe.graceMinutes}><input type="number" min="0" max="120" value={f.graceMinutes} onChange={(e) => setF({ ...f, graceMinutes: e.target.value })} /></Field>
            </div>
            <div className="field"><span>Weekend</span><div className="row">{DAYS.map((d, i) => <label key={d} className="check"><input type="checkbox" checked={f.weekend.includes(i)} onChange={() => toggleDay(i)} />{d}</label>)}</div></div>
            <div className="grid2">
              <Field label="Office latitude" error={fe['geo.lat']}><input type="number" step="any" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} /></Field>
              <Field label="Office longitude" error={fe['geo.lng']}><input type="number" step="any" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} /></Field>
              <Field label="Allowed radius (metres)" error={fe['geo.radiusMeters']}><input type="number" min="10" max="5000" value={f.radiusMeters} onChange={(e) => setF({ ...f, radiusMeters: e.target.value })} /></Field>
            </div>
            <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" checked={f.requireCamera} onChange={(e) => setF({ ...f, requireCamera: e.target.checked })} />Require camera + GPS check for check-in/out (needs office latitude and longitude)</label>
            {fe['geo.lat'] && <small className="err">{fe['geo.lat']}</small>}
          </fieldset>
          {canEdit ? <button>Save settings</button> : <p className="muted">Only Admin can change company rules.</p>}
        </form>
        <div>
          <section className="card">
            <h2>Departments</h2>
            {org.departments.length === 0 ? <Empty title="No departments">{canEdit ? 'Add your first one below.' : 'An Admin needs to add them.'}</Empty> : <ul className="plain">{org.departments.map((d) => <li key={d._id}>{d.name}</li>)}</ul>}
            {canEdit && <AddOne label="New department" path="/org/departments" field="name" onAdded={load} />}
          </section>
          <section className="card">
            <h2>Designations</h2>
            {org.designations.length === 0 ? <Empty title="No designations">{canEdit ? 'Add your first one below.' : 'An Admin needs to add them.'}</Empty> : <ul className="plain">{org.designations.map((d) => <li key={d._id}>{d.title}</li>)}</ul>}
            {canEdit && <AddOne label="New designation" path="/org/designations" field="title" onAdded={load} />}
          </section>
          <OrgExtras org={org} canEdit={canEdit} reload={load} />
        </div>
      </div>
    </>
  );
}
