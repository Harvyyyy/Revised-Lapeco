import React from 'react';

const ActivePeriodCard = ({ activePeriod, onSetPeriod }) => {
  return (
    <div className="card shadow-sm">
      <div className="card-body d-flex justify-content-between align-items-center">
        {activePeriod ? (
          <div>
            <h6 className="card-subtitle text-success mb-1">
              <i className="bi bi-broadcast-pin me-2"></i>EVALUATION PERIOD IS ACTIVE
            </h6>
            <h5 className="card-title mb-0">
              {activePeriod.periodStart} to {activePeriod.periodEnd}
            </h5>
          </div>
        ) : (
          <div>
            <h6 className="card-subtitle text-muted mb-1">
              <i className="bi bi-power me-2"></i>NO ACTIVE EVALUATION PERIOD
            </h6>
            <h5 className="card-title mb-0">
              Evaluations are currently disabled.
            </h5>
          </div>
        )}
        <button className="btn btn-primary" onClick={onSetPeriod}>
          {activePeriod ? 'Change Period' : 'Set Active Period'}
        </button>
      </div>
    </div>
  );
};

export default ActivePeriodCard;