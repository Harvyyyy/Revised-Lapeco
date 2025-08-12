import React, { useState } from 'react';

const ScheduleInterviewModal = ({ show, onClose, onSave, applicant }) => {
  const [interviewDate, setInterviewDate] = useState(applicant?.interviewDate || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!interviewDate) {
      setError('Please select an interview date.');
      return;
    }
    onSave(applicant.id, interviewDate);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Schedule Interview for {applicant.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>Select a date and time for the interview.</p>
            <div className="mb-3">
              <label htmlFor="interviewDate" className="form-label">Interview Date & Time*</label>
              <input
                type="datetime-local"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                id="interviewDate"
                value={interviewDate}
                onChange={(e) => { setInterviewDate(e.target.value); setError(''); }}
              />
              {error && <div className="invalid-feedback">{error}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;