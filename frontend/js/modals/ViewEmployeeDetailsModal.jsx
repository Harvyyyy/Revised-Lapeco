import React, { useState } from 'react';
import './ViewEmployeeDetailsModal.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import placeholderImage from '../assets/placeholder-profile.jpg'; 

const ViewEmployeeDetailsModal = ({ employee, show, onClose, positionMap }) => {
  const [activeTab, setActiveTab] = useState('personal');

  if (!show || !employee) {
    return null;
  }

  const positionTitle = positionMap.get(employee.positionId) || 'Unassigned';

  const requirements = {
    resumeUrl: '#', 
    pagIbigNo: employee.pagIbigNo || 'N/A',
    sssNo: employee.sssNo || 'N/A',
    tinNo: employee.tinNo || 'N/A',
    philhealthNo: employee.philhealthNo || 'N/A',
  };
  
  const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const age = calculateAge(employee.birthday);

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg employee-details-modal-dialog">
        <div className="modal-content employee-details-modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Employee Profile</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="employee-details-container">
              <div className="employee-details-left-column">
                <img
                  src={employee.imageUrl || placeholderImage}
                  alt={`${employee.name}'s profile`}
                  className="employee-profile-img"
                  onError={(e) => { e.target.src = placeholderImage; }}
                />
                <h4 className="employee-name-modal">{employee.name}</h4>
                <p className="employee-id-modal">{employee.id}</p>
                <p className="employee-position-modal">{positionTitle}</p>
                
                <div className="detail-group">
                    <p className="detail-label-modal">Joining Date</p>
                    <p className="detail-value-modal">{employee.joiningDate || 'N/A'}</p>
                </div>
                <div className="detail-group">
                    <p className="detail-label-modal">Email Address</p>
                    <p className="detail-value-modal"><a href={`mailto:${employee.email}`}>{employee.email || 'N/A'}</a></p>
                </div>
                <div className="detail-group">
                    <p className="detail-label-modal">Contact Number</p>
                    <p className="detail-value-modal">{employee.contactNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="employee-details-right-column">
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal</button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === 'statutory' ? 'active' : ''}`} onClick={() => setActiveTab('statutory')}>Statutory</button>
                  </li>
                </ul>
                <div className="tab-content">
                  {activeTab === 'personal' && (
                    <div>
                      <h5 className="info-section-title">Personal Information</h5>
                      <div className="row g-4">
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">Full Name</p><p className="detail-value-modal">{employee.name || 'N/A'}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">Age</p><p className="detail-value-modal">{age}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">Birthday</p><p className="detail-value-modal">{employee.birthday || 'N/A'}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">Gender</p><p className="detail-value-modal">{employee.gender || 'N/A'}</p></div>
                        <div className="col-12 detail-group"><p className="detail-label-modal">Address</p><p className="detail-value-modal">{employee.address || 'N/A'}</p></div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'statutory' && (
                    <div>
                      <h5 className="info-section-title">Statutory Requirements</h5>
                      <div className="row g-4">
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">SSS No.</p><p className="detail-value-modal">{requirements.sssNo}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">TIN No.</p><p className="detail-value-modal">{requirements.tinNo}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">Pag-IBIG No.</p><p className="detail-value-modal">{requirements.pagIbigNo}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">PhilHealth No.</p><p className="detail-value-modal">{requirements.philhealthNo}</p></div>
                        <div className="col-md-6 detail-group"><p className="detail-label-modal">Resume</p><p className="detail-value-modal"><a href={requirements.resumeUrl} target="_blank" rel="noopener noreferrer">View Document</a></p></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployeeDetailsModal;