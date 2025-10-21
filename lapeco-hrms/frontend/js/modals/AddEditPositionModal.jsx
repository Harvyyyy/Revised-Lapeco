import React, { useState, useEffect, useMemo } from 'react';
import './AddEditPositionModal.css';

const AddEditPositionModal = ({ show, onClose, onSave, positionData }) => {
  const initialFormState = { 
    title: '', 
    description: '', 
    base_rate_per_hour: '', 
    overtime_rate_per_hour: '',
    night_diff_rate_per_hour: '',
    late_deduction_per_minute: '',
    monthly_salary: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('details');

  const isEditMode = Boolean(positionData && positionData.id);

  useEffect(() => {
    if (show) {
      if (isEditMode && positionData) {
        setFormData({
          title: positionData.title || positionData.name || '',
          description: positionData.description || '',
          base_rate_per_hour: positionData.base_rate_per_hour ?? positionData.hourlyRate ?? '',
          overtime_rate_per_hour: positionData.overtime_rate_per_hour ?? positionData.overtimeRate ?? '',
          night_diff_rate_per_hour: positionData.night_diff_rate_per_hour ?? positionData.nightDiffRate ?? '',
          late_deduction_per_minute: positionData.late_deduction_per_minute ?? positionData.lateDeductionPerMin ?? '',
          monthly_salary: positionData.monthly_salary ?? positionData.monthlySalary ?? '',
        });

      } else {
        setFormData(initialFormState);
      }
      setActiveTab('details');
      setErrors({});
    }
  }, [positionData, show, isEditMode]); 
  
  const monthlySalary = useMemo(() => {
    const rate = parseFloat(formData.base_rate_per_hour);
    if (isNaN(rate) || rate <= 0) return 0;
    // Standard calculation: hourly rate * 8 hours/day * 22 days/month
    return rate * 8 * 22;
  }, [formData.base_rate_per_hour]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Position title is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    if (!formData.base_rate_per_hour || isNaN(formData.base_rate_per_hour) || Number(formData.base_rate_per_hour) <= 0) {
      newErrors.base_rate_per_hour = 'Base rate must be a valid positive number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        base_rate_per_hour: Number(formData.base_rate_per_hour || 0),
        overtime_rate_per_hour: Number(formData.overtime_rate_per_hour || 0),
        night_diff_rate_per_hour: Number(formData.night_diff_rate_per_hour || 0),
        late_deduction_per_minute: Number(formData.late_deduction_per_minute || 0),
        monthly_salary: monthlySalary,
      }, positionData?.id);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content position-form-modal">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h5 className="modal-title">{isEditMode ? 'Edit Position' : 'Add New Position'}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button type="button" className={`nav-link ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
                </li>
                <li className="nav-item">
                  <button type="button" className={`nav-link ${activeTab === 'pay' ? 'active' : ''}`} onClick={() => setActiveTab('pay')}>Pay Structure</button>
                </li>
              </ul>

              <div className="tab-content">
                {activeTab === 'details' && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">Position Title*</label>
                      <input type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`} id="title" name="title" value={formData.title} onChange={handleChange} required />
                      {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">Description*</label>
                      <textarea className={`form-control ${errors.description ? 'is-invalid' : ''}`} id="description" name="description" rows="4" value={formData.description} onChange={handleChange} required></textarea>
                      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>
                  </>
                )}

                {activeTab === 'pay' && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="base_rate_per_hour" className="form-label">Base Rate (per hour)*</label>
                      <div className="input-group">
                          <span className="input-group-text">₱</span>
                          <input type="number" step="0.01" className={`form-control ${errors.base_rate_per_hour ? 'is-invalid' : ''}`} id="base_rate_per_hour" name="base_rate_per_hour" value={formData.base_rate_per_hour} onChange={handleChange} required placeholder="e.g., 102.27" />
                      </div>
                      {errors.base_rate_per_hour && <div className="invalid-feedback d-block">{errors.base_rate_per_hour}</div>}
                    </div>
                    <div className="alert alert-info small">
                        Calculated Monthly Salary: <strong className="fs-6">₱ {monthlySalary.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                        <br/>
                        <small className="text-muted">Based on (Rate × 8 hours × 22 days)</small>
                    </div>
                    <hr/>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="overtime_rate_per_hour" className="form-label">Overtime Rate (/hr)</label>
                            <div className="input-group"><span className="input-group-text">₱</span><input type="number" step="0.01" className="form-control" id="overtime_rate_per_hour" name="overtime_rate_per_hour" value={formData.overtime_rate_per_hour} onChange={handleChange} /></div>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="night_diff_rate_per_hour" className="form-label">Night Diff. Rate (/hr)</label>
                            <div className="input-group"><span className="input-group-text">₱</span><input type="number" step="0.01" className="form-control" id="night_diff_rate_per_hour" name="night_diff_rate_per_hour" value={formData.night_diff_rate_per_hour} onChange={handleChange} /></div>
                        </div>
                         <div className="col-md-6">
                            <label htmlFor="late_deduction_per_minute" className="form-label">Late Deduction (/min)</label>
                            <div className="input-group"><span className="input-group-text">₱</span><input type="number" step="0.01" className="form-control" id="late_deduction_per_minute" name="late_deduction_per_minute" value={formData.late_deduction_per_minute} onChange={handleChange} /></div>
                        </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success">{isEditMode ? 'Save Changes' : 'Add Position'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditPositionModal;