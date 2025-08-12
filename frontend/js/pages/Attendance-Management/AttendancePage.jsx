import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './AttendancePage.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ReportPreviewModal from '../../modals/ReportPreviewModal';
import EditAttendanceModal from '../../modals/EditAttendanceModal';
import Layout from '@/layout/Layout';

const createPastDate = (daysAgo) => new Date(Date.now() - (86400000 * daysAgo)).toISOString().split('T')[0];

const initialAttendanceLogs = [
  { empId: 'EMP001', date: createPastDate(0), signIn: '09:02', breakOut: '12:05', breakIn: '13:01', signOut: null },
  { empId: 'EMP002', date: createPastDate(0), signIn: '08:58', breakOut: null, breakIn: null, signOut: null },
  { empId: 'EMP001', date: createPastDate(1), signIn: '09:00', breakOut: '12:00', breakIn: '13:00', signOut: '18:00' },
  { empId: 'EMP002', date: createPastDate(1), signIn: '08:55', breakOut: '12:10', breakIn: '13:05', signOut: '17:58' },
  { empId: 'EMP003', date: createPastDate(1), signIn: '09:15', breakOut: '12:30', breakIn: '13:30', signOut: '18:10' },
  { empId: 'EMP001', date: createPastDate(2), signIn: '09:05', breakOut: '12:01', breakIn: '12:59', signOut: '18:05' },
  { empId: 'EMP003', date: createPastDate(2), signIn: '09:00', breakOut: '12:00', breakIn: '13:00', signOut: '18:00' },
  { empId: 'EMP001', date: createPastDate(3), signIn: '08:58', breakOut: '11:55', breakIn: '12:55', signOut: '17:50' },
  { empId: 'EMP002', date: createPastDate(3), signIn: '09:03', breakOut: '12:05', breakIn: '13:05', signOut: '18:01' },
  { empId: 'EMP003', date: createPastDate(3), signIn: '09:01', breakOut: '12:02', breakIn: '13:01', signOut: '18:03' },
  { empId: 'EMP004', date: createPastDate(3), signIn: '09:05', breakOut: '12:00', breakIn: '13:00', signOut: '18:02' },
  { empId: 'EMP002', date: createPastDate(4), signIn: '08:45', breakOut: '12:00', breakIn: '13:00', signOut: '17:45' },
  { empId: 'EMP004', date: createPastDate(4), signIn: '09:10', breakOut: '12:15', breakIn: '13:10', signOut: '18:15' },
];

const AttendancePage = (props) => {
  // Defensive defaults for required props
  const allSchedules = props.allSchedules || [];
  const employees = props.employees || [];
  const positions = props.positions || [];

  const [activeView, setActiveView] = useState('daily');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceLogs, setAttendanceLogs] = useState(initialAttendanceLogs);

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState(null);
  
  const fileInputRef = useRef(null);

  const dailyAttendanceList = useMemo(() => {
    if (!allSchedules || !employees || !positions) return [];
    const schedulesForDate = allSchedules.filter(s => s.date === currentDate);
    if (schedulesForDate.length === 0) return [];
    const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
    const positionMap = new Map(positions.map(pos => [pos.id, pos.title]));
    const logMap = new Map(attendanceLogs.filter(att => att.date === currentDate).map(att => [att.empId, att]));
    return schedulesForDate.map(schedule => {
      const employeeDetails = employeeMap.get(schedule.empId);
      if (!employeeDetails) return null;
      const attendance = logMap.get(schedule.empId) || {};
      const positionTitle = positionMap.get(employeeDetails.positionId) || 'Unassigned';
      let status = "Absent";
      if (attendance.signIn) {
          const shiftStartTime = schedule.shift ? schedule.shift.split(' - ')[0] : '00:00';
          status = attendance.signIn > shiftStartTime ? "Late" : "Present";
      }
      return {
        ...employeeDetails, scheduleId: schedule.scheduleId, position: positionTitle, shift: schedule.shift,
        signIn: attendance.signIn || null, breakOut: attendance.breakOut || null, breakIn: attendance.breakIn || null, signOut: attendance.signOut || null,
        workingHours: '0h 0m', status: status,
      };
    }).filter(Boolean);
  }, [currentDate, allSchedules, employees, positions, attendanceLogs]);

  const sortedAndFilteredList = useMemo(() => {
    let list = [...dailyAttendanceList];
    if (positionFilter) list = list.filter(item => item.position === positionFilter);
    if (statusFilter) list = list.filter(item => item.status === statusFilter);
    if (sortConfig.key) {
      list.sort((a, b) => {
        const valA = String(a[sortConfig.key] || 'z').toLowerCase();
        const valB = String(b[sortConfig.key] || 'z').toLowerCase();
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [dailyAttendanceList, positionFilter, statusFilter, sortConfig]);

  const attendanceHistory = useMemo(() => {
    const history = {};
    const today = new Date().toISOString().split('T')[0];
    const schedulesMap = new Map(allSchedules.map(s => [`${s.date}-${s.empId}`, s]));
    allSchedules.forEach(s => {
      if (s.date < today) {
        if (!history[s.date]) {
          history[s.date] = { scheduled: 0, present: 0, late: 0 };
        }
        history[s.date].scheduled++;
      }
    });
    attendanceLogs.forEach(log => {
      if (history[log.date]) {
        const scheduleKey = `${log.date}-${log.empId}`;
        const schedule = schedulesMap.get(scheduleKey);
        if (schedule && log.signIn) {
          history[log.date].present++;
          const shiftStartTime = schedule.shift ? schedule.shift.split(' - ')[0] : '00:00';
          if (log.signIn > shiftStartTime) {
            history[log.date].late++;
          }
        }
      }
    });
    return Object.entries(history).map(([date, counts]) => ({
      date,
      present: counts.present,
      late: counts.late,
      absent: counts.scheduled - counts.present,
      total: counts.scheduled,
    })).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [attendanceLogs, allSchedules]);

  const handleStatusFilterClick = (newStatus) => {
    if (statusFilter === newStatus) {
      setStatusFilter('');
    } else {
      setStatusFilter(newStatus);
    }
  };

  const handleRequestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up sort-icon ms-1"></i>;
    return sortConfig.direction === 'ascending' ? <i className="bi bi-sort-up sort-icon active ms-1"></i> : <i className="bi bi-sort-down sort-icon active ms-1"></i>;
  };
  
  const handleLogTime = (empId, logType) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateToLog = currentDate;
    setAttendanceLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.empId === empId && log.date === dateToLog);
      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = { ...updatedLogs[existingLogIndex], [logType]: currentTime };
        return updatedLogs;
      }
      return [...prevLogs, { empId, date: dateToLog, [logType]: currentTime }];
    });
  };

  const handleViewHistoryDetail = (date) => {
    setCurrentDate(date);
    setActiveView('historyDetail');
  };

  const handleGenerateReport = () => {
    if (!dailyAttendanceList || dailyAttendanceList.length === 0) {
      alert("No attendance data to generate a report for the selected day.");
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const reportDate = new Date(currentDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(18); doc.setFont(undefined, 'bold');
    doc.text('Daily Attendance Report', pageWidth / 2, 40, { align: 'center' });
    doc.setFontSize(11); doc.setFont(undefined, 'normal');
    doc.text(`Date: ${reportDate}`, pageWidth / 2, 55, { align: 'center' });
    const totalScheduled = dailyAttendanceList.length;
    const presentEmployees = dailyAttendanceList.filter(e => e.status === 'Present');
    const lateEmployees = dailyAttendanceList.filter(e => e.status === 'Late');
    const absentEmployees = dailyAttendanceList.filter(e => e.status === 'Absent');
    let summaryY = 80;
    doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text('Summary', 40, summaryY);
    summaryY += 18;
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`- Total Scheduled: ${totalScheduled}`, 50, summaryY);
    doc.text(`- Present: ${presentEmployees.length}`, 200, summaryY);
    doc.text(`- Late: ${lateEmployees.length}`, 350, summaryY);
    doc.text(`- Absent: ${absentEmployees.length}`, 500, summaryY);
    summaryY += 15;
    
    const drawEmployeeList = (title, employees, startY) => {
      if (employees.length === 0) return startY;
      let y = startY;
      if (y > pageHeight - 60) { doc.addPage(); y = 40; }
      y += 15;
      doc.setFont(undefined, 'bold');
      doc.text(title, 40, y);
      y += 15;
      doc.setFont(undefined, 'normal');
      employees.forEach(emp => {
        if (y > pageHeight - 40) { doc.addPage(); y = 40; }
        doc.text(`- ${emp.name} (${emp.id})`, 50, y);
        y += 12;
      });
      return y + 10;
    };

    summaryY = drawEmployeeList('Present Employees', presentEmployees, summaryY);
    summaryY = drawEmployeeList('Late Employees', lateEmployees, summaryY);
    summaryY = drawEmployeeList('Absent Employees', absentEmployees, summaryY);
    
    if (summaryY > pageHeight - 100) { doc.addPage(); summaryY = 40; }
    const tableColumns = ["ID", "Name", "Position", "Shift", "Sign In", "Break Out", "Break In", "Sign Out", "Status"];
    const tableRows = sortedAndFilteredList.map(emp => [
      emp.id, emp.name, emp.position, emp.shift || '---', emp.signIn || '---',
      emp.breakOut || '---', emp.breakIn || '---', emp.signOut || '---', emp.status,
    ]);
    autoTable(doc, {
      head: [tableColumns], body: tableRows, startY: summaryY, theme: 'grid',
      headStyles: { fillColor: [25, 135, 84], fontSize: 9 }, bodyStyles: { fontSize: 8 },
      didDrawPage: (data) => {
        doc.setFontSize(9);
        doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, pageHeight - 10);
      }
    });
    setPdfDataUri(doc.output('datauristring'));
    setShowReportModal(true);
  };
  
  const handleOpenEditModal = (employeeData) => {
    const record = {
      id: employeeData.id,
      name: employeeData.name,
      schedule: { date: currentDate, shift: employeeData.shift },
      signIn: employeeData.signIn,
      signOut: employeeData.signOut,
      breakIn: employeeData.breakIn,
      breakOut: employeeData.breakOut,
    };
    setEditingAttendanceRecord(record);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAttendanceRecord(null);
  };
  
  const handleSaveEditedTime = (empId, date, updatedTimes) => {
    setAttendanceLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.empId === empId && log.date === date);
      const newLogData = {
        empId, date,
        signIn: updatedTimes.signIn || null,
        signOut: updatedTimes.signOut || null,
        breakIn: updatedTimes.breakIn || null,
        breakOut: updatedTimes.breakOut || null,
      };
      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = newLogData;
        return updatedLogs;
      }
      return [...prevLogs, newLogData];
    });
    handleCloseEditModal();
  };
  
  const handleExport = () => {
    if (!sortedAndFilteredList || sortedAndFilteredList.length === 0) {
      alert("No data to export.");
      return;
    }
    const dataToExport = sortedAndFilteredList.map(emp => ({
      'Employee ID': emp.id,
      'Name': emp.name,
      'Position': emp.position,
      'Shift': emp.shift,
      'Sign In': emp.signIn || '',
      'Break Out': emp.breakOut || '',
      'Break In': emp.breakIn || '',
      'Sign Out': emp.signOut || '',
      'Status': emp.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `Attendance_${currentDate}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const importedData = XLSX.utils.sheet_to_json(worksheet);
          
          const newLogs = [...attendanceLogs];
          let updatedCount = 0;

          importedData.forEach(row => {
            const empId = row['Employee ID']?.toString();
            if (!empId) return;

            const isScheduled = dailyAttendanceList.some(emp => emp.id === empId);
            if (!isScheduled) return;

            const existingLogIndex = newLogs.findIndex(log => log.empId === empId && log.date === currentDate);
            
            const logUpdate = {
              signIn: row['Sign In'] || null,
              signOut: row['Sign Out'] || null,
              breakIn: row['Break In'] || null,
              breakOut: row['Break Out'] || null,
            };
            
            if (existingLogIndex > -1) {
              newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], ...logUpdate };
            } else {
              newLogs.push({ empId, date: currentDate, ...logUpdate });
            }
            updatedCount++;
          });

          setAttendanceLogs(newLogs);
          alert(`${updatedCount} records were updated/imported for ${currentDate}.`);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          alert("Failed to process the Excel file. Please ensure it is a valid format.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = null;
  };
  
  const uniquePositions = useMemo(() => ['All Positions', ...new Set(dailyAttendanceList.map(item => item.position))], [dailyAttendanceList]);

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header attendance-page-header d-flex justify-content-between align-items-md-center p-3">
        <h1 className="page-main-title m-0">Attendance Management</h1>
        <div className="d-flex align-items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleImport} className="d-none" accept=".xlsx, .xls, .csv" />
            <button className="btn btn-outline-secondary" onClick={handleImportClick}><i className="bi bi-upload me-2"></i>Import</button>
            <button className="btn btn-outline-secondary" onClick={handleExport} disabled={activeView === 'historyList' || !sortedAndFilteredList || sortedAndFilteredList.length === 0}><i className="bi bi-download me-2"></i>Export</button>
            <button className="btn btn-outline-secondary" onClick={handleGenerateReport} disabled={activeView === 'historyList' || !sortedAndFilteredList || sortedAndFilteredList.length === 0}>
                <i className="bi bi-file-earmark-text-fill me-2"></i>Generate Report
            </button>
            <div className="attendance-view-controls">
                <button className={`btn ${activeView === 'daily' ? 'active' : ''}`} onClick={() => { setActiveView('daily'); setCurrentDate(new Date().toISOString().split('T')[0]); }}>
                    <i className="bi bi-calendar-day me-2"></i>Daily
                </button>
                <button className={`btn ${activeView.startsWith('history') ? 'active' : ''}`} onClick={() => setActiveView('historyList')}>
                    <i className="bi bi-clock-history me-2"></i>History
                </button>
            </div>
        </div>
      </header>
      
      <div className="attendance-page-content">
        {(activeView === 'daily' || activeView === 'historyDetail') && (
          <>
            <div className="daily-view-header-bar">
              <div className="date-picker-group">
                {activeView === 'historyDetail' ? (
                  <button className="btn btn-outline-secondary" onClick={() => setActiveView('historyList')}>
                    <i className="bi bi-arrow-left"></i> Back to History
                  </button>
                ) : (
                  <div>
                    <label htmlFor="daily-date-picker" className="date-label">VIEWING DATE</label>
                    <input id="daily-date-picker" type="date" className="form-control" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="stat-cards-group">
                <div className={`stat-card scheduled ${!statusFilter ? 'active' : ''}`} onClick={() => handleStatusFilterClick('')}>
                  <span className="stat-value">{dailyAttendanceList.length}</span>
                  <span className="stat-label">Scheduled</span>
                </div>
                <div className={`stat-card present ${statusFilter === 'Present' ? 'active' : ''}`} onClick={() => handleStatusFilterClick('Present')}>
                  <span className="stat-value">{dailyAttendanceList.filter(e => e.status === 'Present').length}</span>
                  <span className="stat-label">Present</span>
                </div>
                <div className={`stat-card late ${statusFilter === 'Late' ? 'active' : ''}`} onClick={() => handleStatusFilterClick('Late')}>
                  <span className="stat-value">{dailyAttendanceList.filter(e => e.status === 'Late').length}</span>
                  <span className="stat-label">Late</span>
                </div>
                <div className={`stat-card absent ${statusFilter === 'Absent' ? 'active' : ''}`} onClick={() => handleStatusFilterClick('Absent')}>
                  <span className="stat-value">{dailyAttendanceList.filter(e => e.status === 'Absent').length}</span>
                  <span className="stat-label">Absent</span>
                </div>
              </div>
              <div className="filters-group">
                <select className="form-select" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
                  {uniquePositions.map(pos => <option key={pos} value={pos === 'All Positions' ? '' : pos}>{pos}</option>)}
                </select>
              </div>
            </div>

            {sortedAndFilteredList.length > 0 ? (
                <div className="card data-table-card shadow-sm">
                    <div className="table-responsive">
                        <table className="table data-table mb-0">
                            <thead><tr>
                                <th className="sortable" onClick={() => handleRequestSort('id')}>ID {getSortIcon('id')}</th>
                                <th className="sortable" onClick={() => handleRequestSort('name')}>Employee Name {getSortIcon('name')}</th>
                                <th>Position</th>
                                <th className="sortable" onClick={() => handleRequestSort('shift')}>Shift {getSortIcon('shift')}</th>
                                <th className="sortable" onClick={() => handleRequestSort('signIn')}>Sign In {getSortIcon('signIn')}</th>
                                <th className="sortable" onClick={() => handleRequestSort('breakOut')}>Break Out {getSortIcon('breakOut')}</th>
                                <th className="sortable" onClick={() => handleRequestSort('breakIn')}>Break In {getSortIcon('breakIn')}</th>
                                <th className="sortable" onClick={() => handleRequestSort('signOut')}>Sign Out {getSortIcon('signOut')}</th>
                                <th className="sortable" onClick={() => handleRequestSort('workingHours')}>Hours {getSortIcon('workingHours')}</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr></thead>
                            <tbody>{sortedAndFilteredList.map((emp) => (
                                <tr key={emp.scheduleId}>
                                    <td>{emp.id}</td><td>{emp.name}</td><td>{emp.position}</td><td>{emp.shift}</td>
                                    <td>{emp.signIn || '---'}</td><td>{emp.breakOut || '---'}</td><td>{emp.breakIn || '---'}</td><td>{emp.signOut || '---'}</td><td>{emp.workingHours}</td>
                                    <td><span className={`status-badge status-${emp.status.toLowerCase()}`}>{emp.status}</span></td>
                                    <td>
                                    <div className="dropdown">
                                        <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Actions</button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                            <li><h6 className="dropdown-header">Log Current Time</h6></li>
                                            <li><a className={`dropdown-item ${emp.signIn ? 'disabled' : ''}`} href="#" onClick={(e) => { e.preventDefault(); if (!emp.signIn) handleLogTime(emp.id, 'signIn'); }}>Sign In</a></li>
                                            <li><a className={`dropdown-item ${!emp.signIn || emp.breakOut || emp.signOut ? 'disabled' : ''}`} href="#" onClick={(e) => { e.preventDefault(); if (emp.signIn && !emp.breakOut && !emp.signOut) handleLogTime(emp.id, 'breakOut'); }}>Break Out</a></li>
                                            <li><a className={`dropdown-item ${!emp.breakOut || emp.breakIn || emp.signOut ? 'disabled' : ''}`} href="#" onClick={(e) => { e.preventDefault(); if (emp.breakOut && !emp.breakIn && !emp.signOut) handleLogTime(emp.id, 'breakIn'); }}>Break In</a></li>
                                            <li><a className={`dropdown-item ${!emp.signIn || emp.signOut ? 'disabled' : ''}`} href="#" onClick={(e) => { e.preventDefault(); if (emp.signIn && !emp.signOut) handleLogTime(emp.id, 'signOut'); }}>Sign Out</a></li>
                                            <li><hr className="dropdown-divider"/></li>
                                            <li><a className="dropdown-item" href="#" onClick={(e) => {e.preventDefault(); handleOpenEditModal(emp)}}>Edit Times</a></li>
                                        </ul>
                                    </div>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center p-5 bg-light rounded d-flex flex-column justify-content-center" style={{minHeight: '300px'}}>
                    <i className="bi bi-calendar-check fs-1 text-muted mb-3 d-block"></i>
                    <h4 className="text-muted">{dailyAttendanceList.length > 0 && (positionFilter || statusFilter) ? 'No employees match filters.' : 'No Employees Scheduled'}</h4>
                    <p className="text-muted">{dailyAttendanceList.length > 0 && (positionFilter || statusFilter) ? 'Try adjusting your filters.' : 'There is no schedule created for this day.'}</p>
                </div>
            )}
          </>
        )}
        {activeView === 'historyList' && (
          <>
            <h4 className="mb-3">Attendance History</h4>
            {attendanceHistory.length > 0 ? (
              <div className="attendance-history-grid">
                {attendanceHistory.map(day => (
                  <div key={day.date} className="attendance-history-card" onClick={() => handleViewHistoryDetail(day.date)}>
                    <div className="card-header"><h5 className="card-title">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h5></div>
                    <div className="card-body">
                      <div className="info-grid">
                        <div className="info-item scheduled"><span className="value">{day.total}</span><span className="label">Scheduled</span></div>
                        <div className="info-item present"><span className="value">{day.present - day.late}</span><span className="label">Present</span></div>
                        <div className="info-item late"><span className="value">{day.late}</span><span className="label">Late</span></div>
                        <div className="info-item absent"><span className="value">{day.absent}</span><span className="label">Absent</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted">No historical attendance data found.</p>}
          </>
        )}
      </div>

      <ReportPreviewModal 
        show={showReportModal} 
        onClose={() => setShowReportModal(false)}
        pdfDataUri={pdfDataUri}
        reportTitle={`Daily_Attendance_Report_${currentDate}`}
      />
      {showEditModal && (
        <EditAttendanceModal
          show={showEditModal}
          onClose={handleCloseEditModal}
          onSave={handleSaveEditedTime}
          attendanceRecord={editingAttendanceRecord}
        />
      )}
    </div>
  );
};

export default AttendancePage;