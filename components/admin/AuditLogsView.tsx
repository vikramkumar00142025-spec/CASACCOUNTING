'use client';

import React, { useState, useMemo } from 'react';
import { ScrollText, Search, Shield, Filter } from 'lucide-react';
import { AuditLog } from '@/types';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export default function AuditLogsView({ auditLogs }: AuditLogsViewProps) {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.user_name.toLowerCase().includes(search.toLowerCase()) ||
        (log.record_id && log.record_id.toLowerCase().includes(search.toLowerCase()));

      const matchModule = moduleFilter === 'ALL' || log.module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [auditLogs, search, moduleFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Security & Operational Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable record of every user authentication, financial creation, cancellation and stock update</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by user, details, record ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-hidden text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {['ALL', 'Sales', 'Purchases', 'Challans', 'Inventory', 'Payments', 'Expenses', 'Users', 'Settings', 'Auth'].map(
            (m) => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  moduleFilter === m
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            )
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Actor / User</th>
                <th className="py-3 px-3 text-center">Action</th>
                <th className="py-3 px-3">Domain Module</th>
                <th className="py-3 px-3">Audit Details & Narration</th>
                <th className="py-3 px-3 font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-900">{log.user_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{log.user_email}</p>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.action === 'Create'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'Delete' || log.action === 'Cancel'
                            ? 'bg-rose-100 text-rose-800'
                            : log.action === 'Login'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{log.module}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span>{log.details}</span>
                      {log.record_id && (
                        <span className="ml-1 text-[10px] font-mono text-slate-400">[{log.record_id}]</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
