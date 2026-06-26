// components/locations/TyreListModal.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Search, 
  Package, 
  Disc, 
  Circle,
  ArrowUpDown,
  Calendar,
  Hash,
  Gauge
} from 'lucide-react';
import { locationApi } from '../../api/locationApi';
import { TyreConditionBadge } from './TyreConditionBadge';
import type { TyreSizeCount, TyreCondition, LocationTyreItem } from '../../types/location.types';

interface TyreListModalProps {
  locationId: string;
  sizeGroup: TyreSizeCount | null;
  condition: TyreCondition | null;
  onClose: () => void;
}

type SortField = 'serialNumber' | 'condition' | 'hasRim' | 'createdAt' | 'treadDepth';
type SortDir = 'asc' | 'desc';

export const TyreListModal: React.FC<TyreListModalProps> = ({
  locationId,
  sizeGroup,
  condition,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [rimFilter, setRimFilter] = useState<'ALL' | 'WITH' | 'WITHOUT'>('ALL');

  const { data: tyres, isPending } = useQuery({
    queryKey: ['location-tyres', locationId, sizeGroup?.size, condition],
    queryFn: () => locationApi.getTyres(locationId, {
      size: sizeGroup?.size,
      condition: condition || undefined,
    }),
    enabled: !!locationId,
  });

  // Filter and sort
  const filteredTyres = React.useMemo(() => {
    if (!tyres) return [];

    let result = [...tyres];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.serialNumber.toLowerCase().includes(q) ||
        t.brand.toLowerCase().includes(q) ||
        t.pattern?.toLowerCase().includes(q)
      );
    }

    // Rim filter
    if (rimFilter !== 'ALL') {
      result = result.filter(t => 
        rimFilter === 'WITH' ? t.hasRim : !t.hasRim
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'serialNumber':
          comparison = a.serialNumber.localeCompare(b.serialNumber);
          break;
        case 'condition':
          comparison = a.condition.localeCompare(b.condition);
          break;
        case 'hasRim':
          comparison = Number(a.hasRim) - Number(b.hasRim);
          break;
        case 'treadDepth':
          comparison = (a.treadDepth || 0) - (b.treadDepth || 0);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tyres, searchQuery, rimFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={`w-3 h-3 ml-1 transition-colors ${sortField === field ? 'text-blue-400' : 'text-slate-600'}`} />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {sizeGroup ? `${sizeGroup.size} — ${sizeGroup.brand}` : 'All Tyres'}
            </h2>
            {condition && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-400">Filtered by:</span>
                <TyreConditionBadge condition={condition} size="sm" />
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Filters bar */}
        <div className="px-6 py-3 border-b border-slate-700 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'WITH', 'WITHOUT'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRimFilter(r)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  rimFilter === r 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {r === 'ALL' ? 'All' : r === 'WITH' ? 'With Rim' : 'No Rim'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredTyres.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No tyres found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800 sticky top-0">
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort('serialNumber')}
                  >
                    <span className="flex items-center">
                      <Hash className="w-3 h-3 mr-1" /> Serial No
                      <SortIcon field="serialNumber" />
                    </span>
                  </th>
                  <th className="px-6 py-3 font-medium">Brand / Pattern</th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort('condition')}
                  >
                    <span className="flex items-center">
                      Condition
                      <SortIcon field="condition" />
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort('hasRim')}
                  >
                    <span className="flex items-center">
                      Rim
                      <SortIcon field="hasRim" />
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort('treadDepth')}
                  >
                    <span className="flex items-center">
                      <Gauge className="w-3 h-3 mr-1" /> Tread
                      <SortIcon field="treadDepth" />
                    </span>
                  </th>
                  <th className="px-6 py-3 font-medium">Vehicle</th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" /> Added
                      <SortIcon field="createdAt" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTyres.map((tyre) => (
                  <tr 
                    key={tyre.id} 
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-3">
                      <span className="text-sm font-mono text-white">{tyre.serialNumber}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-sm text-white">{tyre.brand}</p>
                        <p className="text-xs text-slate-500">{tyre.pattern || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <TyreConditionBadge condition={tyre.condition} size="sm" />
                    </td>
                    <td className="px-6 py-3">
                      {tyre.hasRim ? (
                        <span className="flex items-center gap-1 text-sm text-blue-400">
                          <Disc className="w-4 h-4" /> Yes
                          {tyre.rimType && <span className="text-xs text-slate-500">({tyre.rimType})</span>}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Circle className="w-4 h-4" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {tyre.treadDepth ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                tyre.treadDepth > 6 ? 'bg-emerald-500' : 
                                tyre.treadDepth > 3 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((tyre.treadDepth / 16) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-white">{tyre.treadDepth}mm</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {tyre.vehicle ? (
                        <div>
                          <p className="text-sm text-white">{tyre.vehicle.registrationNumber}</p>
                          <p className="text-xs text-slate-500">{tyre.position || '—'}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Not mounted</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-slate-400">
                        {new Date(tyre.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{filteredTyres.length}</span> of{' '}
            <span className="text-white font-medium">{tyres?.length || 0}</span> tyres
          </p>
        </div>
      </div>
    </div>
  );
};
