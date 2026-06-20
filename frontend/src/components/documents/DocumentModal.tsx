import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Calendar, DollarSign, Bell } from 'lucide-react';
import { useCreateDocument, useUpdateDocument } from '../../hooks/useDocuments';
import { useVehicles } from '../../hooks/useVehicles';
import { Document, DocumentType, DocumentFormData, DOCUMENT_TYPE_LABELS } from '../../types/document';
import { format } from 'date-fns';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  document?: Document | null;
  truckId?: string;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, mode, document, truckId }) => {
  const { data: vehicles } = useVehicles();
  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();

  const [formData, setFormData] = useState<DocumentFormData>({
    truckId: truckId || '',
    title: '',
    type: 'REGISTRATION',
    number: '',
    issueDate: '',
    expiryDate: '',
    reminderDays: 30,
    renewalCost: undefined,
    notes: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (document && mode === 'edit') {
      setFormData({
        truckId: document.truckId,
        title: document.title,
        type: document.type,
        number: document.number || '',
        issueDate: document.issueDate ? format(new Date(document.issueDate), 'yyyy-MM-dd') : '',
        expiryDate: document.expiryDate ? format(new Date(document.expiryDate), 'yyyy-MM-dd') : '',
        reminderDays: document.reminderDays,
        renewalCost: document.renewalCost || undefined,
        notes: document.notes || '',
      });
    } else {
      setFormData({
        truckId: truckId || '',
        title: '',
        type: 'REGISTRATION',
        number: '',
        issueDate: '',
        expiryDate: '',
        reminderDays: 30,
        renewalCost: undefined,
        notes: '',
      });
      setFile(null);
    }
  }, [document, mode, truckId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: DocumentFormData = {
      ...formData,
      file: file || undefined,
    };

    if (mode === 'create') {
      await createMutation.mutateAsync(submitData);
    } else if (document) {
      await updateMutation.mutateAsync({ id: document.id, formData: submitData });
    }

    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            {mode === 'create' ? 'Add New Document' : 'Edit Document'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Truck <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.truckId}
              onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Truck</option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>{v.number} - {v.model}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentType })}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Vehicle Registration 2024"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Document Number / ID
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="e.g., MH12AB1234"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Expiry Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Reminder Days Before Expiry
              </label>
              <input
                type="number"
                value={formData.reminderDays}
                onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) || 30 })}
                min={1}
                max={365}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Default: 30 days</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Renewal Cost (₹)
              </label>
              <input
                type="number"
                value={formData.renewalCost || ''}
                onChange={(e) => setFormData({ ...formData, renewalCost: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attach Document File
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {file ? (
                  <span className="text-blue-400">{file.name}</span>
                ) : (
                  <>
                    Drag & drop file here, or{' '}
                    <label className="text-blue-400 cursor-pointer hover:text-blue-300">
                      browse
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </label>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes about this document..."
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                mode === 'create' ? 'Add Document' : 'Update Document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentModal;