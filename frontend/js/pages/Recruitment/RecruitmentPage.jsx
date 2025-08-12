import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import './RecruitmentPage.css';
import KanbanColumn from './KanbanColumn';
import AddApplicantModal from '../../modals/AddApplicantModal';
import ViewApplicantDetailsModal from '../../modals/ViewApplicantDetailsModal';
import ScheduleInterviewModal from '../../modals/ScheduleInterviewModal';
import HireApplicantModal from '../../modals/HireApplicantModal';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import Layout from '@/layout/Layout';

const PIPELINE_STAGES = ['New Applicant', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const ageDifMs = Date.now() - new Date(birthdate).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const RecruitmentPage = (props) => {
  // Defensive defaults for required props
  const jobOpenings = props.jobOpenings || [];
  const applicants = props.applicants || [];
  const positions = props.positions || [];
  const handlers = props.handlers || {};
  
  const [viewMode, setViewMode] = useState('board');
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showJobOpeningModal, setShowJobOpeningModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'applicationDate', direction: 'descending' });

  const jobOpeningsMap = useMemo(() => new Map(jobOpenings.map(job => [job.id, job.title])), [jobOpenings]);

  const filteredApplicants = useMemo(() => {
    let results = [...applicants];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    if (start || end) {
        results = results.filter(app => {
            const appDate = new Date(app.applicationDate);
            const updateDate = new Date(app.lastStatusUpdate);
            const inRange = (date) => (!start || date >= start) && (!end || date <= end);
            return inRange(appDate) || inRange(updateDate);
        });
    }
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        results = results.filter(app => app.name.toLowerCase().includes(lowerSearch) || app.email.toLowerCase().includes(lowerSearch));
    }
    results.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
    });
    return results;
  }, [applicants, searchTerm, startDate, endDate, sortConfig]);
  
  const stats = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    const inRange = (date) => (!start || date >= start) && (!end || date <= end);
    return {
        totalApplicants: filteredApplicants.length,
        newlyHired: filteredApplicants.filter(a => a.status === 'Hired' && inRange(new Date(a.lastStatusUpdate))).length,
        interviewsSet: filteredApplicants.filter(a => a.status === 'Interview' && inRange(new Date(a.lastStatusUpdate))).length
    };
  }, [filteredApplicants, startDate, endDate]);

  const dateRangeText = useMemo(() => {
    if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    if (startDate) return `From ${formatDate(startDate)}`;
    if (endDate) return `Until ${formatDate(endDate)}`;
    return 'All Time';
  }, [startDate, endDate]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const applicantId = parseInt(active.id, 10);
    const originalStatus = active.data.current?.applicant?.status;
    const newStatus = over.id;
    if (originalStatus && newStatus && originalStatus !== newStatus && PIPELINE_STAGES.includes(newStatus)) {
      handlers.updateApplicantStatus(applicantId, newStatus);
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; }
    setSortConfig({ key, direction });
  };
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up sort-icon ms-1"></i>;
    return sortConfig.direction === 'ascending' ? <i className="bi bi-sort-up sort-icon active ms-1"></i> : <i className="bi bi-sort-down sort-icon active ms-1"></i>;
  };
  
  const handleGenerateReport = () => {
    if (!filteredApplicants || filteredApplicants.length === 0) {
      alert("No data to generate a report for the current filters.");
      return;
    }
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    const inRange = (date) => (!start || date >= start) && (!end || date <= end);
    const reportData = {
        applied: filteredApplicants.filter(app => inRange(new Date(app.applicationDate))),
        hired: filteredApplicants.filter(app => app.status === 'Hired' && inRange(new Date(app.lastStatusUpdate))),
        rejected: filteredApplicants.filter(app => app.status === 'Rejected' && inRange(new Date(app.lastStatusUpdate))),
        interview: filteredApplicants.filter(app => app.status === 'Interview' && inRange(new Date(app.lastStatusUpdate))),
    };
    const doc = new jsPDF();
    const pageTitle = "Recruitment Activity Report";
    const dateRange = startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Time';
    let finalY = 0;
    doc.setFontSize(18); doc.text(pageTitle, 14, 22);
    doc.setFontSize(11); doc.text(`Date Range: ${dateRange}`, 14, 30);
    finalY = 35;
    const createSummarySection = (label, applicants) => {
        if (applicants.length === 0) return;
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        finalY += 10;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`${label} (${applicants.length})`, 14, finalY);
        finalY += 7;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        applicants.forEach(app => {
            if (finalY > 280) { doc.addPage(); finalY = 20; }
            doc.text(`- ${app.name} (Applied for: ${jobOpeningsMap.get(app.jobOpeningId) || 'N/A'})`, 20, finalY);
            finalY += 5;
        });
    };
    createSummarySection('New Applications Received', reportData.applied);
    createSummarySection('Applicants Moved to Interview', reportData.interview);
    createSummarySection('Applicants Hired', reportData.hired);
    createSummarySection('Applicants Rejected', reportData.rejected);
    finalY += 10;
    if (finalY > 260) { doc.addPage(); finalY = 20; }
    autoTable(doc, {
        head: [['Applicant', 'Job', 'Status', 'Applied On', 'Last Updated']],
        body: filteredApplicants.map(app => [
            app.name, jobOpeningsMap.get(app.jobOpeningId) || 'N/A', app.status,
            formatDate(app.applicationDate), formatDate(app.lastStatusUpdate, true)
        ]),
        startY: finalY
    });
    setPdfDataUri(doc.output('datauristring'));
    setShowReportModal(true);
  };

  const handleAction = (action, data) => {
    switch (action) {
      case 'view': setSelectedApplicant(data); setShowViewModal(true); break;
      case 'move': handlers.updateApplicantStatus(data.applicantId, data.newStatus); break;
      case 'scheduleInterview': setSelectedApplicant(data); setShowInterviewModal(true); break;
      case 'hire': setSelectedApplicant(data); setShowHireModal(true); break;
      case 'reject': if(window.confirm("Are you sure you want to reject this applicant?")) handlers.updateApplicantStatus(data.id, 'Rejected'); break;
      default: break;
    }
  };

  const renderBoardView = () => {
    const groupedApplicants = PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage] = filteredApplicants.filter(app => app.status === stage);
      return acc;
    }, {});
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="kanban-board-container">
          {PIPELINE_STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              id={stage}
              title={stage}
              applicants={groupedApplicants[stage]}
              jobOpeningsMap={jobOpeningsMap}
              onAction={handleAction}
            />
          ))}
        </div>
      </DndContext>
    );
  };

  const renderListView = () => (
    <div className="card data-table-card shadow-sm">
      <div className="table-responsive">
        <table className="table data-table mb-0">
          <thead>
            <tr>
              <th className="sortable" onClick={() => requestSort('name')}>Applicant {getSortIcon('name')}</th>
              <th>Gender</th><th>Age</th><th>Contact</th>
              <th className="sortable" onClick={() => requestSort('applicationDate')}>Applied On {getSortIcon('applicationDate')}</th>
              <th className="sortable" onClick={() => requestSort('lastStatusUpdate')}>Last Updated {getSortIcon('lastStatusUpdate')}</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.map(applicant => (
              <tr key={applicant.id}>
                <td><div>{applicant.name}</div><small className="text-muted">{jobOpeningsMap.get(applicant.jobOpeningId)}</small></td>
                <td>{applicant.gender}</td><td>{calculateAge(applicant.birthday)}</td>
                <td>{applicant.phone}</td><td>{formatDate(applicant.applicationDate)}</td>
                <td>{formatDate(applicant.lastStatusUpdate, true)}</td>
                <td><span className={`applicant-status-badge status-${applicant.status.replace(/\s+/g, '-').toLowerCase()}`}>{applicant.status}</span></td>
                <td>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Actions</button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><a className="dropdown-item" href="#" onClick={() => handleAction('view', applicant)}>View Details</a></li>
                      <li><a className="dropdown-item" href="#" onClick={() => handleAction('scheduleInterview', applicant)}>Schedule Interview</a></li>
                      <div className="dropdown-divider"></div>
                      <li><a className="dropdown-item text-success" href="#" onClick={() => handleAction('hire', applicant)}>Hire</a></li>
                      <li><a className="dropdown-item text-danger" href="#" onClick={() => handleAction('reject', applicant)}>Reject</a></li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
            {filteredApplicants.length === 0 && (<tr><td colSpan="8" className="text-center p-5">No applicants match your criteria.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-main-title">Recruitment Pipeline</h1>
        <div className="header-actions d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary" onClick={handleGenerateReport}><i className="bi bi-file-earmark-pdf-fill me-2"></i>Generate Report</button>
            <button className="btn btn-success" onClick={() => setShowApplicantModal(true)}><i className="bi bi-person-plus-fill me-2"></i>New Applicant</button>
        </div>
      </header>

      <div className="recruitment-stats-bar">
        <div className="recruitment-stat-card">
            <div className="stat-main">
                <div className="stat-icon icon-total-applicants"><i className="bi bi-people-fill"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{stats.totalApplicants}</span>
                    <span className="stat-label">Total Applicants</span>
                </div>
            </div>
            <div className="stat-period">{dateRangeText}</div>
        </div>
        <div className="recruitment-stat-card">
            <div className="stat-main">
                <div className="stat-icon icon-hired"><i className="bi bi-person-check-fill"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{stats.newlyHired}</span>
                    <span className="stat-label">Newly Hired</span>
                </div>
            </div>
            <div className="stat-period">{dateRangeText}</div>
        </div>
        <div className="recruitment-stat-card">
            <div className="stat-main">
                <div className="stat-icon icon-interviews-set"><i className="bi bi-calendar2-check-fill"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{stats.interviewsSet}</span>
                    <span className="stat-label">Interviews Set</span>
                </div>
            </div>
            <div className="stat-period">{dateRangeText}</div>
        </div>
      </div>
      
      <div className="recruitment-controls-bar">
        <div className="filters-group">
            <div className="input-group"><span className="input-group-text"><i className="bi bi-search"></i></span><input type="text" className="form-control" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
            <div className="input-group"><span className="input-group-text">From</span><input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div className="input-group"><span className="input-group-text">To</span><input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>
        <div className="actions-group">
            <div className="view-toggle-buttons btn-group">
                <button className={`btn btn-sm ${viewMode === 'board' ? 'active' : 'btn-outline-secondary'}`} onClick={() => setViewMode('board')} title="Board View"><i className="bi bi-kanban-fill"></i></button>
                <button className={`btn btn-sm ${viewMode === 'list' ? 'active' : 'btn-outline-secondary'}`} onClick={() => setViewMode('list')} title="List View"><i className="bi bi-list-task"></i></button>
            </div>
        </div>
      </div>
      
      {viewMode === 'board' ? renderBoardView() : renderListView()}

      {pdfDataUri && <ReportPreviewModal show={showReportModal} onClose={() => {setShowReportModal(false); setPdfDataUri('')}} pdfDataUri={pdfDataUri} reportTitle="Recruitment Activity Report" />}
      <AddApplicantModal show={showApplicantModal} onClose={() => setShowApplicantModal(false)} onSave={handlers.saveApplicant} jobOpenings={jobOpenings}/>
      {selectedApplicant && <ViewApplicantDetailsModal show={showViewModal} onClose={() => setShowViewModal(false)} applicant={selectedApplicant} jobTitle={jobOpeningsMap.get(selectedApplicant?.jobOpeningId)}/>}
      {selectedApplicant && <ScheduleInterviewModal show={showInterviewModal} onClose={() => setShowInterviewModal(false)} onSave={handlers.scheduleInterview} applicant={selectedApplicant}/>}
      {selectedApplicant && <HireApplicantModal show={showHireModal} onClose={() => setShowHireModal(false)} onHire={handlers.hireApplicant} applicant={selectedApplicant} positions={positions}/>}
    </div>
  );
};

export default RecruitmentPage;