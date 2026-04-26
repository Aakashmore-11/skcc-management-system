import { useState, useEffect } from "react";
import { Calendar, Bell, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Topbar({ toggleSidebar }) {
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
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('date', newDate);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  return (
    <div className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border-b border-border px-4 py-3 md:px-7 md:py-4">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden p-1.5 -ml-1.5 text-text2 hover:text-text1 rounded-md hover:bg-card">
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-lg md:text-[18px] font-semibold tracking-tight text-text1">SKCC Portal Overview</h1>
          <p className="text-[12.5px] text-text2 mt-0.5 hidden sm:block">Welcome back — here's what's happening today.</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between w-full md:w-auto gap-3">
        <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden hover:border-border2 transition-colors">
          <Calendar size={13} className="ml-3 text-text2" />
          <input 
            type="date" 
            value={date}
            onChange={handleDateChange}
            className="bg-transparent border-none text-text2 outline-none py-1.5 px-3 text-[12.5px] cursor-pointer font-sans w-[130px]"
          />
        </div>
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border text-text2 hover:text-text1 hover:border-border2 transition-colors">
          <Bell size={15} />
          <span className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full bg-red border-[1.5px] border-surface" />
        </button>
      </div>
    </div>
  );
}
