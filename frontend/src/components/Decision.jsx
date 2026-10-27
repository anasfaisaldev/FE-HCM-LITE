import { useState } from 'react';
import { Alert, Field, Modal } from './ui.jsx';

// Approve/reject dialog with a comment. onSubmit(decision, comment) must throw on failure.
export default function Decision({ title, summary, onSubmit, onClose }) {
  const [comment, setComment] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async (decision) => {
    setBusy(true); setErr(null);
    try { await onSubmit(decision, comment); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose}>
      <p>{summary}</p>
      <Alert>{err}</Alert>
      <Field label="Comment" hint="Required when rejecting"><textarea rows="3" value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      <div className="row"><button disabled={busy} onClick={() => go('approved')}>Approve</button><button className="danger" disabled={busy} onClick={() => go('rejected')}>Reject</button><button className="ghost" onClick={onClose}>Cancel</button></div>
    </Modal>
  );
}
