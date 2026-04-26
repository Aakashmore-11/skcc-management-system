import { CalendarClock } from 'lucide-react';

export default function Schedule() {
  return (
    <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <CalendarClock size={48} color="var(--amber)" style={{ margin: '0 auto 20px' }} />
      <h2 className="card-title" style={{ fontSize: '24px', marginBottom: '10px' }}>Batch Schedule</h2>
      <p className="card-subtitle" style={{ fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>
        The interactive calendar and academic timetable manager is currently being integrated.
      </p>
    </div>
  );
}
