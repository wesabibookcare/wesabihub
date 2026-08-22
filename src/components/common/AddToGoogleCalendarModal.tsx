import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { createGoogleCalendarEvent, connectGoogleServices, getGoogleAccessToken, CalendarEventPayload } from '../../services/googleService';
import { toast } from 'sonner';

interface AddToGoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEvent: CalendarEventPayload;
}

export const AddToGoogleCalendarModal: React.FC<AddToGoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  defaultEvent,
}) => {
  const [eventData, setEventData] = useState<CalendarEventPayload>(defaultEvent);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddToCalendar = async () => {
    setLoading(true);
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        token = await connectGoogleServices();
      }
      if (!token) {
        toast.error('Google authorization required to add event to Google Calendar');
        setLoading(false);
        return;
      }

      await createGoogleCalendarEvent(eventData, token);
      setSuccess(true);
      toast.success('Event successfully added to your Google Calendar!');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add event to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Google Calendar</h3>
              <p className="text-xs text-teal-100">Schedule Delivery / Pickup Reminder</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl font-bold p-1 rounded-lg">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {success ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="font-bold text-gray-900 text-lg">Event Scheduled!</h4>
              <p className="text-sm text-gray-500">Check your Google Calendar for your reminder.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Event Summary</label>
                  <input
                    type="text"
                    value={eventData.summary}
                    onChange={e => setEventData({ ...eventData, summary: e.target.value })}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Details</label>
                  <textarea
                    rows={2}
                    value={eventData.description}
                    onChange={e => setEventData({ ...eventData, description: e.target.value })}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      value={eventData.startTime ? new Date(eventData.startTime).toISOString().slice(0, 16) : ''}
                      onChange={e => setEventData({ ...eventData, startTime: new Date(e.target.value).toISOString() })}
                      className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      value={eventData.endTime ? new Date(eventData.endTime).toISOString().slice(0, 16) : ''}
                      onChange={e => setEventData({ ...eventData, endTime: new Date(e.target.value).toISOString() })}
                      className="w-full p-2 text-xs border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={eventData.location || ''}
                    onChange={e => setEventData({ ...eventData, location: e.target.value })}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Confirming will create an event on your primary Google Calendar with email & popup reminders set.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCalendar}
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Add to Google Calendar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
