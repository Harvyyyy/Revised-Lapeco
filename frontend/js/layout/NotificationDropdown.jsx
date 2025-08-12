import React from 'react';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ notifications = [], handlers }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const noopHandlers = {
    markAllNotificationsAsRead: () => {},
    markNotificationAsRead: () => {},
    clearAllNotifications: () => {},
  };
  const safeHandlers = { ...noopHandlers, ...(handlers || {}) };

  return (
    <div className="dropdown notification-menu">
      <button 
        className="btn btn-link text-white me-3 position-relative notification-btn"
        data-bs-toggle="dropdown" 
        aria-expanded="false"
        onClick={(e) => e.stopPropagation()} 
      >
        <i className="bi bi-bell-fill fs-5"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      <div className="dropdown-menu dropdown-menu-end notification-dropdown-pane" onClick={(e) => e.stopPropagation()}>
        <div className="notification-dropdown-header">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <button className="btn btn-sm btn-link" onClick={safeHandlers.markAllNotificationsAsRead}>
              Mark all as read
            </button>
          )}
        </div>
        <ul className="notification-list">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <NotificationItem 
                key={n.id} 
                notification={n} 
                onMarkAsRead={safeHandlers.markNotificationAsRead}
              />
            ))
          ) : (
            <li className="notification-empty-state">
              <i className="bi bi-check2-circle"></i>
              <p>You're all caught up!</p>
            </li>
          )}
        </ul>
        <div className="notification-dropdown-footer">
          <button className="btn btn-sm btn-light w-100" onClick={safeHandlers.clearAllNotifications}>
            Clear All Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;