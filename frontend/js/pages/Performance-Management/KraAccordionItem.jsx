import React from 'react';

const KraAccordionItem = ({ kra, kpis, onEdit, onDelete }) => {
  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  const weightClass = totalWeight === 100 ? 'text-success' : 'text-danger fw-bold';
  const accordionId = `kra-collapse-${kra.id}`;

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="accordion-item kra-accordion-item">
      <h2 className="accordion-header">
        <button 
          className="accordion-button collapsed" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target={`#${accordionId}`}
          aria-expanded="false"
        >
          <div className="kra-accordion-title-wrapper">
            <span className="kra-accordion-title">{kra.title}</span>
            <div className="kra-accordion-summary">
              <span className="badge bg-secondary-subtle text-secondary-emphasis">{kpis.length} KPIs</span>
              <span className={`badge ${weightClass === 'text-success' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                {totalWeight}% Weight
              </span>
            </div>
          </div>
        </button>

        <div className="kra-accordion-actions">
          <button className="btn btn-sm btn-outline-primary" onClick={(e) => handleActionClick(e, () => onEdit(kra))}>Edit</button>
          <button className="btn btn-sm btn-outline-danger" onClick={(e) => handleActionClick(e, () => onDelete(kra.id))}>Delete</button>
        </div>
      </h2>
      <div id={accordionId} className="accordion-collapse collapse">
        <div className="accordion-body">
          <p className="text-muted fst-italic">{kra.description || "No description provided."}</p>
          <hr/>
          <ul className="list-group">
            {kpis.length > 0 ? kpis.map(kpi => (
              <li key={kpi.id} className="list-group-item d-flex justify-content-between align-items-center">
                {kpi.title}
                <span className="badge bg-primary rounded-pill">{kpi.weight}%</span>
              </li>
            )) : <li className="list-group-item text-muted">No KPIs defined for this KRA.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KraAccordionItem;