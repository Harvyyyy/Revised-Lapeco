import React, { useState, useEffect } from 'react';

const ReportConfigurationModal = ({ show, onClose, onRunReport, reportConfig }) => {
  const [params, setParams] = useState({});

  useEffect(() => {
    if (show && reportConfig?.parameters) {
      const initialParams = reportConfig.parameters.reduce((acc, param) => {
        if (param.type === 'date-range') {
          acc.startDate = new Date().toISOString().split('T')[0];
          acc.endDate = new Date().toISOString().split('T')[0];
        }
        return acc;
      }, {});
      setParams(initialParams);
    }
  }, [show, reportConfig]);

  const handleParamChange = (name, value) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRunReport(reportConfig.id, params);
  };

  if (!show || !reportConfig) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Configure Report: {reportConfig.title}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <p className="text-muted">{reportConfig.description}</p>
              <hr />
              {reportConfig.parameters?.map(param => {
                switch (param.type) {
                  case 'date-range':
                    return (
                      <div key={param.id} className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="startDate" className="form-label">{param.labels.start}</label>
                          <input
                            type="date"
                            id="startDate"
                            className="form-control"
                            value={params.startDate || ''}
                            onChange={(e) => handleParamChange('startDate', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="endDate" className="form-label">{param.labels.end}</label>
                          <input
                            type="date"
                            id="endDate"
                            className="form-control"
                            value={params.endDate || ''}
                            onChange={(e) => handleParamChange('endDate', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success">Run Report</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportConfigurationModal;