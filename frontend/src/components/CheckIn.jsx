import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import CameraVerify from './CameraVerify.jsx';
import { Alert } from './ui.jsx';

const time = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

export default function CheckIn() {
  const [t, setT] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cam, setCam] = useState(null); // 'in' | 'out'
  const load = useCallback(() => api.get('/attendance/today').then((r) => setT(r.data)).catch((x) => (x.status === 404 ? setHidden(true) : setErr(x.message))), []);
  useEffect(() => { load(); }, [load]);

  const act = async (path, verification) => {
    setBusy(true); setErr(null);
    try { await api.post(path, verification ? { verification } : {}); setCam(null); await load(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  if (hidden) return null;
  const rec = t?.record;
  return (
    <section className="card">
      <h2>Today{t ? `, ${t.date}` : ''}</h2>
      <Alert>{err}</Alert>
      <dl>
        <div><dt>Status</dt><dd>{rec ? <span className={`pill ${rec.status}`}>{rec.status.replace('_', ' ')}</span> : 'Not checked in'}</dd></div>
        <div><dt>Check-in</dt><dd>{time(rec?.checkIn)}</dd></div>
        <div><dt>Check-out</dt><dd>{time(rec?.checkOut)}</dd></div>
      </dl>
      {t?.requireCamera && !t.cameraConfigured && <Alert kind="warn">Camera check-in is required but the office location is not set. Ask an Admin.</Alert>}
      <div className="row" style={{ marginTop: 12 }}>
        {t?.requireCamera ? (
          <>
            <button disabled={busy || !t || !!rec} onClick={() => setCam('in')}>Check in with camera</button>
            <button className="ghost" disabled={busy || !rec || !!rec?.checkOut} onClick={() => setCam('out')}>Check out with camera</button>
          </>
        ) : (
          <>
            <button disabled={busy || !t || !!rec} onClick={() => act('/attendance/check-in')}>Check in</button>
            <button className="ghost" disabled={busy || !rec || !!rec?.checkOut} onClick={() => act('/attendance/check-out')}>Check out</button>
            {t?.cameraConfigured && <button className="ghost" disabled={busy || !!rec?.checkOut} onClick={() => setCam(rec ? 'out' : 'in')}>Use camera</button>}
          </>
        )}
      </div>
      <small>Times are recorded by the server, not your device.{rec?.verification?.in ? ` Verified ${Math.round(rec.verification.in.distanceMeters)} m from the office.` : ''}</small>
      {cam && <CameraVerify title={cam === 'in' ? 'Camera check-in' : 'Camera check-out'} onClose={() => setCam(null)} onVerified={(v) => act(cam === 'in' ? '/attendance/check-in' : '/attendance/check-out', v)} />}
    </section>
  );
}
