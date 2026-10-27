import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, needsSetup: false, user: null, error: null });

  const refresh = useCallback(async () => {
    try {
      const s = await api.get('/setup/status');
      if (s.data.needsSetup) return setState({ loading: false, needsSetup: true, user: null, error: null });
      try {
        const me = await api.get('/auth/me');
        setState({ loading: false, needsSetup: false, user: me.data, error: null });
      } catch {
        setState({ loading: false, needsSetup: false, user: null, error: null });
      }
    } catch {
      setState({ loading: false, needsSetup: false, user: null, error: 'Cannot reach the server. Check that the backend is running.' });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = async () => { await api.post('/auth/logout'); await refresh(); };
  return <Ctx.Provider value={{ ...state, refresh, logout }}>{children}</Ctx.Provider>;
}
