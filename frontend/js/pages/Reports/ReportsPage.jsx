import React, { useState } from 'react';
import ReportCard from './ReportCard';
import ReportConfigurationModal from '../../modals/ReportConfigurationModal';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import useReportGenerator from '../../hooks/useReportGenerator';
import './ReportsPage.css';
import Layout from '@/layout/Layout';

const reportConfigs = [
  {
    id: 'employee_masterlist',
    title: 'Employee Masterlist',
    description: 'Generates a complete list of all active employees with their key details.',
    icon: 'bi-people-fill',
    parameters: null,
  },
  {
    id: 'attendance_summary',
    title: 'Attendance Summary Report',
    description: 'Provides a summary of attendance records within a specified date range.',
    icon: 'bi-calendar-check-fill',
    parameters: [
      { id: 'date_range_1', type: 'date-range', labels: { start: 'Start Date', end: 'End Date' } },
    ],
  },
  {
    id: 'leave_balance_report',
    title: 'Leave Balance Report',
    description: 'Shows the current leave balances for all employees. (Coming Soon)',
    icon: 'bi-briefcase-fill',
    parameters: null,
  },
  {
    id: 'payroll_history',
    title: 'Payroll History Report',
    description: 'Generates a detailed report of all payrolls run in a specific period. (Coming Soon)',
    icon: 'bi-cash-coin',
    parameters: [
       { id: 'date_range_2', type: 'date-range', labels: { start: 'Pay Period Start', end: 'Pay Period End' } },
    ],
  },
];

const ReportsPage = (props) => {
  const [configModalState, setConfigModalState] = useState({ show: false, config: null });
  const [showPreview, setShowPreview] = useState(false);
  const { generateReport, pdfDataUri, isLoading, error, setPdfDataUri } = useReportGenerator();

  const handleOpenConfig = (reportConfig) => {
    if (reportConfig.parameters) {
      // If the report needs configuration, open the modal
      setConfigModalState({ show: true, config: reportConfig });
    } else {
      // Otherwise, generate it directly
      handleRunReport(reportConfig.id, {});
    }
  };

  const handleRunReport = (reportId, params) => {
    // We would pass all necessary data sources from props here
    generateReport(reportId, params, { employees: props.employees, positions: props.positions });
    setConfigModalState({ show: false, config: null }); // Close config modal after running
    setShowPreview(true);
  };
  
  const handleClosePreview = () => {
    setShowPreview(false);
    // Important: Clean up the Blob URL to prevent memory leaks
    if (pdfDataUri) {
        URL.revokeObjectURL(pdfDataUri);
    }
    setPdfDataUri('');
  }

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-main-title">Reports Center</h1>
      </header>
      
      <div className="reports-grid">
        {reportConfigs.map(config => (
          <ReportCard
            key={config.id}
            title={config.title}
            description={config.description}
            icon={config.icon}
            onGenerate={() => handleOpenConfig(config)}
          />
        ))}
      </div>

      <ReportConfigurationModal
        show={configModalState.show}
        onClose={() => setConfigModalState({ show: false, config: null })}
        reportConfig={configModalState.config}
        onRunReport={handleRunReport}
      />

      {(isLoading || pdfDataUri) && (
         <ReportPreviewModal
            show={showPreview}
            onClose={handleClosePreview}
            pdfDataUri={pdfDataUri}
            reportTitle={configModalState.config?.title || 'Report Preview'}
        />
      )}

      {isLoading && (
         <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-body text-center p-4">
                        <div className="spinner-border text-success mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h4>Generating Report...</h4>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ReportsPage;