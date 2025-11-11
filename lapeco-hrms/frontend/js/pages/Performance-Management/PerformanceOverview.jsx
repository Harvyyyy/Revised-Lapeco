import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import ScoreIndicator from './ScoreIndicator';
import placeholderAvatar from '../../assets/placeholder-profile.jpg';
import { performanceAPI } from '../../services/api';

const PerformanceOverview = ({ 
  employees = [], 
  positions = [], 
  evaluations = [], 
  theme = {},
  onGenerateReport,
  onViewEvaluation,
  onShowToast
}) => {
  const [overviewData, setOverviewData] = useState([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [evaluationPeriods, setEvaluationPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('all');
  const [isLoadingPeriodData, setIsLoadingPeriodData] = useState(false);
  const [periodEvaluations, setPeriodEvaluations] = useState([]);

  const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p.title])), [positions]);


  const overviewStats = useMemo(() => {
    if (overviewData.length === 0) return { totalEmployees: 0, avgScore: 0, employeesWithScores: 0 };
    const employeesWithScores = overviewData.filter(emp => typeof emp.combinedAverageScore === 'number' && !Number.isNaN(emp.combinedAverageScore));
    const avgScore = employeesWithScores.length > 0 
      ? employeesWithScores.reduce((sum, emp) => sum + (emp.combinedAverageScore * 20), 0) / employeesWithScores.length 
      : 0;
    return { 
      totalEmployees: overviewData.length, 
      avgScore: avgScore,
      employeesWithScores: employeesWithScores.length
    };
  }, [overviewData]);

  const overviewPerformanceBrackets = useMemo(() => {
    const brackets = { 'Needs Improvement': 0, 'Meets Expectations': 0, 'Outstanding': 0 };
    overviewData.forEach(emp => {
      const score = typeof emp.combinedAverageScore === 'number' && !Number.isNaN(emp.combinedAverageScore)
        ? emp.combinedAverageScore * 20
        : null;
      if (typeof score !== 'number' || Number.isNaN(score)) return;
      if (score < 70) brackets['Needs Improvement']++;
      else if (score < 90) brackets['Meets Expectations']++;
      else brackets['Outstanding']++;
    });
    return brackets;
  }, [overviewData]);

  const periodAwarePerformanceBrackets = useMemo(() => {
    const brackets = { 'Needs Improvement': 0, 'Meets Expectations': 0, 'Outstanding': 0 };

    const bucketByScore = (scorePct) => {
      if (typeof scorePct !== 'number' || Number.isNaN(scorePct)) return;
      if (scorePct < 70) brackets['Needs Improvement']++;
      else if (scorePct < 90) brackets['Meets Expectations']++;
      else brackets['Outstanding']++;
    };

    if (selectedPeriodId && selectedPeriodId !== 'all' && periodEvaluations.length > 0) {
      periodEvaluations.forEach(ev => {
        let avg = ev?.averageScore;
        if (avg === null || avg === undefined) {
          const resp = Array.isArray(ev.responses) ? ev.responses : [];
          if (resp.length) {
            const sum = resp.reduce((s, r) => s + (Number(r.overallScore) || 0), 0);
            avg = sum / resp.length;
          }
        }
        const pct = typeof avg === 'number' ? avg * 20 : null;
        bucketByScore(pct);
      });
    } else {
      Object.entries(overviewPerformanceBrackets).forEach(([label, count]) => {
        brackets[label] = count;
      });
    }
    return brackets;
  }, [overviewPerformanceBrackets, selectedPeriodId, periodEvaluations]);

  const chartTextColor = theme === 'dark' ? '#adb5bd' : '#6c757d';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const overviewChartData = {
    labels: Object.keys(periodAwarePerformanceBrackets),
    datasets: [{
      label: 'Number of Employees',
      data: Object.values(periodAwarePerformanceBrackets),
      backgroundColor: ['#dc3545', '#ffc107', '#198754'],
    }],
  };

  const normalizePeriod = useCallback((period = {}) => ({
    id: period.id,
    name: period.name || '',
    evaluationStart: period.evaluationStart || period.evaluation_start || '',
    evaluationEnd: period.evaluationEnd || period.evaluation_end || '',
    openDate: period.openDate || period.open_date || period.activationStart || '',
    closeDate: period.closeDate || period.close_date || period.activationEnd || '',
    status: period.status,
  }), []);

  const refreshPeriods = async () => {
    try {
      const response = await performanceAPI.getEvaluationPeriods();
      const payload = response.data || {};
      const periods = Array.isArray(payload.evaluationPeriods) ? payload.evaluationPeriods.map(normalizePeriod) : [];
      setEvaluationPeriods(periods);
    } catch (error) {
      console.error('Failed to load evaluation periods', error);
    }
  };

  const refreshPeriodEvaluations = async (periodId) => {
    if (!periodId || periodId === 'all') {
      setPeriodEvaluations([]);
      return;
    }
    try {
      setIsLoadingPeriodData(true);
      const response = await performanceAPI.getPeriodicEvaluations(periodId);
      const payload = response.data || {};
      const fetchedPeriod = payload.period || {};
      const normalizedEvaluations = Array.isArray(fetchedPeriod.evaluations)
        ? fetchedPeriod.evaluations.map(ev => ({
            id: ev.id,
            employeeId: ev.employeeId,
            averageScore: ev.averageScore,
            responsesCount: ev.responsesCount ?? (Array.isArray(ev.responses) ? ev.responses.length : 0),
            responses: Array.isArray(ev.responses)
              ? ev.responses.map(resp => ({
                  overallScore: resp.overallScore,
                }))
              : [],
          }))
        : [];
      setPeriodEvaluations(normalizedEvaluations);
    } catch (error) {
      console.error('Failed to load evaluations for selected period', error);
      setPeriodEvaluations([]);
      onShowToast?.({ message: 'Failed to load period evaluations.', type: 'error' });
    } finally {
      setIsLoadingPeriodData(false);
    }
  };

  const chartOptions = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#212529' : '#ffffff',
        titleColor: theme === 'dark' ? '#f8f9fa' : '#212529',
        bodyColor: theme === 'dark' ? '#f8f9fa' : '#212529',
        borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
        borderWidth: 1,
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: chartTextColor }, grid: { color: gridColor } },
      x: { ticks: { color: chartTextColor }, grid: { display: false } },
    },
  };


  const refreshOverview = async () => {
    try {
      setIsLoadingOverview(true);
      const response = await performanceAPI.getOverview();
      setOverviewData(response.data?.employees || []);
    } catch (error) {
      console.error('Failed to load performance overview', error);
      if (onShowToast) {
        onShowToast({ message: 'Failed to load performance overview.', type: 'error' });
      }
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (overviewData.length === 0) {
      refreshOverview();
    }
  }, []);

  useEffect(() => {
    refreshPeriods();
  }, []);

  useEffect(() => {
    refreshPeriodEvaluations(selectedPeriodId);
  }, [selectedPeriodId]);

  return (
    <div className="performance-dashboard-layout-revised">
      {isLoadingOverview ? (
        <div className="text-center p-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading performance overview...</p>
        </div>
      ) : (
        <>
          <div className="stat-card-grid-revised">
            <div className="stat-card-revised">
              <div className="stat-icon"><i className="bi bi-people-fill"></i></div>
              <div className="stat-info">
                <div className="stat-value">{overviewStats.totalEmployees}</div>
                <div className="stat-label">Total Active Employees</div>
              </div>
            </div>
            <div className="stat-card-revised">
              <div className="stat-icon"><i className="bi bi-reception-4"></i></div>
              <div className="stat-info">
                <div className="stat-value">{overviewStats.avgScore.toFixed(1)}<strong>%</strong></div>
                <div className="stat-label">Average Performance Score</div>
              </div>
            </div>
            <div className="stat-card-revised">
              <div className="stat-icon"><i className="bi bi-journal-check"></i></div>
              <div className="stat-info">
                <div className="stat-value">{overviewStats.employeesWithScores}</div>
                <div className="stat-label">Employees with Scores</div>
              </div>
            </div>
          </div>

          <div className="analysis-grid-full-width">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0"><i className="bi bi-bar-chart-line-fill me-2"></i>Performance Distribution</h6>
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="periodSelect" className="small text-muted">Select Period</label>
                  <select
                    id="periodSelect"
                    className="form-select form-select-sm"
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    style={{ maxWidth: '240px' }}
                  >
                    <option value="all">All Periods</option>
                    {evaluationPeriods.map(p => (
                      <option key={p.id} value={String(p.id)}>{p.name || `${p.evaluationStart} - ${p.evaluationEnd}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="card-body" style={{ height: '280px' }}>
                {isLoadingPeriodData ? (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Bar data={overviewChartData} options={chartOptions} />
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default PerformanceOverview;