import React from 'react';
import './ApplicationModal.css'; 
const steps = [
  'Personal Information',
  'Application Details',
  'Government Requirements',
  'Review & Submit'
];
function StepIndicator({ currentStep }) {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        return (
          <div
            key={step}
            className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="step-number">{isCompleted ? <i className="bi bi-check-lg"></i> : stepNumber}</div>
            <div className="step-label">{step}</div>
          </div>
        );
      })}
    </div>
  );
}
export default StepIndicator;
