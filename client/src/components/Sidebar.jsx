import { NavLink, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { X } from 'lucide-react';

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", path: "/" },
  { icon: "◎", label: "Students", path: "/students" },
  { icon: "⊡", label: "Classes & Batches", path: "/classes" },
  { icon: "✓", label: "Attendance Reports", path: "/attendance-reports" },
  { icon: "🛡", label: "Teachers", path: "/teachers" },
  { icon: "₹", label: "Fees", path: "/fees" },
  { icon: "✧", label: "Events", path: "/events" },
  { icon: "⌕", label: "Audit Logs", path: "/audit-logs" },
];

export default function Sidebar({ closeSidebar }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  const navItemClass = ({ isActive }) => 
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition-colors mb-0.5 ${
      isActive 
        ? "bg-accent/10 text-accent font-medium" 
        : "text-text2 hover:bg-card hover:text-text1"
    }`;

  return (
    <aside className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full bg-white object-contain" />
          <span className="text-sm font-semibold leading-tight text-text1">SKCC <br /> Management<br />System</span>
        </div>
        <button className="lg:hidden text-text2 hover:text-text1" onClick={closeSidebar}>
          <X size={20} />
        </button>
      </div>

      <div className="px-3 py-4">
        <div className="px-2 mb-2 text-[10px] font-medium tracking-wider text-text3 uppercase">Main</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/'}
            className={navItemClass}
            onClick={closeSidebar}
          >
            <span className="w-[18px] text-center text-sm">{item.icon}</span>
            {item.label}
            {item.badge && <span className="ml-auto px-1.5 py-[1px] bg-red text-white text-[10px] font-semibold rounded-full">{item.badge}</span>}
          </NavLink>
        ))}
      </div>

      <div className="px-3 pb-4">
        <div className="px-2 mb-2 text-[10px] font-medium tracking-wider text-text3 uppercase">System</div>
        <NavLink to="/reports" className={navItemClass} onClick={closeSidebar}>
          <span className="w-[18px] text-center text-sm">◱</span>
          Reports
        </NavLink>
        <NavLink to="/schedule" className={navItemClass} onClick={closeSidebar}>
          <span className="w-[18px] text-center text-sm">◷</span>
          Schedule
        </NavLink>
        <NavLink to="/settings" className={navItemClass} onClick={closeSidebar}>
          <span className="w-[18px] text-center text-sm">⚙</span>
          Settings
        </NavLink>
      </div>

      <div className="mt-auto px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-card transition-colors" onClick={handleLogout}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-teal flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
            AD
          </div>
          <div>
            <div className="text-[13px] font-medium text-text1">Admin</div>
            <div className="text-[11px] text-red mt-0.5">Logout</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
