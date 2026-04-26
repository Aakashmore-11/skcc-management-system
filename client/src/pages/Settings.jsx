import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="chart-card text-center py-16 px-5 flex flex-col items-center justify-center min-h-[400px]">
      <SettingsIcon size={48} color="var(--text2)" className="mb-5" />
      <h2 className="card-title text-2xl mb-2.5">System Settings</h2>
      <p className="card-subtitle text-[15px] max-w-[400px] mx-auto leading-relaxed">
        Global system configuration, user management, and administrative preferences will be accessible here.
      </p>
    </div>
  );
}
