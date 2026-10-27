import { useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { Alert, Spinner } from './ui.jsx';

const LABEL = { present: 'Present', late: 'Late', half_day: 'Half day', missing_checkout: 'No check-out', absent: 'Absent', on_leave: 'On leave', weekend: 'Weekend', holiday: 'Holiday' };

export default function Calendar({ employeeId }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    setData(null); setErr(null);
    api.get(`/attendance/calendar${qs({ month, employeeId })}`).then((r) => setData(r.data)).catch((x) => setErr(x.message));
  }, [month, employeeId]);
  if (err) return <Alert>{err}</Alert>;
  const lead = data ? new Date(`${data.days[0].date}T00:00:00Z`).getUTCDay() : 0;
  return (
    <div>
      <div className="row"><label className="field"><span>Month</span><input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></label>{data && <strong>{data.employee.name}</strong>}</div>
      {!data ? <Spinner /> : (
        <>
          <div className="cal" role="grid" aria-label={`Attendance for ${month}`}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="calhead">{d}</div>)}
            {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} />)}
            {data.days.map((d) => (
              <div key={d.date} role="gridcell" className={`day ${d.status}`} title={`${d.date}: ${LABEL[d.status] || d.status}`}>
                <b>{Number(d.date.slice(8))}</b><span>{LABEL[d.status] || ''}</span>
              </div>
            ))}
          </div>
          <p className="muted">{Object.entries(data.summary).filter(([k]) => LABEL[k]).map(([k, v]) => `${LABEL[k]}: ${v}`).join(' · ') || 'No records this month.'}</p>
        </>
      )}
    </div>
  );
}
