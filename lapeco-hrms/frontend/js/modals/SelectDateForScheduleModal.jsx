import React, { useState, useMemo } from 'react';
import { scheduleAPI } from '../services/api';
import './SelectDateForScheduleModal.css';

const SelectDateForScheduleModal = ({ show, onClose, onProceed, existingScheduleDates }) => {
  const MAX_DATES = 60;
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const normalizedExistingDates = useMemo(() => {
    if (!existingScheduleDates) return null;
    return existingScheduleDates instanceof Set ? existingScheduleDates : new Set(existingScheduleDates);
  }, [existingScheduleDates]);

  const formatPrettyDate = (iso) => {
    if (!iso) return '';
    const parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return iso;
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${mm}-${dd}-${String(y)}`;
  };

  const handleProceed = () => {
    if (!selectedDates.length) {
      setError('Add at least one date to proceed.');
      return;
    }
    // If any date is known to have an existing schedule, block and list them
    if (normalizedExistingDates) {
      const conflicts = selectedDates.filter(d => normalizedExistingDates.has(d));
      if (conflicts.length) {
        setError(`Schedules already exist for: ${conflicts.map(formatPrettyDate).join(', ')}. Remove them to continue.`);
        return;
      }
    }
    checkAndProceed(selectedDates);
  };

  const handleDateChange = (e) => {
    setInputDate(e.target.value);
    if (error) {
      setError('');
    }
  };

  const addDate = () => {
    if (!inputDate) return;
    const date = inputDate;
    if (normalizedExistingDates && normalizedExistingDates.has(date)) {
      setError(`A schedule already exists for ${formatPrettyDate(date)}.`);
      return;
    }
    if (selectedDates.includes(date)) return;
    if (selectedDates.length + 1 > MAX_DATES) {
      setError(`You can select up to ${MAX_DATES} dates.`);
      return;
    }
    setSelectedDates(prev => [...prev, date].sort());
    setError('');
  };

  const addRange = () => {
    if (!rangeStart || !rangeEnd) return;
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (end < start) {
      setError('End date must be on or after start date.');
      return;
    }
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${dd}`);
    }
    const conflicts = normalizedExistingDates ? days.filter(dt => normalizedExistingDates.has(dt)) : [];
    if (conflicts.length) {
      setError(`Schedules already exist for: ${conflicts.map(formatPrettyDate).join(', ')}.`);
      return;
    }
    const union = Array.from(new Set([...selectedDates, ...days]));
    if (union.length > MAX_DATES) {
      setError(`You can select up to ${MAX_DATES} dates.`);
      return;
    }
    setSelectedDates(union.sort());
    setError('');
  };

  const removeDate = (date) => {
    setSelectedDates(prev => prev.filter(d => d !== date));
  };
  
  const handleClose = () => {
    setError('');
    setInputDate(new Date().toISOString().split('T')[0]);
    setSelectedDates([]);
    setRangeStart('');
    setRangeEnd('');
    onClose();
  }

  const checkAndProceed = async (dates) => {
    setChecking(true);
    try {
      // Verify none of the selected dates have schedules
      const conflicts = [];
      for (const d of dates) {
        try {
          const response = await scheduleAPI.getByDate(d);
          const existingSchedule = response?.data?.schedule;
          if (existingSchedule) conflicts.push(d);
        } catch (e) {
          // Ignore individual fetch errors; builder will handle
        }
      }
      if (conflicts.length) {
        setError(`Schedules already exist for: ${conflicts.map(formatPrettyDate).join(', ')}. Remove them to continue.`);
        return;
      }
      onProceed(dates);
      onClose();
    } finally {
      setChecking(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal fade show d-block select-date-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-calendar-week me-2"></i>Select Date for New Schedule</h5>
            <button type="button" className="btn-close" onClick={handleClose} aria-label="Close"></button>
          </div>
          
          <div className="modal-body">
            <p className="text-muted mb-4">Select one or more dates to create a schedule for. You can add individual dates or ranges.</p>
            
            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <div className="row g-4">
              {/* Left Column: Inputs */}
              <div className="col-md-6">
                {/* Add Single Date */}
                <div className="mb-4">
                  <div className="section-title">Add Single Date</div>
                  <div className="input-group-custom">
                    <div className="input-wrapper">
                      <i className="bi bi-calendar"></i>
                      <input 
                        type="date" 
                        className="form-control form-control-custom" 
                        id="scheduleDate" 
                        value={inputDate} 
                        onChange={handleDateChange} 
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline-primary btn-add" 
                      onClick={addDate} 
                      disabled={!inputDate}
                    >
                      <i className="bi bi-plus-lg"></i> Add
                    </button>
                  </div>
                </div>

                {/* Add Date Range */}
                <div>
                  <div className="section-title">Add Date Range</div>
                  <div className="date-range-container">
                    <div className="mb-3">
                      <label className="form-label small text-muted">Start Date</label>
                      <div className="input-wrapper">
                        <i className="bi bi-calendar-event"></i>
                        <input 
                          type="date" 
                          className="form-control form-control-custom" 
                          value={rangeStart} 
                          onChange={(e) => setRangeStart(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted">End Date</label>
                      <div className="input-wrapper">
                        <i className="bi bi-calendar-check"></i>
                        <input 
                          type="date" 
                          className="form-control form-control-custom" 
                          value={rangeEnd} 
                          onChange={(e) => setRangeEnd(e.target.value)} 
                        />
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary btn-add w-100 justify-content-center" 
                      onClick={addRange} 
                      disabled={!rangeStart || !rangeEnd}
                    >
                      <i className="bi bi-arrows-angle-expand me-2"></i> Add Range
                    </button>
                  </div>
                  <small className="text-muted d-block text-center">
                    <i className="bi bi-info-circle me-1"></i>
                    Max {MAX_DATES} dates selection allowed
                  </small>
                </div>
              </div>

              {/* Right Column: Selected Dates */}
              <div className="col-md-6">
                <div className="h-100 d-flex flex-column">
                  <div className="selected-dates-header">
                    <div className="section-title mb-0">Selected Dates ({selectedDates.length})</div>
                    {selectedDates.length > 0 && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-link text-danger text-decoration-none p-0" 
                        onClick={() => setSelectedDates([])}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="selected-dates-area flex-grow-1">
                    {selectedDates.length === 0 ? (
                      <div className="empty-state h-100 d-flex flex-column justify-content-center align-items-center">
                        <i className="bi bi-calendar-x fs-3 mb-2 text-muted opacity-50"></i>
                        <p>No dates selected yet.</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap">
                        {selectedDates.map(d => (
                          <span key={d} className="date-badge">
                            {formatPrettyDate(d)}
                            <button 
                              type="button" 
                              className="remove-btn" 
                              onClick={() => removeDate(d)} 
                              title="Remove"
                            >
                              <i className="bi bi-x-circle-fill"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-light border" onClick={handleClose}>Cancel</button>
            <button 
              type="button" 
              className="btn btn-proceed" 
              onClick={handleProceed} 
              disabled={checking || selectedDates.length === 0}
            >
              {checking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Checking...
                </>
              ) : (
                <>
                  Proceed to Builder <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectDateForScheduleModal;
