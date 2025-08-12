import React, { useState, useEffect } from 'react';
import './AddEditProgramModal.css';

const AddEditProgramModal = ({ show, onClose, onSave, programData }) => {
  const initialFormState = { title: '', description: '', provider: '', duration: '' };
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const isEditMode = Boolean(programData && programData.id);

  useEffect(() => {
    if (show) {
      if (isEditMode) {
        setFormData({ ...initialFormState, ...programData });
      } else {
        setFormData(initialFormState);
      }
      setErrors({});
    }
  }, [programData, show, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Program title is required.';
    if (!formData.provider.trim()) newErrors.provider = 'Training provider is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData, programData?.id);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content program-form-modal">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header"><h5 className="modal-title">{isEditMode ? 'Edit Training Program' : 'Add New Training Program'}</h5><button type="button" className="btn-close" onClick={onClose}></button></div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Program Title*</label>
                <input type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`} id="title" name="title" value={formData.title} onChange={handleChange} required />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea className="form-control" id="description" name="description" rows="4" value={formData.description} onChange={handleChange}></textarea>
              </div>
              <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="provider" className="form-label">Provider*</label>
                    <input type="text" className={`form-control ${errors.provider ? 'is-invalid' : ''}`} id="provider" name="provider" value={formData.provider} onChange={handleChange} required />
                    {errors.provider && <div className="invalid-feedback">{errors.provider}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="duration" className="form-label">Duration (e.g., 2 weeks, 8 hours)</label>
                    <input type="text" className="form-control" id="duration" name="duration" value={formData.duration} onChange={handleChange} />
                  </div>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-success">{isEditMode ? 'Save Changes' : 'Add Program'}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditProgramModal;