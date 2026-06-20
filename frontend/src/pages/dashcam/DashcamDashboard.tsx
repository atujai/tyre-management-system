import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashcamApi } from '../../api/dashcamApi';
import { VideoPlayer } from '../../components/dashcam/VideoPlayer';
import { LiveStream } from '../../components/dashcam/LiveStream';
import { EventTimeline } from '../../components/dashcam/EventTimeline';
import { StorageBar } from '../../components/dashcam/StorageBar';

export const DashcamDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashcam-stats'],
    queryFn: dashcamApi.getDashboardStats,
  });

  const { data: dashcams } = useQuery({
    queryKey: ['dashcams'],
    queryFn: dashcamApi.getDashcams,
  });

  const [selectedDashcam, setSelectedDashcam] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useMutation({
    mutationFn: dashcamApi.startLiveStream,
  });

  const stopStream = useMutation({
    mutationFn: dashcamApi.stopLiveStream,
  });

  const selectedDevice = dashcams?.find((d: any) => d.id === selectedDashcam);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashcam Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Total Devices</p>
          <p className="text-2xl font-bold text-white">{stats?.totalDashcams || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Online</p>
          <p className="text-2xl font-bold text-green-400">{stats?.onlineDashcams || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Recording</p>
          <p className="text-2xl font-bold text-blue-400">{stats?.recordingDashcams || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Streaming</p>
          <p className="text-2xl font-bold text-purple-400">{stats?.streamingDashcams || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Unreviewed Events</p>
          <p className="text-2xl font-bold text-orange-400">{stats?.unreviewedEvents || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="space-y-4">
          {dashcams?.map((dashcam: any) => (
            <div
              key={dashcam.id}
              onClick={() => setSelectedDashcam(dashcam.id)}
              className={`bg-slate-800 p-4 rounded-xl cursor-pointer transition-all ${
                selectedDashcam === dashcam.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-semibold">
                    {dashcam.vehicle.registrationNumber}
                  </h3>
                  <p className="text-slate-400 text-sm">{dashcam.model}</p>
                </div>
                <StatusBadge status={dashcam.status} />
              </div>

              <StorageBar
                used={dashcam.storageUsed}
                total={dashcam.storageTotal}
              />

              <div className="mt-3 flex gap-2">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {dashcam.resolution}
                </span>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {dashcam.fps}fps
                </span>
                {dashcam.nightVision && (
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                    NV
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main View */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDevice && (
            <>
              {/* Live View / Player */}
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                {isStreaming ? (
                  <LiveStream
                    streamUrl={selectedDevice.streamUrl}
                    onStop={() => {
                      stopStream.mutate(selectedDevice.id);
                      setIsStreaming(false);
                    }}
                  />
                ) : (
                  <div className="aspect-video bg-slate-900 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-slate-400 mb-4">Live Stream Ready</p>
                      <button
                        onClick={() => {
                          startStream.mutate(selectedDevice.id);
                          setIsStreaming(true);
                        }}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                      >
                        Start Live Stream
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Recordings */}
              <div className="bg-slate-800 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Recordings
                </h3>
                <RecordingsList dashcamId={selectedDevice.id} />
              </div>

              {/* Events */}
              <div className="bg-slate-800 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Events
                </h3>
                <EventTimeline dashcamId={selectedDevice.id} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    ONLINE: 'bg-green-500/20 text-green-400',
    OFFLINE: 'bg-red-500/20 text-red-400',
    RECORDING: 'bg-blue-500/20 text-blue-400',
    STREAMING: 'bg-purple-500/20 text-purple-400',
    ERROR: 'bg-orange-500/20 text-orange-400',
    MAINTENANCE: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${colors[status] || colors.OFFLINE}`}>
      {status}
    </span>
  );
};