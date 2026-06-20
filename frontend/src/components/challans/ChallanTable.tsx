import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { IndianRupee, CreditCard, Eye, FileText, AlertTriangle, FileX } from 'lucide-react';

export function ChallanTable({ filter, onPay }: { filter: any; onPay: (id: string) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['challans', filter],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/challans?${new URLSearchParams(filter)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch challans');
      return res.json();
    }
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <FileX size={48} className="mx-auto mb-2" />
        <p>Error loading challans</p>
      </div>
    );
  }

  const challans = data?.data || [];

  // Empty state
  if (challans.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <FileX size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">No challans found</p>
        <p className="text-sm text-gray-400 mt-1">Add a manual challan to get started</p>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    DISMISSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    CONTESTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    OVERDUE: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challan No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {challans.map((challan: any) => (
              <tr key={challan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  {/* FIXED: Use "reg" not "registrationNumber" */}
                  <div className="font-medium text-gray-900 dark:text-white">
                    {challan.vehicle?.reg || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">{challan.vehicle?.model || ''}</div>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                  {challan.challanNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {challan.challanDate ? format(new Date(challan.challanDate), 'dd MMM yyyy') : 'N/A'}
                  <div className="text-xs text-gray-400">
                    {challan.challanDate ? format(new Date(challan.challanDate), 'HH:mm') : ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {challan.offence}
                  </div>
                  {challan.section && (
                    <div className="text-xs text-gray-500">{challan.section}</div>
                  )}
                  {challan.location && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <AlertTriangle size={12} />
                      {challan.location}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">
                    ₹{(challan.totalAmount || 0).toLocaleString()}
                  </div>
                  {(challan.penaltyAmount || 0) > 0 && (
                    <div className="text-xs text-red-500">
                      +₹{challan.penaltyAmount} penalty
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[challan.status] || 'bg-gray-100'}`}>
                    {challan.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {challan.status === 'PENDING' && (
                      <button
                        onClick={() => onPay(challan.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        <CreditCard size={14} />
                        Pay
                      </button>
                    )}
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Eye size={16} />
                    </button>
                    {challan.paymentReceipt && (
                      <a 
                        href={challan.paymentReceipt} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <FileText size={16} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={data.pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              disabled={data.pagination.page >= data.pagination.totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}