import React, { useState, useMemo } from 'react';
import ViewPayslipModal from '../../modals/ViewPayslipModal';
import './MyPayrollPage.css';

const formatCurrency = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MyPayrollHistoryPage = ({ currentUser, payrolls = [] }) => {
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const myPayrolls = useMemo(() => {
    return payrolls
      .map(run => {
        const myRecord = run.records.find(rec => rec.empId === currentUser.id);
        if (!myRecord) return null;
        return { ...run, myRecord };
      })
      .filter(Boolean)
      .sort((a,b) => new Date(b.cutOff.split(' to ')[0]) - new Date(a.cutOff.split(' to ')[0]));
  }, [payrolls, currentUser.id]);

  const handleViewPayslip = (record, run) => {
    setSelectedRecord({ ...record, cutOff: run.cutOff });
    setShowPayslipModal(true);
  };

  return (
    <div className="my-payroll-history-container">
      <div className="accordion my-payroll-accordion" id="myPayrollHistoryAccordion">
        {myPayrolls.length > 0 ? myPayrolls.map((run) => (
          <div className="accordion-item" key={run.runId}>
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-history-${run.runId}`}>
                <div className="period-info">
                  <span className="period-date">{run.cutOff}</span>
                  <span className="period-status">Status: {run.myRecord.status}</span>
                </div>
                <div className="period-summary">
                  <span className="summary-label">Official Net Pay</span>
                  <span className="summary-value">₱{formatCurrency(run.myRecord.netPay)}</span>
                </div>
              </button>
            </h2>
            <div id={`collapse-history-${run.runId}`} className="accordion-collapse collapse" data-bs-parent="#myPayrollHistoryAccordion">
              <div className="accordion-body text-center p-4">
                  <p className="text-muted mb-3">This is an official record. View the full payslip for a detailed breakdown of earnings and deductions.</p>
                  <button className="btn btn-primary" onClick={() => handleViewPayslip(run.myRecord, run)}>
                      <i className="bi bi-eye-fill me-2"></i>View Official Payslip
                  </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center p-5 bg-light rounded">
            <i className="bi bi-archive-fill fs-1 text-muted mb-3 d-block"></i>
            <h4 className="text-muted">No Official Payroll History</h4>
            <p className="text-muted">Your finalized payslips will appear here after they are processed by HR.</p>
          </div>
        )}
      </div>
      {selectedRecord && <ViewPayslipModal show={showPayslipModal} onClose={() => setShowPayslipModal(false)} payslipData={selectedRecord} />}
    </div>
  );
};

export default MyPayrollHistoryPage;