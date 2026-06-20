import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, AlertCircle, Car, IndianRupee } from 'lucide-react';

const COLORS = ['#ef4444', '#22c55e', '#f59e0b', '#6b7280', '#3b82f6'];

export function AnalyticsDashboard({ filter }: { filter: any }) {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['challan-analytics', filter],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/challans/analytics?${new URLSearchParams(filter)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    }
  });

  if (isLoading) return <div className="text-center py-8">Loading analytics...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading analytics</div>;

  // Format monthly trend dates for chart
  const formattedTrend = analytics?.monthlyTrend?.map((item: any) => ({
    ...item,
    monthLabel: item.month ? new Date(item.month).toLocaleString('default', { month: 'short', year: '2-digit' }) : ''
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <IndianRupee size={24} />
            <div>
              <p className="text-red-100 text-sm">Total Pending</p>
              <p className="text-2xl font-bold">₹{analytics?.summary?.pendingAmount?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <Car size={24} />
            <div>
              <p className="text-blue-100 text-sm">Most Fined Vehicle</p>
              {/* FIXED: Use "reg" not "registrationNumber" */}
              <p className="text-lg font-bold">
                {analytics?.vehicleRanking?.[0]?.vehicle?.reg || 'N/A'}
              </p>
              <p className="text-sm text-blue-100">
                ₹{analytics?.vehicleRanking?.[0]?.amount?.toLocaleString() || 0} total
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} />
            <div>
              <p className="text-green-100 text-sm">Payment Rate</p>
              <p className="text-2xl font-bold">{analytics?.paymentEfficiency || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value?.toLocaleString() || 0}`} />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="Amount (₹)" />
              <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} name="Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.statusBreakdown || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {(analytics?.statusBreakdown || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {analytics?.statusBreakdown?.map((item: any, idx: number) => (
              <div key={item.status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{item.status} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Offences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Offences</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.topOffences || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="offence" type="category" width={150} tick={{fontSize: 12}} />
              <Tooltip formatter={(value: number) => `${value} challans`} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Ranking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Most Fined Vehicles</h3>
          <div className="space-y-3">
            {analytics?.vehicleRanking?.map((item: any, idx: number) => (
              <div key={item.vehicle?.id || idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  {/* FIXED: Use "reg" not "registrationNumber" */}
                  <div className="font-medium">{item.vehicle?.reg || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{item.vehicle?.model || ''}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">₹{item.amount?.toLocaleString() || 0}</div>
                  <div className="text-xs text-gray-500">{item.count} challans</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}