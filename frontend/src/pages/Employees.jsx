import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import ImportModal from '../components/ImportModal.jsx';
import { Alert, Empty, Field, Modal, Pager, Spinner, fieldErrors } from '../components/ui.jsx';

const STATUSES = ['active', 'probation', 'resigned', 'terminated'];
const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-PK'));

function RegisterForm({ org, onDone, onClose, actorRole }) {
  const [f, setF] = useState({ employeeCode: '', name: '', email: '', phone: '', gender: '', department: '', designation: '', joiningDate: '', status: 'active', basicSalary: '', role: 'employee' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const fe = fieldErrors(err);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const body = { ...f, basicSalary: Number(f.basicSalary) };
    if (!body.phone) delete body.phone;
    if (!body.gender) delete body.gender;
    try { const r = await api.post('/employees', body); setCreated(r.data); } catch (x) { setErr(x); } finally { setBusy(false); }
  };

  if (created) {
    return (
      <Modal title="Employee registered" onClose={() => { onDone(); onClose(); }}>
        <Alert kind="ok">{created.employee.name} can now sign in.</Alert>
        <p>Share this temporary password securely. It is shown only once and must be changed at first login.</p>
        <code className="temp">{created.tempPassword}</code>
        <button onClick={() => navigator.clipboard?.writeText(created.tempPassword)}>Copy password</button>
      </Modal>
    );
  }
  return (
    <Modal title="Register employee" onClose={onClose}>
      <form onSubmit={submit} className="grid2">
        <Alert>{err && !err.details?.length ? err.message : null}</Alert>
        <Field label="Employee code" error={fe.employeeCode}><input value={f.employeeCode} onChange={set('employeeCode')} required /></Field>
        <Field label="Full name" error={fe.name}><input value={f.name} onChange={set('name')} required /></Field>
        <Field label="Email" error={fe.email}><input type="email" value={f.email} onChange={set('email')} required /></Field>
        <Field label="Phone" error={fe.phone}><input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Department" error={fe.department}>
          <select value={f.department} onChange={set('department')} required><option value="">Select…</option>{org.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
        </Field>
        <Field label="Designation" error={fe.designation}>
          <select value={f.designation} onChange={set('designation')} required><option value="">Select…</option>{org.designations.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}</select>
        </Field>
        <Field label="Joining date" error={fe.joiningDate}><input type="date" value={f.joiningDate} onChange={set('joiningDate')} required /></Field>
        <Field label="Employment status" error={fe.status}>
          <select value={f.status} onChange={set('status')}>{STATUSES.slice(0, 2).map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Basic salary (monthly)" error={fe.basicSalary} hint={f.basicSalary > 0 ? `Gross = ${money(f.basicSalary * 1.5)} (basic + 40% HRA + 10% medical)` : 'Gross is 1.5 × basic'}>
          <input type="number" min="1" step="any" value={f.basicSalary} onChange={set('basicSalary')} required />
        </Field>
        <Field label="Gender" error={fe.gender}>
          <select value={f.gender} onChange={set('gender')}><option value="">Not specified</option><option>male</option><option>female</option><option>other</option></select>
        </Field>
        {actorRole === 'admin' && (
          <Field label="Account role" error={fe.role}><select value={f.role} onChange={set('role')}><option>employee</option><option>hr</option><option>admin</option></select></Field>
        )}
        <div className="row full"><button disabled={busy}>{busy ? 'Registering…' : 'Register employee'}</button><button type="button" className="ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

export default function Employees() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ search: '', department: '', status: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { api.get('/org').then((r) => setOrg(r.data)); }, []);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await api.get(`/employees${qs({ ...filters, page, limit: 15 })}`); setData(r); } catch (x) { setError(x.message); }
  }, [filters, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const setFilter = (k) => (e) => { setPage(1); setFilters({ ...filters, [k]: e.target.value }); };
  const exportCsv = async () => {
    const res = await api.raw(`/employees/export.csv${qs(filters)}`);
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: 'employees.csv' });
    a.click(); URL.revokeObjectURL(url);
  };
  const ready = org && org.departments.length && org.designations.length;

  return (
    <>
      <div className="head">
        <h1>Employees</h1>
        <div className="row">
          <button className="ghost" onClick={exportCsv}>Export CSV</button>
          <button className="ghost" onClick={() => setShowImport(true)} disabled={!ready} title={ready ? '' : 'Create a department and designation first'}>Import CSV</button>
          <button onClick={() => setShowForm(true)} disabled={!ready} title={ready ? '' : 'Create a department and designation first'}>Register employee</button>
        </div>
      </div>
      {org && !ready && <Alert kind="warn">Registration needs at least one department and one designation. {user.role === 'admin' ? 'Add them under Organization.' : 'Ask an Admin to add them under Organization.'}</Alert>}
      <div className="filters">
        <input aria-label="Search" placeholder="Search name, email or code" value={filters.search} onChange={setFilter('search')} />
        <select aria-label="Department" value={filters.department} onChange={setFilter('department')}><option value="">All departments</option>{org?.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
        <select aria-label="Status" value={filters.status} onChange={setFilter('status')}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <Alert>{error}</Alert>
      {!data ? <Spinner /> : data.data.length === 0 ? (
        <Empty title={Object.values(filters).some(Boolean) ? 'No matches' : 'No employees yet'}>{Object.values(filters).some(Boolean) ? 'Try clearing a filter.' : 'Register your first employee to get started.'}</Empty>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Designation</th><th>Status</th><th className="num">Gross / month</th></tr></thead>
            <tbody>
              {data.data.map((e) => (
                <tr key={e._id}>
                  <td>{e.employeeCode}</td>
                  <td><Link to={`/employees/${e._id}`}>{e.name}</Link><small>{e.email}</small></td>
                  <td>{e.department?.name}</td><td>{e.designation?.title}</td>
                  <td><span className={`pill ${e.status}`}>{e.status}</span></td>
                  <td className="num">{money(e.salary?.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={data?.meta} onPage={setPage} />
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={load} />}
      {showForm && org && <RegisterForm org={org} actorRole={user.role} onClose={() => setShowForm(false)} onDone={load} />}
    </>
  );
}
