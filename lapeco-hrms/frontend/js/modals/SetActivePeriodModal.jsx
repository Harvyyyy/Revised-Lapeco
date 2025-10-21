import React, { useState, useEffect } from 'react';

const SetActivePeriodModal = ({ show, onClose, onSetPeriod, currentPeriod }) => {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setPeriodStart(currentPeriod?.periodStart || '');
      setPeriodEnd(currentPeriod?.periodEnd || '');
      setError('');
    }
  }, [show, currentPeriod]);

  const handleSubmit = () => {
    if (!periodStart || !periodEnd) {
      setError('Both start and end dates are required.');
      return;
    }
    if (new Date(periodEnd) < new Date(periodStart)) {
      setError('End date cannot be before start date.');
      return;
    }
    onSetPeriod({ periodStart, periodEnd });
    onClose();
  };

  const handleClear = () => {
    onSetPeriod(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Set Active Evaluation Period</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted">
              Define a global period during which employees and leaders can submit their evaluations.
            </p>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="periodStart" className="form-label">Period Start*</label>
                <input
                  type="date" id="periodStart" className="form-control"
                  value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="periodEnd" className="form-label">Period End*</label>
                <input
                  type="date" id="periodEnd" className="form-control"
                  value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
            {currentPeriod && (
              <div className="text-center mt-3">
                <button type="button" className="btn btn-sm btn-link text-danger" onClick={handleClear}>
                  Clear Active Period
                </button>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-success" onClick={handleSubmit}>
              Set Period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetActivePeriodModal;