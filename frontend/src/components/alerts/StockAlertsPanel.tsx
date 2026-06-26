// components/alerts/StockAlertsPanel.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  X,
  Package,
  TrendingDown,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  User,
} from 'lucide-react';
import { locationApi } from '../../api/locationApi';
import type { StockAlert } from '../../types/transfer-alert.types';

export const StockAlertsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED'>('ACTIVE');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'LOW' | 'CRITICAL'>('ALL');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const { data: alerts, isPending } = useQuery({
    queryKey: ['stock-alerts', filterStatus, filterSeverity],
    queryFn: () => locationApi.getAlerts({
      status: filterStatus === 'ALL' ? undefined : filterStatus,
      severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
    }),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: locationApi.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: locationApi.resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });

  const activeCount = alerts?.filter(a => a.status === 'ACTIVE').length || 0;
  const criticalCount = alerts?.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length || 0;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-500' };
      case 'LOW':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-500' };
      default:
        return { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400', icon: 'text-slate-500' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-400" />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Stock Alerts</h2>
            <p className="text-xs text-slate-500">
              {criticalCount > 0 && (
                <span className="text-red-400 font-medium">{criticalCount} critical</span>
              )}
              {criticalCount > 0 && activeCount > criticalCount && ' · '}
              {activeCount > criticalCount && (
                <span>{activeCount - criticalCount} low stock</span>
              )}
              {activeCount === 0 && 'All stock levels healthy'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="ALL">All</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {isPending ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        </div>
      ) : alerts?.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No alerts</p>
          <p className="text-sm text-slate-500 mt-1">All stock levels are within thresholds</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const isExpanded = expandedAlert === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden transition-all`}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                >
                  <AlertTriangle className={`w-5 h-5 ${styles.icon} flex-shrink-0`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${styles.text}`}>
                        {alert.size}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {alert.severity}
                      </span>
                      {alert.status === 'ACKNOWLEDGED' && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {alert.locationName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span className="text-red-400 font-medium">{alert.currentStock}</span> / {alert.threshold} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          acknowledgeMutation.mutate(alert.id);
                        }}
                        disabled={acknowledgeMutation.isPending}
                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveMutation.mutate(alert.id);
                        }}
                        disabled={resolveMutation.isPending}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-700/50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs">Brand</p>
                        <p className="text-white font-medium">{alert.brand}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Current Stock</p>
                        <p className={`font-bold ${alert.currentStock === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                          {alert.currentStock}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Threshold</p>
                        <p className="text-white font-medium">{alert.threshold}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Shortage</p>
                        <p className="text-red-400 font-bold">{alert.threshold - alert.currentStock}</p>
                      </div>
                    </div>

                    {/* Stock bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Stock Level</span>
                        <span className={alert.currentStock < alert.threshold * 0.5 ? 'text-red-400' : 'text-amber-400'}>
                          {Math.round((alert.currentStock / alert.threshold) * 100)}% of threshold
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            alert.currentStock < alert.threshold * 0.5 ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min((alert.currentStock / alert.threshold) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {alert.acknowledgedBy && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        Acknowledged by {alert.acknowledgedBy}
                        {alert.acknowledgedAt && (
                          <span>on {new Date(alert.acknowledgedAt).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
