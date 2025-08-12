import React, { useState, useEffect } from 'react';

const EditAttendanceModal = ({ show, onClose, onSave, attendanceRecord }) => {
  const [formData, setFormData] = useState({
    signIn: '',
    breakOut: '',
    breakIn: '',
    signOut: '',
  });

  useEffect(() => {
    if (attendanceRecord) {
      setFormData({
        signIn: attendanceRecord.signIn || '',
        breakOut: attendanceRecord.breakOut || '',
        breakIn: attendanceRecord.breakIn || '',
        signOut: attendanceRecord.signOut || '',
      });
    }
  }, [attendanceRecord]);

  if (!show || !attendanceRecord) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(attendanceRecord.id, attendanceRecord.schedule.date, formData);
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Time Log for {attendanceRecord.name}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="text-muted">Editing attendance for {new Date(attendanceRecord.schedule.date + 'T00:00:00').toLocaleDateString()}.</p>
              <div className="row g-3">
                <div className="col-md-6 mb-3">
                  <label htmlFor="signIn" className="form-label">Sign In</label>
                  <input type="time" id="signIn" name="signIn" className="form-control" value={formData.signIn} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="signOut" className="form-label">Sign Out</label>
                  <input type="time" id="signOut" name="signOut" className="form-control" value={formData.signOut} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="breakOut" className="form-label">Break Out</label>
                  <input type="time" id="breakOut" name="breakOut" className="form-control" value={formData.breakOut} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="breakIn" className="form-label">Break In</label>
                  <input type="time" id="breakIn" name="breakIn" className="form-control" value={formData.breakIn} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAttendanceModal;