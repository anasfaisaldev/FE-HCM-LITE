import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import Decision from '../components/Decision.jsx';
import { Alert, Empty, Field, Modal, Pager, Spinner, fieldErrors } from '../components/ui.jsx';

function SmartLeave({ onPrefill }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null); setRes(null);
    try { const r = (await api.post('/ai/leave-parse', { text })).data; setRes(r); if (r.prefill) onPrefill(r.prefill); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <form className="card" onSubmit={go}>
      <h2>Smart leave</h2>
      <Field label="Describe your leave" hint='e.g. "I need next Monday and Tuesday off for a wedding"'><textarea rows="2" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} required /></Field>
      <button disabled={busy || text.trim().length < 3}>{busy ? 'Reading…' : 'Fill the form for me'}</button>
      <Alert>{err}</Alert>
      {res && (res.prefill ? <Alert kind="ok">{res.label}. {res.workingDays} working day(s). Check the form below, then submit.</Alert> : <Alert kind="warn">{res.label}</Alert>)}
      {res?.warnings?.map((w) => <Alert key={w} kind="warn">{w}</Alert>)}
    </form>
  );
}

function Apply({ types, onDone, prefill }) {
  const [f, setF] = useState({ leaveType: '', startDate: '', endDate: '', reason: '' });
  useEffect(() => { if (prefill) setF({ leaveType: prefill.leaveType, startDate: prefill.startDate, endDate: prefill.endDate, reason: prefill.reason || '' }); }, [prefill]);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const fe = fieldErrors(err);
  const submit = async (e) => {
    e.preventDefault(); setErr(null); setMsg(null);
    try {
      const r = await api.post('/leave/requests', { ...f, reason: f.reason || undefined });
      setMsg(`Request sent: ${r.data.days} working day(s).`); setF({ leaveType: '', startDate: '', endDate: '', reason: '' }); onDone();
    } catch (x) { setErr(x); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>Apply for leave</h2>
      <Alert kind="ok">{msg}</Alert><Alert>{err && !err.details?.length ? err.message : null}</Alert>
      {err?.details?.length > 0 && <Alert>{err.message}: {err.details.map((d) => d.reason).join(', ')}</Alert>}
      <Field label="Leave type" error={fe.leaveType}><select value={f.leaveType} onChange={(e) => setF({ ...f, leaveType: e.target.value })} required><option value="">Select…</option>{types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Field>
      <div className="grid2">
        <Field label="From" error={fe.startDate}><input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} required /></Field>
        <Field label="To" error={fe.endDate}><input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} required /></Field>
      </div>
      <Field label="Reason" hint="Weekends and public holidays are not counted"><textarea rows="2" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
      <button>Submit request</button>
    </form>
  );
}

function Requests({ staff, refreshKey, onChange }) {
  const [status, setStatus] = useState(staff ? 'pending' : '');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(() => api.get(`/leave/requests${qs({ status, page, limit: 10 })}`).then(setData), [status, page]);
  useEffect(() => { load(); }, [load, refreshKey]);
  const doCancel = async () => { try { await api.post(`/leave/requests/${cancel._id}/cancel`); setCancel(null); load(); onChange?.(); } catch (x) { setErr(x.message); setCancel(null); } };
  return (
    <section className="card">
      <div className="head"><h2>{staff ? 'Leave requests' : 'My requests'}</h2>
        <select aria-label="Status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}><option value="">All</option>{['pending', 'approved', 'rejected', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select></div>
      <Alert>{err}</Alert>
      {!data ? <Spinner /> : data.data.length === 0 ? <Empty title="No requests">{staff ? 'Nothing matches this filter.' : 'Your leave requests will appear here.'}</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr>{staff && <th>Employee</th>}<th>Type</th><th>Dates</th><th className="num">Days</th><th>Status</th><th /></tr></thead>
          <tbody>{data.data.map((r) => (
            <tr key={r._id}>{staff && <td>{r.employee?.name}</td>}<td>{r.leaveType?.name}{r.reason && <small>{r.reason}</small>}</td>
              <td>{r.startDate} → {r.endDate}</td><td className="num">{r.days}</td>
              <td><span className={`pill ${r.status}`}>{r.status}</span>{r.decisionComment && <small>{r.decisionComment}</small>}</td>
              <td className="row">
                {staff && r.status === 'pending' && <button className="ghost" onClick={() => setSel(r)}>Review</button>}
                {(r.status === 'pending' || (r.status === 'approved' && r.startDate > new Date().toISOString().slice(0, 10))) && !staff && <button className="ghost" onClick={() => setCancel(r)}>Cancel</button>}
              </td></tr>
          ))}</tbody>
        </table></div>
      )}
      <Pager meta={data?.meta} onPage={setPage} />
      {sel && <Decision title="Review leave request" summary={`${sel.employee?.name}: ${sel.leaveType?.name}, ${sel.startDate} to ${sel.endDate} (${sel.days} working days).`} onClose={() => setSel(null)}
        onSubmit={async (d, c) => { await api.patch(`/leave/requests/${sel._id}/decision`, { decision: d, comment: c || undefined }); load(); }} />}
      {cancel && <Modal title="Cancel this request?" onClose={() => setCancel(null)}>
        <p>{cancel.leaveType?.name}, {cancel.startDate} to {cancel.endDate}. This returns the days to your balance.</p>
        <div className="row"><button className="danger" onClick={doCancel}>Cancel request</button><button className="ghost" onClick={() => setCancel(null)}>Keep it</button></div></Modal>}
    </section>
  );
}

export default function Leave() {
  const { user } = useAuth();
  const staff = user.role !== 'employee';
  const [bal, setBal] = useState(null);
  const [noProfile, setNoProfile] = useState(false);
  const [key, setKey] = useState(0);
  const [types, setTypes] = useState([]);
  const [tab, setTab] = useState(staff ? 'review' : 'mine');
  const [prefill, setPrefill] = useState(null);
  const refresh = () => { setKey((k) => k + 1); api.get('/leave/balance').then((r) => setBal(r.data)).catch(() => setNoProfile(true)); };
  useEffect(() => { refresh(); api.get('/org').then((r) => setTypes(r.data.leaveTypes)); }, []); // eslint-disable-line

  return (
    <>
      <h1>Leave</h1>
      {staff && <div className="tabs" role="tablist"><button role="tab" aria-selected={tab === 'review'} onClick={() => setTab('review')}>Approvals</button><button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>My leave</button></div>}
      {tab === 'review' && staff && <Requests staff refreshKey={key} />}
      {tab === 'mine' && (noProfile ? <Empty title="No employee profile">This account is not linked to an employee record, so it has no leave balance.</Empty> : (
        <>
          {!bal ? <Spinner /> : <div className="balances">{bal.balances.map((b) => (
            <div className="card stat" key={b.leaveType._id}><span>{b.leaveType.name}</span><strong>{b.remaining ?? '∞'}</strong>
              <small>{b.quota == null ? `${b.used} taken (unlimited)` : `${b.used} used, ${b.pending} pending of ${b.quota}`}</small></div>))}</div>}
          <div className="two"><div><SmartLeave onPrefill={setPrefill} /><Apply types={types} prefill={prefill} onDone={refresh} /></div><Requests refreshKey={key} onChange={refresh} /></div>
        </>
      ))}
    </>
  );
}
