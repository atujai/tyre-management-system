import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashcamApi } from '../../api/dashcamApi';
import { format } from 'date-fns';
import { VideoPlayer } from '../../components/dashcam/VideoPlayer';
import { StorageBar } from '../../components/dashcam/StorageBar';

export const DashcamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'recordings' | 'events' | 'settings'>('recordings');

  const { data: dashcam } = useQuery(['dashcam', id], () => dashcamApi.getDashcamById(id!));
  const { data: recordings } = useQuery(['dashcam-recordings', id], () => dashcamApi.getRecordings(id!));
  const { data: events } = useQuery(['dashcam-events', id], () => dashcamApi.getEvents(id!));
  const { data: health } = useQuery(['dashcam-health', id], () => dashcamApi.getHealthStatus(id!));
  const { data: storage } = useQuery(['dashcam-storage', id], () => dashcamApi.getStorageInfo(id!));

  const updateSettings = useMutation(dashcamApi.updateSettings);
  const reviewEvent = useMutation(dashcamApi.reviewEvent);
  const cleanupStorage = useMutation(dashcamApi.cleanupStorage);

  if (!dashcam) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {dashcam.vehicle?.registrationNumber} - Dashcam
        </h1>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            dashcam.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' :
            dashcam.status === 'RECORDING' ? 'bg-blue-500/20 text-blue-400' :
            dashcam.status === 'STREAMING' ? 'bg-purple-500/20 text-purple-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {dashcam.status}
          </span>
          {health && health.issues.length > 0 && (
            <span className="px-3 py-1 rounded-full text-sm bg-orange-500/20 text-orange-400">
              {health.issues.length} Issue{health.issues.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Device Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Device Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Model</span>
              <span className="text-white">{dashcam.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Serial</span>
              <span className="text-white">{dashcam.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Resolution</span>
              <span className="text-white">{dashcam.resolution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">FPS</span>
              <span className="text-white">{dashcam.fps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Firmware</span>
              <span className="text-white">{dashcam.firmwareVersion || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Ping</span>
              <span className="text-white">
                {dashcam.lastPing ? format(new Date(dashcam.lastPing), 'PPp') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Storage</h3>
          {storage && <StorageBar used={storage.usedSpace} total={storage.totalCapacity} />}
          <div className="mt-4 flex justify-between items-center">
            <span className="text-slate-400 text-sm">
              {storage ? `${(storage.usedSpace / 1024 / 1024 / 1024).toFixed(1)} GB used` : 'Loading...'}
            </span>
            <button
              onClick={() => cleanupStorage.mutate(id!)}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-sm"
            >
              Cleanup Old
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Health Status</h3>
          {health ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Online</span>
                <span className={health.isOnline ? 'text-green-400' : 'text-red-400'}>
                  {health.isOnline ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Storage</span>
                <span className={health.storageHealthy ? 'text-green-400' : 'text-red-400'}>
                  {health.storageHealthy ? 'Healthy' : 'Critical'}
                </span>
              </div>
              {health.issues.length > 0 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {health.issues.map((issue: string, i: number) => (
                    <p key={i} className="text-red-400 text-sm">⚠️ {issue}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400">Loading...</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-700">
          {(['recordings', 'events', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'recordings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings?.map((rec: any) => (
                <div key={rec.id} className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-slate-900 flex items-center justify-center">
                    {rec.thumbnail ? (
                      <img src={rec.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 text-sm">No Preview</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white text-sm font-medium">{rec.type}</p>
                        <p className="text-slate-400 text-xs">
                          {format(new Date(rec.startTime), 'PPp')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        rec.archived ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600 text-slate-300'
                      }`}>
                        {rec.archived ? 'Archived' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      {(rec.fileSize / 1024 / 1024).toFixed(1)} MB · {rec.duration}s
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button className="flex-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        Play
                      </button>
                      <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-2">
              {events?.map((event: any) => (
                <div key={event.id} className={`flex justify-between items-center p-4 rounded-lg ${
                  event.reviewed ? 'bg-slate-700/30' : 'bg-slate-700/50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'CRITICAL' ? 'bg-red-500' :
                      event.severity === 'WARNING' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className={`text-sm ${event.reviewed ? 'text-slate-400' : 'text-white'}`}>
                        {event.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-slate-500 text-xs">{event.description}</p>
                      <p className="text-slate-500 text-xs">
                        {format(new Date(event.timestamp), 'PPp')}
                        {event.speed && ` · ${event.speed.toFixed(1)} km/h`}
                      </p>
                    </div>
                  </div>
                  {!event.reviewed && (
                    <button
                      onClick={() => reviewEvent.mutate(event.id)}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-sm"
                    >
                      Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white">Resolution</span>
                <select
                  defaultValue={dashcam.resolution}
                  onChange={(e) => updateSettings.mutate({ id: id!, resolution: e.target.value })}
                  className="bg-slate-700 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="1440p">1440p</option>
                  <option value="4K">4K</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">FPS</span>
                <select
                  defaultValue={dashcam.fps}
                  onChange={(e) => updateSettings.mutate({ id: id!, fps: parseInt(e.target.value) })}
                  className="bg-slate-700 text-white rounded px-3 py-2 text-sm"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Night Vision</span>
                <button
                  onClick={() => updateSettings.mutate({ id: id!, nightVision: !dashcam.nightVision })}
                  className={`w-12 h-6 rounded-full transition-colors ${dashcam.nightVision ? 'bg-blue-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${dashcam.nightVision ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Audio</span>
                <button
                  onClick={() => updateSettings.mutate({ id: id!, audioEnabled: !dashcam.audioEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${dashcam.audioEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${dashcam.audioEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Loop Recording</span>
                <button
                  onClick={() => updateSettings.mutate({ id: id!, loopRecording: !dashcam.loopRecording })}
                  className={`w-12 h-6 rounded-full transition-colors ${dashcam.loopRecording ? 'bg-blue-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${dashcam.loopRecording ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};