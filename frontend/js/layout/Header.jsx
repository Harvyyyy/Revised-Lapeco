import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import placeholderAvatar from '../assets/placeholder-profile.jpg';
import NotificationDropdown from './NotificationDropdown';
import { authAPI } from '@/services/api';

const Header = ({ currentUser, notifications, appLevelHandlers }) => {
  const router = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router('/login');
  };

  const avatarSrc = currentUser?.image_url || placeholderAvatar;
  const displayName = currentUser?.name || '—';
  const displayRole = currentUser?.role || '';
  const displayEmployeeId = currentUser?.employee_id || '';

  return (
    <header className="app-header">
      <div className="header-left"></div>
      <div className="header-right">
        <NotificationDropdown notifications={notifications} handlers={appLevelHandlers} />
        <div className="dropdown user-profile-menu">
          <div 
            className="user-info-wrapper"
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <img 
              src={avatarSrc}
              alt="User Avatar" 
              className="user-avatar" 
              onError={(e) => { e.target.onerror = null; e.target.src=placeholderAvatar; }}
            />
            <div className="user-text-info">
              <span className="user-name">{displayName}</span>
              <span className="user-position">{displayRole}</span>
            </div>
            <i className="bi bi-chevron-down dropdown-caret"></i>
          </div>
          <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
            <li className="dropdown-header-custom">
              <h6 className="mb-0">{displayName}</h6>
              <div className="text-muted small">ID: {displayEmployeeId}</div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item" href="#"><i className="bi bi-person-fill"></i> My Profile</a></li>
            <li><a className="dropdown-item" href="#"><i className="bi bi-gear-fill"></i> Account Settings</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;