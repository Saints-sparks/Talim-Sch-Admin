'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'

  // Sample notification data
  const notifications = [
    {
      id: 1,
      sender: 'Mrs. Yetunde Adebayo',
      type: 'Announcement',
      message: 'Dear Students, please be reminded that all assignments for this week are due on Friday.',
      time: '9:00 PM',
      read: false,
    },
    {
      id: 2,
      sender: 'Mrs. Yetunde Adebayo',
      type: 'Announcement',
      message: 'Dear Students, ensure you check the updated timetable.',
      time: '3:00 PM',
      read: true,
    },
    {
      id: 3,
      sender: 'Mrs. Yetunde Adebayo',
      type: 'Announcement',
      message: 'The upcoming quiz schedule has been posted.',
      time: '12:00 PM',
      read: true,
    },
    {
      id: 4,
      sender: 'Mrs. Yetunde Adebayo',
      type: 'Announcement',
      message: 'Don’t forget to attend tomorrow’s virtual meeting at 10:00 AM.',
      time: '10:00 AM',
      read: false,
    },
  ];

  // Filter notifications based on the active tab
  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((notification) => !notification.read);

  return (
    <div className="p-6">
          <Header user={'Admistrator'} tent={'Notifications'} />
      {/* Header */}
      <header className="flex items-center justify-between mb-6 p-5">
        <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'unread'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            Unread ({notifications.filter((n) => !n.read).length})
          </button>
        </div>
      </header>

      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg p-6">
        {filteredNotifications.length > 0 ? (
          <ul className="space-y-4">
            {filteredNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`flex items-center justify-between p-4 border ${
                  notification.read ? 'bg-gray-50' : 'bg-blue-50'
                } rounded-md`}
              >
                <div>
                  <h2 className="text-sm font-medium text-gray-800">
                    {notification.sender}
                  </h2>
                  <p className="text-xs text-gray-600">{notification.type}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {notification.message}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{notification.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No notifications to display.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
