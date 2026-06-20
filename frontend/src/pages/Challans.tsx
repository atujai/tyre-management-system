import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { 
  AlertTriangle, CheckCircle, Clock, IndianRupee, 
  Search, Filter, Download, Plus, RefreshCw,
  TrendingUp, Car, ShieldAlert, CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChallanTable } from '../components/challans/ChallanTable';
import { ChallanStats } from '../components/challans/ChallanStats';
import { PaymentModal } from '../components/challans/PaymentModal';
import { ManualEntryModal } from '../components/challans/ManualEntryModal';
import { AnalyticsDashboard } from '../components/challans/AnalyticsDashboard';
import { useAuthStore } from '../stores/auth';

export default function ChallansPage() {
  const { token } = useAuthStore();
  const [filter, setFilter] = useState({
    status: '',
    vehicleId: '',
    from: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

  const { data: stats } = useQuery({
    queryKey: ['challan-stats', filter.vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/challans/stats?vehicleId=${filter.vehicleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      return res.json();
    }
  });

  // FIX: Handle different response formats
  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.data || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Challan Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage traffic violations across your fleet
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Manual
          </button>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/challans/check-now', { 
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Check failed');
                const result = await res.json();
                alert(`Checked ${result.checked} vehicles, found ${result.newChallans} new challans`);
              } catch (e: any) {
                alert('Error: ' + e.message);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={18} />
            Check Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ChallanStats stats={stats} />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-sm font-medium border-b-2 ${
              activeTab === 'list' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Challan List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 text-sm font-medium border-b-2 ${
              activeTab === 'analytics' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-gray-400" />
              <select
                value={filter.status}
                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="DISMISSED">Dismissed</option>
                <option value="CONTESTED">Contested</option>
              </select>
            </div>

            <select
              value={filter.vehicleId}
              onChange={e => setFilter(f => ({ ...f, vehicleId: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
            >
              <option value="">All Vehicles</option>
              {vehicles?.map((v: any) => (
                <option key={v.id} value={v.id}>{v.reg}</option>
              ))}
            </select>

            <input
              type="date"
              value={filter.from}
              onChange={e => setFilter(f => ({ ...f, from: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
            />
            <input
              type="date"
              value={filter.to}
              onChange={e => setFilter(f => ({ ...f, to: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
            />

            <button
              onClick={() => {/* Export CSV */}}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <Download size={18} />
              Export
            </button>
          </div>

          {/* Table */}
          <ChallanTable 
            filter={filter} 
            onPay={setShowPayment}
          />
        </>
      ) : (
        <AnalyticsDashboard filter={filter} />
      )}

      {/* Modals */}
      {showPayment && (
        <PaymentModal 
          challanId={showPayment} 
          onClose={() => setShowPayment(null)} 
        />
      )}
      {showManual && (
        <ManualEntryModal 
          vehicles={vehicles}
          onClose={() => setShowManual(false)} 
        />
      )}
    </div>
  );
}