import React, { useState, useMemo } from 'react';
import './MyPayrollPage.css';

const formatCurrency = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1];
};

const MONTHS = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' },
];

const PERIODS = [
    { value: '1', label: '1st Half (26th - 10th)' },
    { value: '2', label: '2nd Half (11th - 25th)' },
];


const MyPayrollProjectionPage = ({ currentUser, positions = [], schedules = [], attendanceLogs = [], holidays = [] }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const day = new Date().getDate();
    return day >= 11 && day <= 25 ? '2' : '1';
  });

  const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);
  const holidayMap = useMemo(() => new Map(holidays.map(h => [h.date, h])), [holidays]);
  const scheduleMap = useMemo(() => new Map(schedules.map(s => [`${s.empId}-${s.date}`, s])), [schedules]);
  const attendanceMap = useMemo(() => new Map(attendanceLogs.map(a => [`${a.empId}-${a.date}`, a])), [attendanceLogs]);
  
  const { startDate, endDate, cutOffString } = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;

    if (selectedPeriod === '1') { // 1st Half: 26th of prev month to 10th of current month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthYear = month === 0 ? year - 1 : year;
        const start = new Date(Date.UTC(prevMonthYear, prevMonth, 26)).toISOString().split('T')[0];
        const end = new Date(Date.UTC(year, month, 10)).toISOString().split('T')[0];
        return { startDate: start, endDate: end, cutOffString: `${start} to ${end}` };
    } else { // 2nd Half: 11th to 25th of current month
        const start = new Date(Date.UTC(year, month, 11)).toISOString().split('T')[0];
        const end = new Date(Date.UTC(year, month, 25)).toISOString().split('T')[0];
        return { startDate: start, endDate: end, cutOffString: `${start} to ${end}` };
    }
  }, [selectedYear, selectedMonth, selectedPeriod]);

  const projectionData = useMemo(() => {
    if (!startDate || !endDate) return null;
    
    const position = positionMap.get(currentUser.positionId);
    if (!position) return null;

    const dailyRate = position.monthlySalary / 22; // Assumption: 22 work days
    let totalGross = 0;
    const breakdown = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999); 

    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        if (d > today) continue;
        
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
        // Skip weekends for calculation unless explicitly scheduled
        const schedule = scheduleMap.get(`${currentUser.id}-${dateStr}`);
        if (!schedule && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
        if (!schedule) continue; // Skip if not scheduled on a weekday either

        const attendance = attendanceMap.get(`${currentUser.id}-${dateStr}`);
        const holiday = holidayMap.get(dateStr);
        let dailyPay = 0;
        let dayStatus = 'Absent';

        if (attendance && attendance.signIn) {
            dailyPay = dailyRate;
            dayStatus = 'Present';
            if (holiday) {
                if (holiday.type === 'Regular Holiday') { dailyPay *= 2; }
                if (holiday.type === 'Special Non-Working Day') { dailyPay *= 1.3; }
                dayStatus = `Worked Holiday (${holiday.name})`;
            }
        }
        totalGross += dailyPay;
        breakdown.push({ date: dateStr, status: dayStatus, pay: dailyPay });
    }
    
    return {
        totalGross, 
        breakdown,
        cutOff: cutOffString
    };
  }, [startDate, endDate, currentUser, positionMap, scheduleMap, attendanceMap, holidayMap]);

  return (
    <div className="payroll-projection-container">
      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          <h5 className="card-title section-title">Select Projection Period</h5>
          <p className="text-secondary">Select a pay period to see your estimated gross income based on your attendance.</p>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label htmlFor="year" className="form-label fw-bold">Year</label>
              <select id="year" className="form-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="month" className="form-label fw-bold">Month</label>
              <select id="month" className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="col-md-5">
              <label htmlFor="period" className="form-label fw-bold">Period</label>
              <select id="period" className="form-select" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {projectionData && (
        <div className="card shadow-sm mt-4">
            <div className="card-body p-4">
                <div className="projection-summary-card">
                    <div className="summary-label">Projected Gross Income</div>
                    <div className="summary-value">₱{formatCurrency(projectionData.totalGross)}</div>
                    <div className="summary-period">For Period: {projectionData.cutOff}</div>
                </div>
                
                <h6 className="mt-4 section-title">Daily Breakdown</h6>
                <div className="table-responsive breakdown-table-container">
                    <table className="table data-table table-sm table-striped mb-0">
                        <thead><tr><th>Date</th><th>Status</th><th className="text-end">Estimated Earning</th></tr></thead>
                        <tbody>
                            {projectionData.breakdown.length > 0 ? projectionData.breakdown.map((day, index) => (
                                <tr key={index}>
                                    <td>{new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                    <td>{day.status}</td>
                                    <td className="text-end">₱{formatCurrency(day.pay)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" className="text-center p-4 text-muted">No attendance data to calculate for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MyPayrollProjectionPage;