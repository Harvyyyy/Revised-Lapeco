import React, { useState } from 'react';

const HireApplicantModal = ({ show, onClose, onHire, applicant, positions }) => {
  const [positionId, setPositionId] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeId, setEmployeeId] = useState(`EMP${Date.now().toString().slice(-4)}`);
  const [error, setError] = useState('');

  const handleHire = () => {
    if (!positionId) {
      setError('You must assign a position.');
      return;
    }
    if (!joiningDate) {
      setError('Joining date is required.');
      return;
    }
    onHire(applicant.id, { positionId, joiningDate, employeeId });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Hire Applicant: {applicant.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>Please confirm the details to onboard this applicant as an employee.</p>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label htmlFor="employeeId" className="form-label">Employee ID*</label>
              <input type="text" className="form-control" id="employeeId" value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="positionId" className="form-label">Assign Position*</label>
              <select className="form-select" id="positionId" value={positionId} onChange={(e) => { setPositionId(e.target.value); setError(''); }}>
                <option value="">Select a position...</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="joiningDate" className="form-label">Joining Date*</label>
              <input type="date" className="form-control" id="joiningDate" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-success" onClick={handleHire}>Confirm Hire</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HireApplicantModal;