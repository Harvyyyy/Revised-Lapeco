import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { startOfDay, endOfDay, isPast, isFuture, parseISO } from 'date-fns';
import Select from 'react-select';
import './PerformanceManagement.css';

// Component Imports
import AddEditPeriodModal from '../../modals/AddEditPeriodModal';
import ViewEvaluationModal from '../../modals/ViewEvaluationModal';
import ScoreIndicator from './ScoreIndicator';
import PerformanceReportModal from '../../modals/PerformanceReportModal';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import useReportGenerator from '../../hooks/useReportGenerator';
import ConfirmationModal from '../../modals/ConfirmationModal';
import PeriodCard from './PeriodCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PerformanceManagementPage = ({ kras, kpis, positions, employees, evaluations, handlers, evaluationFactors, theme, evaluationPeriods }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [periodToDelete, setPeriodToDelete] = useState(null);

  const [viewingEvaluation, setViewingEvaluation] = useState(null);
  const [showReportConfigModal, setShowReportConfigModal] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);

  // Filters for Overview Tab
  const [periodFilter, setPeriodFilter] = useState({ value: 'all', label: 'All Time' });
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySortConfig, setHistorySortConfig] = useState({ key: 'evaluationDate', direction: 'descending' });
  
  // Filters for Manage Periods Tab
  const [periodSearchTerm, setPeriodSearchTerm] = useState('');
  const [periodStatusFilter, setPeriodStatusFilter] = useState('all');

  const { generateReport, pdfDataUri, isLoading, setPdfDataUri } = useReportGenerator();
  const navigate = useNavigate();

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p.title])), [positions]);
  
  const evaluationCountsByPeriod = useMemo(() => {
    const counts = {};
    for (const period of evaluationPeriods) {
      const start = startOfDay(parseISO(period.evaluationStart));
      const end = endOfDay(parseISO(period.evaluationEnd));
      counts[period.id] = evaluations.filter(ev => {
        const evalDate = parseISO(ev.periodEnd);
        return evalDate >= start && evalDate <= end;
      }).length;
    }
    return counts;
  }, [evaluationPeriods, evaluations]);

  const sortedEvaluationPeriods = useMemo(() => 
    [...evaluationPeriods].sort((a,b) => new Date(b.periodStart) - new Date(a.periodStart))
  , [evaluationPeriods]);

  const periodOptions = useMemo(() => [
    { value: 'all', label: 'All Time' },
    ...sortedEvaluationPeriods.map(p => ({ value: p.id, label: p.name }))
  ], [sortedEvaluationPeriods]);

  const filteredEvaluations = useMemo(() => {
    let evals = [...evaluations];

    if (periodFilter.value !== 'all') {
      const selectedPeriod = evaluationPeriods.find(p => p.id === Number(periodFilter.value));
      if (selectedPeriod) {
        const start = startOfDay(parseISO(selectedPeriod.evaluationStart));
        const end = endOfDay(parseISO(selectedPeriod.evaluationEnd));
        evals = evals.filter(ev => {
            const evalDate = parseISO(ev.periodEnd);
            return evalDate >= start && evalDate <= end;
        });
      }
    }
    
    if (historySearchTerm) {
      const lowerSearch = historySearchTerm.toLowerCase();
      evals = evals.filter(ev => {
        const emp = employeeMap.get(ev.employeeId);
        const evaluator = employeeMap.get(ev.evaluatorId);
        return emp?.name.toLowerCase().includes(lowerSearch) || evaluator?.name.toLowerCase().includes(lowerSearch);
      });
    }

    evals.sort((a, b) => {
      const key = historySortConfig.key;
      const direction = historySortConfig.direction === 'ascending' ? 1 : -1;
      let valA, valB;
      if (key === 'employeeName') {
        valA = employeeMap.get(a.employeeId)?.name || '';
        valB = employeeMap.get(b.employeeId)?.name || '';
      } else if (key === 'evaluatorName') {
        valA = employeeMap.get(a.evaluatorId)?.name || '';
        valB = employeeMap.get(b.evaluatorId)?.name || '';
      } else {
        valA = a[key]; valB = b[key];
      }
      if (typeof valA === 'string') return valA.localeCompare(valB) * direction;
      if (typeof valA === 'number') return (valA - valB) * direction;
      return (new Date(valB) - new Date(valA)) * direction;
    });
    return evals;
  }, [evaluations, periodFilter, evaluationPeriods, historySearchTerm, historySortConfig, employeeMap]);

  const getPeriodStatusValue = (period) => {
    const today = startOfDay(new Date());
    const start = startOfDay(parseISO(period.activationStart));
    const end = endOfDay(parseISO(period.activationEnd));
    if (today >= start && today <= end) return 'active';
    if (isFuture(start)) return 'upcoming';
    if (isPast(end)) return 'closed';
    return 'unknown';
  };

  const filteredAndSortedPeriods = useMemo(() => {
    let periods = [...sortedEvaluationPeriods];
    if (periodStatusFilter !== 'all') {
      periods = periods.filter(p => getPeriodStatusValue(p) === periodStatusFilter);
    }
    if (periodSearchTerm) {
      const lowerSearch = periodSearchTerm.toLowerCase();
      periods = periods.filter(p => p.name.toLowerCase().includes(lowerSearch));
    }
    return periods;
  }, [sortedEvaluationPeriods, periodSearchTerm, periodStatusFilter]);
  
  const dashboardStats = useMemo(() => {
    const totalEvals = filteredEvaluations.length;
    if (totalEvals === 0) return { totalEvals, avgScore: 0 };
    const avgScore = filteredEvaluations.reduce((sum, ev) => sum + ev.overallScore, 0) / totalEvals;
    return { totalEvals, avgScore };
  }, [filteredEvaluations]);

  const performanceBrackets = useMemo(() => {
    const brackets = { 'Needs Improvement': 0, 'Meets Expectations': 0, 'Outstanding': 0 };
    filteredEvaluations.forEach(ev => {
      if (ev.overallScore < 70) brackets['Needs Improvement']++;
      else if (ev.overallScore < 90) brackets['Meets Expectations']++;
      else brackets['Outstanding']++;
    });
    return brackets;
  }, [filteredEvaluations]);

  const chartTextColor = theme === 'dark' ? '#adb5bd' : '#6c757d';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const chartData = {
    labels: Object.keys(performanceBrackets),
    datasets: [{
      label: 'Number of Employees',
      data: Object.values(performanceBrackets),
      backgroundColor: ['#dc3545', '#ffc107', '#198754'],
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#212529' : '#ffffff',
        titleColor: theme === 'dark' ? '#f8f9fa' : '#212529',
        bodyColor: theme === 'dark' ? '#f8f9fa' : '#212529',
        borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
        borderWidth: 1,
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: chartTextColor }, grid: { color: gridColor } },
      x: { ticks: { color: chartTextColor }, grid: { display: false } },
    },
  };

  const getSortIcon = (key) => {
    if (historySortConfig.key !== key) return <i className="bi bi-arrow-down-up sort-icon ms-1 opacity-25"></i>;
    return historySortConfig.direction === 'ascending' ? <i className="bi bi-sort-up sort-icon active ms-1"></i> : <i className="bi bi-sort-down sort-icon active ms-1"></i>;
  };

  const handleViewEvaluation = (evaluation) => setViewingEvaluation(evaluation);
  const handleGenerateReport = () => setShowReportConfigModal(true);

  const handleRunReport = (params) => {
    generateReport('performance_summary', { startDate: params.startDate, endDate: params.endDate }, { employees, positions, evaluations });
    setShowReportConfigModal(false);
    setShowReportPreview(true);
  };

  const handleCloseReportPreview = () => {
    setShowReportPreview(false);
    if (pdfDataUri) URL.revokeObjectURL(pdfDataUri);
    setPdfDataUri('');
  };

  const requestHistorySort = (key) => {
    let direction = 'ascending';
    if (historySortConfig.key === key && historySortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setHistorySortConfig({ key, direction });
  };
  
  const handleOpenPeriodModal = (period = null) => {
    setEditingPeriod(period);
    setShowPeriodModal(true);
  }
  
  const handleConfirmDeletePeriod = () => {
    if (periodToDelete) {
      handlers.deleteEvaluationPeriod(periodToDelete.id);
      setPeriodToDelete(null);
    }
  };

  const handleViewResultsForPeriod = (period) => {
    setPeriodFilter({ value: period.id, label: period.name });
    setActiveTab('overview');
  };

  const modalProps = useMemo(() => {
    if (!viewingEvaluation) return null;
    const employee = employeeMap.get(viewingEvaluation.employeeId);
    const position = employee ? positions.find(p => p.id === employee.positionId) : null;
    return { evaluation: viewingEvaluation, employee, position };
  }, [viewingEvaluation, employeeMap, positions]);

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header mb-4">
        <h1 className="page-main-title">Performance Management</h1>
      </header>
      
      <ul className="nav nav-tabs performance-nav-tabs mb-4">
        <li className="nav-item">
            <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                Overview
            </button>
        </li>
        <li className="nav-item">
            <button className={`nav-link ${activeTab === 'periods' ? 'active' : ''}`} onClick={() => setActiveTab('periods')}>
                Manage Periods
            </button>
        </li>
      </ul>

      <div className="performance-content">
        {activeTab === 'overview' && (
            <div className="performance-dashboard-layout-revised">
                <div className="stat-card-grid-revised">
                    <div className="stat-card-revised">
                        <div className="stat-icon"><i className="bi bi-journal-check"></i></div>
                        <div className="stat-info">
                            <div className="stat-value">{dashboardStats.totalEvals}</div>
                            <div className="stat-label">Evaluations in Period</div>
                        </div>
                    </div>
                    <div className="stat-card-revised">
                        <div className="stat-icon"><i className="bi bi-reception-4"></i></div>
                        <div className="stat-info">
                            <div className="stat-value">{dashboardStats.avgScore.toFixed(1)}<strong>%</strong></div>
                            <div className="stat-label">Average Score in Period</div>
                        </div>
                    </div>
                </div>

                <div className="analysis-grid-full-width">
                    <div className="card">
                    <div className="card-header"><h6><i className="bi bi-bar-chart-line-fill me-2"></i>Performance Distribution</h6></div>
                    <div className="card-body" style={{ height: '280px' }}><Bar data={chartData} options={chartOptions} /></div>
                    </div>
                </div>

                <div className="card dashboard-history-table">
                    <div className="history-table-controls">
                        <h6><i className="bi bi-clock-history me-2"></i>Evaluation History</h6>
                        <div className='d-flex align-items-center gap-2'>
                          <button className="btn btn-outline-secondary text-nowrap" onClick={handleGenerateReport}>
                            <i className="bi bi-file-earmark-pdf-fill me-1"></i>Generate Report
                          </button>
                          <div className="input-group flex-grow-1">
                              <label className="input-group-text">Filter by Period</label>
                              <Select
                                options={periodOptions}
                                value={periodFilter}
                                onChange={setPeriodFilter}
                                className="react-select-container flex-grow-1"
                                classNamePrefix="react-select"
                              />
                          </div>
                          <div className="input-group">
                              <span className="input-group-text"><i className="bi bi-search"></i></span>
                              <input type="text" className="form-control" placeholder="Search by name..." value={historySearchTerm} onChange={e => setHistorySearchTerm(e.target.value)} />
                          </div>
                        </div>
                    </div>
                    <div className="table-responsive">
                    <table className="table data-table mb-0 align-middle">
                        <thead>
                        <tr>
                            <th className="sortable" onClick={() => requestHistorySort('employeeName')}>Employee {getSortIcon('employeeName')}</th>
                            <th className="sortable" onClick={() => requestHistorySort('evaluatorName')}>Evaluator {getSortIcon('evaluatorName')}</th>
                            <th className="sortable" onClick={() => requestHistorySort('periodEnd')}>Period {getSortIcon('periodEnd')}</th>
                            <th className="sortable" onClick={() => requestHistorySort('evaluationDate')}>Date Submitted {getSortIcon('evaluationDate')}</th>
                            <th className="sortable" onClick={() => requestHistorySort('overallScore')}>Score {getSortIcon('overallScore')}</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredEvaluations.length > 0 ? filteredEvaluations.map(ev => {
                            const employee = employeeMap.get(ev.employeeId);
                            const evaluator = employeeMap.get(ev.evaluatorId);
                            return (
                            <tr key={ev.id}>
                                <td>
                                <div className='d-flex align-items-center'>
                                    <img src={employee?.imageUrl} alt={employee?.name} size='sm' className='avatar-table me-2' />
                                    <div>
                                    <div className='fw-bold'>{employee?.name || 'Unknown'}</div>
                                    <small className='text-muted'>{positionMap.get(employee?.positionId) || 'N/A'}</small>
                                    </div>
                                </div>
                                </td>
                                <td>{evaluator?.name || 'N/A'}</td>
                                <td>{ev.periodStart} to {ev.periodEnd}</td>
                                <td>{ev.evaluationDate}</td>
                                <td><ScoreIndicator score={ev.overallScore} /></td>
                                <td><button className="btn btn-sm btn-outline-secondary" onClick={() => handleViewEvaluation(ev)}>View</button></td>
                            </tr>
                            )
                        }) : (
                            <tr><td colSpan="6" className="text-center p-4">No evaluations found for the selected period.</td></tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'periods' && (
            <div>
              <div className="period-controls-bar">
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by period name..."
                    value={periodSearchTerm}
                    onChange={e => setPeriodSearchTerm(e.target.value)}
                  />
                </div>
                <div className="btn-group" role="group">
                  <button type="button" className={`btn ${periodStatusFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPeriodStatusFilter('all')}>All</button>
                  <button type="button" className={`btn ${periodStatusFilter === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPeriodStatusFilter('active')}>Active</button>
                  <button type="button" className={`btn ${periodStatusFilter === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPeriodStatusFilter('upcoming')}>Upcoming</button>
                  <button type="button" className={`btn ${periodStatusFilter === 'closed' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPeriodStatusFilter('closed')}>Closed</button>
                </div>
                <button className="btn btn-success" onClick={() => handleOpenPeriodModal()}>
                    <i className="bi bi-plus-lg me-2"></i>Add New Period
                </button>
              </div>
              <div className="periods-grid-container">
                {filteredAndSortedPeriods.length > 0 ? filteredAndSortedPeriods.map(period => (
                  <PeriodCard 
                    key={period.id}
                    period={period}
                    evaluationsCount={evaluationCountsByPeriod[period.id] || 0}
                    onEdit={() => handleOpenPeriodModal(period)}
                    onDelete={() => setPeriodToDelete(period)}
                    onViewResults={() => handleViewResultsForPeriod(period)}
                  />
                )) : (
                  <div className="text-center p-5 bg-light rounded w-100">
                    <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                    <h5 className="text-muted">No Evaluation Periods Found</h5>
                    <p className="text-muted">Try adjusting your filters or add a new period.</p>
                  </div>
                )}
              </div>
            </div>
        )}
      </div>

      <AddEditPeriodModal
        show={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        onSave={handlers.saveEvaluationPeriod}
        periodData={editingPeriod}
      />
      
      <ConfirmationModal
        show={!!periodToDelete}
        onClose={() => setPeriodToDelete(null)}
        onConfirm={handleConfirmDeletePeriod}
        title="Confirm Period Deletion"
        confirmVariant="danger"
        confirmText="Yes, Delete"
      >
        <p>Are you sure you want to delete the evaluation period "<strong>{periodToDelete?.name}</strong>"?</p>
        <p className="text-danger">This action cannot be undone and may disassociate historical evaluations from this period.</p>
      </ConfirmationModal>

      {modalProps && (
        <ViewEvaluationModal
          show={!!viewingEvaluation}
          onClose={() => setViewingEvaluation(null)}
          evaluation={modalProps.evaluation}
          employee={modalProps.employee}
          position={modalProps.position}
          evaluationFactors={evaluationFactors}
        />
      )}

      <PerformanceReportModal show={showReportConfigModal} onClose={() => setShowReportConfigModal(false)} onGenerate={handleRunReport} />

      {(isLoading || pdfDataUri) && (
        <ReportPreviewModal
          show={showReportPreview}
          onClose={handleCloseReportPreview}
          pdfDataUri={pdfDataUri}
          reportTitle="Performance Summary Report"
        />
      )}
    </div>
  );
};

export default PerformanceManagementPage;