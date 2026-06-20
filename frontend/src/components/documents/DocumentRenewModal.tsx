import React, { useState } from 'react';
import { X, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { useRenewDocument } from '../../hooks/useDocuments';
import { Document } from '../../types/document';
import { format } from 'date-fns';

interface DocumentRenewModalProps {
  document: Document;
  onClose: () => void;
}

const DocumentRenewModal: React.FC<DocumentRenewModalProps> = ({ document, onClose }) => {
  const renewMutation = useRenewDocument();
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [renewalCost, setRenewalCost] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await renewMutation.mutateAsync({
      id: document.id,
      newExpiryDate,
      renewalCost: renewalCost ? parseFloat(renewalCost) : undefined,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Renew Document
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">Current Document</p>
            <p className="font-medium">{document.title}</p>
            <p className="text-sm text-gray-400 mt-1">
              Current Expiry: {document.expiryDate ? format(new Date(document.expiryDate), 'MMM dd, yyyy') : 'N/A'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                New Expiry Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Renewal Cost (₹)
              </label>
              <input
                type="number"
                value={renewalCost}
                onChange={(e) => setRenewalCost(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Renewal Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notes about this renewal..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renewMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              >
                {renewMutation.isPending ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentRenewModal;