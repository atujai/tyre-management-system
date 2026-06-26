// pages/locations/LocationsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Warehouse, 
  Truck, 
  MapPin, 
  Phone,
  ChevronRight,
  X
} from 'lucide-react';
import { locationApi } from '../../api/locationApi';
import type { Location, LocationType } from '../../types/location.types';

export const LocationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<LocationType | 'ALL'>('ALL');
  const [clickLog, setClickLog] = useState<string[]>([]);

  const { data: locations, isPending } = useQuery({
    queryKey: ['locations'],
    queryFn: locationApi.getAll,
  });

  const filteredLocations = locations?.filter((loc) => {
    const matchesSearch = !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || loc.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const godowns = filteredLocations.filter(l => l.type === 'GODOWN');
  const retreaders = filteredLocations.filter(l => l.type === 'RETREADER');

  // Log click events
  const handleCardClick = (locationId: string, locationName: string) => {
    const msg = `CLICKED: ${locationName} (ID: ${locationId}) at ${new Date().toLocaleTimeString()}`;
    console.log(msg);
    setClickLog(prev => [...prev, msg]);
  };

  const LocationCard = ({ location }: { location: Location }) => {
    const isGodown = location.type === 'GODOWN';
    
    return (
      <div 
        className="relative"
        onClick={(e) => {
          console.log('DIV onClick fired');
          handleCardClick(location.id, location.name);
        }}
      >
        <Link
          to={`/locations/${location.id}`}
          onClick={(e) => {
            console.log('LINK onClick fired');
            handleCardClick(location.id, location.name);
          }}
          className="block w-full text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--primary))] hover:shadow-md transition-all group"
          style={{ position: 'relative', zIndex: 10 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${isGodown ? 'bg-amber-500/10' : 'bg-purple-500/10'}`}>
                {isGodown ? (
                  <Warehouse className="w-5 h-5 text-amber-400" />
                ) : (
                  <Truck className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(var(--card-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                  {location.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isGodown ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {location.type}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
          </div>

          {location.address && (
            <div className="flex items-center gap-1.5 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location.address}</span>
            </div>
          )}

          <div className="flex items-center gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {location.contactPerson && (
              <span>{location.contactPerson}</span>
            )}
            {location.contactPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {location.contactPhone}
              </span>
            )}
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Click Log Panel - for debugging */}
      {clickLog.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <h3 className="text-red-400 font-bold mb-2">Click Events Log:</h3>
          <div className="space-y-1 max-h-40 overflow-auto">
            {clickLog.map((log, i) => (
              <p key={i} className="text-red-300 text-xs font-mono">{log}</p>
            ))}
          </div>
          <button 
            onClick={() => setClickLog([])}
            className="mt-2 text-xs text-red-400 underline"
          >
            Clear Log
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Locations</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            Manage godowns and retreaders
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(var(--primary))] hover:opacity-90 text-[hsl(var(--primary-foreground))] rounded-xl font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(['ALL', 'GODOWN', 'RETREADER'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === t 
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' 
                  : 'bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'GODOWN' ? 'Godowns' : 'Retreaders'}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]" />
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12">
          <Warehouse className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
          <p className="text-[hsl(var(--muted-foreground))] text-lg">No locations found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(typeFilter === 'ALL' || typeFilter === 'GODOWN') && godowns.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-amber-400" />
                Godowns ({godowns.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {godowns.map((loc) => (
                  <LocationCard key={loc.id} location={loc} />
                ))}
              </div>
            </section>
          )}

          {(typeFilter === 'ALL' || typeFilter === 'RETREADER') && retreaders.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                Retreaders ({retreaders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {retreaders.map((loc) => (
                  <LocationCard key={loc.id} location={loc} />
                ))}
n              </div>
            </section>
          )}
        </div>
      )}

      {/* Debug info */}
      <div className="mt-8 p-4 bg-[hsl(var(--muted))] rounded-xl text-xs text-[hsl(var(--muted-foreground))]">
        <p>Debug: Locations loaded: {locations?.length || 0}</p>
        <p>Debug: Filtered: {filteredLocations.length}</p>
        <p>Debug: Click events: {clickLog.length}</p>
      </div>
    </div>
  );
};