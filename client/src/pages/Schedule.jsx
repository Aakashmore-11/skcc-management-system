import { CalendarClock } from 'lucide-react';

export default function Schedule() {
  return (
    <div className="chart-card text-center py-16 px-5 flex flex-col items-center justify-center min-h-[400px]">
      <CalendarClock size={48} color="var(--amber)" className="mb-5" />
      <h2 className="card-title text-2xl mb-2.5">Batch Schedule</h2>
      <p className="card-subtitle text-[15px] max-w-[400px] mx-auto leading-relaxed">
        The interactive calendar and academic timetable manager is currently being integrated.
      </p>
    </div>
  );
}
