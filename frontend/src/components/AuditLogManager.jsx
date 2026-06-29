import { useState } from 'react';
import { useGetActivityLogsQuery } from '../features/activityLogs/activityLogApiSlice';
import { ShieldCheck, Search, ShieldAlert, Download, Terminal, User } from 'lucide-react';
import { motion } from 'framer-motion';

const SEVERITY_COLORS = {
  Info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Critical: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
};

const AuditLogManager = () => {
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useGetActivityLogsQuery({
    pageNumber: page,
    severity,
    action,
  });

  const handleExportJSON = () => {
    if (!data?.logs) return;
    const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border-main flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-bg-card shadow-2xl relative overflow-hidden">
        <div className="flex items-center space-x-4 z-10">
          <div className="p-4 bg-primary-500/10 text-primary-500 rounded-2xl border border-primary-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main">System Activity & Security Audits</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Track operations, configuration modifications, and system-wide security actions.
            </p>
          </div>
        </div>
        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-muted">Filter Severity</label>
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className="w-full bg-bg-card border border-border-main text-text-main rounded-2xl py-3 px-4 outline-none focus:ring-2 ring-primary-500 font-bold text-sm cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-muted">Search Action</label>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="e.g. LOGIN, CREATE_MALL..."
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full bg-bg-card border border-border-main text-text-main rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 ring-primary-500 font-bold text-sm"
            />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-card rounded-[2.5rem] border border-border-main overflow-hidden bg-bg-card shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-bg-sub/50 text-xs font-black uppercase tracking-widest text-text-muted">
                <th className="py-5 px-6">Timestamp</th>
                <th className="py-5 px-6">User</th>
                <th className="py-5 px-6">Action</th>
                <th className="py-5 px-6">Details</th>
                <th className="py-5 px-6">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 text-sm font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-text-muted">
                    Loading audit records...
                  </td>
                </tr>
              ) : data?.logs?.length > 0 ? (
                data.logs.map((log) => (
                  <tr key={log._id} className="hover:bg-bg-sub/30 transition-colors">
                    <td className="py-5 px-6 text-xs text-text-muted font-bold">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-text-muted" />
                        <div>
                          <p className="font-bold text-text-main">{log.user?.name || 'System'}</p>
                          <p className="text-[10px] text-text-muted uppercase font-black">{log.user?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-mono text-xs font-black text-primary-400">
                      {log.action}
                    </td>
                    <td className="py-5 px-6 text-text-muted leading-relaxed text-xs max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-5 px-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.Info}`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Terminal className="w-12 h-12 text-text-muted opacity-20" />
                      <p className="text-sm font-bold text-text-muted">No audit trails found matching parameters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="p-6 border-t border-border-main flex justify-between items-center bg-bg-sub/20">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-bg-sub border border-border-main text-text-main rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-black uppercase tracking-widest text-text-muted">
              Page {page} of {data.pages}
            </span>
            <button
              disabled={page === data.pages}
              onClick={() => setPage((prev) => Math.min(prev + 1, data.pages))}
              className="px-4 py-2 bg-bg-sub border border-border-main text-text-main rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogManager;
