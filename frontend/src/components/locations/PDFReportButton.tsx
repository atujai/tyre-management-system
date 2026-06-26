// components/locations/PDFReportButton.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Loader2,
  Eye,
  X,
  Printer,
  Calendar,
  MapPin,
  Package,
  User,
} from 'lucide-react';
import { locationApi } from '../../api/locationApi';
import type { PDFReportData } from '../../types/transfer-alert.types';

interface PDFReportButtonProps {
  locationId: string;
  locationName: string;
}

export const PDFReportButton: React.FC<PDFReportButtonProps> = ({
  locationId,
  locationName,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PDFReportData | null>(null);

  const previewMutation = useMutation({
    mutationFn: locationApi.getReportData,
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: locationApi.generatePDFReport,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${locationName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => previewMutation.mutate(locationId)}
          disabled={previewMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          {previewMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          Preview
        </button>
        <button
          onClick={() => downloadMutation.mutate(locationId)}
          disabled={downloadMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          {downloadMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download PDF
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPreview(false)} />

          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inventory Report</h2>
                  <p className="text-sm text-gray-500">{previewData.location.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-8 print:p-0">
              {/* Report Header */}
              <div className="text-center mb-8 border-b border-gray-200 pb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tyre Inventory Report</h1>
                <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {previewData.location.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {new Date(previewData.generatedAt).toLocaleDateString('en-IN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> {previewData.generatedBy}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{previewData.summary.totalTyres}</p>
                  <p className="text-xs text-gray-500 uppercase">Total Tyres</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{previewData.summary.totalWithRim}</p>
                  <p className="text-xs text-gray-500 uppercase">With Rim</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-600">{previewData.summary.totalWithoutRim}</p>
                  <p className="text-xs text-gray-500 uppercase">Without Rim</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{previewData.bySize.length}</p>
                  <p className="text-xs text-gray-500 uppercase">Unique Sizes</p>
                </div>
              </div>

              {/* Condition Breakdown */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Condition Breakdown</h3>
                <div className="grid grid-cols-6 gap-3">
                  {Object.entries(previewData.summary.byCondition).map(([condition, count]) => (
                    <div key={condition} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">{condition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size-wise Inventory */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Size-wise Inventory</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-semibold text-gray-700">Size</th>
                      <th className="px-4 py-2 font-semibold text-gray-700">Brand</th>
                      <th className="px-4 py-2 font-semibold text-gray-700 text-right">Total</th>
                      <th className="px-4 py-2 font-semibold text-gray-700 text-right">With Rim</th>
                      <th className="px-4 py-2 font-semibold text-gray-700 text-right">Without</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.bySize.map((size) => (
                      <tr key={size.size} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{size.size}</td>
                        <td className="px-4 py-2 text-gray-600">{size.brand}</td>
                        <td className="px-4 py-2 text-right font-bold">{size.total}</td>
                        <td className="px-4 py-2 text-right text-blue-600">{size.withRim}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{size.withoutRim}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
                <p>Generated by Tyre Management System</p>
                <p>{new Date(previewData.generatedAt).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
