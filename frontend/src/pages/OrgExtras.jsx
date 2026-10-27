import { useState } from 'react';
import { api } from '../api.js';
import { Alert, Empty, Field, Modal } from '../components/ui.jsx';

export default function OrgExtras({ org, canEdit, reload }) {
  const [h, setH] = useState({ date: '', name: '' });
  const [lt, setLt] = useState({ name: '', code: '', annualQuota: '' });
  const [del, setDel] = useState(null);
  const [err, setErr] = useState(null);
  const run = async (fn) => { setErr(null); try { await fn(); reload(); } catch (x) { setErr(x.details?.[0] ? `${x.message}: ${x.details[0].field} ${x.details[0].reason}` : x.message); } };
  const quota = (v) => (v === '' ? null : Number(v));
  return (
    <>
      <section className="card">
        <h2>Leave types</h2>
        <Alert>{err}</Alert>
        <ul className="plain">{org.leaveTypes.map((t) => (
          <li key={t._id} className="row between"><span>{t.name}<small>{t.isPaid ? 'Paid' : 'Unpaid'}</small></span>
            {canEdit ? <input aria-label={`${t.name} yearly quota`} className="qty" type="number" min="0" placeholder="Unlimited" defaultValue={t.annualQuota ?? ''}
              onBlur={(e) => quota(e.target.value) !== t.annualQuota && run(() => api.patch(`/org/leave-types/${t._id}`, { annualQuota: quota(e.target.value) }))} />
              : <span>{t.annualQuota ?? 'Unlimited'}</span>}</li>))}</ul>
        {canEdit && <form className="row" onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post('/org/leave-types', { name: lt.name, code: lt.code, annualQuota: quota(lt.annualQuota), isPaid: true }); setLt({ name: '', code: '', annualQuota: '' }); }); }}>
          <input aria-label="Name" placeholder="Name" value={lt.name} onChange={(e) => setLt({ ...lt, name: e.target.value })} required />
          <input aria-label="Code" placeholder="code" value={lt.code} onChange={(e) => setLt({ ...lt, code: e.target.value })} required />
          <input aria-label="Quota" className="qty" type="number" min="0" placeholder="Quota" value={lt.annualQuota} onChange={(e) => setLt({ ...lt, annualQuota: e.target.value })} />
          <button>Add</button></form>}
        {canEdit && <small>Quota edits apply to new requests only. Leave empty for unlimited.</small>}
      </section>
      <section className="card">
        <h2>Public holidays</h2>
        {org.holidays.length === 0 ? <Empty title="No holidays">Holidays are excluded from leave day counts.</Empty> : (
          <ul className="plain">{org.holidays.map((x) => <li key={x._id} className="row between"><span>{x.date}: {x.name}</span>{canEdit && <button className="ghost" onClick={() => setDel(x)}>Remove</button>}</li>)}</ul>)}
        {canEdit && <form className="row" onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post('/org/holidays', h); setH({ date: '', name: '' }); }); }}>
          <input aria-label="Holiday date" type="date" value={h.date} onChange={(e) => setH({ ...h, date: e.target.value })} required />
          <input aria-label="Holiday name" placeholder="Name" value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} required /><button>Add</button></form>}
      </section>
      {del && <Modal title="Remove holiday?" onClose={() => setDel(null)}><p>{del.date}: {del.name}</p>
        <div className="row"><button className="danger" onClick={() => { run(() => api.delete?.(`/org/holidays/${del._id}`)); setDel(null); }}>Remove</button><button className="ghost" onClick={() => setDel(null)}>Keep</button></div></Modal>}
    </>
  );
}
