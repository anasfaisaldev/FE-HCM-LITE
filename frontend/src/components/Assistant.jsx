import { useRef, useState } from 'react';
import { api } from '../api.js';
import { Alert } from './ui.jsx';

export default function Assistant({ role }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const end = useRef(null);

  const send = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    const history = msgs.filter((m) => !m.fallback).slice(-8).map((m) => ({ role: m.role, content: m.text }));
    setMsgs((m) => [...m, { role: 'user', text: message }]); setText(''); setBusy(true); setErr(null);
    try {
      const r = await api.post('/ai/chat', { message, history });
      setMsgs((m) => [...m, { role: 'assistant', text: r.data.reply, label: r.data.label, fallback: r.data.fallback }]);
    } catch (x) { setErr(x.message); } finally { setBusy(false); setTimeout(() => end.current?.scrollIntoView({ block: 'nearest' }), 50); }
  };
  const hints = role === 'employee' ? ['What is my leave balance?', 'Meri casual leave kitni bachi hai?', 'What time is the late cut-off?'] : ['How many employees do we have?', 'Who are the top late-comers this month?', 'Show leave utilization'];
  return (
    <section className="card assistant">
      <h2>AI assistant</h2>
      <small>Answers come from your live HCM data and your role's permissions. It can read, never approve or change anything.</small>
      <div className="chat" aria-live="polite">
        {msgs.length === 0 && <div className="hints">{hints.map((h) => <button key={h} type="button" className="ghost" onClick={() => setText(h)}>{h}</button>)}</div>}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <p>{m.text}</p>
            {m.label && <small>{m.label}</small>}
          </div>
        ))}
        {busy && <div className="msg assistant"><p>Thinking…</p></div>}
        <div ref={end} />
      </div>
      <Alert>{err}</Alert>
      <form className="row" onSubmit={send}>
        <input aria-label="Ask the assistant" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Ask in English or Roman Urdu" />
        <button disabled={busy || !text.trim()}>Send</button>
      </form>
    </section>
  );
}
