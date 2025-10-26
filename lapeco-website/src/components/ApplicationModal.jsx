import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Form, Button, Row, Col, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import StepIndicator from './StepIndicator';
import './ApplicationModal.css';
import lapecoLogo from '../assets/images/logo.png';
import { applicantApi } from '../api/api';

const TOTAL_STEPS = 4;
const INITIAL_FORM_DATA = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  phone: '',
  birthday: '',
  gender: '',
  job_opening_id: '',
  resume: null,
  profile_picture: null,
  sss: '',
  tin: '',
  pagibig: '',
  philhealth: ''
};
function ApplicationModal({ show, onHide }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [validated, setValidated] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [positions, setPositions] = useState([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const abortControllerRef = useRef(null);

  const loadPositions = useCallback(async () => {
    setIsLoadingPositions(true);
    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const response = await applicantApi.getPositions({ signal: controller.signal });
      setPositions(response.data || []);
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching positions:', error);
        toast.error('Failed to load positions. Please refresh the page.');
      }
    } finally {
      setIsLoadingPositions(false);
    }
  }, []);

  useEffect(() => {
    loadPositions();
    return () => {
      abortControllerRef.current?.abort();
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [loadPositions, photoPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: file || null }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prevState => ({ ...prevState, profile_picture: file }));
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
    } else if (!file) {
      setFormData(prevState => ({ ...prevState, profile_picture: null }));
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setValidated(false);
    setCurrentStep(1);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    document.getElementById('multiStepForm')?.reset();
  };
  const handleAttemptClose = () => {
    setShowExitConfirmModal(true);
  };
  const handleFinalClose = () => {
    setShowExitConfirmModal(false);
    resetForm();
    onHide();
  };
  const handleNextStep = (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }
    setValidated(false);
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  const handleAttemptSubmit = () => {
    setValidated(true);
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'birthday', 'gender', 'job_opening_id', 'resume'];
    const hasMissing = requiredFields.some(field => !formData[field]);
    if (hasMissing) {
      toast.error('Please fill in all required fields before submitting.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      const backendFieldMap = {
        sss: 'sss_no',
        tin: 'tin_no',
        pagibig: 'pag_ibig_no',
        philhealth: 'philhealth_no'
      };
      Object.entries(formData).forEach(([key, value]) => {
        const backendKey = backendFieldMap[key] || key;
        if (value instanceof File) {
          formDataToSend.append(backendKey, value);
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(backendKey, value);
        }
      });

      await applicantApi.submitApplication(formDataToSend);
      toast.success('Application submitted successfully! Thank you.');
      handleFinalClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      if (error.response?.status === 422 && error.response.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        toast.error(validationErrors.join('\n'));
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Unable to connect to the server. Please check your connection and try again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Row className="mb-3">
              <Form.Group as={Col} md={4} controlId="validationFirstName">
                <Form.Label>First Name*</Form.Label>
                <Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                <Form.Control.Feedback type="invalid">Please provide your first name.</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={3} controlId="validationMiddleName">
                <Form.Label>Middle</Form.Label>
                <Form.Control type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} />
              </Form.Group>
              <Form.Group as={Col} md={5} controlId="validationLastName">
                <Form.Label>Last Name*</Form.Label>
                <Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                <Form.Control.Feedback type="invalid">Please provide your last name.</Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group as={Col} md={7} controlId="validationEmail">
                <Form.Label>Email*</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@email.com" required />
                <Form.Control.Feedback type="invalid">Please provide a valid email.</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={5} controlId="validationPhone">
                <Form.Label>Phone*</Form.Label>
                <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g., 09123456789" required />
                <Form.Control.Feedback type="invalid">Please provide a valid phone number.</Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-4 align-items-center">
              <Form.Group as={Col} sm={8} controlId="validationPhoto">
                <Form.Label>Applicant Photo (Optional)</Form.Label>
                <Form.Control type="file" name="profile_picture" onChange={handlePhotoChange} accept="image/png, image/jpeg, image/jpg" />
              </Form.Group>
              {photoPreview && (
                <Col sm={4} className="text-center mt-3 mt-sm-0">
                  <Image src={photoPreview} alt="Applicant preview" className="applicant-photo-preview" />
                </Col>
              )}
            </Row>
            <Row className="mb-4">
              <Form.Group as={Col} md={6} controlId="validationBirthday">
                <Form.Label>Birthday*</Form.Label>
                <Form.Control type="date" name="birthday" value={formData.birthday} onChange={handleChange} required />
                <Form.Control.Feedback type="invalid">Please enter your birthday.</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={6} controlId="validationGender">
                <Form.Label>Gender*</Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">Please select your gender.</Form.Control.Feedback>
              </Form.Group>
            </Row>
          </>
        );
      case 2:
        return (
          <>
            <Row className="mb-4">
              <Form.Group as={Col} md={6} controlId="validationApplyingFor">
                <Form.Label>Applying For*</Form.Label>
                <Form.Select name="job_opening_id" value={formData.job_opening_id} onChange={handleChange} required disabled={isLoadingPositions}>
                  <option value="">{isLoadingPositions ? 'Loading positions...' : 'Select a job...'}</option>
                  {positions.map(position => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">Please select a job position.</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={6} controlId="validationResume">
                <Form.Label>Resume (PDF/Doc)*</Form.Label>
                <Form.Control type="file" name="resume" onChange={handleFileChange} accept=".pdf,.doc,.docx" required />
                <Form.Control.Feedback type="invalid">Please upload your resume.</Form.Control.Feedback>
              </Form.Group>
            </Row>
          </>
        );
      case 3:
        return (
          <>
            <Row className="mb-3">
              <Form.Group as={Col} md={6} controlId="validationSSS">
                <Form.Label>SSS No.</Form.Label>
                <Form.Control type="text" name="sss" value={formData.sss} onChange={handleChange} />
              </Form.Group>
              <Form.Group as={Col} md={6} controlId="validationTIN">
                <Form.Label>TIN No.</Form.Label>
                <Form.Control type="text" name="tin" value={formData.tin} onChange={handleChange} />
              </Form.Group>
            </Row>
            <Row className="mb-4">
              <Form.Group as={Col} md={6} controlId="validationPagibig">
                <Form.Label>Pag-IBIG No.</Form.Label>
                <Form.Control type="text" name="pagibig" value={formData.pagibig} onChange={handleChange} />
              </Form.Group>
              <Form.Group as={Col} md={6} controlId="validationPhilhealth">
                <Form.Label>PhilHealth No.</Form.Label>
                <Form.Control type="text" name="philhealth" value={formData.philhealth} onChange={handleChange} />
              </Form.Group>
            </Row>
          </>
        );
      case 4:
        return (
          <>
            <p className="mb-4">Please review your information carefully before submitting.</p>
            <div className="review-summary">
              {Object.entries(formData).map(([key, value]) => {
                if (!value) return null;
                const formattedKey = key
                  .replace(/_/g, ' ')
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="review-item">
                    <strong>{formattedKey}:</strong>
                    <span>{value instanceof File ? value.name : value}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <Modal show={show} onHide={handleAttemptClose} dialogClassName="modal-90w" centered backdrop="static" keyboard={false}>
        <Modal.Body className="p-0">
          <div className="application-modal-layout">
            <div className="modal-sidebar">
              <img src={lapecoLogo} alt="LAPECO" className="modal-logo" />
              <StepIndicator currentStep={currentStep} />
            </div>
            <div className="modal-main-content">
              <div className="modal-form-header">
                <h3 className="modal-form-title">
                  {currentStep === 1 && 'Personal Information'}
                  {currentStep === 2 && 'Application Details'}
                  {currentStep === 3 && 'Government Requirements'}
                  {currentStep === 4 && 'Review Your Application'}
                </h3>
                <button type="button" className="btn-close" aria-label="Close" onClick={handleAttemptClose}></button>
              </div>
              <Form noValidate validated={validated} onSubmit={handleNextStep} id="multiStepForm">
                <div className="form-content-area">
                  {renderStepContent()}
                </div>
                <div className="modal-navigation">
                  {currentStep > 1 && (
                    <Button variant="secondary" onClick={handlePrevStep}>
                      Previous
                    </Button>
                  )}
                  <div className="ms-auto">
                    {currentStep < TOTAL_STEPS && (
                      <Button variant="success" type="submit">
                        Next Step
                      </Button>
                    )}
                    {currentStep === TOTAL_STEPS && (
                      <Button variant="success" onClick={handleAttemptSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    )}
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Submission</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to submit your application? Please ensure all information is correct.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleFinalSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showExitConfirmModal} onHide={() => setShowExitConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Exit Application?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to exit? All your progress will be lost.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExitConfirmModal(false)}>
            Stay
          </Button>
          <Button variant="danger" onClick={handleFinalClose}>
            Exit
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
export default ApplicationModal;
