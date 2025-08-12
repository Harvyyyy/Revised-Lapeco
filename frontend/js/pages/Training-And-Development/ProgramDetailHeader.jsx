import React from 'react';
import { Link } from 'react-router-dom';

const ProgramDetailHeader = ({ program, enrolledCount, onGenerateReport, onEnrollClick }) => {
  return (
    <header className="program-detail-header">
      <Link to="/dashboard/training" className="btn btn-light me-3 back-button mb-3">
        <i className="bi bi-arrow-left"></i> Back to Programs
      </Link>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="page-main-title mb-0">{program.title}</h1>
          <p className="page-subtitle">{program.provider}</p>
          <div className="program-meta">
            <span className="meta-item"><i className="bi bi-clock-fill"></i>{program.duration || 'N/A'}</span>
            <span className="meta-item"><i className="bi bi-people-fill"></i>{enrolledCount} Enrolled</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={onGenerateReport} disabled={enrolledCount === 0}>
            <i className="bi bi-file-earmark-text-fill me-2"></i>Generate Report
          </button>
          <button className="btn btn-success" onClick={onEnrollClick}>
            <i className="bi bi-person-plus-fill me-2"></i>Enroll Employees
          </button>
        </div>
      </div>
    </header>
  );
};

export default ProgramDetailHeader;