import React, { useState, useEffect } from 'react';
import KpiRow from './KpiRow';

const KraCard = ({ kra, kpis, positions, isNew, onSaveKra, onDeleteKra, onSaveKpi, onDeleteKpi, onCancelNew }) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [newKpis, setNewKpis] = useState([]);
  
  const [formData, setFormData] = useState({
    title: kra.title || '',
    description: kra.description || '',
  });

  useEffect(() => {
    if (!isNew) {
      setFormData({
        title: kra.title,
        description: kra.description,
      });
    }
  }, [kra, isNew]);

  const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
  const weightClass = totalWeight === 100 ? 'text-success' : 'text-danger fw-bold';

  const handleSave = () => {
    if (!formData.title) {
      alert('KRA Title is required.');
      return;
    }
    onSaveKra(formData, kra.id);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    if (isNew) {
      onCancelNew(kra.id);
    } else {
      setFormData({
        title: kra.title,
        description: kra.description,
      });
      setIsEditing(false);
    }
  };
  
  const handleAddNewKpi = () => {
    setNewKpis(prev => [...prev, { tempId: `new-kpi-${Date.now()}` }]);
  };

  const handleSaveNewKpi = (kpiData) => {
    onSaveKpi(kra.id, kpiData, null);
    setNewKpis([]);
  };
  
  const handleRemoveNewKpiRow = (tempId) => {
    setNewKpis(prev => prev.filter(k => k.tempId !== tempId));
  };
  
  const handleDeleteExistingKpi = (kpiId) => {
    if (window.confirm('Are you sure you want to delete this KPI?')) {
        onDeleteKpi(kpiId);
    }
  };

  return (
    <div className={`kra-card ${isEditing ? 'editing-outline' : ''}`}>
      <div className="kra-card-header">
        {isEditing ? (
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Enter KRA Title (e.g., Warehouse Efficiency)"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        ) : (
          <h5 className="kra-title">{kra.title}</h5>
        )}
        <div className="kra-header-actions">
          {isEditing ? (
            <>
              <button className="btn btn-sm btn-success" onClick={handleSave}>Save</button>
              <button className="btn btn-sm btn-secondary" onClick={handleCancelEdit}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setIsEditing(true)}>Edit KRA</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteKra(kra.id)}>Delete KRA</button>
            </>
          )}
        </div>
      </div>
      <div className="kra-card-body">
        {isEditing ? (
          <div className="mb-2">
            <label className="form-label small text-muted">Description</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Describe what this KRA measures."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>
        ) : (
          <p className="kra-description">{kra.description || <span className="text-muted fst-italic">No description provided.</span>}</p>
        )}
      </div>
      <div className="kpi-section">
        <div className="kpi-section-header">
          <h6>Key Performance Indicators (KPIs)</h6>
          <h6 className={weightClass}>Total Weight: {totalWeight}%</h6>
        </div>
        <div className="kpi-list">
          {kpis.map(kpi => (
            <KpiRow 
                key={kpi.id} 
                kpi={kpi} 
                positions={positions}
                onSave={(data, id) => onSaveKpi(kra.id, data, id)} 
                onDelete={handleDeleteExistingKpi} 
            />
          ))}
          {newKpis.map(kpi => (
             <KpiRow 
                key={kpi.tempId} 
                kpi={kpi} 
                positions={positions}
                onSave={handleSaveNewKpi} 
                onDelete={() => handleRemoveNewKpiRow(kpi.tempId)} 
             />
          ))}
        </div>
        {!isNew && (
          <div className="kpi-section-footer">
            <button className="btn btn-sm btn-outline-success" onClick={handleAddNewKpi} disabled={isEditing || newKpis.length > 0}>
              <i className="bi bi-plus-circle-fill me-2"></i>Add KPI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KraCard;