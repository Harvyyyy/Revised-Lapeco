import React, { useState, useEffect, useMemo } from 'react';
import ReportHeader from './ReportHeader';
import EditableContributionTable from './EditableContributionTable';
import AddColumnModal from './AddColumnModal';
import ConfirmationModal from '../../modals/ConfirmationModal';
import ContributionsHistoryTab from './ContributionsHistoryTab';
import FinalizedReportPlaceholder from './FinalizedReportPlaceholder';
import ToastNotification from '../../common/ToastNotification';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import useReportGenerator from '../../hooks/useReportGenerator';
import { generateSssData, generatePhilhealthData, generatePagibigData, generateTinData } from '../../hooks/contributionUtils';
import ContributionTypeToggle from './ContributionTypeToggle';
import SssTab from './SssTab';
import PhilhealthTab from './PhilhealthTab';
import PagibigTab from './PagibigTab';
import TinTab from './TinTab';
import './ContributionsManagement.css';

const MONTHS = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' },
];

const ContributionsManagementPage = ({ employees, positions, payrolls, theme }) => {
  const [mainTab, setMainTab] = useState('current');
  const [activeReport, setActiveReport] = useState('sss');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [reportTitle, setReportTitle] = useState('');
  const [headerData, setHeaderData] = useState({});
  const [archivedReports, setArchivedReports] = useState(mockData.initialArchivedContributions);
  
  const { generateReport, pdfDataUri, isLoading, setPdfDataUri } = useReportGenerator(theme);
  const [showReportPreview, setShowReportPreview] = useState(false);

  const [editingHeaderKey, setEditingHeaderKey] = useState(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [confirmationModalState, setConfirmationModalState] = useState({
    isOpen: false, title: '', body: '', onConfirm: () => {},
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const uniqueYears = useMemo(() => {
    const years = new Set((payrolls || []).map(run => new Date(run.cutOff.split(' to ')[0]).getFullYear()));
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [payrolls]);

  const { payroll1, payroll2, isProvisional, missingPeriodCutoff } = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;

    // Use UTC dates to build exact cutoff strings to avoid timezone shifts
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;

    const firstHalfStart = new Date(Date.UTC(prevMonthYear, prevMonth, 26)).toISOString().split('T')[0];
    const firstHalfEnd = new Date(Date.UTC(year, month, 10)).toISOString().split('T')[0];
    const firstHalfCutoff = `${firstHalfStart} to ${firstHalfEnd}`;

    const secondHalfStart = new Date(Date.UTC(year, month, 11)).toISOString().split('T')[0];
    const secondHalfEnd = new Date(Date.UTC(year, month, 25)).toISOString().split('T')[0];
    const secondHalfCutoff = `${secondHalfStart} to ${secondHalfEnd}`;
    
    // Find payrolls that match these exact strings
    const p1 = (payrolls || []).find(p => p.cutOff === firstHalfCutoff);
    const p2 = (payrolls || []).find(p => p.cutOff === secondHalfCutoff);

    const isProv = (p1 || p2) && !(p1 && p2);
    
    let missingCutoff = '';
    if (isProv) {
      missingCutoff = !p1 ? firstHalfCutoff : secondHalfCutoff;
    }

    return { payroll1: p1, payroll2: p2, isProvisional: isProv, missingPeriodCutoff: missingCutoff };
  }, [selectedYear, selectedMonth, payrolls]);

  const aggregatedMonthlyRecords = useMemo(() => {
    if (!payroll1 && !payroll2) return [];

    const employeeRecords = new Map();
    const payrollsToProcess = [payroll1, payroll2].filter(Boolean);

    payrollsToProcess.forEach(run => {
      (run.records || []).forEach(record => {
        if (!employeeRecords.has(record.empId)) {
          employeeRecords.set(record.empId, {
            empId: record.empId,
            totalGross: 0,
            totalTaxable: 0,
            totalTaxWithheld: 0,
          });
        }
        const empRecord = employeeRecords.get(record.empId);
        const gross = (record.earnings || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const contributions = (record.deductions?.sss || 0) + (record.deductions?.philhealth || 0) + (record.deductions?.hdmf || 0);
        
        empRecord.totalGross += gross;
        empRecord.totalTaxable += (gross - contributions);
        empRecord.totalTaxWithheld += (record.deductions?.tax || 0);
      });
    });

    return Array.from(employeeRecords.values());
  }, [payroll1, payroll2]);

  const isCurrentMonthArchived = useMemo(() => {
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;
    if (!monthLabel) return false;
    const monthStr = `${monthLabel} ${selectedYear}`;
    
    const finalizedForMonth = archivedReports.filter(r => r.payPeriod === monthStr);
    const requiredTypes = new Set(['SSS', 'PhilHealth', 'Pag-IBIG', 'TIN']);
    finalizedForMonth.forEach(r => requiredTypes.delete(r.type));
    
    return requiredTypes.size === 0;

  }, [selectedMonth, selectedYear, archivedReports]);


  useEffect(() => {
    if (aggregatedMonthlyRecords.length === 0) {
      setColumns([]); setRows([]); setReportTitle('No Data'); setHeaderData({});
      return;
    };

    const monthDate = new Date(selectedYear, selectedMonth, 1);
    let data;
    if (activeReport === 'pagibig') data = generatePagibigData(employees, aggregatedMonthlyRecords, monthDate, isProvisional);
    else if (activeReport === 'philhealth') data = generatePhilhealthData(employees, aggregatedMonthlyRecords, monthDate, isProvisional);
    else if (activeReport === 'tin') data = generateTinData(employees, aggregatedMonthlyRecords, monthDate);
    else data = generateSssData(employees, aggregatedMonthlyRecords, monthDate, isProvisional);
    
    setColumns(data.columns);
    setRows(data.rows);
    setReportTitle(data.title);
    setHeaderData(data.headerData);
  }, [activeReport, aggregatedMonthlyRecords, employees, selectedYear, selectedMonth, isProvisional]);

  const stats = useMemo(() => {
    if (aggregatedMonthlyRecords.length === 0 || isCurrentMonthArchived) {
      return { sss: 0, philhealth: 0, pagibig: 0, tin: 0 };
    }
    
    const calculateTotal = (data, key = 'totalContribution') => data.rows.reduce((acc, row) => acc + (row[key] || 0), 0);
    const monthDate = new Date(selectedYear, selectedMonth, 1);
    
    const sssTotal = calculateTotal(generateSssData(employees, aggregatedMonthlyRecords, monthDate, isProvisional));
    const philhealthTotal = calculateTotal(generatePhilhealthData(employees, aggregatedMonthlyRecords, monthDate, isProvisional));
    const pagibigTotal = calculateTotal(generatePagibigData(employees, aggregatedMonthlyRecords, monthDate, isProvisional));
    const tinTotal = calculateTotal(generateTinData(employees, aggregatedMonthlyRecords, monthDate), 'taxWithheld');

    return { sss: sssTotal, philhealth: philhealthTotal, pagibig: pagibigTotal, tin: tinTotal };
  }, [aggregatedMonthlyRecords, employees, selectedYear, selectedMonth, isCurrentMonthArchived, isProvisional]);
  
  const handleExportPdf = () => {
    if (!payroll1 && !payroll2) return;
    generateReport('contributions_summary', { runId: (payroll1 || payroll2).runId }, { employees, positions, payrolls: [payroll1, payroll2].filter(Boolean) });
    setShowReportPreview(true);
  };
  
  const handleArchivePeriod = () => {
    if (!payroll1 || !payroll2) return;
    const monthDate = new Date(selectedYear, selectedMonth, 1);
    const sssData = generateSssData(employees, aggregatedMonthlyRecords, monthDate, false);
    const philhealthData = generatePhilhealthData(employees, aggregatedMonthlyRecords, monthDate, false);
    const pagibigData = generatePagibigData(employees, aggregatedMonthlyRecords, monthDate, false);
    const tinData = generateTinData(employees, aggregatedMonthlyRecords, monthDate);
    const reportsToArchive = [
        { ...sssData, type: 'SSS' }, { ...philhealthData, type: 'PhilHealth' },
        { ...pagibigData, type: 'Pag-IBIG' }, { ...tinData, type: 'TIN' }
    ];
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;

    const newArchives = reportsToArchive.map(report => ({
      id: `ARCHIVE-${report.type}-${Date.now()}`, type: report.type,
      payPeriod: `${monthLabel} ${selectedYear}`, generationDate: new Date().toISOString(),
      generatedBy: 'Grace Field', columns: report.columns, rows: report.rows, headerData: report.headerData,
    }));
    setArchivedReports(prev => [...prev.filter(r => r.payPeriod !== `${monthLabel} ${selectedYear}`), ...newArchives]);
    setToast({ show: true, message: `Reports for ${monthLabel} ${selectedYear} have been finalized.`, type: 'success' });
    setMainTab('history');
  };

  const handleCellChange = (rowIndex, columnKey, value) => setRows(prev => prev.map((row, i) => i === rowIndex ? { ...row, [columnKey]: value } : row));
  const handleAddColumn = (columnName) => {
    const newColumnKey = columnName.trim().toLowerCase().replace(/\s+/g, '_') + `_${Date.now()}`;
    setColumns([...columns, { key: newColumnKey, label: columnName, editable: true, isPermanent: false }]);
    setRows(rows.map(row => ({ ...row, [newColumnKey]: '' })));
  };
  const handleDeleteColumn = (keyToDelete) => setConfirmationModalState({
    isOpen: true, title: 'Delete Column', body: `Are you sure you want to permanently delete the "${columns.find(c => c.key === keyToDelete)?.label}" column?`,
    onConfirm: () => {
      setColumns(prev => prev.filter(col => col.key !== keyToDelete));
      setRows(prevRows => prevRows.map(row => {
        const newRow = { ...row }; delete newRow[keyToDelete]; return newRow;
      }));
      closeConfirmationModal();
    }
  });
  const handleAddRow = () => setRows(prev => [...prev, columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {})]);
  const handleDeleteRow = (rowIndex) => setConfirmationModalState({
    isOpen: true, title: 'Delete Row', body: `Are you sure you want to permanently delete this row?`,
    onConfirm: () => {
      setRows(prev => prev.filter((_, index) => index !== rowIndex));
      closeConfirmationModal();
    }
  });
  const closeConfirmationModal = () => setConfirmationModalState({ isOpen: false });
  const handleHeaderClick = (key) => setEditingHeaderKey(key);
  const handleColumnHeaderChange = (columnKey, newLabel) => setColumns(prev => prev.map(col => col.key === columnKey ? { ...col, label: newLabel } : col));
  const formatCurrency = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const handleClosePreview = () => { setShowReportPreview(false); if(pdfDataUri) { URL.revokeObjectURL(pdfDataUri); } setPdfDataUri(''); };
  const handleDeleteFinalizedPeriod = () => {};
  const handleViewHistoryPdf = () => {};

  const commonTableProps = {
    columns, rows, reportTitle, onCellChange: handleCellChange,
    onAddRow: handleAddRow, onDeleteRow: handleDeleteRow,
    onAddColumn: () => setShowAddColumnModal(true), onDeleteColumn: handleDeleteColumn,
    onHeaderClick: handleHeaderClick, onHeaderChange: handleColumnHeaderChange,
    editingHeaderKey,
  };

  return (
    <div className="container-fluid p-0 page-module-container">
       {toast.show && ( <ToastNotification toast={toast} onClose={() => setToast({ ...toast, show: false })} /> )}
      <header className="page-header mb-4"><h1 className="page-main-title">Contributions Management</h1><p className="text-muted">Generate, edit, and archive monthly contribution reports.</p></header>
      <ul className="nav nav-tabs contributions-main-tabs">
        <li className="nav-item"><button className={`nav-link ${mainTab === 'current' ? 'active' : ''}`} onClick={() => setMainTab('current')}>Current Report</button></li>
        <li className="nav-item"><button className={`nav-link ${mainTab === 'history' ? 'active' : ''}`} onClick={() => setMainTab('history')}>Finalized Reports</button></li>
      </ul>
      {mainTab === 'current' ? (
        <div className="tab-pane-content">
          <div className="contribution-stats-grid">
            <div className="stat-card-contribution sss-card"><div className="stat-icon"><i className="bi bi-building-fill-check"></i></div><div className="stat-info"><div className="stat-value">₱{formatCurrency(stats.sss)}</div><div className="stat-label">Total SSS{isProvisional && ' (Provisional)'}</div></div></div>
            <div className="stat-card-contribution philhealth-card"><div className="stat-icon"><i className="bi bi-heart-pulse-fill"></i></div><div className="stat-info"><div className="stat-value">₱{formatCurrency(stats.philhealth)}</div><div className="stat-label">Total PhilHealth{isProvisional && ' (Provisional)'}</div></div></div>
            <div className="stat-card-contribution pagibig-card"><div className="stat-icon"><i className="bi bi-house-heart-fill"></i></div><div className="stat-info"><div className="stat-value">₱{formatCurrency(stats.pagibig)}</div><div className="stat-label">Total Pag-IBIG{isProvisional && ' (Provisional)'}</div></div></div>
            <div className="stat-card-contribution"><div className="stat-icon" style={{backgroundColor: '#6f42c1'}}><i className="bi bi-file-earmark-person-fill"></i></div><div className="stat-info"><div className="stat-value">₱{formatCurrency(stats.tin)}</div><div className="stat-label">Total Tax Withheld{isProvisional && ' (Provisional)'}</div></div></div>
          </div>
          <div className="card shadow-sm">
            <ReportHeader
              title={`Contributions for`}
              availableYears={uniqueYears} selectedYear={selectedYear} selectedMonth={selectedMonth}
              onYearChange={setSelectedYear} onMonthChange={setSelectedMonth}
              onArchive={handleArchivePeriod} isArchived={isCurrentMonthArchived || isProvisional}
              onExportPdf={handleExportPdf} columns={columns} rows={rows} headerData={headerData}
            />
            <div className="card-body">
              {isProvisional && aggregatedMonthlyRecords.length > 0 && (
                <div className="alert alert-warning">
                  <strong>Provisional Data:</strong> The figures shown are based on an incomplete monthly payroll. Contributions will adjust once the <strong>{missingPeriodCutoff}</strong> pay period is generated.
                </div>
              )}
              <ContributionTypeToggle activeReport={activeReport} onSelectReport={setActiveReport} />
              {isCurrentMonthArchived ? <FinalizedReportPlaceholder onNavigate={() => setMainTab('history')} reportInfo={{ payPeriod: `${MONTHS[selectedMonth].label} ${selectedYear}` }} />
               : aggregatedMonthlyRecords.length === 0 ? <div className="text-center p-5 bg-light rounded mt-3"><i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3 d-block"></i><h4 className="text-muted">Incomplete Payroll Data</h4><p className="text-muted">At least one semi-monthly payroll for the selected month must be generated before contributions can be calculated.</p></div>
               : <>
                  {activeReport === 'sss' && <SssTab {...commonTableProps} />}
                  {activeReport === 'philhealth' && <PhilhealthTab {...commonTableProps} />}
                  {activeReport === 'pagibig' && <PagibigTab {...commonTableProps} />}
                  {activeReport === 'tin' && <TinTab {...commonTableProps} />}
                 </>
              }
            </div>
          </div>
        </div>
      ) : (
        <div className="tab-pane-content">
          <ContributionsHistoryTab archivedReports={archivedReports} onDeletePeriod={handleDeleteFinalizedPeriod} onView={handleViewHistoryPdf} />
        </div>
      )}
      
      {(isLoading || pdfDataUri) && (
        <ReportPreviewModal
          show={showReportPreview}
          onClose={handleClosePreview}
          pdfDataUri={pdfDataUri}
          reportTitle="Consolidated Contributions Report"
        />
      )}

      <AddColumnModal show={showAddColumnModal} onClose={() => setShowAddColumnModal(false)} onAdd={handleAddColumn} />
      <ConfirmationModal show={confirmationModalState.isOpen} onClose={closeConfirmationModal} onConfirm={confirmationModalState.onConfirm} title={confirmationModalState.title} confirmText="Yes, Delete" confirmVariant="danger"><p>{confirmationModalState.body}</p></ConfirmationModal>
    </div>
  );
};

export default ContributionsManagementPage;