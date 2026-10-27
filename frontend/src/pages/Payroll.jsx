import { useCallback, useEffect, useState } from 'react';
import { api, download, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Empty, Field, Modal, Pager, Spinner } from '../components/ui.jsx';

const money = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const thisMonth = () => new Date().toISOString().slice(0, 7);

function RunDetail({ id, isAdmin, onChanged, onBack }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get(`/payroll/runs/${id}${qs({ page, search, limit: 20 })}`).then(setData).catch((x) => setErr(x.message)), [id, page, search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const act = async (fn) => { setBusy(true); setErr(null); try { await fn(); await load(); onChanged(); } catch (x) { setErr(x.message); } finally { setBusy(false); setConfirm(false); } };
  if (!data) return err ? <Alert>{err}</Alert> : <Spinner />;
  const { run, items } = data.data ? { run: data.data.run, items: data.data.items } : data;
  const draft = run.status === 'draft';
  const t = run.totals || {};
  return (
    <>
      <button className="ghost" onClick={onBack}>← All payroll runs</button>
      <div className="head">
        <h1>Payroll {run.month} <span className={`pill ${draft ? 'pending' : 'approved'}`}>{run.status}</span></h1>
        <div className="row">
          {draft && <button className="ghost" disabled={busy} onClick={() => act(() => api.post('/payroll/runs', { month: run.month }))}>Regenerate draft</button>}
          {draft && isAdmin && <button disabled={busy} onClick={() => setConfirm(true)}>Finalize payroll</button>}
        </div>
      </div>
      {draft && !isAdmin && <Alert kind="warn">This is a draft. Only an Admin can finalize it.</Alert>}
      {!draft && <Alert kind="ok">Finalized and locked. Payslips were sent to employees.</Alert>}
      <Alert>{err}</Alert>
      {run.skipped?.length > 0 && <Alert kind="warn">Skipped: {run.skipped.map((s) => `${s.name} (${s.reason})`).join('; ')}</Alert>}
      <div className="balances">
        {[['Employees', t.headcount], ['Gross', money(t.gross)], ['Deductions', money(t.deductions)], ['Tax', money(t.tax)], ['Net payable', money(t.net)]].map(([k, v]) => <div className="card stat" key={k}><span>{k}</span><strong style={{ fontSize: '1.4rem' }}>{v}</strong></div>)}
      </div>
      <small>Working days in {run.month}: {run.workingDays}. Daily rate = monthly gross ÷ working days.</small>
      <div className="filters two-f"><input aria-label="Search" placeholder="Search name or code" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} /><span /></div>
      {items.length === 0 ? <Empty title="No payslips">{search ? 'No match.' : 'No employee was in service with a salary structure this month.'}</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Employee</th><th className="num">Days</th><th className="num">Absent</th><th className="num">Unpaid</th><th className="num">Half</th><th className="num">Gross</th><th className="num">Deductions</th><th className="num">Tax</th><th className="num">Net</th><th /></tr></thead>
          <tbody>{items.map((s) => (
            <tr key={s._id}><td>{s.employeeName}<small>{s.employeeCode} · {s.department}</small></td>
              <td className="num">{s.eligibleDays}/{s.workingDays}</td><td className="num">{s.absentDays}</td><td className="num">{s.unpaidLeaveDays}</td><td className="num">{s.halfDays}</td>
              <td className="num">{money(s.proratedGross)}</td><td className="num">{money(s.deductions.absence + s.deductions.unpaidLeave + s.deductions.halfDay)}</td><td className="num">{money(s.tax)}</td><td className="num"><b>{money(s.net)}</b></td>
              <td><button className="ghost" onClick={() => download(`/payslips/${s._id}/pdf`, 'payslip.pdf')}>PDF</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
      <Pager meta={data.meta} onPage={setPage} />
      {confirm && <Modal title={`Finalize ${run.month}?`} onClose={() => setConfirm(false)}>
        <p>This locks {t.headcount} payslips totalling <b>{money(t.net)}</b> net. It cannot be undone or regenerated, and employees are notified.</p>
        <div className="row"><button disabled={busy} onClick={() => act(() => api.post(`/payroll/runs/${run._id}/finalize`))}>Finalize payroll</button><button className="ghost" onClick={() => setConfirm(false)}>Cancel</button></div></Modal>}
    </>
  );
}

export default function Payroll() {
  const { user } = useAuth();
  const [runs, setRuns] = useState(null);
  const [month, setMonth] = useState(thisMonth());
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get('/payroll/runs').then((r) => setRuns(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { const r = await api.post('/payroll/runs', { month }); await load(); setOpen(r.data._id); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  if (open) return <RunDetail id={open} isAdmin={user.role === 'admin'} onChanged={load} onBack={() => setOpen(null)} />;
  return (
    <>
      <h1>Payroll</h1>
      <form className="card row" onSubmit={create}>
        <Field label="Month" hint="Creates a draft, or refreshes the existing draft"><input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} required /></Field>
        <button disabled={busy}>{busy ? 'Calculating…' : 'Generate draft'}</button>
      </form>
      <Alert>{err}</Alert>
      {!runs ? <Spinner /> : runs.length === 0 ? <Empty title="No payroll runs yet">Pick a month above. Employees need a salary structure, which is set when they are registered.</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Month</th><th>Status</th><th className="num">Employees</th><th className="num">Net payable</th><th /></tr></thead>
          <tbody>{runs.map((r) => (
            <tr key={r._id}><td>{r.month}</td><td><span className={`pill ${r.status === 'draft' ? 'pending' : 'approved'}`}>{r.status}</span></td>
              <td className="num">{r.totals?.headcount}</td><td className="num">{money(r.totals?.net)}</td><td><button className="ghost" onClick={() => setOpen(r._id)}>Open</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
