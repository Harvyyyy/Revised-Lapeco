import React, { useState, useEffect } from 'react';
import KpiRow from '../pages/Performance-Management/KpiRow';

const AddEditKraModal = ({ show, onClose, onSave, positions, kraData, kpisData }) => {
  const [kra, setKra] = useState({ title: '', description: '' });
  const [kpis, setKpis] = useState([]);
  const isEditMode = Boolean(kraData && kraData.id);

  useEffect(() => {
    if (show) {
      if (isEditMode) {
        setKra({ title: kraData.title, description: kraData.description });
        setKpis(kpisData);
      } else {
        setKra({ title: '', description: '' });
        setKpis([]);
      }
    }
  }, [show, kraData, kpisData, isEditMode]);

  const handleKraChange = (e) => {
    const { name, value } = e.target;
    setKra(prev => ({ ...prev, [name]: value }));
  };

  const handleKpiChange = (index, field, value) => {
    const updatedKpis = [...kpis];
    updatedKpis[index] = { ...updatedKpis[index], [field]: value };
    setKpis(updatedKpis);
  };
  
  const handleAddNewKpi = () => {
    setKpis(prev => [...prev, { tempId: `new-${Date.now()}`, title: '', weight: 0, appliesToPositionIds: [] }]);
  };
  
  const handleDeleteKpi = (index) => {
    const updatedKpis = [...kpis];
    updatedKpis.splice(index, 1);
    setKpis(updatedKpis);
  };

  const handleSubmit = () => {
    if (!kra.title) {
      alert('KRA Title is required.');
      return;
    }
    const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
    if (kpis.length > 0 && totalWeight !== 100) {
      alert(`The total weight for all KPIs must be exactly 100%. Current total: ${totalWeight}%.`);
      return;
    }
    onSave({ ...kra, id: kraData?.id }, kpis);
    onClose();
  };

  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  const weightClass = totalWeight === 100 ? 'text-success' : 'text-danger fw-bold';

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditMode ? 'Edit Key Result Area' : 'Add New Key Result Area'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label fw-bold">KRA Title*</label>
              <input type="text" id="title" name="title" className="form-control" value={kra.title} onChange={handleKraChange} />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="form-label fw-bold">Description</label>
              <textarea id="description" name="description" className="form-control" rows="2" value={kra.description} onChange={handleKraChange}></textarea>
            </div>
            
            <hr />

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Key Performance Indicators (KPIs)</h6>
              <h6 className={`mb-0 ${weightClass}`}>Total Weight: {totalWeight}%</h6>
            </div>
            <div className="kpi-list-in-modal">
                {kpis.map((kpi, index) => (
                    <KpiRow 
                        key={kpi.id || kpi.tempId}
                        kpi={kpi}
                        positions={positions}
                        index={index}
                        onKpiChange={handleKpiChange}
                        onDelete={handleDeleteKpi}
                    />
                ))}
            </div>
            <button type="button" className="btn btn-sm btn-outline-success mt-2" onClick={handleAddNewKpi}>
              <i className="bi bi-plus-circle me-1"></i> Add KPI
            </button>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditKraModal;