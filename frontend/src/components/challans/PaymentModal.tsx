import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, Calendar, FileText, CheckCircle } from 'lucide-react';

export function PaymentModal({ challanId, onClose }: { challanId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  const payMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/challans/${challanId}/pay`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentDate,
          paymentMethod,
          receiptUrl: receiptUrl || undefined,
          notes: notes || undefined
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['challan-stats'] });
      onClose();
    }
  });

  const methods = [
    { id: 'UPI', label: 'UPI' },
    { id: 'CARD', label: 'Credit/Debit Card' },
    { id: 'NETBANKING', label: 'Net Banking' },
    { id: 'WALLET', label: 'Wallet (Paytm/PhonePe)' },
    { id: 'CASH', label: 'Cash' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Mark Challan as Paid</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            Record payment details. Pay the challan on Parivahan/eChallan website first, then mark it here.
          </p>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Payment Date</label>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-2 text-sm rounded-lg border ${
                    paymentMethod === m.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt URL */}
          <div>
            <label className="block text-sm font-medium mb-1">Receipt URL (Optional)</label>
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="https://... or upload path"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Transaction ID, reference number, etc."
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {payMutation.isPending ? 'Saving...' : 'Mark as Paid'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          {payMutation.isError && (
            <p className="text-sm text-red-500">{payMutation.error?.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}