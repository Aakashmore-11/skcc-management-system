import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Calendar, Clock, User, Activity } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/system/audit-logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-green bg-green/10';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red bg-red/10';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-amber bg-amber/10';
    if (action.includes('LOGIN')) return 'text-accent bg-accent/10';
    return 'text-text2 bg-surface border border-border';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="card-title text-[18px]">Security & Audit Logs</div>
          <div className="card-subtitle">Track critical system actions, logins, and credential updates.</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-accent" />
            <span className="font-medium text-sm">System Activity</span>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-text3">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-text1">
                          <Calendar size={12} className="text-text3" />
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-text3">
                          <Clock size={12} />
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="w-full">
                      <div className="text-[13px] text-text2 max-w-xl truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center p-10 text-text3">No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
