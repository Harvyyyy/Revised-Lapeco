import React, { useState, useEffect, useRef } from 'react';
import './AddEditEmployeeModal.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import placeholderImage from '../assets/placeholder-profile.jpg';

const AddEditEmployeeModal = ({ show, onClose, onSave, employeeData, positions }) => {
  const initialFormState = {
    name: '', email: '', positionId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    birthday: '', gender: '', address: '', contactNumber: '',
    imageUrl: null, imagePreviewUrl: placeholderImage,
    sssNo: '', tinNo: '', pagIbigNo: '', philhealthNo: '',
    resumeFile: null, 
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const isEditMode = Boolean(employeeData && employeeData.id);

  useEffect(() => {
    if (show) {
      if (isEditMode && employeeData) {
        setFormData({
          name: employeeData.name || '', email: employeeData.email || '',
          positionId: employeeData.positionId || '',
          joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
          birthday: employeeData.birthday || '', gender: employeeData.gender || '',
          address: employeeData.address || '', contactNumber: employeeData.contactNumber || '',
          imageUrl: employeeData.imageUrl || null,
          imagePreviewUrl: employeeData.imageUrl || placeholderImage,
          sssNo: employeeData.sssNo || '', tinNo: employeeData.tinNo || '',
          pagIbigNo: employeeData.pagIbigNo || '', philhealthNo: employeeData.philhealthNo || '',
          resumeFile: null, 
        });
      } else {
        setFormData(initialFormState);
      }
      setActiveTab('personal');
      setFormErrors({});
      setIsSubmitting(false);
    }
  }, [employeeData, show]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      if (name === 'imageUrl') {
        const file = files[0];
        if (file) {
          setFormData({ ...formData, imageUrl: file, imagePreviewUrl: URL.createObjectURL(file) });
        }
      } else if (name === 'resumeFile') {
        setFormData({ ...formData, resumeFile: files[0] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required.';
    if (!formData.email.trim()) { errors.email = 'Email is required.'; } 
    else if (!/\S+@\S+\.\S+/.test(formData.email)) { errors.email = 'Email address is invalid.';}
    if (!isEditMode && !formData.positionId) errors.positionId = 'Position is required.';
    if (!isEditMode && !formData.joiningDate) errors.joiningDate = 'Joining date is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;
    setIsSubmitting(true);
    const dataToSave = { ...formData };
    delete dataToSave.imagePreviewUrl;
    try {
      await onSave(dataToSave, employeeData?.id);
      onClose();
    } catch (err) {
      // Parent handler shows alerts; keep modal open for corrections
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h5 className="modal-title">{isEditMode ? 'Edit Employee Details' : 'Add New Employee'}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body employee-form-modal-body">
              <div className="employee-form-container">
                <div className="employee-form-left-column">
                  <div className="employee-profile-img-container" onClick={() => fileInputRef.current.click()}>
                    <img src={formData.imagePreviewUrl} alt="Profile Preview" className="employee-profile-img-form" onError={(e) => { e.target.src = placeholderImage; }} />
                    <div className="employee-profile-img-overlay"><i className="bi bi-camera-fill"></i></div>
                  </div>
                  <input type="file" ref={fileInputRef} name="imageUrl" accept="image/*" onChange={handleChange} className="d-none" />

                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name*</label>
                    <input type="text" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`} id="name" name="name" value={formData.name} onChange={handleChange} required />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="positionId" className="form-label">Position*</label>
                    <select className={`form-select ${formErrors.positionId ? 'is-invalid' : ''}`} id="positionId" name="positionId" value={formData.positionId} onChange={handleChange} required={!isEditMode}>
                        <option value="">Select a position...</option>
                        {(positions || []).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    {formErrors.positionId && <div className="invalid-feedback">{formErrors.positionId}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="joiningDate" className="form-label">Joining Date*</label>
                    <input type="date" className={`form-control ${formErrors.joiningDate ? 'is-invalid' : ''}`} id="joiningDate" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required={!isEditMode} />
                    {formErrors.joiningDate && <div className="invalid-feedback">{formErrors.joiningDate}</div>}
                  </div>
                </div>

                <div className="employee-form-right-column">
                  <ul className="nav nav-tabs">
                    <li className="nav-item">
                      <button type="button" className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal Details</button>
                    </li>
                    <li className="nav-item">
                      <button type="button" className={`nav-link ${activeTab === 'statutory' ? 'active' : ''}`} onClick={() => setActiveTab('statutory')}>Statutory</button>
                    </li>
                  </ul>
                  <div className="tab-content">
                    {activeTab === 'personal' && (
                      <div>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label htmlFor="email" className="form-label">Email Address*</label>
                            <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} id="email" name="email" value={formData.email} onChange={handleChange} required />
                            {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                          </div>
                          <div className="col-md-6">
                            <label htmlFor="contactNumber" className="form-label">Contact Number</label>
                            <input type="tel" className="form-control" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
                          </div>
                          <div className="col-md-6">
                            <label htmlFor="birthday" className="form-label">Birthday</label>
                            <input type="date" className="form-control" id="birthday" name="birthday" value={formData.birthday} onChange={handleChange} />
                          </div>
                          <div className="col-md-6">
                            <label htmlFor="gender" className="form-label">Gender</label>
                            <select className="form-select" id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                              <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="col-12">
                            <label htmlFor="address" className="form-label">Address</label>
                            <textarea className="form-control" id="address" name="address" rows="3" value={formData.address} onChange={handleChange}></textarea>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'statutory' && (
                      <div>
                        <div className="row g-3">
                          <div className="col-md-6"><label htmlFor="sssNo" className="form-label">SSS No.</label><input type="text" className="form-control" id="sssNo" name="sssNo" value={formData.sssNo} onChange={handleChange} /></div>
                          <div className="col-md-6"><label htmlFor="tinNo" className="form-label">TIN No.</label><input type="text" className="form-control" id="tinNo" name="tinNo" value={formData.tinNo} onChange={handleChange} /></div>
                          <div className="col-md-6"><label htmlFor="pagIbigNo" className="form-label">Pag-IBIG No.</label><input type="text" className="form-control" id="pagIbigNo" name="pagIbigNo" value={formData.pagIbigNo} onChange={handleChange} /></div>
                          <div className="col-md-6"><label htmlFor="philhealthNo" className="form-label">PhilHealth No.</label><input type="text" className="form-control" id="philhealthNo" name="philhealthNo" value={formData.philhealthNo} onChange={handleChange} /></div>
                          <div className="col-md-12">
                              <label htmlFor="resumeFile" className="form-label">Resume (PDF/Doc)</label>
                              <input type="file" className="form-control" id="resumeFile" name="resumeFile" accept=".pdf,.doc,.docx" onChange={handleChange} />
                              {formData.resumeFile && <small className="text-muted d-block mt-1">{formData.resumeFile.name}</small>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Employee')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditEmployeeModal;