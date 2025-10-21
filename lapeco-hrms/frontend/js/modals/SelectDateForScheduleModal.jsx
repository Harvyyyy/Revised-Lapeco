import React, { useState, useMemo } from 'react';
import { scheduleAPI } from '../services/api';

const SelectDateForScheduleModal = ({ show, onClose, onProceed, existingScheduleDates }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const normalizedExistingDates = useMemo(() => {
    if (!existingScheduleDates) return null;
    return existingScheduleDates instanceof Set ? existingScheduleDates : new Set(existingScheduleDates);
  }, [existingScheduleDates]);

  const handleProceed = () => {
    if (!selectedDate) {
      setError('You must select a date to proceed.');
      return;
    }
    if (normalizedExistingDates && normalizedExistingDates.has(selectedDate)) {
      setError(`A schedule already exists for ${selectedDate}. Please choose a different date.`);
      return;
    }
    checkAndProceed(selectedDate);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    if (error) {
      setError('');
    }
  };
  
  const handleClose = () => {
    setError('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    onClose();
  }

  const checkAndProceed = async (date) => {
    setChecking(true);
    try {
      const response = await scheduleAPI.getByDate(date);
      const existingSchedule = response?.data?.schedule;
      if (existingSchedule) {
        setError(`A schedule already exists for ${date}. Please choose a different date.`);
        return;
      }
      onProceed(date);
      onClose();
    } catch (err) {
      setError('Unable to verify schedules. Please try again later.');
    } finally {
      setChecking(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select Date for New Schedule</h5>
            <button type="button" className="btn-close" onClick={handleClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Please select a date to create this schedule for.</p>
            <div className="mb-3">
              <label htmlFor="scheduleDate" className="form-label fw-bold">Schedule Date*</label>
              <input 
                type="date" 
                className={`form-control ${error ? 'is-invalid' : ''}`} 
                id="scheduleDate" 
                value={selectedDate} 
                onChange={handleDateChange} 
              />
              {error && <div className="invalid-feedback d-block">{error}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>Cancel</button>
            <button type="button" className="btn btn-success" onClick={handleProceed} disabled={checking}>
              {checking ? 'Checking...' : 'Proceed to Builder'} <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectDateForScheduleModal;