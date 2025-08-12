import React, { useState, useEffect } from 'react';

const RequestLeaveModal = ({ show, onClose, onSave }) => {
  const initialFormState = {
    leaveType: 'Vacation',
    dateFrom: '',
    dateTo: '',
    reason: '',
    days: 0,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (formData.dateFrom && formData.dateTo) {
      const start = new Date(formData.dateFrom);
      const end = new Date(formData.dateTo);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, days: diffDays }));
      } else {
        setFormData(prev => ({ ...prev, days: 0 }));
      }
    }
  }, [formData.dateFrom, formData.dateTo]);

  const validate = () => {
    const newErrors = {};
    if (!formData.leaveType) newErrors.leaveType = 'Please select a leave type.';
    if (!formData.dateFrom) newErrors.dateFrom = 'Start date is required.';
    if (!formData.dateTo) newErrors.dateTo = 'End date is required.';
    if (formData.dateTo < formData.dateFrom) newErrors.dateTo = 'End date cannot be before start date.';
    if (!formData.reason.trim()) newErrors.reason = 'A reason for the leave is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h5 className="modal-title">New Leave Request</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="leaveType" className="form-label">Leave Type*</label>
                <select id="leaveType" name="leaveType" className={`form-select ${errors.leaveType ? 'is-invalid' : ''}`} value={formData.leaveType} onChange={(e) => setFormData({...formData, leaveType: e.target.value})}>
                  <option value="Vacation">Vacation</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Personal Leave">Personal Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
                {errors.leaveType && <div className="invalid-feedback">{errors.leaveType}</div>}
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="dateFrom" className="form-label">From*</label>
                  <input type="date" id="dateFrom" name="dateFrom" className={`form-control ${errors.dateFrom ? 'is-invalid' : ''}`} value={formData.dateFrom} onChange={(e) => setFormData({...formData, dateFrom: e.target.value})} />
                  {errors.dateFrom && <div className="invalid-feedback">{errors.dateFrom}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="dateTo" className="form-label">To*</label>
                  <input type="date" id="dateTo" name="dateTo" className={`form-control ${errors.dateTo ? 'is-invalid' : ''}`} value={formData.dateTo} onChange={(e) => setFormData({...formData, dateTo: e.target.value})} />
                  {errors.dateTo && <div className="invalid-feedback">{errors.dateTo}</div>}
                </div>
              </div>
              <div className="mb-3">
                <p className="text-muted">Total Days: <strong className="text-dark">{formData.days}</strong></p>
              </div>
              <div className="mb-3">
                <label htmlFor="reason" className="form-label">Reason*</label>
                <textarea id="reason" name="reason" rows="3" className={`form-control ${errors.reason ? 'is-invalid' : ''}`} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
                {errors.reason && <div className="invalid-feedback">{errors.reason}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success">Submit Request</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestLeaveModal;