import React from 'react';
import Select from 'react-select';

const KpiRow = ({ kpi, positions, index, onKpiChange, onDelete }) => {
  const positionOptions = positions.map(p => ({ value: p.id, label: p.title }));
  const selectedPositions = positionOptions.filter(opt => kpi.appliesToPositionIds?.includes(opt.value));

  const handleChange = (field, value) => {
    onKpiChange(index, field, value);
  };
  
  return (
    <div className="kpi-row-in-modal">
      <div className="kpi-modal-fields">
        <input
          type="text"
          className="form-control form-control-sm mb-2"
          placeholder="KPI Title (e.g., Packing Speed)"
          value={kpi.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
        <Select
          isMulti
          placeholder="Assign to positions..."
          options={positionOptions}
          value={selectedPositions}
          onChange={selected => handleChange('appliesToPositionIds', selected.map(s => s.value))}
          className="react-select-sm"
          classNamePrefix="react-select"
        />
      </div>
      <div className="kpi-modal-weight">
        <div className="input-group input-group-sm">
          <input
            type="number"
            className="form-control"
            placeholder="Weight"
            value={kpi.weight}
            onChange={(e) => handleChange('weight', parseInt(e.target.value, 10) || 0)}
          />
          <span className="input-group-text">%</span>
        </div>
      </div>
      <div className="kpi-modal-actions">
        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(index)}>
            <i className="bi bi-trash-fill"></i>
        </button>
      </div>
    </div>
  );
};

export default KpiRow;