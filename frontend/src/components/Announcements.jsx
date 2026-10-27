import { useState } from 'react';
import { api } from '../api.js';
import { Alert, Empty, Field, Modal } from './ui.jsx';

export default function Announcements({ items, canPost, onChanged }) {
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState(null);
  const [f, setF] = useState({ title: '', body: '', expiresAt: '' });
  const [err, setErr] = useState(null);
  const post = async (e) => {
    e.preventDefault(); setErr(null);
    try { await api.post('/announcements', { title: f.title, body: f.body, ...(f.expiresAt ? { expiresAt: f.expiresAt } : {}) }); setOpen(false); setF({ title: '', body: '', expiresAt: '' }); onChanged(); } catch (x) { setErr(x.details?.[0] ? `${x.details[0].field}: ${x.details[0].reason}` : x.message); }
  };
  return (
    <section className="card">
      <div className="head"><h2>Announcements</h2>{canPost && <button className="ghost" onClick={() => setOpen(true)}>Post</button>}</div>
      {items.length === 0 ? <Empty title="No announcements">{canPost ? 'Post one to share news with everyone.' : 'Company news will show up here.'}</Empty> : (
        <ul className="plain">{items.map((a) => (
          <li key={a._id}><strong>{a.title}</strong><p style={{ margin: '2px 0' }}>{a.body}</p><small>{a.createdByName} · {new Date(a.createdAt).toLocaleDateString()}{canPost && <> · <button className="link" onClick={() => setDel(a)}>Remove</button></>}</small></li>
        ))}</ul>
      )}
      {open && <Modal title="New announcement" onClose={() => setOpen(false)}>
        <form onSubmit={post}><Alert>{err}</Alert>
          <Field label="Title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></Field>
          <Field label="Message"><textarea rows="4" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} required /></Field>
          <Field label="Hide after (optional)"><input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>
          <div className="row"><button>Publish</button><button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button></div></form></Modal>}
      {del && <Modal title="Remove announcement?" onClose={() => setDel(null)}><p>{del.title}</p>
        <div className="row"><button className="danger" onClick={async () => { await api.delete(`/announcements/${del._id}`); setDel(null); onChanged(); }}>Remove</button><button className="ghost" onClick={() => setDel(null)}>Keep</button></div></Modal>}
    </section>
  );
}
