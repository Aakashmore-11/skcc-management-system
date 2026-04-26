import { useState, useEffect } from "react";
import { Calendar, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Topbar() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      setDate(dateParam);
    }
  }, [location.search]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    // Keep current pathname, just update the date query param
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('date', newDate);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1>SKCC Portal Overview</h1>
        <p>Welcome back — here's what's happening today.</p>
      </div>
      <div className="topbar-right">
        <div className="date-chip" style={{ padding: 0, overflow: 'hidden' }}>
          <Calendar size={13} style={{ marginLeft: '12px' }} />
          <input 
            type="date" 
            value={date}
            onChange={handleDateChange}
            style={{ background: 'transparent', border: 'none', color: 'var(--text2)', outline: 'none', padding: '7px 12px 7px 6px', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'var(--font)' }}
          />
        </div>
        <div className="icon-btn">
          <Bell size={15} />
          <span className="notif-dot" />
        </div>
      </div>
    </div>
  );
}
