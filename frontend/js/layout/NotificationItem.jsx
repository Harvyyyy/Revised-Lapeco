import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'leave_request':
        return { icon: 'bi-calendar-event-fill', color: 'text-info' };
      case 'performance_review':
        return { icon: 'bi-clipboard-check-fill', color: 'text-warning' };
      case 'recruitment':
        return { icon: 'bi-person-plus-fill', color: 'text-success' };
      case 'system_update':
        return { icon: 'bi-info-circle-fill', color: 'text-primary' };
      case 'training':
        return { icon: 'bi-mortarboard-fill', color: 'text-secondary' };
      default:
        return { icon: 'bi-bell-fill', color: 'text-muted' };
    }
  };

  const { icon, color } = getIconForType(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });

  const handleClick = (e) => {
    e.preventDefault();
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <li className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
      <a href="#" className="notification-link" onClick={handleClick}>
        <div className="notification-icon">
          <i className={`bi ${icon} ${color}`}></i>
        </div>
        <div className="notification-content">
          <p className="notification-message">{notification.message}</p>
          <span className="notification-timestamp">{timeAgo}</span>
        </div>
        {!notification.read && <div className="unread-dot" title="Mark as read"></div>}
      </a>
    </li>
  );
};

export default NotificationItem;