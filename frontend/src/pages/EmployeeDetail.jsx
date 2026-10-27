import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Field, Spinner } from '../components/ui.jsx';

const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-PK'));
const date = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');

function SalaryForm({ id, onSaved }) {
  const [basic, setBasic] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    try { await api.patch(`/employees/${id}`, { basicSalary: Number(basic) }); setMsg('New salary structure saved. It applies to payroll drafts from now on.'); setBasic(''); onSaved(); } catch (x) { setErr(x.details?.[0]?.reason || x.message); }
  };
  return (
    <form onSubmit={submit}>
      <Alert kind="ok">{msg}</Alert><Alert>{err}</Alert>
      <Field label="New basic salary (monthly)" hint={basic > 0 ? `Gross becomes ${(basic * 1.5).toLocaleString()} (basic + 40% HRA + 10% medical)` : 'Gross = 1.5 × basic'}><input type="number" min="1" step="any" value={basic} onChange={(e) => setBasic(e.target.value)} required /></Field>
      <button>Update salary</button>
    </form>
  );
}

export default function EmployeeDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [e, setE] = useState(null);
  const [err, setErr] = useState(null);
  const load = () => api.get(`/employees/${id}`).then((r) => setE(r.data)).catch((x) => setErr(x.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line
  if (err) return <Alert>{err}</Alert>;
  if (!e) return <Spinner />;
  const rows = [['Employee code', e.employeeCode], ['Email', e.email], ['Phone', e.phone || '—'], ['Address', e.address || '—'], ['Gender', e.gender || '—'],
    ['Department', e.department?.name], ['Designation', e.designation?.title], ['Joined', date(e.joiningDate)], ['Left', date(e.leavingDate)], ['Account role', e.user?.role]];
  return (
    <>
      <Link to="/employees">← Employees</Link>
      <div className="head"><h1>{e.name}</h1><span className={`pill ${e.status}`}>{e.status}</span></div>
      <div className="two">
        <section className="card"><h2>Profile</h2><dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>
        <section className="card">
          <h2>Salary</h2>
          {e.salary ? <dl>{[['Basic', e.salary.basic], ['HRA (40%)', e.salary.hra], ['Medical (10%)', e.salary.medical], ['Gross (1.5 × basic)', e.salary.gross]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{money(v)}</dd></div>)}</dl> : <p className="muted">No salary structure.</p>}
          {user.role !== 'employee' && <SalaryForm id={id} onSaved={load} />}
          <h3>History</h3>
          <ul className="plain">{e.salaryHistory.map((s) => <li key={s._id}>{date(s.effectiveFrom)}: basic {money(s.basic)}, gross {money(s.gross)}</li>)}</ul>
        </section>
      </div>
    </>
  );
}
