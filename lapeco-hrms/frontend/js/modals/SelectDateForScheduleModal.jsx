import React, { useState, useMemo } from 'react';
import { scheduleAPI } from '../services/api';

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
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select Date for New Schedule</h5>
            <button type="button" className="btn-close" onClick={handleClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Select one or more dates to create this schedule for.</p>
            <div className="mb-3">
              <label htmlFor="scheduleDate" className="form-label fw-bold">Add Date</label>
              <div className="input-group">
                <input 
                  type="date" 
                  className={`form-control ${error ? 'is-invalid' : ''}`} 
                  id="scheduleDate" 
                  value={inputDate} 
                  onChange={handleDateChange} 
                />
                <button type="button" className="btn btn-outline-secondary" onClick={addDate} disabled={!inputDate}><i className="bi bi-plus-lg"></i> Add</button>
              </div>
            </div>
            <div className="mb-3">
              <div className="row g-2 align-items-end">
                <div className="col">
                  <label htmlFor="rangeStart" className="form-label fw-bold">Start Date</label>
                  <input type="date" id="rangeStart" className="form-control" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
                </div>
                <div className="col">
                  <label htmlFor="rangeEnd" className="form-label fw-bold">End Date</label>
                  <input type="date" id="rangeEnd" className="form-control" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
                </div>
                <div className="col-auto">
                  <button type="button" className="btn btn-outline-secondary" onClick={addRange} disabled={!rangeStart || !rangeEnd}><i className="bi bi-plus-lg"></i> Add Range</button>
                </div>
              </div>
              <small className="text-muted d-block mt-1">You can select up to {MAX_DATES} dates.</small>
            </div>
            {selectedDates.length > 0 && (
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label fw-bold mb-0">Selected Dates ({selectedDates.length})</label>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedDates([])} disabled={!selectedDates.length}>Clear All</button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {selectedDates.map(d => (
                    <span key={d} className="badge bg-secondary-subtle text-secondary-emphasis">
                      {formatPrettyDate(d)}
                      <button type="button" className="btn btn-sm btn-link ms-2" onClick={() => removeDate(d)} title="Remove">
                        <i className="bi bi-x"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {error && <div className="invalid-feedback d-block">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>Cancel</button>
            <button type="button" className="btn btn-success" onClick={handleProceed} disabled={checking || !selectedDates.length || !!error}>
              {checking ? 'Checking...' : 'Proceed to Builder'} <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectDateForScheduleModal;