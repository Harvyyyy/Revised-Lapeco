import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './EmployeeDataPage.css';
import ViewEmployeeDetailsModal from '../../modals/ViewEmployeeDetailsModal';
import AddEditEmployeeModal from '../../modals/AddEditEmployeeModal';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import 'bootstrap-icons/font/bootstrap-icons.css';
import placeholderImage from '../../assets/placeholder-profile.jpg';
import logo from '../../assets/logo.png';
import { employeeAPI } from '../../services/api';
import { positionAPI } from '../../services/api';

const EmployeeDataPage = () => {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [joiningDateFilter, setJoiningDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [reportTitle, setReportTitle] = useState('');

  const normalizeEmployee = (e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
    employeeId: e.employee_id ?? e.employeeId ?? null,
    positionId: e.position_id ?? e.positionId ?? null,
    position: e.position ?? null,
    joiningDate: e.joining_date ?? e.joiningDate ?? null,
    birthday: e.birthday ?? null,
    gender: e.gender ?? null,
    address: e.address ?? null,
    contactNumber: e.contact_number ?? e.contactNumber ?? null,
    imageUrl: e.image_url ?? e.imageUrl ?? null,
    sssNo: e.sss_no ?? e.sssNo ?? null,
    tinNo: e.tin_no ?? e.tinNo ?? null,
    pagIbigNo: e.pag_ibig_no ?? e.pagIbigNo ?? null,
    philhealthNo: e.philhealth_no ?? e.philhealthNo ?? null,
    resumeFile: e.resume_file ?? e.resumeFile ?? null,
  });

  // Fetch employees and positions
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [empRes, posRes] = await Promise.all([
          employeeAPI.getAll(),
          positionAPI.getAll(),
        ]);
        const empData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
        setEmployees(empData.map(normalizeEmployee));

        const posData = Array.isArray(posRes.data) ? posRes.data : (posRes.data?.data || []);
        // Normalize positions to { id, title }
        setPositions(posData.map(p => ({ id: p.id, title: p.title ?? p.name })));
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setEmployees([]);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handlers = { 
    saveEmployee: async (employeeData, id) => {
      try {
        const isEdit = Boolean(id);
        const payload = {
          name: employeeData.name,
          email: employeeData.email,
          ...(isEdit ? {} : { role: employeeData.role || 'REGULAR_EMPLOYEE' }),
          position_id: employeeData.positionId ? Number(employeeData.positionId) : null,
          joining_date: employeeData.joiningDate || null,
          birthday: employeeData.birthday || null,
          gender: employeeData.gender || null,
          address: employeeData.address || null,
          contact_number: employeeData.contactNumber || null,
          sss_no: employeeData.sssNo || null,
          tin_no: employeeData.tinNo || null,
          pag_ibig_no: employeeData.pagIbigNo || null,
          philhealth_no: employeeData.philhealthNo || null,
        };

        if (isEdit) {
          await employeeAPI.update(id, payload);
        } else {
          await employeeAPI.create(payload);
        }
        // Refresh
        const response = await employeeAPI.getAll();
        const empData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setEmployees(empData.map(normalizeEmployee));
        setShowAddEditModal(false);
      } catch (err) {
        console.error('Error saving employee:', err);
        const apiErrors = err?.response?.data?.errors;
        const message = apiErrors ? Object.values(apiErrors).flat().join('\n') : 'Failed to save employee. Please try again.';
        alert(message);
      }
    }, 
    deleteEmployee: async (employeeId) => {
      try {
        await employeeAPI.delete(employeeId);
        const response = await employeeAPI.getAll();
        const empData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setEmployees(empData.map(normalizeEmployee));
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert('Failed to delete employee. Please try again.');
      }
    } 
  };

  const uniquePositions = useMemo(() => ['All Positions', ...new Set(employees.map(emp => emp.position).filter(Boolean).sort())], [employees]);
  
  const filteredAndSortedEmployees = useMemo(() => {
    let records = employees.map(emp => ({...emp}));
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      records = records.filter(emp => emp.name.toLowerCase().includes(lowerSearchTerm) || emp.email.toLowerCase().includes(lowerSearchTerm) || (emp.position || '').toLowerCase().includes(lowerSearchTerm) || String(emp.id).toLowerCase().includes(lowerSearchTerm) );
    }
    if (positionFilter) { records = records.filter(emp => emp.position === positionFilter); }
    if (joiningDateFilter) { records = records.filter(emp => emp.joiningDate === joiningDateFilter); }
    if (sortConfig.key) {
      records.sort((a, b) => {
        const valA = String(a[sortConfig.key] || '').toLowerCase();
        const valB = String(b[sortConfig.key] || '').toLowerCase();
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return records;
  }, [searchTerm, positionFilter, joiningDateFilter, sortConfig, employees]);
  
  const handleOpenViewModal = (employee) => { setViewingEmployee(employee); setShowViewModal(true); };
  const handleCloseViewModal = () => { setShowViewModal(false); setViewingEmployee(null); };
  const handleOpenAddModal = () => { setEditingEmployee(null); setShowAddEditModal(true); };
  const handleOpenEditModal = (e, employee) => { e.stopPropagation(); setEditingEmployee(employee); setShowAddEditModal(true); };
  const handleCloseAddEditModal = () => { setShowAddEditModal(false); setEditingEmployee(null); };
  const handleDeleteEmployee = (e, employeeId) => { e.stopPropagation(); if (window.confirm(`Are you sure you want to delete employee ${employeeId}?`)) { handlers.deleteEmployee(employeeId); } };
  const handleCloseReportPreview = () => { setShowReportPreviewModal(false); setPdfDataUri(''); };

  const generateEmployeeReportPdf = () => {
    if (!filteredAndSortedEmployees || filteredAndSortedEmployees.length === 0) {
        alert("No employee data to generate a report for the current filter.");
        return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageTitle = "Employee Data Report";
    const generationDate = new Date().toLocaleDateString();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    
    doc.addImage(logo, 'PNG', margin, 20, 80, 26);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(pageTitle, pageWidth - margin, 40, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${generationDate}`, pageWidth - margin, 55, { align: 'right' });
    doc.setLineWidth(1);
    doc.line(margin, 70, pageWidth - margin, 70);

    const totalEmployees = filteredAndSortedEmployees.length;
    const positionCounts = filteredAndSortedEmployees.reduce((acc, emp) => {
        acc[emp.position || 'Unassigned'] = (acc[emp.position || 'Unassigned'] || 0) + 1;
        return acc;
    }, {});
    
    let summaryY = 95;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Report Summary', margin, summaryY);
    summaryY += 18;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`- Total Employees in Report: ${totalEmployees}`, margin + 10, summaryY);
    summaryY += 15;
    doc.text(`- Breakdown by Position:`, margin + 10, summaryY);
    summaryY += 15;
    
    Object.entries(positionCounts).forEach(([position, count]) => {
        doc.text(`  • ${position}: ${count} employee(s)`, margin + 20, summaryY);
        summaryY += 15;
    });

    summaryY += 10;

    const tableColumns = ['ID', 'Name', 'Position', 'Joining Date', 'Email', 'Contact No.', 'SSS', 'TIN', 'Pag-IBIG', 'PhilHealth'];
    const tableRows = filteredAndSortedEmployees.map(emp => [
        emp.id, emp.name, emp.position || 'Unassigned', emp.joiningDate || '-', emp.email,
        emp.contactNumber || '-', emp.sssNo || '-', emp.tinNo || '-', emp.pagIbigNo || '-', emp.philhealthNo || '-',
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: summaryY,
      theme: 'striped',
      headStyles: { fillColor: [25, 135, 84] },
    });

    setReportTitle(pageTitle);
    const pdfBlob = doc.output('blob');
    setPdfDataUri(URL.createObjectURL(pdfBlob));
    setShowReportPreviewModal(true);
  };
  
  const renderCardView = () => (
    <div className="employee-grid-container">
      {filteredAndSortedEmployees.map(emp => (
        <div key={emp.id} className="employee-card-v2" onClick={() => handleOpenViewModal(emp)}>
          <div className="employee-card-header-v2">
            <span className="employee-id">{emp.id}</span>
            <div className="dropdown">
              <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" onClick={e => e.stopPropagation()} aria-label="Employee Actions">
                  <i className="bi bi-three-dots-vertical"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#" onClick={(e) => handleOpenEditModal(e, emp)}>Edit</a></li>
                <li><a className="dropdown-item text-danger" href="#" onClick={(e) => handleDeleteEmployee(e, emp.id)}>Delete</a></li>
              </ul>
            </div>
          </div>
          <div className="employee-card-body-v2">
            <img src={emp.imageUrl || placeholderImage} alt={emp.name} className="employee-avatar-v2" onError={(e) => { e.target.src = placeholderImage; }} />
            <h5 className="employee-name-v2">{emp.name}</h5>
            <p className="employee-position-v2">{emp.position || 'Unassigned'}</p>
            <div className="employee-details-v2">
                <div className="detail-item">
                    <i className="bi bi-envelope-fill"></i>
                    <a href={`mailto:${emp.email}`} onClick={e => e.stopPropagation()}>{emp.email}</a>
                </div>
                <div className="detail-item">
                    <i className="bi bi-calendar-event-fill"></i>
                    <span>Joined on {emp.joiningDate || '-'}</span>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="card data-table-card shadow-sm">
      <div className="table-responsive">
        <table className="table data-table mb-0">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Position</th><th>Joining Date</th><th>Action</th></tr></thead>
          <tbody>{filteredAndSortedEmployees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td><img src={emp.imageUrl || placeholderImage} alt={emp.name} className="employee-avatar-table me-2" onError={(e) => { e.target.src = placeholderImage; }}/>{emp.name}</td>
              <td>{emp.email}</td><td>{emp.position || 'Unassigned'}</td><td>{emp.joiningDate || '-'}</td>
              <td>
                <div className="dropdown"><button className="btn btn-outline-secondary btn-sm action-dropdown-toggle" type="button" data-bs-toggle="dropdown"><i className="bi bi-caret-down-fill me-2"></i>Actions</button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleOpenViewModal(emp);}}><i className="bi bi-eye-fill me-2"></i>View Details</a></li>
                    <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleOpenEditModal(e, emp);}}><i className="bi bi-pencil-fill me-2"></i>Edit</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); handleDeleteEmployee(e, emp.id);}}><i className="bi bi-trash-fill me-2"></i>Delete</a></li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const positionMap = useMemo(() => {
    if (!positions || !Array.isArray(positions)) return new Map();
    return new Map(positions.map(p => [p.id, p.title]));
  }, [positions]);

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center"><h1 className="page-main-title me-3">Employee Management</h1><span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">{filteredAndSortedEmployees.length === employees.length ? `${employees.length} employees` : `Showing ${filteredAndSortedEmployees.length} of ${employees.length}`}</span></div>
        <div className="header-actions d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary" onClick={generateEmployeeReportPdf} disabled={!employees || employees.length === 0}><i className="bi bi-file-earmark-text-fill"></i> Generate Report</button>
            <button className="btn btn-success action-button-primary" onClick={handleOpenAddModal}><i className="bi bi-person-plus-fill"></i> Add New Employee</button>
        </div>
      </header>
      
      <div className="page-controls-bar mb-4">
        <div className="filters-group">
            <div className="input-group"><span className="input-group-text"><i className="bi bi-search"></i></span><input type="text" className="form-control" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <select className="form-select" value={positionFilter} onChange={e => setPositionFilter(e.target.value)}>{uniquePositions.map(pos => <option key={pos} value={pos === 'All Positions' ? '' : pos}>{pos}</option>)}</select>
            <div className="input-group date-filter-group"><span className="input-group-text" title="Filter by Joining Date"><i className="bi bi-calendar-event"></i></span><input type="date" className="form-control" value={joiningDateFilter} onChange={(e) => setJoiningDateFilter(e.target.value)} />{joiningDateFilter && <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setJoiningDateFilter('')}><i className="bi bi-x"></i></button>}</div>
        </div>
        <div className="actions-group">
          <div className="dropdown sort-dropdown">
            <button className="btn btn-outline-secondary" type="button" data-bs-toggle="dropdown" aria-label="Sort employees">
                <i className="bi bi-sort-down"></i> Sort
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
                <li><h6 className="dropdown-header">Sort by</h6></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortConfig({key: 'name', direction: 'ascending'})}}>Name (A-Z)</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortConfig({key: 'name', direction: 'descending'})}}>Name (Z-A)</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortConfig({key: 'joiningDate', direction: 'descending'})}}>Joining Date (Newest)</a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setSortConfig({key: 'joiningDate', direction: 'ascending'})}}>Joining Date (Oldest)</a></li>
            </ul>
          </div>
          <div className="view-toggle-buttons btn-group">
              <button className={`btn btn-sm ${viewMode === 'card' ? 'active' : 'btn-outline-secondary'}`} onClick={() => setViewMode('card')} title="Card View"><i className="bi bi-grid-3x3-gap-fill"></i></button>
              <button className={`btn btn-sm ${viewMode === 'table' ? 'active' : 'btn-outline-secondary'}`} onClick={() => setViewMode('table')} title="Table View"><i className="bi bi-list-task"></i></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5 bg-light rounded">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading employee data...</p>
        </div>
      ) : error ? (
        <div className="text-center p-5 bg-light rounded">
          <p className="text-danger">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : filteredAndSortedEmployees.length > 0 ? (viewMode === 'card' ? renderCardView() : renderTableView()) : (<div className="text-center p-5 bg-light rounded"><i className="bi bi-people-fill fs-1 text-muted mb-3 d-block"></i><h4 className="text-muted">{employees.length === 0 ? "No employees in the system." : "No employees match criteria."}</h4>{employees.length === 0 && <p>Click "Add New Employee" to get started.</p>}</div>)}
      {showViewModal && viewingEmployee && ( <ViewEmployeeDetailsModal employee={viewingEmployee} show={showViewModal} onClose={handleCloseViewModal} positionMap={positionMap} /> )}
      {showAddEditModal && (
        <AddEditEmployeeModal
          show={showAddEditModal}
          onClose={handleCloseAddEditModal}
          onSave={(data) => handlers.saveEmployee(data, editingEmployee?.id)}
          employeeData={editingEmployee}
          positions={positions}
        />
      )}
      {showReportPreviewModal && ( <ReportPreviewModal show={showReportPreviewModal} onClose={handleCloseReportPreview} pdfDataUri={pdfDataUri} reportTitle={reportTitle} /> )}
    </div>
  );
};

export default EmployeeDataPage;