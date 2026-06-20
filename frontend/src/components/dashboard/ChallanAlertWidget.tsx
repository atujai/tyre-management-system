import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, IndianRupee } from 'lucide-react';

export function ChallanAlertWidget() {
  const { data: stats } = useQuery({
    queryKey: ['challan-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/challans/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return res.json();
    }
  });

  if (!stats?.pendingCount) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 dark:text-red-200">
            {stats.pendingCount} Pending Challan{stats.pendingCount > 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 flex items-center gap-1">
            <IndianRupee size={14} />
            Total fine amount: ₹{((stats.totalAmount || 0) - (stats.paidAmount || 0)).toLocaleString()}
          </p>
        </div>
        <Link 
          to="/challans" 
          className="text-sm font-medium text-red-700 hover:underline px-3 py-1 bg-red-100 dark:bg-red-800 rounded-md"
        >
          View All →
        </Link>
      </div>
    </div>
  );
}