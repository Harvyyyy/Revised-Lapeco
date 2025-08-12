import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './LeaveManagementPage.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import ViewReasonModal from '../../modals/ViewReasonModal';
import Layout from '@/layout/Layout';
import { leaveAPI } from '@/services/api';

const LeaveManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await leaveAPI.getAll();
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Map API to UI structure
        const mapped = data.map(l => ({
          leaveId: l.id,
          empId: l.user?.id ?? l.user_id,
          name: l.user?.name ?? '',
          position: l.user?.position?.name ?? '',
          leaveType: l.type,
          dateFrom: l.date_from,
          dateTo: l.date_to,
          days: l.days,
          status: l.status,
          reason: l.reason,
        }));
        setLeaveRequests(mapped);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaves:', err);
        setLeaveRequests([]);
        setError('Failed to load leave requests. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dateFrom', direction: 'ascending' });

  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [tempStatus, setTempStatus] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState(null);

  const uniqueLeaveTypes = useMemo(() => ['All', ...new Set(leaveRequests.map(req => req.leaveType))], [leaveRequests]);
  
  const leaveStats = useMemo(() => {
    return {
        All: leaveRequests.length,
        Pending: leaveRequests.filter(r => r.status === 'Pending').length,
        Approved: leaveRequests.filter(r => r.status === 'Approved').length,
        Declined: leaveRequests.filter(r => r.status === 'Declined').length,
        Canceled: leaveRequests.filter(r => r.status === 'Canceled').length
    };
  }, [leaveRequests]);

  const employeesOnLeaveToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return leaveRequests.filter(req => {
        if (req.status !== 'Approved') return false;
        const startDate = new Date(req.dateFrom);
        const endDate = new Date(req.dateTo);
        startDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);
        return today >= startDate && today <= endDate;
    }).length;
  }, [leaveRequests]);

  useEffect(() => {
    let records = [...leaveRequests];
    if (statusFilter && statusFilter !== 'All') {
      records = records.filter(req => req.status === statusFilter);
    }
    if (leaveTypeFilter && leaveTypeFilter !== 'All') {
      records = records.filter(req => req.leaveType === leaveTypeFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      records = records.filter(req =>
        req.name?.toLowerCase().includes(lowerSearchTerm) ||
        req.empId?.toLowerCase().includes(lowerSearchTerm) ||
        req.position?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    if (sortConfig.key) {
      records.sort((a, b) => {
        let valA = a[sortConfig.key]; let valB = b[sortConfig.key];
        if (sortConfig.key === 'days') { valA = Number(valA) || 0; valB = Number(valB) || 0; } 
        else if (sortConfig.key === 'dateFrom') { valA = new Date(valA).getTime() || 0; valB = new Date(valB).getTime() || 0; } 
        else { valA = String(valA || '').toLowerCase(); valB = String(valB || '').toLowerCase(); }
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    setFilteredRequests(records);
  }, [searchTerm, statusFilter, leaveTypeFilter, leaveRequests, sortConfig]);

  const handleEditClick = (request) => {
    setEditingLeaveId(request.leaveId);
    setTempStatus(request.status);
  };
  
  const handleCancelEdit = () => {
    setEditingLeaveId(null);
    setTempStatus('');
  };

  const handleSaveStatus = (leaveId) => {
    // Update leave status via API
    (async () => {
      try {
        await leaveAPI.update(leaveId, { status: tempStatus });
        // Refresh the data
        const res = await leaveAPI.getAll();
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const mapped = data.map(l => ({
          leaveId: l.id,
          empId: l.user?.id ?? l.user_id,
          name: l.user?.name ?? '',
          position: l.user?.position?.name ?? '',
          leaveType: l.type,
          dateFrom: l.date_from,
          dateTo: l.date_to,
          days: l.days,
          status: l.status,
          reason: l.reason,
        }));
        setLeaveRequests(mapped);
      } catch (err) {
        console.error('Error updating leave status:', err);
        alert('Failed to update leave status. Please try again.');
      }
    })();
    setEditingLeaveId(null);
    setTempStatus('');
  };

  const handleViewReason = (request) => {
    setViewingRequest(request);
    setShowReasonModal(true);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up sort-icon inactive-sort-icon ms-1"></i>;
    return sortConfig.direction === 'ascending' ? <i className="bi bi-sort-up-alt sort-icon active-sort-icon ms-1"></i> : <i className="bi bi-sort-down-alt sort-icon active-sort-icon ms-1"></i>;
  };

  const handleGenerateReport = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      alert("No data to generate a report for the current filter.");
      return;
    }
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageTitle = "Leave Requests Report";
    const generationDate = new Date().toLocaleDateString();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(pageTitle, pageWidth / 2, 40, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${generationDate}`, pageWidth / 2, 55, { align: 'center' });

    let summaryY = 80;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Report Summary', margin, summaryY);
    summaryY += 18;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`- Total Requests in Report: ${filteredRequests.length}`, margin + 10, summaryY);
    summaryY += 15;
    doc.text(`- Status Filter: ${statusFilter || 'All'}`, margin + 10, summaryY);
    summaryY += 15;
    doc.text(`- Leave Type Filter: ${leaveTypeFilter || 'All'}`, margin + 10, summaryY);
    summaryY += 25;

    const tableColumns = ["ID", "Name", "Position", "Leave Type", "Date Range", "Days", "Status"];
    const tableRows = filteredRequests.map(req => [
        req.empId,
        req.name,
        req.position,
        req.leaveType,
        `${req.dateFrom} to ${req.dateTo}`,
        req.days,
        req.status
    ]);
    
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: summaryY,
      theme: 'grid',
      headStyles: { fillColor: [25, 135, 84], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
    });

    const finalTitle = `Leave_Requests_${generationDate.replace(/\//g, '-')}`;
    setReportTitle(finalTitle);
    setPdfDataUri(doc.output('datauristring'));
    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="container-fluid p-0 page-module-container">
        <div className="text-center p-5 bg-light rounded">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-0 page-module-container">
        <div className="text-center p-5 bg-light rounded">
          <p className="text-danger">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-main-title">Leave Management</h1>
        {/* CHANGED: Standardized the report button style */}
        <button className="btn btn-outline-secondary" onClick={handleGenerateReport} disabled={filteredRequests.length === 0}>
            <i className="bi bi-file-earmark-text-fill me-2"></i>Generate Report
        </button>
      </header>
      
      <div className="leave-status-bar">
        <div className={`status-filter-card filter-all ${!statusFilter || statusFilter === 'All' ? 'active' : ''}`} onClick={() => setStatusFilter('All')}>
            <span className="stat-value">{leaveStats.All}</span>
            <span className="stat-label">Total Requests</span>
        </div>
        <div className={`status-filter-card filter-pending ${statusFilter === 'Pending' ? 'active' : ''}`} onClick={() => setStatusFilter('Pending')}>
            <span className="stat-value">{leaveStats.Pending}</span>
            <span className="stat-label">Pending</span>
        </div>
        <div className={`status-filter-card filter-approved ${statusFilter === 'Approved' ? 'active' : ''}`} onClick={() => setStatusFilter('Approved')}>
            <span className="stat-value">{leaveStats.Approved}</span>
            <span className="stat-label">Approved</span>
        </div>
        <div className={`status-filter-card filter-declined ${statusFilter === 'Declined' ? 'active' : ''}`} onClick={() => setStatusFilter('Declined')}>
            <span className="stat-value">{leaveStats.Declined}</span>
            <span className="stat-label">Declined</span>
        </div>
        <div className={`status-filter-card filter-canceled ${statusFilter === 'Canceled' ? 'active' : ''}`} onClick={() => setStatusFilter('Canceled')}>
            <span className="stat-value">{leaveStats.Canceled}</span>
            <span className="stat-label">Canceled</span>
        </div>
      </div>
      
      <div className="controls-bar leave-controls-bar mb-4">
        <div className="filters-group">
            <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control" placeholder="Search by name, ID, or position..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="dropdown">
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {leaveTypeFilter || 'Filter by Leave Type'}
                </button>
                <ul className="dropdown-menu">
                    {uniqueLeaveTypes.map(type => (
                        <li key={type}><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setLeaveTypeFilter(type === 'All' ? '' : type); }}>{type}</a></li>
                    ))}
                </ul>
            </div>
        </div>
        <div className="leave-stat-item">
            <span className="stat-value">{employeesOnLeaveToday}</span>
            <span className="stat-label">On Leave Today</span>
        </div>
      </div>

      <div className="card data-table-card shadow-sm leave-table-container">
          <table className="table data-table mb-0 leave-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => requestSort('empId')}>ID {getSortIcon('empId')}</th>
                <th className="sortable" onClick={() => requestSort('name')}>Name {getSortIcon('name')}</th>
                <th className="sortable" onClick={() => requestSort('position')}>Position {getSortIcon('position')}</th>
                <th>Leave Type</th>
                <th className="sortable" onClick={() => requestSort('dateFrom')}>Date Range {getSortIcon('dateFrom')}</th>
                <th className="sortable text-center" onClick={() => requestSort('days')}>Days {getSortIcon('days')}</th>
                <th className="status-col">Status</th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => {
                  const isEditing = editingLeaveId === req.leaveId;
                  return (
                    <tr key={req.leaveId}>
                      <td>{req.empId}</td>
                      <td>{req.name}</td>
                      <td>{req.position}</td>
                      <td>{req.leaveType}</td>
                      <td>{req.dateFrom} to {req.dateTo}</td>
                      <td className="text-center">{req.days}</td>
                      <td className="status-col">
                        {isEditing ? (
                          <select 
                            className={`form-select form-select-sm status-select status-${tempStatus.toLowerCase()}`}
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Declined">Declined</option>
                            <option value="Canceled">Canceled</option>
                          </select>
                        ) : (
                          <span className={`status-badge status-${req.status?.toLowerCase()}`}>{req.status}</span>
                        )}
                      </td>
                      <td className="action-col">
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary" title="View Reason" onClick={() => handleViewReason(req)}>
                                <i className="bi bi-info-circle"></i>
                            </button>
                            {isEditing ? (
                                <>
                                    <button className="btn btn-sm btn-success" onClick={() => handleSaveStatus(req.leaveId)}>Save</button>
                                    <button className="btn btn-sm btn-light" onClick={handleCancelEdit}>Cancel</button>
                                </>
                            ) : (
                                <button className="btn btn-sm btn-primary" title="Edit Status" onClick={() => handleEditClick(req)}>
                                    <i className="bi bi-pencil-fill"></i>
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="8" className="text-center p-5">No leave requests found for the selected filters.</td></tr>
              )}
            </tbody>
          </table>
      </div>
      <ReportPreviewModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        pdfDataUri={pdfDataUri}
        reportTitle={reportTitle}
      />
      <ViewReasonModal
        show={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        request={viewingRequest}
      />
    </div>
  );
};

export default LeaveManagementPage;