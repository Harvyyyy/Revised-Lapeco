import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './PositionsPage.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AddEditPositionModal from '../../modals/AddEditPositionModal';
import AddEmployeeToPositionModal from '../../modals/AddEmployeeToPositionModal';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import Layout from '@/layout/Layout';
import { positionAPI } from '@/services/api';
import { employeeAPI } from '@/services/api';

const PositionsPage = (props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [positionEmployeeSearchTerm, setPositionEmployeeSearchTerm] = useState('');
  const [positionEmployees, setPositionEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingAllEmployees, setLoadingAllEmployees] = useState(false);

  // Load positions from API
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingPositions(true);
        const res = await positionAPI.getAll();
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (isMounted) setPositions(data);
      } catch (e) {
        if (isMounted) setPositions([]);
      } finally {
        if (isMounted) setLoadingPositions(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlers = props?.handlers || {};

  const employeeCounts = useMemo(() => {
    return (positions || []).reduce((acc, pos) => {
      acc[pos.id] = pos.employeeCount || 0;
      return acc;
    }, {});
  }, [positions]);

  const filteredPositions = useMemo(() => {
    if (!searchTerm) return positions || [];
    return (positions || []).filter(pos =>
      (pos.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pos.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, positions]);

  const displayedEmployeesInPosition = useMemo(() => {
    if (!positionEmployeeSearchTerm) return positionEmployees;
    return positionEmployees.filter(emp => (emp.name || '').toLowerCase().includes(positionEmployeeSearchTerm.toLowerCase()));
  }, [positionEmployeeSearchTerm, positionEmployees]);

  const refreshPositions = async () => {
    try {
      const res = await positionAPI.getAll();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setPositions(data);
    } catch {}
  };

  const refreshPositionEmployees = async (positionId) => {
    try {
      const res = await positionAPI.getEmployees(positionId);
      setPositionEmployees(res.data?.employees || []);
    } catch {
      setPositionEmployees([]);
    }
  };

  // --- Handlers ---
  const handleSavePosition = async (formData, positionId) => {
    try {
      setSubmitting(true);
      const payload = {
        name: formData.title,
        description: formData.description,
        monthly_salary: Number(formData.monthlySalary),
      };
      if (positionId) {
        await positionAPI.update(positionId, payload);
      } else {
        await positionAPI.create(payload);
      }
      await refreshPositions();
      setShowAddEditPositionModal(false);
      setEditingPosition(null);
    } catch (e) {
      const message = e?.response?.data?.message || 'Failed to save position. Please try again.';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeletePosition = async (e, positionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this position? This will unassign all employees.')) {
      try {
        await positionAPI.delete(positionId);
        await refreshPositions();
        if (selectedPosition?.id === positionId) {
          setSelectedPosition(null);
          setPositionEmployees([]);
        }
      } catch (e) {
        alert('Failed to delete position.');
      }
    }
  };

  const handleSaveEmployeeToPosition = async (employeeId, positionId) => {
    try {
      await employeeAPI.update(employeeId, { position_id: positionId });
      if (selectedPosition) {
        await refreshPositionEmployees(selectedPosition.id);
      }
      await refreshPositions();
    } catch (e) {
      alert('Failed to assign employee to position.');
    }
  };

  const handleRemoveFromPosition = async (employeeId) => {
    if(window.confirm(`Are you sure you want to remove this employee from the position?`)){
      try {
        await employeeAPI.update(employeeId, { position_id: null });
        if (selectedPosition) {
          await refreshPositionEmployees(selectedPosition.id);
        }
        await refreshPositions();
      } catch (e) {
        alert('Failed to remove employee from position.');
      }
    }
  };

  const handleToggleLeader = (employeeId) => {
    if (typeof handlers.toggleTeamLeaderStatus === 'function') {
      handlers.toggleTeamLeaderStatus(employeeId);
    }
  };

  const handleViewPositionDetails = async (position) => {
    setSelectedPosition(position);
    setLoadingEmployees(true);
    try {
      const res = await positionAPI.getEmployees(position.id);
      setPositionEmployees(res.data?.employees || []);
    } catch (e) {
      setPositionEmployees([]);
    }
    setLoadingEmployees(false);
  };
  const handleBackToPositionsList = () => { setSelectedPosition(null); setPositionEmployeeSearchTerm(''); };
  const handleOpenAddPositionModal = () => { setEditingPosition(null); setShowAddEditPositionModal(true); };
  const handleOpenEditPositionModal = (e, position) => { e.stopPropagation(); setEditingPosition(position); setShowAddEditPositionModal(true); };
  const handleCloseAddEditPositionModal = () => setShowAddEditPositionModal(false);
  const handleOpenAddEmployeeModal = async () => {
    setLoadingAllEmployees(true);
    try {
      const res = await employeeAPI.getAll();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Normalize to { id, name, positionId }
      const normalized = data.map(e => ({ id: e.id, name: e.name, positionId: e.position_id ?? e.positionId ?? null }));
      setAllEmployees(normalized);
      setShowAddEmployeeModal(true);
    } catch {
      setAllEmployees([]);
      setShowAddEmployeeModal(true);
    } finally {
      setLoadingAllEmployees(false);
    }
  };
  const handleCloseAddEmployeeModal = () => setShowAddEmployeeModal(false);

  // Modal States
  const [showAddEditPositionModal, setShowAddEditPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const safeMonthlySalary = (pos) => {
    const value = pos.monthlySalary ?? pos.monthly_salary ?? 0;
    return Number(value) || 0;
  };

  const generatePositionsReportPdf = () => {
    if (!positions || positions.length === 0) {
      alert("No positions available to generate a report.");
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageTitle = "Company Positions Report";
    const generationDate = new Date().toLocaleDateString();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    doc.setFontSize(18); doc.setFont(undefined, 'bold');
    doc.text(pageTitle, pageWidth / 2, 40, { align: 'center' });
    doc.setFontSize(11); doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${generationDate}`, pageWidth / 2, 55, { align: 'center' });

    const totalPositions = positions.length;
    const totalAssignedEmployees = Object.values(employeeCounts).reduce((sum, count) => sum + count, 0);

    let summaryY = 80;
    doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text('Report Summary', margin, summaryY);
    summaryY += 18;
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`- Total Defined Positions: ${totalPositions}`, margin + 10, summaryY);
    summaryY += 15;
    doc.text(`- Total Employees with Positions: ${totalAssignedEmployees}`, margin + 10, summaryY);
    summaryY += 25;

    const tableColumns = ['Position Title', 'Description', 'Employee Count', 'Monthly Salary (₱)'];
    const tableRows = positions.map(pos => [
      pos.title,
      pos.description || '',
      employeeCounts[pos.id] || 0,
      safeMonthlySalary(pos).toLocaleString()
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: summaryY,
      theme: 'grid',
      headStyles: { fillColor: [25, 135, 84] },
    });

    setReportTitle(pageTitle);
    setPdfDataUri(doc.output('datauristring'));
    setShowReportModal(true);
  };

  // --- RENDER ---
  if (selectedPosition) {
    return (
      <div className="container-fluid p-0 page-module-container">
        <header className="page-header detail-view-header">
          <button className="btn btn-light me-3 back-button" onClick={handleBackToPositionsList}>
            <i className="bi bi-arrow-left"></i> Back to Positions List
          </button>
        </header>

        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 className="page-main-title mb-0">{selectedPosition.title}</h1>
                <p className="page-subtitle text-muted mb-0">{positionEmployees.length} Employee(s)</p>
            </div>
            <button className="btn btn-success" onClick={handleOpenAddEmployeeModal} disabled={loadingAllEmployees}>
              {loadingAllEmployees ? (<><span className="spinner-border spinner-border-sm me-2" role="status" />Loading...</>) : (<><i className="bi bi-person-plus-fill me-2"></i> Add Employee</>)}
            </button>
        </div>

        <div className="controls-bar d-flex justify-content-start mb-4">
            <div className="input-group detail-view-search">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control" placeholder="Search employees in this position..." value={positionEmployeeSearchTerm} onChange={(e) => setPositionEmployeeSearchTerm(e.target.value)} />
            </div>
        </div>

        {loadingEmployees ? (
          <div className="text-center p-5">Loading employees...</div>
        ) : (
          <div className="card data-table-card shadow-sm">
            <div className="table-responsive">
              <table className="table data-table mb-0">
                <thead><tr><th>Employee ID</th><th>Name</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>
                  {displayedEmployeesInPosition.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td><td>{emp.name}</td>
                      <td>{emp.isTeamLeader ? <span className="badge bg-success">Team Leader</span> : 'Member'}</td>
                      <td>
                        <div className="dropdown"><button className="btn btn-outline-secondary btn-sm" type="button" data-bs-toggle="dropdown">Manage <i className="bi bi-caret-down-fill"></i></button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleToggleLeader(emp.id); }}>{emp.isTeamLeader ? 'Unset as Leader' : 'Set as Leader'}</a></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); handleRemoveFromPosition(emp.id); }}>Remove from Position</a></li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayedEmployeesInPosition.length === 0 && (
                    <tr><td colSpan="4" className="text-center p-5">No employees match your search in this position.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {showAddEmployeeModal && (
          <AddEmployeeToPositionModal
            show={showAddEmployeeModal} onClose={handleCloseAddEmployeeModal}
            onSave={handleSaveEmployeeToPosition} currentPosition={selectedPosition}
            allEmployees={allEmployees} allPositions={positions}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
            <h1 className="page-main-title me-3">Positions</h1>
            <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">
                {positions.length} total positions
            </span>
        </div>
        <div className="header-actions d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary" onClick={generatePositionsReportPdf} disabled={!positions || positions.length === 0}>
                <i className="bi bi-file-earmark-text-fill"></i> Generate Report
            </button>
            <button className="btn btn-success" onClick={handleOpenAddPositionModal}>
                <i className="bi bi-plus-circle-fill me-2"></i> Add New Position
            </button>
        </div>
      </header>
      
      <div className="controls-bar d-flex justify-content-start mb-4">
        <div className="input-group">
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Search positions by title or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loadingPositions ? (
        <div className="w-100 text-center p-5 bg-light rounded">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading positions...</p>
        </div>
      ) : (
        <div className="positions-grid-container">
          {filteredPositions.length > 0 ? (
              filteredPositions.map(pos => (
              <div key={pos.id} className="position-card">
                  <div className="position-card-header">
                      <h5 className="position-title">{pos.title}</h5>
                      <div className="dropdown">
                      <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i className="bi bi-three-dots-vertical"></i></button>
                      <ul className="dropdown-menu dropdown-menu-end">
                          <li><a className="dropdown-item" href="#" onClick={(e) => handleOpenEditPositionModal(e, pos)}>Edit</a></li>
                          <li><a className="dropdown-item text-danger" href="#" onClick={(e) => handleDeletePosition(e, pos.id)}>Delete</a></li>
                      </ul>
                      </div>
                  </div>
                  <div className="card-body">
                      <p className="position-description">{pos.description}</p>
                      <div className="info-row">
                          <span className="label">Employee Count:</span>
                          <span className="value">{employeeCounts[pos.id] || 0}</span>
                      </div>
                      <div className="info-row">
                          <span className="label">Monthly Salary:</span>
                          <span className="value salary">₱ {safeMonthlySalary(pos).toLocaleString()}</span>
                      </div>
                  </div>
                  <div className="position-card-footer">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handleViewPositionDetails(pos)}>View Details</button>
                  </div>
              </div>
              ))
          ) : (
              <div className="w-100 text-center p-5 bg-light rounded">
                  <i className="bi bi-diagram-3-fill fs-1 text-muted mb-3 d-block"></i>
                  <h4 className="text-muted">{positions.length > 0 ? "No positions match your search." : "No positions have been created yet."}</h4>
              </div>
          )}
        </div>
      )}

      {showAddEditPositionModal && (
        <AddEditPositionModal show={showAddEditPositionModal} onClose={handleCloseAddEditPositionModal} onSave={handleSavePosition} positionData={editingPosition} />
      )}
      <ReportPreviewModal 
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        pdfDataUri={pdfDataUri}
        reportTitle={reportTitle}
      />
    </div>
  );
};

export default PositionsPage;