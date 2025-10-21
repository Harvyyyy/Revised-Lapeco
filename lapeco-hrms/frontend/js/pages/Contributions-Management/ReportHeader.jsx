import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const MONTHS = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' },
];

const ReportHeader = ({
  title,
  availableYears,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onArchive,
  isArchived,
  onExportPdf,
  // Props for Excel export
  columns,
  rows,
  headerData,
}) => {

  const handleExportExcel = () => {
    const dataForExport = rows.map(row => {
      const newRow = {};
      columns.forEach(col => { newRow[col.label] = row[col.key]; });
      return newRow;
    });
    
    const ws = XLSX.utils.json_to_sheet([]);
    const headerRows = Object.entries(headerData).map(([key, value]) => [key, value]);
    if (headerRows.length > 0) XLSX.utils.sheet_add_aoa(ws, headerRows, { origin: 'A1' });
    const tableOrigin = headerRows.length > 0 ? headerRows.length + 2 : 0;
    XLSX.utils.sheet_add_json(ws, dataForExport, { origin: `A${tableOrigin}` });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const contributionMonth = format(new Date(selectedYear, selectedMonth), 'yyyy-MM');
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${title.replace(/\s+/g, '_')}_${contributionMonth}.xlsx`);
  };

  return (
    <div className="card-header report-card-header">
      <div className="header-left">
        <h5 className="mb-0">{title}</h5>
        <div className="d-flex align-items-center gap-2 pay-period-selector-wrapper">
          <label className="form-label mb-0 small">Month:</label>
          <select className="form-select form-select-sm" value={selectedYear} onChange={e => onYearChange(Number(e.target.value))}>
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <select className="form-select form-select-sm" value={selectedMonth} onChange={e => onMonthChange(Number(e.target.value))}>
            {MONTHS.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
        </div>
      </div>
      <div className="header-right">
        <button className="btn btn-sm btn-outline-primary" onClick={onArchive} disabled={rows.length === 0 || isArchived}>
          <i className="bi bi-archive-fill me-1"></i> Finalize & Archive Month
        </button>
        <div className="dropdown">
          <button className="btn btn-sm btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" disabled={rows.length === 0}>
              <i className="bi bi-download me-1"></i> Export
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
              <li><a className="dropdown-item" href="#" onClick={onExportPdf}><i className="bi bi-file-earmark-pdf-fill me-2"></i>Export as PDF</a></li>
              <li><a className="dropdown-item" href="#" onClick={handleExportExcel}><i className="bi bi-file-earmark-spreadsheet-fill me-2"></i>Export as Excel</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;