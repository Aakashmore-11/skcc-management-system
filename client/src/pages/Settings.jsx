import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <SettingsIcon size={48} color="var(--text2)" style={{ margin: '0 auto 20px' }} />
      <h2 className="card-title" style={{ fontSize: '24px', marginBottom: '10px' }}>System Settings</h2>
      <p className="card-subtitle" style={{ fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>
        Global system configuration, user management, and administrative preferences will be accessible here.
      </p>
    </div>
  );
}
