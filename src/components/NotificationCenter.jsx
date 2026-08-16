import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Mail, Clock, AlertCircle, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { getPendingNotifications, clearNotification, markNotificationSent } from '../utils/emailService';

const NotificationCenter = ({ pendingListingsCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadNotifications();
  }, [isOpen]);

  const loadNotifications = () => {
    const stored = getPendingNotifications();
    setNotifications(stored);
  };

  const handleClearNotification = (id) => {
    clearNotification(id);
    loadNotifications();
  };

  const handleMarkSent = (id) => {
    markNotificationSent(id);
    loadNotifications();
  };

  const totalCount = pendingListingsCount + notifications.filter(n => !n.sent).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/80 border border-gray-200 hover:bg-white hover:shadow-md transition-all"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">{totalCount} items need attention</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'text-red-600 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Listings ({pendingListingsCount})
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'emails'
                    ? 'text-red-600 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email Queue ({notifications.filter(n => !n.sent).length})
              </button>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {activeTab === 'pending' ? (
                pendingListingsCount > 0 ? (
                  <div className="p-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-orange-800">
                            {pendingListingsCount} listing{pendingListingsCount > 1 ? 's' : ''} awaiting approval
                          </p>
                          <p className="text-sm text-orange-600 mt-1">
                            Review and approve or reject these listings
                          </p>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              // Trigger filter to pending
                              window.dispatchEvent(new CustomEvent('filterPending'));
                            }}
                            className="mt-3 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                          >
                            Review Now
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-600 font-medium">All caught up!</p>
                    <p className="text-sm text-gray-400 mt-1">No pending listings to review</p>
                  </div>
                )
              ) : (
                notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 hover:bg-gray-50 transition-colors ${notif.sent ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'admin' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            <Mail className={`w-4 h-4 ${
                              notif.type === 'admin' ? 'text-blue-600' : 'text-purple-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notif.data?.subject || 'Email notification'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              To: {notif.data?.to_email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                            {notif.sent && (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1">
                                <Check className="w-3 h-3" /> Sent
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!notif.sent && (
                              <button
                                onClick={() => handleMarkSent(notif.id)}
                                className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Mark as sent"
                              >
                                <Check className="w-4 h-4 text-emerald-600" />
                              </button>
                            )}
                            <button
                              onClick={() => handleClearNotification(notif.id)}
                              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No pending emails</p>
                    <p className="text-sm text-gray-400 mt-1">Email queue is empty</p>
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={loadNotifications}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
