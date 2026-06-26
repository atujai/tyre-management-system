// components/locations/BulkTransferModal.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Search,
  ArrowRight,
  Check,
  Package,
  MapPin,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { locationApi } from '../../api/locationApi';
import { TyreConditionBadge } from './TyreConditionBadge';
import type { Location, TyreCondition, TransferReason } from '../../types/location.types';
import type { TyreTransferItem } from '../../types/transfer-alert.types';

const TRANSFER_REASONS: { value: TransferReason; label: string }[] = [
  { value: 'STOCK_TRANSFER', label: 'Stock Transfer' },
  { value: 'RETREAD_SEND', label: 'Send for Retreading' },
  { value: 'RETREAD_RETURN', label: 'Retread Return' },
  { value: 'REPAIR_SEND', label: 'Send for Repair' },
  { value: 'REPAIR_RETURN', label: 'Repair Return' },
  { value: 'VEHICLE_FITMENT', label: 'Vehicle Fitment' },
  { value: 'SCRAP_DISPOSAL', label: 'Scrap Disposal' },
  { value: 'OTHER', label: 'Other (specify)' },
];

const CONDITIONS: TyreCondition[] = ['NEW', 'REPAIR', 'RETREAD', 'WORN', 'SCRAP', 'REJECTED'];

interface BulkTransferModalProps {
  fromLocation: Location;
  locations: Location[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkTransferModal: React.FC<BulkTransferModalProps> = ({
  fromLocation,
  locations,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<TyreCondition | 'ALL'>('ALL');
  const [selectedTyres, setSelectedTyres] = useState<Set<string>>(new Set());
  const [toLocationId, setToLocationId] = useState('');
  const [reason, setReason] = useState<TransferReason>('STOCK_TRANSFER');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const { data: tyres, isPending: tyresLoading } = useQuery({
    queryKey: ['transferable-tyres', fromLocation.id, conditionFilter],
    queryFn: () => locationApi.getTransferableTyres(fromLocation.id, {
      condition: conditionFilter === 'ALL' ? undefined : conditionFilter,
    }),
    enabled: !!fromLocation.id,
  });

  const transferMutation = useMutation({
    mutationFn: locationApi.bulkTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['transferable-tyres'] });
      queryClient.invalidateQueries({ queryKey: ['location-tyres'] });
      onSuccess?.();
      onClose();
    },
  });

  const filteredTyres = useMemo(() => {
    if (!tyres) return [];
    if (!searchQuery) return tyres;
    const q = searchQuery.toLowerCase();
    return tyres.filter(t =>
      t.serialNumber.toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q) ||
      t.size.toLowerCase().includes(q)
    );
  }, [tyres, searchQuery]);

  const toggleTyre = (tyreId: string) => {
    setSelectedTyres(prev => {
      const next = new Set(prev);
      if (next.has(tyreId)) next.delete(tyreId);
      else next.add(tyreId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedTyres.size === filteredTyres.length) {
      setSelectedTyres(new Set());
    } else {
      setSelectedTyres(new Set(filteredTyres.map(t => t.tyreId)));
    }
  };

  const handleTransfer = () => {
    if (!toLocationId || selectedTyres.size === 0) return;

    transferMutation.mutate({
      fromLocationId: fromLocation.id,
      toLocationId,
      tyreIds: Array.from(selectedTyres),
      reason,
      customReason: reason === 'OTHER' ? customReason : undefined,
      transferDate: new Date().toISOString(),
      notes: notes || undefined,
      referenceNumber: referenceNumber || undefined,
    });
  };

  const destinationLocations = locations.filter(l => l.id !== fromLocation.id && l.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {step === 1 ? 'Select Tyres to Transfer' : 'Transfer Details'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              From: <span className="text-amber-400">{fromLocation.name}</span>
              {toLocationId && (
                <>
                  {' '}<ArrowRight className="w-4 h-4 inline mx-1" />{' '}
                  <span className="text-blue-400">
                    {locations.find(l => l.id === toLocationId)?.name}
                  </span>
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 py-3 border-b border-slate-700 bg-slate-800/50">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-400' : 'text-slate-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 1 ? 'bg-blue-500 text-white' : 'bg-slate-700'
            }`}>1</div>
            <span className="text-sm font-medium">Select Tyres</span>
          </div>
          <div className="w-8 h-px bg-slate-700 mx-2" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-400' : 'text-slate-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 2 ? 'bg-blue-500 text-white' : 'bg-slate-700'
            }`}>2</div>
            <span className="text-sm font-medium">Confirm Transfer</span>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Filters */}
            <div className="px-6 py-3 border-b border-slate-700 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tyres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value as TyreCondition | 'ALL')}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="ALL">All Conditions</option>
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select all */}
            <div className="px-6 py-2 border-b border-slate-700 flex items-center justify-between bg-slate-800/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filteredTyres.length > 0 && selectedTyres.size === filteredTyres.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                />
                <span className="text-sm text-slate-400">
                  Select All ({selectedTyres.size} selected)
                </span>
              </label>
              <span className="text-xs text-slate-500">{filteredTyres.length} tyres available</span>
            </div>

            {/* Tyre list */}
            <div className="flex-1 overflow-auto">
              {tyresLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredTyres.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No tyres match your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredTyres.map((tyre) => (
                    <label
                      key={tyre.tyreId}
                      className={`flex items-center gap-4 px-6 py-3 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        selectedTyres.has(tyre.tyreId) ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTyres.has(tyre.tyreId)}
                        onChange={() => toggleTyre(tyre.tyreId)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{tyre.serialNumber}</span>
                          <TyreConditionBadge condition={tyre.condition} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {tyre.brand} · {tyre.size}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {tyre.hasRim ? (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Package className="w-3 h-3" /> With rim
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" /> No rim
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                <span className="text-white font-bold">{selectedTyres.size}</span> tyres selected
              </p>
              <button
                onClick={() => setStep(2)}
                disabled={selectedTyres.size === 0}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
              >
                Continue →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Transfer Details */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Destination Location <span className="text-red-400">*</span>
                </label>
                <select
                  value={toLocationId}
                  onChange={(e) => setToLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Select destination...</option>
                  {destinationLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Transfer Reason <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TRANSFER_REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        reason === r.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {reason === 'OTHER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Reason <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              )}

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reference Number (optional)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g., GRN-2026-001"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-sm font-medium text-white mb-3">Transfer Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">From</span>
                    <span className="text-amber-400">{fromLocation.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">To</span>
                    <span className="text-blue-400">
                      {locations.find(l => l.id === toLocationId)?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tyres</span>
                    <span className="text-white font-bold">{selectedTyres.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reason</span>
                    <span className="text-white">
                      {TRANSFER_REASONS.find(r => r.value === reason)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleTransfer}
                disabled={!toLocationId || transferMutation.isPending || (reason === 'OTHER' && !customReason)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
              >
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Transfer
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
