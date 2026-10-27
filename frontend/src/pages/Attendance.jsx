import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import Calendar from '../components/Calendar.jsx';
import Decision from '../components/Decision.jsx';
import { Alert, Empty, Field, Modal, Pager, Spinner, fieldErrors } from '../components/ui.jsx';

const time = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const hrs = (m) => (m ? `${Math.floor(m / 60)}h ${m % 60}m` : '—');

function CorrectionForm({ onDone }) {
  const [f, setF] = useState({ date: '', checkIn: '', checkOut: '', reason: '' });
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const fe = fieldErrors(err);
  const submit = async (e) => {
    e.preventDefault(); setErr(null); setMsg(null);
    const body = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    try { await api.post('/attendance/corrections', body); setMsg('Request sent to HR.'); setF({ date: '', checkIn: '', checkOut: '', reason: '' }); onDone(); } catch (x) { setErr(x); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>Request a correction</h2>
      <Alert kind="ok">{msg}</Alert><Alert>{err && !err.details?.length ? err.message : null}</Alert>
      <div className="grid2">
        <Field label="Date" error={fe.date}><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
        <span />
        <Field label="Correct check-in" error={fe.checkIn}><input type="time" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} /></Field>
        <Field label="Correct check-out" error={fe.checkOut}><input type="time" value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} /></Field>
      </div>
      <Field label="Reason" error={fe.reason}><textarea rows="2" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} required /></Field>
      <button>Send request</button>
    </form>
  );
}

function Corrections({ staff, refreshKey }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const load = useCallback(() => api.get(`/attendance/corrections${qs({ page, limit: 10, status: staff ? 'pending' : '' })}`).then(setData), [page, staff]);
  useEffect(() => { load(); }, [load, refreshKey]);
  if (!data) return <Spinner />;
  return (
    <section className="card">
      <h2>{staff ? 'Pending corrections' : 'My correction requests'}</h2>
      {data.data.length === 0 ? <Empty title={staff ? 'Nothing waiting' : 'No requests yet'}>{staff ? 'New requests from employees appear here.' : 'Requests you send will be listed here.'}</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr>{staff && <th>Employee</th>}<th>Date</th><th>In</th><th>Out</th><th>Reason</th><th>Status</th>{staff && <th />}</tr></thead>
          <tbody>{data.data.map((c) => (
            <tr key={c._id}>{staff && <td>{c.employee?.name}</td>}<td>{c.date}</td><td>{c.checkIn || '—'}</td><td>{c.checkOut || '—'}</td>
              <td>{c.reason}{c.decisionComment && <small>HR: {c.decisionComment}</small>}</td>
              <td><span className={`pill ${c.status}`}>{c.status}</span></td>
              {staff && <td><button className="ghost" onClick={() => setSel(c)}>Review</button></td>}</tr>
          ))}</tbody>
        </table></div>
      )}
      <Pager meta={data.meta} onPage={setPage} />
      {sel && <Decision title="Review correction" summary={`${sel.employee?.name}, ${sel.date}: in ${sel.checkIn || '—'}, out ${sel.checkOut || '—'}. ${sel.reason}`} onClose={() => setSel(null)}
        onSubmit={async (d, c) => { await api.patch(`/attendance/corrections/${sel._id}`, { decision: d, comment: c || undefined }); load(); }} />}
    </section>
  );
}

function Board() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dept, setDept] = useState('');
  const [deps, setDeps] = useState([]);
  const [data, setData] = useState(null);
  const [view, setView] = useState(null);
  useEffect(() => { api.get('/org').then((r) => setDeps(r.data.departments)); }, []);
  useEffect(() => { setData(null); api.get(`/attendance/board${qs({ date, department: dept })}`).then((r) => setData(r.data)); }, [date, dept]);
  return (
    <section className="card">
      <h2>Daily board</h2>
      <div className="filters two-f">
        <input type="date" aria-label="Date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{deps.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
      </div>
      {!data ? <Spinner /> : data.rows.length === 0 ? <Empty title="No employees to show">No active employees had joined by this date.</Empty> : (
        <>
          <p className="muted">{Object.entries(data.totals).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(' · ')}</p>
          <div className="tablewrap"><table>
            <thead><tr><th>Employee</th><th>Department</th><th>Status</th><th>In</th><th>Out</th><th>Worked</th><th /></tr></thead>
            <tbody>{data.rows.map((r) => (
              <tr key={r.employee._id}><td>{r.employee.name}<small>{r.employee.employeeCode}</small></td><td>{r.employee.department}</td>
                <td><span className={`pill ${r.status}`}>{r.status.replace('_', ' ')}</span></td><td>{time(r.checkIn)}</td><td>{time(r.checkOut)}</td><td>{hrs(r.workedMinutes)}</td>
                <td><button className="ghost" onClick={() => setView(r.employee)}>Calendar</button></td></tr>
            ))}</tbody>
          </table></div>
        </>
      )}
      {view && <Modal title={`${view.name}: attendance`} onClose={() => setView(null)}><Calendar employeeId={view._id} /></Modal>}
    </section>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  const staff = user.role !== 'employee';
  const [tab, setTab] = useState(staff ? 'board' : 'mine');
  const [key, setKey] = useState(0);
  return (
    <>
      <h1>Attendance</h1>
      <div className="tabs" role="tablist">
        {staff && <button role="tab" aria-selected={tab === 'board'} onClick={() => setTab('board')}>Daily board</button>}
        {staff && <button role="tab" aria-selected={tab === 'review'} onClick={() => setTab('review')}>Corrections</button>}
        <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>My attendance</button>
      </div>
      {tab === 'board' && <Board />}
      {tab === 'review' && <Corrections staff />}
      {tab === 'mine' && (
        <div className="two">
          <section className="card"><h2>My calendar</h2><Calendar /></section>
          <div><CorrectionForm onDone={() => setKey(key + 1)} /><Corrections refreshKey={key} /></div>
        </div>
      )}
    </>
  );
}
