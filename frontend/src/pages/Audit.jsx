import { useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { Alert, Empty, Pager, Spinner } from '../components/ui.jsx';

export default function Audit() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.get(`/audit${qs({ page, limit: 20 })}`).then(setData).catch((x) => setErr(x.message)); }, [page]);
  if (err) return <Alert>{err}</Alert>;
  if (!data) return <Spinner />;
  return (
    <>
      <h1>Audit log</h1>
      {data.data.length === 0 ? <Empty title="Nothing recorded yet">Actions such as registrations and setting changes will appear here.</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>Change</th></tr></thead>
          <tbody>{data.data.map((a) => (
            <tr key={a._id}>
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td>{a.actorName}<small>{a.actorRole}</small></td>
              <td>{a.action}</td><td>{a.entity}</td>
              <td><details><summary>Before / after</summary><pre>{JSON.stringify({ before: a.before, after: a.after }, null, 2)}</pre></details></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <Pager meta={data.meta} onPage={setPage} />
    </>
  );
}
