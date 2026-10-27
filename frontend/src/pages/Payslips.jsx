import { useEffect, useState } from 'react';
import { api, download } from '../api.js';
import { Alert, Empty, Spinner } from '../components/ui.jsx';

const money = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Payslips() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.get('/payslips').then((r) => setRows(r.data)).catch((x) => setErr(x.status === 404 ? 'This account has no employee profile, so it has no payslips.' : x.message)); }, []);
  if (err) return <><h1>My payslips</h1><Alert kind="warn">{err}</Alert></>;
  if (!rows) return <Spinner />;
  return (
    <>
      <h1>My payslips</h1>
      {rows.length === 0 ? <Empty title="No payslips yet">A payslip appears here after the Admin finalizes payroll for a month.</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Month</th><th className="num">Gross</th><th className="num">Deductions</th><th className="num">Tax</th><th className="num">Net pay</th><th /></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s._id}><td>{s.month}</td><td className="num">{money(s.proratedGross)}</td>
              <td className="num">{money(s.deductions.absence + s.deductions.unpaidLeave + s.deductions.halfDay)}</td><td className="num">{money(s.tax)}</td><td className="num"><b>{money(s.net)}</b></td>
              <td><button onClick={() => download(`/payslips/${s._id}/pdf`, `payslip-${s.month}.pdf`)}>Download PDF</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
