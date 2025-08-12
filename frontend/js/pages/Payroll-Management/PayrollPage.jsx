import React, { useState, useMemo } from 'react';
import './PayrollPage.css';
import PayrollAdjustmentModal from '../../modals/PayrollAdjustmentModal';
import GeneratePayrollModal from '../../modals/GeneratePayrollModal';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from '@/layout/Layout';

const formatCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const initialPayrollRecords = [
    { payrollId: 'PAY001', empId: 'EMP001', employeeName: 'Alice Johnson', cutOff: '2023-10-01 to 2023-10-15', hoursWorked: 120, basicSalary: 20000.00, regularOT: 1500.00, netPay: 19700.00, payrollDate: '2023-10-20', status: 'Paid', tax: 1918.70, sss: 581.30, philhealth: 400, hdmf: 100, absents: 1333.33, lates: 250.00, undertime: 120.00, },
    { payrollId: 'PAY002', empId: 'EMP002', employeeName: 'Bob Smith', cutOff: '2023-10-01 to 2023-10-15', hoursWorked: 116, basicSalary: 25000.00, regularOT: 0.00, netPay: 20700.00, payrollDate: '2023-10-20', status: 'Paid', tax: 2500.00, sss: 700.00, philhealth: 500, hdmf: 100, absents: 0, lates: 0, undertime: 0, },
    { payrollId: 'PAY003', empId: 'EMP003', employeeName: 'Carol White', cutOff: '2023-10-16 to 2023-10-31', hoursWorked: 128, basicSalary: 18000.00, regularOT: 500.00, netPay: 17450.00, payrollDate: '2023-11-05', status: 'Pending', tax: 1500.00, sss: 550.00, philhealth: 350, hdmf: 100, absents: 0, lates: 0, undertime: 0, },
    { payrollId: 'PAY004', empId: 'EMP001', employeeName: 'Alice Johnson', cutOff: '2023-10-16 to 2023-10-31', hoursWorked: 120, basicSalary: 20000.00, regularOT: 0.00, netPay: 18250.00, payrollDate: '2023-11-05', status: 'Paid', tax: 1500.00, sss: 550.00, philhealth: 350, hdmf: 100, absents: 0, lates: 0, undertime: 0, },
];

const PayrollGroup = ({ group, onAdjustClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'empId', direction: 'ascending' });
  const [recordFilter, setRecordFilter] = useState('All');
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up sort-icon ms-1"></i>;
    return sortConfig.direction === 'ascending' ? <i className="bi bi-sort-up sort-icon active ms-1"></i> : <i className="bi bi-sort-down sort-icon active ms-1"></i>;
  };
  
  const sortedAndFilteredRecords = useMemo(() => {
    let records = [...group.records];
    if (recordFilter !== 'All') {
      records = records.filter(r => r.status === recordFilter);
    }
    if (sortConfig.key) {
      records.sort((a, b) => {
        const valA = a[sortConfig.key] || ''; const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return records;
  }, [group.records, sortConfig, recordFilter]);

  const calculateRowTotals = (p) => {
    const grossPay = (p.basicSalary || 0) + (p.regularOT || 0) + (p.holidayPay || 0) + (p.allowances || 0) + (p.bonuses || 0) + (p.otherEarnings || 0);
    const deductions = (p.tax || 0) + (p.sss || 0) + (p.philhealth || 0) + (p.hdmf || 0) + (p.loans || 0) + (p.cashAdvance || 0) + (p.absents || 0) + (p.lates || 0) + (p.undertime || 0);
    return { grossPay, deductions };
  };

  return (
    <div className="payroll-group-card">
      <div className="payroll-group-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="group-title-section">
          <h5 className="group-title" aria-expanded={!isCollapsed}><i className={`bi bi-chevron-down me-2 ${isCollapsed ? 'collapsed-icon' : ''}`}></i>Payroll for {group.cutOff}</h5>
          <span className={`badge rounded-pill header-status-badge ${group.status === 'Completed' ? 'bg-success-subtle text-success-emphasis' : 'bg-warning-subtle text-warning-emphasis'}`}>{group.status}</span>
        </div>
      </div>
      <div className={`collapse ${!isCollapsed ? 'show' : ''} payroll-group-content`}>
        <div className="table-controls-row">
            <div className="btn-group btn-group-sm record-filter-group">
                <span className="me-2" style={{fontWeight: 500}}>Show:</span>
                <button type="button" className={`btn btn-outline-secondary ${recordFilter === 'All' ? 'active' : ''}`} onClick={() => setRecordFilter('All')}>All</button>
                <button type="button" className={`btn btn-outline-secondary ${recordFilter === 'Paid' ? 'active' : ''}`} onClick={() => setRecordFilter('Paid')}>Paid</button>
                <button type="button" className={`btn btn-outline-secondary ${recordFilter === 'Pending' ? 'active' : ''}`} onClick={() => setRecordFilter('Pending')}>Pending</button>
            </div>
        </div>
        <div className="table-responsive">
          <table className="table data-table mb-0">
            <thead>
              <tr>
                <th className="col-id sortable" onClick={() => requestSort('empId')}>ID {getSortIcon('empId')}</th>
                <th className="col-name sortable" onClick={() => requestSort('employeeName')}>Employee Name {getSortIcon('employeeName')}</th>
                <th className="col-hours text-right sortable" onClick={() => requestSort('hoursWorked')}>Hours {getSortIcon('hoursWorked')}</th>
                <th className="col-currency text-right">Gross Pay</th>
                <th className="col-currency text-right">Deductions</th>
                <th className="col-currency text-right sortable" onClick={() => requestSort('netPay')}>Net Pay {getSortIcon('netPay')}</th>
                <th className="col-status text-center">Status</th>
                <th className="col-action text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredRecords.map((p) => {
                const { grossPay, deductions } = calculateRowTotals(p);
                return (
                  <tr key={p.payrollId}>
                    <td className="col-id">{p.empId}</td>
                    <td className="col-name">{p.employeeName}</td>
                    {/* THIS IS THE KEY FIX: Added a fallback for undefined values */}
                    <td className="col-hours text-right">{(p.hoursWorked || 0).toFixed(2)}</td>
                    <td className="col-currency text-right">₱{formatCurrency(grossPay)}</td>
                    <td className="col-currency text-right">₱{formatCurrency(deductions)}</td>
                    <td className="col-currency text-right fw-bold">₱{formatCurrency(p.netPay)}</td>
                    <td className="col-status text-center"><span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td className="col-action text-center"><button className="btn btn-outline-primary btn-sm btn-adjust" onClick={() => onAdjustClick(p)}>Adjust</button></td>
                  </tr>
                );
              })}
              {sortedAndFilteredRecords.length === 0 && (<tr><td colSpan="8" className="text-center p-3">No records match the selected filter.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const PayrollPage = ({...props}) => {
  const [payrolls, setPayrolls] = useState(initialPayrollRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  const payrollGroups = useMemo(() => {
    const groups = payrolls.reduce((acc, p) => { (acc[p.cutOff] = acc[p.cutOff] || []).push(p); return acc; }, {});
    return Object.entries(groups).map(([cutOff, records]) => ({ cutOff, records, status: records.some(r => r.status === 'Pending') ? 'Has Pending' : 'Completed' })).sort((a, b) => new Date(b.records[0].payrollDate) - new Date(a.records[0].payrollDate));
  }, [payrolls]);
  
  const filteredGroups = useMemo(() => {
    let groups = [...payrollGroups];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      groups = groups.filter(g => g.cutOff.toLowerCase().includes(lowerSearchTerm) || g.records.some(r => r.employeeName.toLowerCase().includes(lowerSearchTerm)));
    }
    return groups;
  }, [payrollGroups, searchTerm]);
  
  const summaryStats = useMemo(() => ({
    all: payrollGroups.length,
    hasPending: payrollGroups.filter(g => g.status === 'Has Pending').length,
    completed: payrollGroups.filter(g => g.status === 'Completed').length,
  }), [payrollGroups]);

  const handleOpenAdjustmentModal = (p) => { setSelectedPayroll(p); setShowAdjustmentModal(true); };
  const handleCloseAdjustmentModal = () => setShowAdjustmentModal(false);
  const handleSavePayrollAdjustment = (id, adjustments) => {
    setPayrolls(prev => prev.map(p => p.payrollId === id ? { ...p, ...adjustments } : p));
    handleCloseAdjustmentModal();
    alert(`Payroll for ${id} has been updated.`);
  };

  const handleGenerateNewPayroll = ({ startDate, endDate, employeeIds }) => {
    const cutOff = `${startDate} to ${endDate}`;
    const newPayrollRecords = employeeIds.map(empId => {
        const employeeData = initialPayrollRecords.find(p => p.empId === empId) || { basicSalary: 20000, employeeName: `Employee ${empId}` };
        const newNetPay = employeeData.basicSalary;
        return {
            payrollId: `PAY${Date.now()}${Math.floor(Math.random() * 100)}`, empId, employeeName: employeeData.employeeName, cutOff,
            payrollDate: new Date().toISOString().split('T')[0], status: 'Pending', basicSalary: employeeData.basicSalary, hoursWorked: 120,
            regularOT: 0, holidayPay: 0, allowances: 0, bonuses: 0, otherEarnings: 0,
            tax: 0, sss: 0, philhealth: 0, hdmf: 0, loans: 0, cashAdvance: 0,
            absents: 0, lates: 0, undertime: 0,
            netPay: newNetPay,
        };
    });
    setPayrolls(prev => [...prev, ...newPayrollRecords]);
    alert(`${newPayrollRecords.length} pending payroll records have been generated for the period ${cutOff}.`);
  };

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4"><h1 className="page-main-title">Payroll Management</h1><button className="btn btn-success" onClick={() => setShowGenerateModal(true)}><i className="bi bi-calculator-fill me-2"></i>Generate New Payroll</button></header>
      <div className="payroll-summary-bar">
        <div className="summary-stat-item"><span className="stat-icon icon-all"><i className="bi bi-calendar3"></i></span><div className="stat-details"><span className="stat-value">{summaryStats.all}</span><span className="stat-label">Total Periods</span></div></div>
        <div className="summary-stat-item"><span className="stat-icon icon-pending"><i className="bi bi-hourglass-split"></i></span><div className="stat-details"><span className="stat-value">{summaryStats.hasPending}</span><span className="stat-label">With Pending</span></div></div>
        <div className="summary-stat-item"><span className="stat-icon icon-completed"><i className="bi bi-check2-circle"></i></span><div className="stat-details"><span className="stat-value">{summaryStats.completed}</span><span className="stat-label">Completed</span></div></div>
      </div>
      <div className="payroll-controls-bar mb-4"><div className="input-group"><span className="input-group-text"><i className="bi bi-search"></i></span><input type="text" className="form-control" placeholder="Search by pay period or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
      <div className="payroll-groups-container">
        {filteredGroups.map((group) => (
          <PayrollGroup key={group.cutOff} group={group} onAdjustClick={handleOpenAdjustmentModal} />
        ))}
        {filteredGroups.length === 0 && <div className="text-center p-5 bg-light rounded"><i className="bi bi-wallet2 fs-1 text-muted mb-3 d-block"></i><h4 className="text-muted">No payroll records found.</h4></div>}
      </div>
      <GeneratePayrollModal show={showGenerateModal} onClose={() => setShowGenerateModal(false)} onGenerate={handleGenerateNewPayroll} allEmployees={initialPayrollRecords} existingPayrolls={payrolls}/>
      {showAdjustmentModal && selectedPayroll && ( <PayrollAdjustmentModal show={showAdjustmentModal} payrollData={selectedPayroll} onClose={handleCloseAdjustmentModal} onSave={handleSavePayrollAdjustment} /> )}
    </div>
  );
};

export default PayrollPage;