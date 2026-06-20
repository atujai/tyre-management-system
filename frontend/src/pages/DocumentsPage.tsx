import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, AlertTriangle, Clock, CheckCircle, XCircle, 
  Archive, Search, Filter, Truck, Calendar, Bell, Download,
  ChevronRight, TrendingUp, Shield, AlertOctagon, LayoutGrid, List
} from 'lucide-react';
import { useDocumentDashboard, useExpiringDocuments } from '../hooks/useDocuments';
import { useVehicles } from '../hooks/useVehicles';
import { DOCUMENT_STATUS_CONFIG, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS } from '../types/document';
import { format, differenceInDays } from 'date-fns';
import DocumentModal from '../components/documents/DocumentModal';
import DocumentList from '../components/documents/DocumentList';
import DocumentCalendar from '../components/documents/DocumentCalendar';

type ViewMode = 'list' | 'calendar';

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const { data: dashboard } = useDocumentDashboard();
  const { data: expiringDocs } = useExpiringDocuments(30);
  const { data: vehicles } = useVehicles();

  const stats = [
    { 
      title: 'Total Documents', 
      value: dashboard?.totalDocuments || 0, 
      icon: FileText, 
      color: 'bg-blue-500',
      trend: '+12%'
    },
    { 
      title: 'Expiring in 30 Days', 
      value: dashboard?.expiring30 || 0, 
      icon: AlertTriangle, 
      color: 'bg-yellow-500',
      trend: 'Urgent'
    },
    { 
      title: 'Expiring in 7 Days', 
      value: dashboard?.expiring7 || 0, 
      icon: Clock, 
      color: 'bg-orange-500',
      trend: 'Critical'
    },
    { 
      title: 'Expired', 
      value: dashboard?.expired || 0, 
      icon: XCircle, 
      color: 'bg-red-500',
      trend: 'Action Needed'
    },
  ];

  const handleCreate = () => {
    setModalMode('create');
    setSelectedDocument(null);
    setIsModalOpen(true);
  };

  const handleEdit = (doc: any) => {
    setModalMode('edit');
    setSelectedDocument(doc);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Document Management
          </h1>
          <p className="text-gray-400 mt-1">Manage truck documents, track expiry dates & renewals</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm">List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Calendar</span>
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Document
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${
                stat.trend === 'Critical' || stat.trend === 'Action Needed' 
                  ? 'text-red-400' 
                  : stat.trend === 'Urgent' 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
              }`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Document Type Distribution */}
      {dashboard?.byType && dashboard.byType.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Documents by Type
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {dashboard.byType.map((item) => (
              <div key={item.type} className="bg-gray-700 rounded-lg p-4">
                <div className={`w-3 h-3 rounded-full ${DOCUMENT_TYPE_COLORS[item.type]} mb-2`} />
                <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[item.type]}</p>
                <p className="text-2xl font-bold mt-1">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon Alert */}
      {expiringDocs && expiringDocs.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400">
            <Bell className="w-5 h-5" />
            Expiring Soon ({expiringDocs.length} documents)
          </h3>
          <div className="space-y-3">
            {expiringDocs.slice(0, 5).map((doc) => {
              const daysLeft = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : 0;
              const statusConfig = DOCUMENT_STATUS_CONFIG[doc.status];

              return (
                <div key={doc.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${statusConfig?.color || 'bg-gray-500'}`}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-gray-400">
                        {doc.truck?.number} • {DOCUMENT_TYPE_LABELS[doc.type]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      daysLeft <= 7 ? 'text-red-400' : daysLeft <= 15 ? 'text-orange-400' : 'text-yellow-400'
                    }`}>
                      {daysLeft} days left
                    </p>
                    <p className="text-sm text-gray-400">
                      Expires {doc.expiryDate ? format(new Date(doc.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {expiringDocs.length > 5 && (
            <button className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
              View all {expiringDocs.length} expiring documents →
            </button>
          )}
        </div>
      )}

      {/* View Content */}
      {viewMode === 'list' ? (
        <>
          {/* Filters & Search */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <select
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Trucks</option>
                {vehicles?.map((v) => (
                  <option key={v.id} value={v.id}>{v.number} - {v.model}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="RENEWAL_PENDING">Renewal Pending</option>
                <option value="EXPIRED">Expired</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Document List */}
          <DocumentList 
            truckId={selectedTruck} 
            searchQuery={searchQuery}
            filterStatus={filterStatus}
            onEdit={handleEdit}
          />
        </>
      ) : (
        <DocumentCalendar truckId={selectedTruck} />
      )}

      {/* Modal */}
      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        document={selectedDocument}
        truckId={selectedTruck}
      />
    </div>
  );
};

export default DocumentsPage;