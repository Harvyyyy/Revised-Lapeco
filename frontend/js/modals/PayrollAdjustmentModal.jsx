import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './PayrollAdjustmentModal.css';
import ReportPreviewModal from './ReportPreviewModal';
import 'bootstrap-icons/font/bootstrap-icons.css';
import logo from '../assets/logo.png';

const formatCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PayrollAdjustmentModal = ({ payrollData, show, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('earnings');
  const [showPayslipPreview, setShowPayslipPreview] = useState(false);
  const [payslipPdfData, setPayslipPdfData] = useState('');
  
  const [adjustments, setAdjustments] = useState({
    allowances: 0,
    bonuses: 0,
    otherEarnings: 0,
    loanRepayments: 0,
    cashAdvances: 0,
  });

  useEffect(() => {
    if (show) {
      setAdjustments({
        allowances: payrollData.allowances || 0,
        bonuses: payrollData.bonuses || 0,
        otherEarnings: payrollData.otherEarnings || 0,
        loanRepayments: payrollData.loans || 0,
        cashAdvances: payrollData.cashAdvance || 0,
      });
      setActiveTab('earnings');
    }
  }, [payrollData, show]);
  
  const handleAdjustmentChange = (field, value) => {
    setAdjustments(prev => ({ ...prev, [field]: Number(value) }));
  };
  
  const totals = useMemo(() => {
    const calculatedEarnings = 
        (payrollData.basicSalary || 0) + (payrollData.regularOT || 0) + 
        (payrollData.regularHoliday || 0) + (payrollData.regularHolidayOT || 0) +
        (payrollData.specialHoliday || 0) + (payrollData.specialHolidayOT || 0) +
        (payrollData.nightDifferential || 0);

    const manualEarnings = adjustments.allowances + adjustments.bonuses + adjustments.otherEarnings;
    const grossEarnings = calculatedEarnings + manualEarnings;
        
    const statutoryDeductions = 
        (payrollData.tax || 0) + (payrollData.sss || 0) + 
        (payrollData.philhealth || 0) + (payrollData.hdmf || 0);

    const attendanceDeductions = 
        (payrollData.absents || 0) + (payrollData.lates || 0) + (payrollData.undertime || 0);

    const manualDeductions = adjustments.loanRepayments + adjustments.cashAdvances;
    const totalDeductions = statutoryDeductions + attendanceDeductions + manualDeductions;
        
    const netPay = grossEarnings - totalDeductions;

    return { grossEarnings, totalDeductions, netPay };
  }, [payrollData, adjustments]);
  
  const handleSaveChanges = () => {
    onSave(payrollData.payrollId, { ...adjustments, netPay: totals.netPay });
    onClose();
  };

  const handleGeneratePayslip = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const accentColor = '#198754';

    doc.addImage(logo, 'PNG', 15, 12, 40, 13);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('PAYSLIP', pageW - 15, 25, { align: 'right' });
    doc.setDrawColor(accentColor);
    doc.setLineWidth(0.5);
    doc.line(15, 32, pageW - 15, 32);

    doc.setFillColor(248, 249, 250);
    doc.rect(15, 40, pageW - 30, 22, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(108, 117, 125);
    doc.text('EMPLOYEE', 20, 46);
    doc.text('PAY PERIOD', pageW / 2, 46);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(33, 37, 41);
    doc.text(payrollData.employeeName, 20, 52);
    doc.text(payrollData.cutOff, pageW / 2, 52);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(108, 117, 125);
    doc.text('EMPLOYEE ID', 20, 58);
    doc.text('PAY DATE', pageW / 2, 58);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(33, 37, 41);
    doc.text(payrollData.empId, 20, 64);
    doc.text(payrollData.payrollDate, pageW / 2, 64);
    
    const financialBody = [
        ['Basic Salary', formatCurrency(payrollData.basicSalary), ''],
        ['Overtime Pay', formatCurrency(payrollData.regularOT), ''],
        ['Holiday Pay', formatCurrency((payrollData.regularHoliday || 0) + (payrollData.regularHolidayOT || 0) + (payrollData.specialHoliday || 0) + (payrollData.specialHolidayOT || 0)), ''],
        ['Night Differential', formatCurrency(payrollData.nightDifferential), ''],
        ['Allowances', formatCurrency(adjustments.allowances), ''],
        ['Bonuses', formatCurrency(adjustments.bonuses), ''],
        ['Other Earnings', formatCurrency(adjustments.otherEarnings), ''],
        ['Lates', '', formatCurrency(payrollData.lates)],
        ['Absences', '', formatCurrency(payrollData.absents)],
        ['Undertime', '', formatCurrency(payrollData.undertime)],
        ['Withholding Tax', '', formatCurrency(payrollData.tax)],
        ['SSS Contribution', '', formatCurrency(payrollData.sss)],
        ['PhilHealth Contribution', '', formatCurrency(payrollData.philhealth)],
        ['Pag-IBIG Contribution', '', formatCurrency(payrollData.hdmf)],
        ['Loan Repayments', '', formatCurrency(adjustments.loanRepayments)],
        ['Cash Advances', '', formatCurrency(adjustments.cashAdvances)],
    ];

    autoTable(doc, {
        head: [['Current Period Breakdown', 'Earnings (₱)', 'Deductions (₱)']],
        body: financialBody,
        startY: 70,
        theme: 'striped',
        headStyles: { fillColor: '#343a40', textColor: '#ffffff' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });

    const ytdBody = [
        ['Gross Earnings', formatCurrency(payrollData.ytdGross)],
        ['Withholding Tax', formatCurrency(payrollData.ytdTax)],
        ['SSS Contribution', formatCurrency(payrollData.ytdSss)],
        ['PhilHealth Contribution', formatCurrency(payrollData.ytdPhilhealth)],
        ['Pag-IBIG Contribution', formatCurrency(payrollData.ytdHdmf)],
    ];

    autoTable(doc, {
        head: [['Year-to-Date Summary', 'Amount (₱)']],
        body: ytdBody,
        startY: doc.lastAutoTable.finalY + 5,
        theme: 'grid',
        headStyles: { fillColor: '#6c757d', textColor: '#ffffff' },
        columnStyles: { 1: { halign: 'right' } },
    });
    
    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Gross Earnings:', 120, finalY + 15, { align: 'right' });
    doc.text('Total Deductions:', 120, finalY + 22, { align: 'right' });
    doc.setFontSize(12);
    doc.text('NET PAY:', 120, finalY + 32, { align: 'right' });

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(formatCurrency(totals.grossEarnings), 160, finalY + 15, { align: 'right' });
    doc.text(`(${formatCurrency(totals.totalDeductions)})`, 160, finalY + 22, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(accentColor);
    doc.text(`₱ ${formatCurrency(totals.netPay)}`, pageW - 15, finalY + 32, { align: 'right' });

    doc.setTextColor(108, 117, 125);
    doc.setFontSize(9);
    doc.text(`Leave Balances (as of ${payrollData.payrollDate}): Vacation: ${payrollData.vacationLeaves}, Sick: ${payrollData.sickLeaves}`, 15, doc.internal.pageSize.getHeight() - 25);

    doc.setLineWidth(0.3);
    doc.line(15, doc.internal.pageSize.getHeight() - 15, 80, doc.internal.pageSize.getHeight() - 15);
    doc.setFontSize(10);
    doc.setTextColor(33, 37, 41);
    doc.text('Employee Signature', 17, doc.internal.pageSize.getHeight() - 10);

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPayslipPdfData(url);
    setShowPayslipPreview(true);
  };

  const ReadOnlyField = ({ label, value }) => (<div className="form-group"><label>{label}</label><span className="form-control-plaintext">{formatCurrency(value)}</span></div>);
  const AdjustmentField = ({ label, field }) => (<div className="form-group"><label htmlFor={field}>{label}</label><div className="input-group"><span className="input-group-text">₱</span><input type="number" id={field} className="form-control" value={adjustments[field]} onChange={e => handleAdjustmentChange(field, e.target.value)} /></div></div>);

  if (!show || !payrollData) return null;

  return (
    <>
      <div className={`modal fade show d-block ${showPayslipPreview ? 'modal-behind' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg payroll-adjustment-modal-dialog">
          <div className="modal-content payroll-adjustment-modal-content">
            <div className="modal-header"><h5 className="modal-title"><span className="employee-name">{payrollData.employeeName}</span><span className="period-text">({payrollData.cutOff})</span></h5><button type="button" className="btn-close" onClick={onClose}></button></div>
            <div className="modal-body">
              <div className="payroll-header-bar"><div className="header-bar-item"><div className="label">Employee ID</div><div className="value">{payrollData.empId}</div></div><div className="header-bar-item"><div className="label">Days Worked</div><div className="value">{payrollData.daysWorked || 'N/A'}</div></div></div>
              <ul className="nav nav-tabs">
                <li className="nav-item"><button className={`nav-link ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>Earnings</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'deductions' ? 'active' : ''}`} onClick={() => setActiveTab('deductions')}>Deductions</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button></li>
              </ul>
              <div className="tab-content">
                {activeTab === 'earnings' && <div className="form-grid"><ReadOnlyField label="Regular Days (Basic)" value={payrollData.basicSalary} /><ReadOnlyField label="Regular OT" value={payrollData.regularOT} /><ReadOnlyField label="Regular Holiday" value={payrollData.regularHoliday} /><ReadOnlyField label="Regular Holiday OT" value={payrollData.regularHolidayOT} /><ReadOnlyField label="Special Holiday" value={payrollData.specialHoliday} /><ReadOnlyField label="Special Holiday OT" value={payrollData.specialHolidayOT} /><ReadOnlyField label="Night Differential" value={payrollData.nightDifferential} /><AdjustmentField label="Allowances" field="allowances" /><AdjustmentField label="Bonuses / Commission" field="bonuses" /><AdjustmentField label="Other Earnings" field="otherEarnings" /></div>}
                {activeTab === 'deductions' &&
                    <div className="form-grid">
                        <ReadOnlyField label="Lates" value={payrollData.lates} />
                        <ReadOnlyField label="Absences" value={payrollData.absents} />
                        <ReadOnlyField label="Undertime" value={payrollData.undertime} />
                        <ReadOnlyField label="Withholding Tax" value={payrollData.tax} />
                        <ReadOnlyField label="SSS Contribution" value={payrollData.sss} />
                        <ReadOnlyField label="PhilHealth Contribution" value={payrollData.philhealth} />
                        <ReadOnlyField label="Pag-IBIG Contribution" value={payrollData.hdmf} />
                        <AdjustmentField label="Loan Repayments" field="loanRepayments" />
                        <AdjustmentField label="Cash Advances" field="cashAdvances" />
                    </div>
                }
                {activeTab === 'summary' && <div className="summary-section"><div className="summary-row"><span className="label">Gross Earnings</span><span className="value">{formatCurrency(totals.grossEarnings)}</span></div><div className="summary-row total-deductions"><span className="label">Total Deductions</span><span className="value">- {formatCurrency(totals.totalDeductions)}</span></div><div className="summary-row net-pay"><span className="label">Net Pay</span><span className="value">₱{formatCurrency(totals.netPay)}</span></div></div>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-primary" onClick={handleGeneratePayslip}><i className="bi bi-file-earmark-text-fill me-2"></i>Preview Payslip</button>
              <div className="footer-actions-right"><button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-success" onClick={handleSaveChanges}><i className="bi bi-save-fill me-2"></i>Save Changes</button></div>
            </div>
          </div>
        </div>
      </div>
      {showPayslipPreview && <ReportPreviewModal show={showPayslipPreview} onClose={() => setShowPayslipPreview(false)} pdfDataUri={payslipPdfData} reportTitle={`Payslip Preview - ${payrollData.employeeName}`} />}
    </>
  );
};

export default PayrollAdjustmentModal;