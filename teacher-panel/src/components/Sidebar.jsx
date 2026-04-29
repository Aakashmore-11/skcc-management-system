import { NavLink, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Cookies from 'js-cookie';

const NAV_ITEMS = [
  { icon: "✓", label: "Mark Attendance", path: "/attendance" },
  { icon: "📊", label: "Monitor & Reports", path: "/monitor" },
];

export default function Sidebar({ closeSidebar, permissions: propPermissions }) {
  const navigate = useNavigate();
  const teacherName = localStorage.getItem('teacher_name') || 'Teacher';
  const permissions = propPermissions || JSON.parse(localStorage.getItem('teacher_permissions') || '{}');

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.path === '/monitor' && !permissions.canAccessReports) return false;
    return true;
  });

  const handleLogout = () => {
    Cookies.remove('teacher_token');
    localStorage.removeItem('teacher_name');
    localStorage.removeItem('teacher_permissions');
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
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg">
            T
          </div>
          <span className="text-sm font-semibold leading-tight text-text1">Teacher<br />Portal</span>
        </div>
        {closeSidebar && (
          <button 
            onClick={closeSidebar}
            className="lg:hidden p-2 -mr-2 text-text2 hover:text-text1 hover:bg-card rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="px-3 py-4">
        <div className="px-2 mb-2 text-[10px] font-medium tracking-wider text-text3 uppercase">Main</div>
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={navItemClass}
            onClick={() => closeSidebar && closeSidebar()}
          >
            <span className="w-[18px] text-center text-sm">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-card transition-colors" onClick={handleLogout}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-teal flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
            {teacherName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] font-medium text-text1">{teacherName}</div>
            <div className="text-[11px] text-red mt-0.5">Logout</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
