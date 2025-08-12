import React from 'react';
import '../pages/Performance-Management/PerformanceManagement.css'; 

const ViewEvaluationModal = ({ show, onClose, evaluation, employee, position, kras, kpis }) => {
  if (!show || !evaluation) return null;

  const kpiMap = new Map(kpis.map(k => [k.id, k]));
  const scoreMap = new Map(evaluation.scores.map(s => [s.kpiId, s]));

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title">Evaluation Details</h5>
              <p className="mb-0 text-muted small">
                For: <strong>{employee?.name}</strong> ({position?.title}) | 
                Period: {evaluation.periodStart} to {evaluation.periodEnd}
              </p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {kras
              .filter(kra => kra.appliesToPositionIds?.includes(position?.id))
              .map(kra => {
                const relevantKpis = kpis.filter(kpi => kpi.kraId === kra.id);
                return (
                  <div key={kra.id} className="card mb-3">
                    <div className="card-header bg-light"><strong>{kra.title}</strong></div>
                    <ul className="list-group list-group-flush">
                      {relevantKpis.map(kpi => {
                        const scoreInfo = scoreMap.get(kpi.id);
                        return (
                          <li key={kpi.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <p className="mb-1 fw-bold">{kpi.title}</p>
                                <p className="mb-1 text-muted small">{scoreInfo?.comments || 'No comments.'}</p>
                              </div>
                              <div className="d-flex align-items-center">
                                <span className="fw-bold fs-5 me-2">{scoreInfo?.score || 0}/5</span>
                                <i className="bi bi-star-fill text-warning"></i>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
            })}
             <div className="card">
                <div className="card-header bg-light"><strong>Final Comments</strong></div>
                <div className="card-body">
                    <p className="mb-0 fst-italic">{evaluation.finalComments || 'No final comments were provided.'}</p>
                </div>
             </div>
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <div className="fw-bold fs-5">
              Overall Score: <span className="text-success">{evaluation.overallScore.toFixed(2)}%</span>
            </div>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEvaluationModal;