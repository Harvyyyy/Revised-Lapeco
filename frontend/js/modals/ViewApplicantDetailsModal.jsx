import React, { useState } from 'react';
import './ViewApplicantDetailsModal.css';
import placeholderImage from '../assets/placeholder-profile.jpg';

const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const ageDifMs = Date.now() - new Date(birthdate).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

const ViewApplicantDetailsModal = ({ applicant, show, onClose, jobTitle }) => {
  const [activeTab, setActiveTab] = useState('personal');

  if (!show || !applicant) {
    return null;
  }
  
  const age = calculateAge(applicant.birthday);

  return (
    <div className="modal fade show d-block applicant-details-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-body">
            <div className="applicant-details-container">
              <div className="profile-sidebar">
                <img
                    src={placeholderImage}
                    alt={`${applicant.name}'s profile`}
                    className="profile-avatar"
                />
                <h4 className="profile-name">{applicant.name}</h4>
                <p className="profile-job-title">{jobTitle}</p>
                <span className={`applicant-status-badge status-${applicant.status.replace(/\s+/g, '-').toLowerCase()}`}>{applicant.status}</span>
                
                <div className="profile-key-info">
                    <div className="info-item">
                        <i className="bi bi-envelope-fill"></i>
                        <a href={`mailto:${applicant.email}`}>{applicant.email}</a>
                    </div>
                    <div className="info-item">
                        <i className="bi bi-telephone-fill"></i>
                        <span>{applicant.phone || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <i className="bi bi-calendar-plus-fill"></i>
                        <span>Applied: {formatDate(applicant.applicationDate)}</span>
                    </div>
                    <div className="info-item">
                        <i className="bi bi-calendar-check-fill"></i>
                        <span>Interview: {formatDate(applicant.interviewDate)}</span>
                    </div>
                </div>

                <a href={applicant.resumeUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-resume">
                    <i className="bi bi-file-earmark-text-fill me-2"></i>View Resume
                </a>
              </div>

              <div className="profile-main">
                 <button type="button" className="btn-close float-end" onClick={onClose} aria-label="Close"></button>
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal Details</button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === 'statutory' ? 'active' : ''}`} onClick={() => setActiveTab('statutory')}>Statutory Info</button>
                  </li>
                </ul>
                <div className="tab-content">
                  {activeTab === 'personal' && (
                    <div>
                      <h5 className="info-section-title">Personal Information</h5>
                      <div className="row g-4">
                        <div className="col-md-6 detail-group"><p className="detail-label">Gender</p><p className="detail-value">{applicant.gender || 'N/A'}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label">Age</p><p className="detail-value">{age}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label">Birthday</p><p className="detail-value">{formatDate(applicant.birthday)}</p></div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'statutory' && (
                    <div>
                      <h5 className="info-section-title">Statutory Requirements</h5>
                      <div className="row g-4">
                        <div className="col-md-6 detail-group"><p className="detail-label">SSS No.</p><p className="detail-value">{applicant.sssNo || 'N/A'}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label">TIN No.</p><p className="detail-value">{applicant.tinNo || 'N/A'}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label">Pag-IBIG No.</p><p className="detail-value">{applicant.pagIbigNo || 'N/A'}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label">PhilHealth No.</p><p className="detail-value">{applicant.philhealthNo || 'N/A'}</p></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewApplicantDetailsModal;