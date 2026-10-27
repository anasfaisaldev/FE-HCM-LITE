import { useEffect, useRef } from 'react';

export const Spinner = ({ label = 'Loading' }) => <div className="spinner" role="status" aria-label={label} />;
export const Alert = ({ kind = 'error', children }) => (children ? <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div> : null);
export const Empty = ({ title, children }) => (
  <div className="empty"><strong>{title}</strong><p>{children}</p></div>
);

export function Field({ label, error, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

// Maps backend { details: [{field, reason}] } to per-field messages.
export const fieldErrors = (err) => Object.fromEntries((err?.details || []).map((d) => [d.field, d.reason]));

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('input,select,button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header><h2>{title}</h2><button className="ghost" onClick={onClose} aria-label="Close">✕</button></header>
        {children}
      </div>
    </div>
  );
}

export function Pager({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="pager">
      <button className="ghost" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</button>
      <span>Page {meta.page} of {meta.pages} ({meta.total} total)</span>
      <button className="ghost" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next</button>
    </div>
  );
}
