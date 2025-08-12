import React, { useState, useEffect } from 'react';

const AddApplicantModal = ({ show, onClose, onSave, jobOpenings }) => {
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    jobOpeningId: '',
    resumeFile: null,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const openJobOpenings = jobOpenings.filter(job => job.status === 'Open');

  useEffect(() => {
    if (show) {
      if (openJobOpenings.length === 1) {
        setFormData({ ...initialFormState, jobOpeningId: openJobOpenings[0].id });
      } else {
        setFormData(initialFormState);
      }
      setErrors({});
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Applicant name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!formData.jobOpeningId) newErrors.jobOpeningId = 'Please select a job opening.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
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
              <h5 className="modal-title">Add New Applicant</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Full Name*</label>
                <input type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`} id="name" name="name" value={formData.name} onChange={handleChange} required />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email*</label>
                <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} id="email" name="email" value={formData.email} onChange={handleChange} required />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">Phone</label>
                <input type="tel" className="form-control" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label htmlFor="jobOpeningId" className="form-label">Applying For*</label>
                <select className={`form-select ${errors.jobOpeningId ? 'is-invalid' : ''}`} id="jobOpeningId" name="jobOpeningId" value={formData.jobOpeningId} onChange={handleChange} required>
                  <option value="">Select a job...</option>
                  {openJobOpenings.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
                {errors.jobOpeningId && <div className="invalid-feedback">{errors.jobOpeningId}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="resumeFile" className="form-label">Resume (PDF/Doc)</label>
                <input type="file" className="form-control" id="resumeFile" name="resumeFile" accept=".pdf,.doc,.docx" onChange={handleChange} />
                {formData.resumeFile && <small className="text-muted d-block mt-1">{formData.resumeFile.name}</small>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success">Add Applicant</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddApplicantModal;