import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import Announcements from '../components/Announcements.jsx';
import Assistant from '../components/Assistant.jsx';
import CheckIn from '../components/CheckIn.jsx';
import { BarList, Kpi, Trend } from '../components/Charts.jsx';
import { Alert, Empty, Spinner } from '../components/ui.jsx';

const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 }));
const pctf = (n) => (n == null ? '—' : `${n}%`);

function Filters({ f, setF, deps }) {
  return (
    <div className="filters three-f">
      <label className="field"><span>From</span><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
      <label className="field"><span>To</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
      <label className="field"><span>Department</span><select value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}><option value="">All departments</option>{deps.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>
    </div>
  );
}

function AiSummary({ filters }) {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => { setS(null); }, [filters.from, filters.to, filters.department]);
  const run = async () => {
    setBusy(true); setErr(null);
    try { setS((await api.post('/ai/dashboard-summary', Object.fromEntries(Object.entries(filters).filter(([, v]) => v)))).data); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <section className="card">
      <div className="head"><h2>AI summary</h2><button className="ghost" disabled={busy} onClick={run}>{busy ? 'Summarising…' : s ? 'Refresh' : 'Generate'}</button></div>
      <Alert>{err}</Alert>
      {!s ? <p className="muted">Summarises the numbers on this dashboard for the selected filters.</p> : <><ul>{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul><small>{s.label}</small></>}
    </section>
  );
}

function AdminView({ d }) {
  const k = d.kpis;
  return (
    <>
      <div className="balances">
        <Kpi label="Headcount" value={k.headcount} hint={`as of ${d.filters.to}`} />
        <Kpi label="Attrition (YTD)" value={pctf(k.attritionYtdPct)} hint={`${d.attrition.leavers} leaver(s) ÷ avg headcount ${((d.attrition.startHeadcount + d.attrition.endHeadcount) / 2).toFixed(1)}`} />
        <Kpi label="Payroll cost" value={money(k.payrollCostGross)} hint={`gross, ${d.payroll.payslips} finalized payslip(s)`} />
        <Kpi label="Average gross salary" value={money(k.averageGross)} hint="per month, in service" />
      </div>
      {k.headcount === 0 && <Empty title="No data yet">Register employees and finalize payroll to see these numbers.</Empty>}
      <div className="two">
        <BarList title="Headcount by department" rows={d.headcountByDepartment} />
        <BarList title="Payroll cost by department (gross)" rows={d.payroll.byDepartment} valueKey="gross" empty="No finalized payroll in this range." />
        <BarList title="Average gross by department" rows={d.salary.byDepartment} valueKey="avgGross" />
        <BarList title="Average gross by designation" rows={d.salary.byDesignation} valueKey="avgGross" />
        <BarList title="Gender" rows={d.gender.map((g) => ({ name: g.label, count: g.count }))} />
        <BarList title="Tenure" rows={d.tenure.map((g) => ({ name: g.label, count: g.count }))} />
      </div>
      <section className="card"><h2>Recent activity</h2>
        {d.auditFeed.length === 0 ? <p className="muted">Nothing recorded yet.</p> : <ul className="plain">{d.auditFeed.map((a) => <li key={a._id}><b>{a.actorName}</b> {a.action.replace(/[._]/g, ' ')}<small>{new Date(a.createdAt).toLocaleString()}</small></li>)}</ul>}
        <Link to="/audit">Open audit log</Link></section>
    </>
  );
}

function HrView({ d }) {
  const k = d.kpis, a = d.attendance;
  return (
    <>
      <div className="balances">
        <Kpi label="Headcount" value={k.headcount} />
        <Kpi label="Present today" value={k.presentToday} hint="checked in" />
        <Kpi label="On leave today" value={k.onLeaveToday} />
        <Kpi label="Late today" value={k.lateToday} />
        <Link to="/leave" className="card stat nolink"><span>Pending approvals</span><strong>{k.pendingApprovals}</strong><small>{k.pendingLeave} leave · {k.pendingCorrections} corrections</small></Link>
      </div>
      <div className="balances">
        <Kpi label="Attendance rate" value={pctf(a.attendanceRatePct)} hint="selected range" />
        <Kpi label="Late %" value={pctf(a.latePct)} hint="late ÷ (present + late)" />
        <Kpi label="Absenteeism" value={pctf(a.absenteeismPct)} hint="absent ÷ expected working days" />
      </div>
      <div className="two">
        <Trend title="Attendance trend" points={d.attendanceTrend} />
        <BarList title="Absenteeism by department" rows={d.absenteeismByDepartment} valueKey="absenteeismPct" suffix="%" empty="No attendance data in this range." />
        <BarList title="Leave by type (approved days)" rows={d.leaveByType.map((l) => ({ name: l.type, days: l.days }))} valueKey="days" empty="No approved leave in this range." />
        <section className="card"><h2>Top 5 late-comers</h2>
          {d.topLateComers.length === 0 ? <p className="muted">No late arrivals in this range.</p> : <ol>{d.topLateComers.map((p) => <li key={p.employeeCode}>{p.employee} <small>{p.department}</small> <b>{p.lateCount}</b></li>)}</ol>}</section>
      </div>
    </>
  );
}

function EmployeeView({ d }) {
  const w = d.week;
  return (
    <>
      <div className="two">
        <CheckIn />
        <section className="card"><h2>This week</h2>
          <p><b>{w.hours}</b> of {w.targetHours} hours</p>
          <div className="meter" role="progressbar" aria-valuenow={w.progressPct} aria-valuemin="0" aria-valuemax="100" aria-label="Weekly hours"><span style={{ width: `${w.progressPct}%` }} /></div>
          <small>{w.from} to {w.to}. {w.note}.</small>
          <dl style={{ marginTop: 12 }}><div><dt>Late arrivals this month</dt><dd>{d.lateCountThisMonth}</dd></div>
            <div><dt>Last payslip</dt><dd>{d.lastPayslip ? <Link to="/payslips">{d.lastPayslip.month}: {money(d.lastPayslip.net)} net</Link> : 'None yet'}</dd></div></dl></section>
      </div>
      <div className="balances">{d.leaveBalances.map((b) => <Kpi key={b.leaveType._id} label={b.leaveType.name} value={b.remaining ?? '∞'} hint={b.quota == null ? `${b.used} taken` : `${b.used} used of ${b.quota}`} />)}</div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const staff = user.role !== 'employee';
  const [f, setF] = useState({ from: '', to: '', department: '' });
  const [deps, setDeps] = useState([]);
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { if (staff) api.get('/org').then((r) => setDeps(r.data.departments)); }, [staff]);
  const load = useCallback(() => {
    setErr(null);
    api.get(`/dashboard${qs(staff ? f : {})}`).then((r) => setD(r.data)).catch((x) => setErr(x.message));
  }, [f, staff]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  return (
    <>
      <h1>Welcome, {user.name}</h1>
      {staff && <div className="two"><CheckIn /></div>}
      {staff && <Filters f={f} setF={setF} deps={deps} />}
      <Alert>{err}</Alert>
      {!d ? (err ? null : <Spinner />) : (
        <>
          {d.role === 'admin' && <AdminView d={d} />}
          {d.role === 'hr' && <HrView d={d} />}
          {d.role === 'employee' && <EmployeeView d={d} />}
          {staff && <AiSummary filters={f} />}
          <div className="two">
            <Announcements items={d.announcements} canPost={staff} onChanged={load} />
            <Assistant role={user.role} />
          </div>
        </>
      )}
    </>
  );
}
