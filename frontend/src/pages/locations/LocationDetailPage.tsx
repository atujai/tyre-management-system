// pages/locations/LocationDetailPage.tsx — COMPLETE FINAL FILE
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  Package,
  CircleDot,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Truck,
  Warehouse,
  X,
  ArrowRightLeft,
  Settings,
  Bell,
} from 'lucide-react';
import { locationApi } from '../../api/locationApi';
import { TyreConditionBadge } from '../../components/locations/TyreConditionBadge';
import { SizeInventoryCard } from '../../components/locations/SizeInventoryCard';
import { TyreListModal } from '../../components/locations/TyreListModal';
import { BulkTransferModal } from '../../components/locations/BulkTransferModal';
import { PDFReportButton } from '../../components/locations/PDFReportButton';
import { StockAlertsPanel } from '../../components/alerts/StockAlertsPanel';
import { AlertThresholdSettings } from '../../components/alerts/AlertThresholdSettings';
import type { TyreCondition, TyreSizeCount, Location } from '../../types/location.types';

const CONDITION_COLORS: Record<TyreCondition, { bg: string; text: string; border: string }> = {
  NEW:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  REPAIR:    { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30' },
  RETREAD:   { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  WORN:      { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  SCRAP:     { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
  REJECTED:  { bg: 'bg-rose-500/15',   text: 'text-rose-400',   border: 'border-rose-500/30' },
};

const CONDITIONS: TyreCondition[] = ['NEW', 'REPAIR', 'RETREAD', 'WORN', 'SCRAP', 'REJECTED'];

export const LocationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSize, setSelectedSize] = useState<TyreSizeCount | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<TyreCondition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCondition, setFilterCondition] = useState<TyreCondition | 'ALL'>('ALL');
  const [filterRim, setFilterRim] = useState<'ALL' | 'WITH_RIM' | 'WITHOUT_RIM'>('ALL');

  // New feature states
  const [showTransfer, setShowTransfer] = useState(false);
  const [showThresholds, setShowThresholds] = useState(false);

  const { data: location, isPending: locationLoading } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationApi.getById(id!),
    enabled: !!id,
  });

  const { data: inventory, isPending: inventoryLoading } = useQuery({
    queryKey: ['location-inventory', id],
    queryFn: () => locationApi.getInventory(id!),
    enabled: !!id,
  });

  const { data: allLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: locationApi.getAll,
  });

  const isLoading = locationLoading || inventoryLoading;

  const filteredSizes = inventory?.bySize.filter((sizeGroup) => {
    const matchesSearch = !searchQuery || 
      sizeGroup.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sizeGroup.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sizeGroup.pattern.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCondition = filterCondition === 'ALL' || 
      (sizeGroup.conditions[filterCondition]?.count || 0) > 0;
    return matchesSearch && matchesCondition;
  }) || [];

  const summaryStats = inventory?.summary || {
    totalTyres: 0, totalWithRim: 0, totalWithoutRim: 0, byCondition: {} as Record<TyreCondition, number>,
  };

  const handleSizeClick = (size: TyreSizeCount, condition?: TyreCondition) => {
    setSelectedSize(size);
    setSelectedCondition(condition || null);
  };

  const handleConditionSummaryClick = (condition: TyreCondition) => {
    setSelectedSize(null);
    setSelectedCondition(condition);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!location || !inventory) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg">Location not found</p>
          <button 
            onClick={() => navigate('/locations')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  const LocationIcon = location.type === 'GODOWN' ? Warehouse : Truck;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate('/locations')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Locations</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${location.type === 'GODOWN' ? 'bg-amber-500/10' : 'bg-purple-500/10'}`}>
                <LocationIcon className={`w-6 h-6 ${location.type === 'GODOWN' ? 'text-amber-400' : 'text-purple-400'}`} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{location.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    location.type === 'GODOWN' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {location.type}
                  </span>
                  {location.isActive ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CircleDot className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <CircleDot className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:text-right text-sm text-slate-400 gap-1">
              {location.address && (
                <div className="flex items-center sm:justify-end gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{location.address}</span>
                </div>
              )}
              {location.contactPerson && (
                <div className="flex items-center sm:justify-end gap-1">
                  <User className="w-4 h-4" />
                  <span>{location.contactPerson}</span>
                </div>
              )}
              {location.contactPhone && (
                <div className="flex items-center sm:justify-end gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{location.contactPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
            >
              <ArrowRightLeft className="w-4 h-4" /> Transfer Tyres
            </button>
            <PDFReportButton locationId={id!} locationName={location.name} />
            <button
              onClick={() => setShowThresholds(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              <Settings className="w-4 h-4" /> Alert Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Total Tyres</p>
            <p className="text-2xl font-bold text-white mt-1">{summaryStats.totalTyres}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" /> {summaryStats.totalWithRim} with rim
              </span>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider">With Rim</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{summaryStats.totalWithRim}</p>
            <p className="text-xs text-slate-500 mt-2">
              {summaryStats.totalTyres > 0 ? `${((summaryStats.totalWithRim / summaryStats.totalTyres) * 100).toFixed(0)}%` : '0%'}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Without Rim</p>
            <p className="text-2xl font-bold text-slate-300 mt-1">{summaryStats.totalWithoutRim}</p>
            <p className="text-xs text-slate-500 mt-2">
              {summaryStats.totalTyres > 0 ? `${((summaryStats.totalWithoutRim / summaryStats.totalTyres) * 100).toFixed(0)}%` : '0%'}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 col-span-2 sm:col-span-1">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Unique Sizes</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{inventory.bySize.length}</p>
            <p className="text-xs text-slate-500 mt-2">Different specs</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 col-span-2 sm:col-span-1">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Unique Brands</p>
            <p className="text-2xl font-bold text-violet-400 mt-1">
              {new Set(inventory.bySize.map(s => s.brand)).size}
            </p>
            <p className="text-xs text-slate-500 mt-2">Manufacturers</p>
          </div>
        </div>

        {/* Stock Alerts Panel */}
        <StockAlertsPanel />

        {/* Condition Breakdown */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Condition Breakdown</h2>
            <p className="text-sm text-slate-400">Click any condition to view tyres</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
            {CONDITIONS.map((condition) => {
              const count = summaryStats.byCondition[condition] || 0;
              const colors = CONDITION_COLORS[condition];
              return (
                <button
                  key={condition}
                  onClick={() => handleConditionSummaryClick(condition)}
                  className={`p-4 text-left hover:bg-slate-750 transition-colors ${count > 0 ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                  disabled={count === 0}
                >
                  <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {condition}
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{count}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {summaryStats.totalTyres > 0 ? `${((count / summaryStats.totalTyres) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by size, brand, or pattern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              showFilters ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Condition</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterCondition('ALL')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCondition === 'ALL' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>All Conditions</button>
                {CONDITIONS.map((c) => (
                  <button key={c} onClick={() => setFilterCondition(c)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCondition === c ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Rim Status</label>
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'WITH_RIM', 'WITHOUT_RIM'] as const).map((r) => (
                  <button key={r} onClick={() => setFilterRim(r)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterRim === r ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                    {r === 'ALL' ? 'All' : r === 'WITH_RIM' ? 'With Rim' : 'Without Rim'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{filteredSizes.length}</span> size groups
            {(searchQuery || filterCondition !== 'ALL') && <span> (filtered)</span>}
          </p>
        </div>

        {/* Size Inventory Grid */}
        {filteredSizes.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No tyres found</p>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery ? 'Try adjusting your search' : 'This location has no tyre inventory'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSizes.map((sizeGroup) => (
              <SizeInventoryCard
                key={`${sizeGroup.size}-${sizeGroup.brand}-${sizeGroup.pattern}`}
                sizeGroup={sizeGroup}
                onConditionClick={(condition) => handleSizeClick(sizeGroup, condition)}
                onCardClick={() => handleSizeClick(sizeGroup)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(selectedSize || selectedCondition) && (
        <TyreListModal
          locationId={id!}
          sizeGroup={selectedSize}
          condition={selectedCondition}
          onClose={() => { setSelectedSize(null); setSelectedCondition(null); }}
        />
      )}

      {showTransfer && allLocations && (
        <BulkTransferModal
          fromLocation={location}
          locations={allLocations}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['location-inventory', id] });
            queryClient.invalidateQueries({ queryKey: ['location-tyres'] });
          }}
        />
      )}

      {showThresholds && allLocations && (
        <AlertThresholdSettings
          locations={allLocations}
          onClose={() => setShowThresholds(false)}
        />
      )}
    </div>
  );
};
