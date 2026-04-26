import { NavLink, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", path: "/" },
  { icon: "◎", label: "Students", path: "/students" },
  { icon: "⊡", label: "Classes & Batches", path: "/classes" },
  { icon: "₹", label: "Fees", path: "/fees" },
  { icon: "✧", label: "Events", path: "/events" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-dot">S</div>
        SKCC Management System
      </div>

      <div className="nav-section">
        <div className="nav-label">Main</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            style={{ textDecoration: 'none' }}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-label">System</div>
        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>◱</span>
          Reports
        </NavLink>
        <NavLink to="/schedule" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>◷</span>
          Schedule
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>⚙</span>
          Settings
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="user-row" onClick={handleLogout}>
          <div className="avatar">AD</div>
          <div>
            <div className="user-name">Admin</div>
            <div className="user-role" style={{ color: "var(--red)" }}>Logout</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
