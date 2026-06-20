import React, { useState } from 'react';
import { 
  FileText, Edit, Trash2, Download, Eye, Bell, RefreshCw,
  AlertTriangle, CheckCircle, Clock, XCircle, Archive, ChevronDown
} from 'lucide-react';
import { useDocumentsByTruck, useDeleteDocument, useSendReminder } from '../../hooks/useDocuments';
import { Document, DocumentStatus, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_CONFIG } from '../../types/document';
import { format, differenceInDays } from 'date-fns';
import DocumentRenewModal from './DocumentRenewModal';

interface DocumentListProps {
  truckId: string;
  searchQuery: string;
  filterStatus: string;
  onEdit: (doc: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ truckId, searchQuery, filterStatus, onEdit }) => {
  const { data: documents, isLoading } = useDocumentsByTruck(truckId || 'all');
  const deleteMutation = useDeleteDocument();
  const sendReminder = useSendReminder();
  const [renewDoc, setRenewDoc] = useState<Document | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const filteredDocs = documents?.filter((doc) => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.truck?.number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !filterStatus || doc.status === filterStatus;

    return matchesSearch && matchesStatus;
  }) || [];

  const getDaysBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());

    if (days < 0) return <span className="text-red-400 font-bold">Expired {Math.abs(days)}d ago</span>;
    if (days === 0) return <span className="text-red-400 font-bold">Expires Today</span>;
    if (days <= 7) return <span className="text-red-400 font-bold">{days}d left</span>;
    if (days <= 15) return <span className="text-orange-400 font-bold">{days}d left</span>;
    if (days <= 30) return <span className="text-yellow-400 font-bold">{days}d left</span>;
    return <span className="text-green-400">{days}d left</span>;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_API_URL}${fileUrl}`;
    link.download = fileName;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-400 mt-4">Loading documents...</p>
      </div>
    );
  }

  if (filteredDocs.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400">No documents found</h3>
        <p className="text-gray-500 mt-2">
          {truckId ? 'This truck has no documents yet.' : 'No documents match your filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Document</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Truck</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Type</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Number</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Expiry</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredDocs.map((doc) => {
              const statusConfig = DOCUMENT_STATUS_CONFIG[doc.status];
              const isExpanded = expandedDoc === doc.id;

              return (
                <React.Fragment key={doc.id}>
                  <tr 
                    className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${DOCUMENT_STATUS_CONFIG[doc.status]?.color || 'bg-gray-500'}`}>
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.fileName && (
                            <p className="text-xs text-gray-400">{doc.fileName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {doc.truck?.number || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.type === 'INSURANCE' ? 'bg-green-500/20 text-green-400' :
                        doc.type === 'REGISTRATION' ? 'bg-blue-500/20 text-blue-400' :
                        doc.type === 'FITNESS' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {DOCUMENT_TYPE_LABELS[doc.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {doc.number || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {doc.expiryDate ? (
                          <>
                            <p>{format(new Date(doc.expiryDate), 'MMM dd, yyyy')}</p>
                            <p className="text-xs mt-1">{getDaysBadge(doc.expiryDate)}</p>
                          </>
                        ) : (
                          <span className="text-gray-500">No expiry</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                        doc.status === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                        doc.status === 'EXPIRING_SOON' ? 'bg-yellow-500/20 text-yellow-400' :
                        doc.status === 'RENEWAL_PENDING' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {doc.status === 'ACTIVE' && <CheckCircle className="w-3 h-3" />}
                        {doc.status === 'EXPIRED' && <XCircle className="w-3 h-3" />}
                        {doc.status === 'EXPIRING_SOON' && <AlertTriangle className="w-3 h-3" />}
                        {doc.status === 'RENEWAL_PENDING' && <Clock className="w-3 h-3" />}
                        {doc.status === 'ARCHIVED' && <Archive className="w-3 h-3" />}
                        {statusConfig?.label || doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {doc.fileUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(doc.fileUrl!, doc.fileName || 'document');
                            }}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sendReminder.mutate({ id: doc.id });
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-yellow-400"
                          title="Send Reminder"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenewDoc(doc);
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-green-400"
                          title="Renew"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(doc);
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-700/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Details</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-gray-500">Issue Date:</span> {doc.issueDate ? format(new Date(doc.issueDate), 'MMM dd, yyyy') : 'N/A'}</p>
                              <p><span className="text-gray-500">Last Renewal:</span> {doc.lastRenewalDate ? format(new Date(doc.lastRenewalDate), 'MMM dd, yyyy') : 'N/A'}</p>
                              <p><span className="text-gray-500">Next Renewal:</span> {doc.nextRenewalDate ? format(new Date(doc.nextRenewalDate), 'MMM dd, yyyy') : 'N/A'}</p>
                              <p><span className="text-gray-500">Renewal Cost:</span> {doc.renewalCost ? `₹${doc.renewalCost}` : 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Reminders</h4>
                            <div className="space-y-2 text-sm">
                              <p className="flex items-center gap-2">
                                <span className={doc.reminderSent30 ? 'text-green-400' : 'text-gray-500'}>
                                  {doc.reminderSent30 ? '✓' : '○'} 30 days
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className={doc.reminderSent15 ? 'text-green-400' : 'text-gray-500'}>
                                  {doc.reminderSent15 ? '✓' : '○'} 15 days
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className={doc.reminderSent7 ? 'text-green-400' : 'text-gray-500'}>
                                  {doc.reminderSent7 ? '✓' : '○'} 7 days
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className={doc.reminderSent1 ? 'text-green-400' : 'text-gray-500'}>
                                  {doc.reminderSent1 ? '✓' : '○'} 1 day
                                </span>
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Notes</h4>
                            <p className="text-sm text-gray-300">{doc.notes || 'No notes'}</p>
                            <p className="text-xs text-gray-500 mt-4">
                              Created: {format(new Date(doc.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Renew Modal */}
      {renewDoc && (
        <DocumentRenewModal
          document={renewDoc}
          onClose={() => setRenewDoc(null)}
        />
      )}
    </div>
  );
};

export default DocumentList;