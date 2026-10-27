import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Alert, Spinner } from './components/ui.jsx';
import Setup from './pages/Setup.jsx';
import Login from './pages/Login.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import Profile from './pages/Profile.jsx';
import Organization from './pages/Organization.jsx';
import Attendance from './pages/Attendance.jsx';
import Leave from './pages/Leave.jsx';
import Notifications from './pages/Notifications.jsx';
import Payroll from './pages/Payroll.jsx';
import Payslips from './pages/Payslips.jsx';
import Audit from './pages/Audit.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'hr', 'employee'], end: true },
  { to: '/employees', label: 'Employees', roles: ['admin', 'hr'] },
  { to: '/attendance', label: 'Attendance', roles: ['admin', 'hr', 'employee'] },
  { to: '/leave', label: 'Leave', roles: ['admin', 'hr', 'employee'] },
  { to: '/payslips', label: 'My payslips', roles: ['admin', 'hr', 'employee'] },
  { to: '/payroll', label: 'Payroll', roles: ['admin', 'hr'] },
  { to: '/notifications', label: 'Notifications', roles: ['admin', 'hr', 'employee'] },
  { to: '/profile', label: 'My profile', roles: ['admin', 'hr', 'employee'] },
  { to: '/organization', label: 'Organization', roles: ['admin', 'hr'] },
  { to: '/audit', label: 'Audit log', roles: ['admin'] },
];

const Guard = ({ roles, children }) => {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <Navigate to="/" replace />;
};

export default function App() {
  const { loading, needsSetup, user, error, logout } = useAuth();
  if (loading) return <div className="center"><Spinner /></div>;
  if (error) return <div className="center"><Alert>{error}</Alert></div>;
  if (needsSetup) return <Setup />;
  if (!user) return <Login />;
  if (user.mustChangePassword) return <ChangePassword forced />;

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <aside>
        <div className="brand">HCM Lite</div>
        <nav aria-label="Main">
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="me">
          <div><strong>{user.name}</strong><small>{user.role.toUpperCase()}</small></div>
          <button className="ghost" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main id="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Guard roles={['admin', 'hr']}><Employees /></Guard>} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/payslips" element={<Payslips />} />
          <Route path="/payroll" element={<Guard roles={['admin', 'hr']}><Payroll /></Guard>} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/organization" element={<Guard roles={['admin', 'hr']}><Organization /></Guard>} />
          <Route path="/audit" element={<Guard roles={['admin']}><Audit /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
