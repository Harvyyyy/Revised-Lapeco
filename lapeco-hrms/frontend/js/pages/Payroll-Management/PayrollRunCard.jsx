import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { formatDate as formatMDY } from '../../utils/dateUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { payrollAPI } from '../../services/api';
import { PdfLayoutManager } from '../../utils/pdfLayoutManager';
import { loadReportGenerator } from '../../reports';

import ReportPreviewModal from '../../modals/ReportPreviewModal';

const formatCurrency = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PayrollRunCard = ({ run, onViewDetails, onMarkAsPaid, onDelete }) => {
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState(false);
  const [showPayslipPreview, setShowPayslipPreview] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const handleExportRun = async (e) => {
    e.stopPropagation();
    
    try {
      // Fetch full payroll details
      const response = await payrollAPI.getPeriodDetails(run.periodId);
      const { records, cutOff } = response.data;
      
      if (!records || records.length === 0) {
        alert('No payroll records found to export.');
        return;
      }
      
      // Prepare data for CSV export
      const csvData = records.map(record => ({
        'Employee ID': record.empId,
        'Employee Name': record.employeeName,
        'Net Pay': Number(record.netPay).toFixed(2),
        'Status': record.status
      }));
      
      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(csvData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
      
      // Generate CSV file
      const csvOutput = XLSX.write(workbook, { bookType: 'csv', type: 'string' });
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      
      // Download file
      const fileName = `Payroll_${run.runId}_${cutOff.replace(/ to /g, '_').replace(/\s/g, '')}.csv`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting payroll:', error);
      alert('Failed to export payroll data. Please try again.');
    }
  };

  const handleClosePayslipPreview = () => {
    setShowPayslipPreview(false);
    if (pdfDataUri) URL.revokeObjectURL(pdfDataUri);
    setPdfDataUri('');
    setProgress(0);
    setProgressText('');
  };

  const handleGeneratePayslips = async (e) => {
    e.stopPropagation();
    if (isGeneratingPayslips) return;
    setIsGeneratingPayslips(true);
    try {
      const details = await payrollAPI.getPeriodDetails(run.periodId);
      const records = details?.data?.records || [];
      if (!records.length) {
        alert('No payroll records found for this run.');
        setIsGeneratingPayslips(false);
        return;
      }

      const generator = await loadReportGenerator('payslip');
      if (!generator) {
        alert('Payslip generator not available.');
        setIsGeneratingPayslips(false);
        return;
      }

      const layoutManager = new PdfLayoutManager('portrait', 'Payslips', 'light', { skipHeader: true, skipFooter: true });
      setShowPayslipPreview(true);
      setProgress(0);
      setProgressText(`Preparing ${records.length} payslips...`);

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const { data } = await payrollAPI.getPayrollRecord(rec.payrollId);
        const [start, end] = (data.cutOff || details?.data?.cutOff || '').split(' to ');
        const paymentDate = data.paymentDate || addDays(new Date(end), 5).toISOString().split('T')[0];
        const payslipData = {
          payrollId: String(data.payrollId || ''),
          empId: String(data.empId || ''),
          employeeName: String(data.employeeName || ''),
          cutOff: String(data.cutOff || details?.data?.cutOff || ''),
          payStartDate: data.payStartDate || start,
          payEndDate: data.payEndDate || end,
          paymentDate,
          period: data.period || (data.cutOff || ''),
          earnings: data.earnings || [],
          deductions: data.deductions || {},
          otherDeductions: data.otherDeductions || [],
          absences: data.absences || [],
          leaveBalances: data.leaveBalances || {},
        };
        const employeeDetails = data.employeeDetails || { id: data.empId, name: data.employeeName, positionTitle: data.position };
        if (i > 0) layoutManager.doc.addPage();
        await generator(layoutManager, { payslipData, employeeDetails });
        const p = Math.round(((i + 1) / records.length) * 100);
        setProgress(p);
        setProgressText(`Generated ${i + 1}/${records.length} payslips...`);
      }

      const blob = layoutManager.getOutput('blob');
      const uri = URL.createObjectURL(blob);
      setPdfDataUri(uri);
      setProgress(100);
      setProgressText('Ready');
    } catch (err) {
      console.error('Error generating payslips:', err);
      alert('Failed to generate payslips. Please try again.');
    } finally {
      setIsGeneratingPayslips(false);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  const payDate = format(addDays(new Date(run.cutOff.split(' to ')[1]), 5), 'yyyy-MM-dd');

  // Use backend-provided totals (new API) or calculate from records (old API)
  const grossPay = run.totalGross ?? 0;
  const totalDeductions = run.totalDeductions ?? 0;
  const employeeCount = run.employeeCount ?? (run.records?.length || 0);

  return (
    <div className="payroll-run-card" onClick={onViewDetails}>
      <div className="card-header">
        <div className="header-info">
          <h5 className="card-title">{run.cutOff}</h5>
          <span className="card-subtitle">{run.runId}</span>
        </div>
        <span className={`status-badge ${run.isPaid ? 'status-paid' : 'status-pending'}`}>
          {run.isPaid ? 'Paid' : 'Pending'}
        </span>
      </div>
      <div className="card-body">
        <div className="body-column financials">
            <div className="financial-item">
                <span className="financial-label">Gross Pay</span>
                <span className="financial-value">₱{formatCurrency(grossPay)}</span>
            </div>
            <div className="financial-item">
                <span className="financial-label">Deductions</span>
                <span className="financial-value text-danger">- ₱{formatCurrency(totalDeductions)}</span>
            </div>
             <div className="financial-item net-payout">
                <span className="financial-label">Total Net Payout</span>
                <span className="financial-value">₱{formatCurrency(run.totalNet)}</span>
            </div>
        </div>
        <div className="body-column details">
            <div className="detail-item">
                <span className="detail-label">Pay Date</span>
                <span className="detail-value">{formatMDY(new Date(payDate + 'T00:00:00'), 'long')}</span>
            </div>
            <div className="detail-item">
                <span className="detail-label">Employees</span>
                <span className="detail-value">{employeeCount}</span>
            </div>
        </div>
      </div>
      <div className="card-footer">
        {!run.isPaid && (
          <button className="btn btn-sm btn-success" onClick={(e) => handleActionClick(e, onMarkAsPaid)}>
            Mark All as Paid
          </button>
        )}
        <div className="ms-auto d-flex gap-2">
            <button className="btn btn-sm btn-primary" onClick={(e) => handleActionClick(e, onViewDetails)}>
            View Details
            </button>
            <div className="dropdown">
                <button className="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown" onClick={(e) => e.stopPropagation()} aria-expanded="false">
                    <i className="bi bi-three-dots-vertical"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                    <li><a className="dropdown-item" href="#" onClick={handleExportRun}><i className="bi bi-download me-2"></i>Export CSV</a></li>
                    <li><a className="dropdown-item" href="#" onClick={handleGeneratePayslips}><i className="bi bi-file-earmark-pdf me-2"></i>{isGeneratingPayslips ? 'Generating Payslips...' : 'Preview Payslips (PDF)'}</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><a className="dropdown-item text-danger" href="#" onClick={(e) => handleActionClick(e, onDelete)}><i className="bi bi-trash-fill me-2"></i>Delete Run</a></li>
                </ul>
            </div>
      </div>
      {(isGeneratingPayslips || pdfDataUri) && (
        <ReportPreviewModal
          show={showPayslipPreview}
          onClose={handleClosePayslipPreview}
          pdfDataUri={pdfDataUri}
          reportTitle={`Payslips ${run.runId}`}
          progress={progress}
          progressText={progressText}
        />
      )}
      </div>
    </div>
  );
};

export default PayrollRunCard;
