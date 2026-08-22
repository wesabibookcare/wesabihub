import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { auditEngine } from '../../../engines/AuditEngine';
import {
  Shield,
  Search,
  Filter,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Terminal
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userRole?: string;
  action: string;
  timestamp: string;
  details: any;
  result: 'SUCCESS' | 'FAILURE';
  isSuspicious?: boolean;
  suspicionReason?: string;
}

export const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = auditEngine.subscribeToRecentLogs((allLogs) => {
      setLogs(allLogs as AuditLog[]);
      setLoading(false);
    }, 100);

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userId.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      filterAction === 'ALL' ||
      (filterAction === 'SUSPICIOUS' && log.isSuspicious) ||
      log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registration & Verification Audit Trail</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time hardened ledger monitoring security actions, role changes, and compliance updates.</p>
        </div>
      </div>

      <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 text-xs">
            <div className="flex-1 bg-slate-50 rounded-xl px-3 flex items-center gap-2 border border-slate-100">
              <Search className="text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search audit trail by Officer UID, event type, action or payload..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-none w-full h-10 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="h-10 px-3 bg-slate-50 border rounded-xl font-semibold text-slate-700"
              >
                <option value="ALL">All Actions</option>
                <option value="SUSPICIOUS">⚠️ Flagged Suspicious</option>
                <option value="ROLE_APPLICATION_APPROVE">Application Approval</option>
                <option value="ROLE_APPLICATION_REJECT">Application Rejection</option>
                <option value="ROLE_APPLICATION_SUSPEND">Application Suspended</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="animate-spin text-primary-600" size={24} />
              <p className="text-xs text-slate-400 font-bold">Querying ledger logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Terminal className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-xs font-bold text-slate-400">No matching audit events found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  className={`p-3.5 border rounded-2xl transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${
                    log.isSuspicious
                      ? 'bg-red-50/50 border-red-100'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">
                        {log.action}
                      </span>
                      {log.isSuspicious && (
                        <Badge className="bg-red-50 text-red-600 border border-red-100 flex items-center gap-1 font-black">
                          <AlertTriangle size={10} /> SUSPICIOUS EVENT
                        </Badge>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                        <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 text-slate-500 text-[11px] font-medium">
                      <span className="flex items-center gap-1"><User size={12} /> Executed By: {log.userId}</span>
                      <span>Result: {log.result === 'SUCCESS' ? '✅ SUCCESS' : '❌ FAILURE'}</span>
                    </div>

                    {log.isSuspicious && log.suspicionReason && (
                      <p className="text-[10px] text-red-700 font-bold bg-red-100/50 p-2 rounded-xl border border-red-200/40">
                        🚨 Warning: {log.suspicionReason}
                      </p>
                    )}

                    {log.details && (
                      <details className="mt-2 text-[10px]">
                        <summary className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold">Show technical details</summary>
                        <pre className="mt-1 bg-slate-950 text-slate-300 p-2.5 rounded-xl font-mono text-[9px] overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
