import React, { useState, useMemo, useEffect } from 'react';
import './MyPayrollPage.css';
import { payrollAPI } from '../../services/api';

const formatCurrency = (value) => Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

const MyPayrollProjectionPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const day = new Date().getDate();
    return day >= 11 && day <= 25 ? '2' : '1';
  });

  const [projectionData, setProjectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const fetchProjection = async () => {
      try {
        setIsLoading(true);
        setError('');
        const { data } = await payrollAPI.myProjection({
          year: selectedYear,
          month: selectedMonth,
          period: selectedPeriod,
        });

        if (isCancelled) return;

        const projection = data?.projection;
        if (projection) {
          setProjectionData({
            totalGross: Number(projection.totalGross ?? 0),
            breakdown: Array.isArray(projection.breakdown) ? projection.breakdown : [],
            cutOff: projection.cutOff ?? data?.period?.label,
          });
        } else {
          setProjectionData(null);
        }
      } catch (err) {
        if (isCancelled) return;
        const message = err.response?.data?.message ?? 'Failed to load payroll projection.';
        setError(message);
        setProjectionData(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProjection();

    return () => {
      isCancelled = true;
    };
  }, [selectedYear, selectedMonth, selectedPeriod]);

  const breakdown = Array.isArray(projectionData?.breakdown) ? projectionData.breakdown : [];

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
      
      {isLoading && (
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4 text-center text-muted">
            Calculating projection...
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="alert alert-danger mt-4" role="alert">{error}</div>
      )}

      {!isLoading && !error && projectionData && (
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
                            {breakdown.length > 0 ? breakdown.map((day, index) => (
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