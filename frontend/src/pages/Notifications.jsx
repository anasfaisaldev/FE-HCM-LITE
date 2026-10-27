import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Empty, Spinner } from '../components/ui.jsx';

export default function Notifications() {
  const [data, setData] = useState(null);
  const load = () => api.get('/notifications').then(setData);
  useEffect(() => { load(); }, []);
  if (!data) return <Spinner />;
  return (
    <>
      <div className="head"><h1>Notifications</h1>{data.meta.unread > 0 && <button className="ghost" onClick={async () => { await api.post('/notifications/read-all'); load(); }}>Mark all read ({data.meta.unread})</button>}</div>
      {data.data.length === 0 ? <Empty title="You're all caught up">Leave and attendance decisions will show up here.</Empty> : (
        <ul className="plain card">{data.data.map((n) => (
          <li key={n._id} className={n.readAt ? '' : 'unread'}><strong>{n.title}</strong><small>{n.body} · {new Date(n.createdAt).toLocaleString()}</small></li>
        ))}</ul>
      )}
    </>
  );
}
