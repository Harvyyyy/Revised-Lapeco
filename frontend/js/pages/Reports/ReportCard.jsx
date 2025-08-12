import React from 'react';

const ReportCard = ({ title, description, icon, onGenerate }) => {
  return (
    <div className="report-card">
      <div className="report-card-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="report-card-body">
        <h5 className="report-card-title">{title}</h5>
        <p className="report-card-description">{description}</p>
      </div>
      <div className="report-card-footer">
        <button className="btn btn-sm btn-outline-success" onClick={onGenerate}>
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default ReportCard;