async function request(path, { method = 'GET', body, raw } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw && res.ok) return res;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error?.message || 'Request failed');
    err.status = res.status;
    err.code = json.error?.code;
    err.details = json.error?.details || [];
    throw err;
  }
  return json; // { success, data, meta? }
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  put: (p, b) => request(p, { method: 'PUT', body: b }),
  patch: (p, b) => request(p, { method: 'PATCH', body: b }),
  delete: (p) => request(p, { method: 'DELETE' }),
  raw: (p) => request(p, { raw: true }),
};

export const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => v !== '' && v != null && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export async function download(path, fallbackName) {
  const res = await request(path, { raw: true });
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}
