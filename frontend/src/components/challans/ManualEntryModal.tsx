import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, AlertTriangle } from 'lucide-react';

export function ManualEntryModal({ vehicles, onClose }: { vehicles: any[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vehicleId: '',
    challanNumber: '',
    challanDate: new Date().toISOString().split('T')[0],
    offence: '',
    section: '',
    fineAmount: '',
    totalAmount: '',
    location: '',
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/challans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          fineAmount: parseFloat(formData.fineAmount),
          totalAmount: parseFloat(formData.totalAmount)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create challan');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['challan-stats'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.challanNumber || !formData.offence || !formData.fineAmount || !formData.totalAmount) {
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Add Challan Manually</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium mb-1">Vehicle *</label>
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles?.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.reg} — {v.model}
                </option>
              ))}
            </select>
          </div>

          {/* Challan Number */}
          <div>
            <label className="block text-sm font-medium mb-1">Challan Number *</label>
            <input
              type="text"
              value={formData.challanNumber}
              onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
              placeholder="e.g., MH123456789"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Challan Date *</label>
            <input
              type="date"
              value={formData.challanDate}
              onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
              required
            />
          </div>

          {/* Offence */}
          <div>
            <label className="block text-sm font-medium mb-1">Offence *</label>
            <input
              type="text"
              value={formData.offence}
              onChange={(e) => setFormData({ ...formData, offence: e.target.value })}
              placeholder="e.g., Overspeeding, Signal Jump"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
              required
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium mb-1">Section (Optional)</label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="e.g., MV Act 177"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fine Amount *</label>
              <input
                type="number"
                value={formData.fineAmount}
                onChange={(e) => setFormData({ ...formData, fineAmount: e.target.value })}
                placeholder="500"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount *</label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="500"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
                required
                min="0"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Location (Optional)</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Where did the violation occur?"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional details..."
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Error */}
          {createMutation.isError && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertTriangle size={16} />
              {createMutation.error?.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {createMutation.isPending ? 'Saving...' : 'Add Challan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}