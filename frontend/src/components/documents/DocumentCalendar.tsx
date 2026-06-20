import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  AlertTriangle, CheckCircle, Clock, FileText
} from 'lucide-react';
import { useDocumentsByTruck } from '../../hooks/useDocuments';
import { Document, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS } from '../../types/document';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, differenceInDays } from 'date-fns';

interface DocumentCalendarProps {
  truckId?: string;
}

const DocumentCalendar: React.FC<DocumentCalendarProps> = ({ truckId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: documents } = useDocumentsByTruck(truckId || 'all');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(() => {
    const daysArray = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    return daysArray;
  }, [calendarStart, calendarEnd]);

  const getDocumentsForDay = (date: Date) => {
    return documents?.filter((doc) => {
      if (!doc.expiryDate) return false;
      return isSameDay(new Date(doc.expiryDate), date);
    }) || [];
  };

  const getStatusColor = (doc: Document) => {
    const daysUntil = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : 0;
    if (daysUntil < 0) return 'bg-red-500';
    if (daysUntil <= 7) return 'bg-orange-500';
    if (daysUntil <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const selectedDayDocs = selectedDate ? getDocumentsForDay(selectedDate) : [];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-400" />
            Document Calendar
          </h2>
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-semibold min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-400">Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-400">&lt; 7 days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-400">&lt; 30 days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-400">Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayDocs = getDocumentsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[100px] p-2 border border-gray-700/50 rounded-lg cursor-pointer
                    transition-all hover:bg-gray-700/50
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isSelected ? 'bg-gray-700' : ''}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayDocs.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        className={`text-xs px-2 py-1 rounded text-white truncate ${getStatusColor(doc)}`}
                        title={`${doc.title} - ${DOCUMENT_TYPE_LABELS[doc.type]}`}
                      >
                        {doc.title}
                      </div>
                    ))}
                    {dayDocs.length > 3 && (
                      <div className="text-xs text-gray-400 text-center">
                        +{dayDocs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="bg-gray-700/30 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </h3>

          {selectedDayDocs.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No documents expiring on this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayDocs.map((doc) => {
                const daysUntil = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : 0;

                return (
                  <div key={doc.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(doc)}`}>
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{doc.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {doc.truck?.number} • {DOCUMENT_TYPE_LABELS[doc.type]}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {daysUntil < 0 ? (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Expired
                            </span>
                          ) : daysUntil <= 7 ? (
                            <span className="text-xs text-orange-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {daysUntil} days left
                            </span>
                          ) : (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {daysUntil} days left
                            </span>
                          )}
                        </div>
                        {doc.number && (
                          <p className="text-xs text-gray-500 mt-1">Doc #: {doc.number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCalendar;