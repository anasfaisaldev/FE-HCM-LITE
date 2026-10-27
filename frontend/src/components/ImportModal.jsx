import { useState } from 'react';
import { api } from '../api.js';
import { Alert, Modal } from './ui.jsx';

const TEMPLATE = 'employeeCode,name,email,phone,gender,department,designation,joiningDate,status,basicSalary\nE100,Ayesha Khan,ayesha@example.com,0300-1234567,female,Engineering,Developer,2026-01-15,active,80000\n';
const saveText = (text, name) => {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type: 'text/csv' })), download: name });
  a.click(); URL.revokeObjectURL(a.href);
};

export default function ImportModal({ onClose, onDone }) {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [check, setCheck] = useState(null);   // dry-run result
  const [result, setResult] = useState(null); // real import result
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name); setCheck(null); setResult(null); setErr(null);
    const r = new FileReader();
    r.onload = () => setCsv(String(r.result));
    r.readAsText(f);
  };
  const run = async (dryRun) => {
    setBusy(true); setErr(null);
    try {
      const r = (await api.post('/employees/import', { csv, dryRun })).data;
      if (dryRun) setCheck(r); else { setResult(r); onDone(); }
    } catch (x) {
      if (x.details?.length) setCheck({ totalRows: null, validRows: null, errors: x.details }); // file-level problems (missing columns etc.)
      setErr(x.message);
    } finally { setBusy(false); }
  };

  if (result) {
    return (
      <Modal title="Import complete" onClose={onClose}>
        <Alert kind="ok">{result.created.length} employee(s) created.{result.failed.length ? ` ${result.failed.length} failed.` : ''}</Alert>
        {result.failed.map((f) => <Alert key={f.row}>Row {f.row}: {f.reason}</Alert>)}
        <p>Temporary passwords are shown only now. Each person must change theirs at first login.</p>
        <div className="tablewrap"><table><thead><tr><th>Code</th><th>Name</th><th>Temp password</th></tr></thead>
          <tbody>{result.created.map((c) => <tr key={c.row}><td>{c.employeeCode}</td><td>{c.name}</td><td><code>{c.tempPassword}</code></td></tr>)}</tbody></table></div>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={() => saveText(['employeeCode,name,email,tempPassword', ...result.created.map((c) => [c.employeeCode, c.name, c.email, c.tempPassword].join(','))].join('\n'), 'temporary-passwords.csv')}>Download passwords (CSV)</button>
          <button className="ghost" onClick={onClose}>Close</button>
        </div>
      </Modal>
    );
  }
  const clean = check && check.errors.length === 0 && check.totalRows != null;
  return (
    <Modal title="Import employees from CSV" onClose={onClose}>
      <p className="muted">Columns: employeeCode, name, email, department, designation, joiningDate (YYYY-MM-DD), basicSalary are required; phone, gender, status are optional. Department and designation must already exist. Accounts are created as Employee.</p>
      <div className="row"><input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={pick} /><button className="ghost" onClick={() => saveText(TEMPLATE, 'employee-import-template.csv')}>Download template</button></div>
      {fileName && <small>{fileName}</small>}
      <Alert>{err}</Alert>
      {check && (clean
        ? <Alert kind="ok">Dry-run passed: all {check.totalRows} row(s) are valid. Nothing has been imported yet.</Alert>
        : <>
            {check.totalRows != null && <Alert kind="warn">{check.validRows} of {check.totalRows} row(s) valid. Fix the {check.errors.length} problem(s) below and validate again. Nothing was imported.</Alert>}
            <div className="tablewrap" style={{ maxHeight: 260, overflow: 'auto' }}><table>
              <thead><tr><th>Row</th><th>Field</th><th>Reason</th></tr></thead>
              <tbody>{check.errors.map((e, i) => <tr key={i}><td>{e.row}</td><td>{e.field}</td><td>{e.reason}</td></tr>)}</tbody></table></div>
          </>)}
      <div className="row" style={{ marginTop: 12 }}>
        <button disabled={!csv || busy} onClick={() => run(true)}>{busy ? 'Working…' : 'Validate (dry run)'}</button>
        <button disabled={!clean || busy} onClick={() => run(false)}>Import {clean ? check.totalRows : ''} employee(s)</button>
        <button className="ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
