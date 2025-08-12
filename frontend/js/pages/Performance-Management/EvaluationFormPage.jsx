import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import KraEvaluationSection from './KraEvaluationSection';
import CompetencySection from './CompetencySection';
import TextareaSection from './TextareaSection';

const EvaluationFormPage = ({ employees, positions, kras, kpis, evaluationFactors, handlers }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { employeeId, periodStart, periodEnd } = location.state || {};
  const [factorScores, setFactorScores] = useState({});
  
  const employee = useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);
  const position = useMemo(() => positions.find(p => p.id === employee?.positionId), [positions, employee]);

  const relevantKpis = useMemo(() => {
    if (!position) return [];
    return kpis.filter(kpi => kpi.appliesToPositionIds?.includes(position.id));
  }, [kpis, position]);

  const relevantKras = useMemo(() => {
    if (!relevantKpis.length) return [];
    const relevantKraIds = new Set(relevantKpis.map(kpi => kpi.kraId));
    return kras.filter(kra => relevantKraIds.has(kra.id));
  }, [kras, relevantKpis]);

  const ratingScaleFactors = useMemo(() => evaluationFactors.filter(f => f.type === 'rating_scale'), [evaluationFactors]);
  const textareaFactors = useMemo(() => evaluationFactors.filter(f => f.type === 'textarea'), [evaluationFactors]);


  const finalScore = useMemo(() => {
    let kpiTotalScore = 0;
    let kpiTotalWeight = 0;
    relevantKpis.forEach(kpi => {
      kpiTotalScore += ((factorScores[kpi.id]?.score || 0) / 5) * kpi.weight;
      kpiTotalWeight += kpi.weight;
    });

    const kpiOverall = kpiTotalWeight > 0 ? (kpiTotalScore / kpiTotalWeight) * 100 : 0;

    const allRatingItems = ratingScaleFactors.flatMap(f => f.items);
    let ratingTotalScore = 0;
    allRatingItems.forEach(item => {
        ratingTotalScore += factorScores[item.id]?.score || 0;
    });
    const ratingOverall = allRatingItems.length > 0 ? (ratingTotalScore / (allRatingItems.length * 5)) * 100 : 0;

    const score = (kpiOverall * 0.6) + (ratingOverall * 0.4);
    return score.toFixed(2);
  }, [relevantKpis, ratingScaleFactors, factorScores]);

  const handleFactorChange = (itemId, field, value) => {
    setFactorScores(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };
  
  const handleSubmit = () => {
    const {
      factor_manager_summary, 
      factor_employee_feedback, 
      factor_development_plan, 
      ...restScores
    } = factorScores;
    
    const evaluationData = {
      employeeId,
      evaluatorId: 'HR_MGR_01',
      periodStart,
      periodEnd,
      status: 'Completed',
      factorScores: restScores,
      managerComments: factor_manager_summary?.value || '',
      employeeComments: factor_employee_feedback?.value || '',
      developmentPlan: factor_development_plan?.value || '',
      overallScore: parseFloat(finalScore),
    };
    handlers.saveEvaluation(evaluationData);
    alert(`Evaluation for ${employee.name} submitted successfully!`);
    navigate('/dashboard/performance');
  };

  if (!employee || !position) {
    return (
      <div className="container-fluid p-4 text-center">
        <h2>Invalid Evaluation Data</h2>
        <p>Employee or evaluation period not specified.</p>
        <Link to="/dashboard/performance" className="btn btn-primary">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 page-module-container evaluation-form-page">
      <div className="evaluation-header">
        <div className="header-info">
          <p className="text-muted mb-0">PERFORMANCE EVALUATION</p>
          <h1>{employee.name}</h1>
          <p className="text-muted">{position.title} | {periodStart} to {periodEnd}</p>
        </div>
      </div>

      <div className="evaluation-body">
        {evaluationFactors.map(factor => {
          switch (factor.type) {
            case 'rating_scale':
              return (
                <CompetencySection 
                  key={factor.id}
                  category={factor.title}
                  competencies={factor.items}
                  scores={factorScores}
                  onScoreChange={handleFactorChange}
                />
              );
            case 'kpi_section':
              return relevantKras.map(kra => (
                <KraEvaluationSection
                  key={kra.id}
                  kra={kra}
                  kpis={relevantKpis.filter(kpi => kpi.kraId === kra.id)}
                  scores={factorScores}
                  onScoreChange={handleFactorChange}
                />
              ));
            case 'textarea':
              return (
                <TextareaSection
                  key={factor.id}
                  factor={factor}
                  value={factorScores[factor.id]?.value}
                  onValueChange={handleFactorChange}
                />
              );
            default:
              return null;
          }
        })}
      </div>
      
      <div className="evaluation-footer">
        <div className="overall-score">
          Overall Score: <span>{finalScore}%</span>
        </div>
        <div className="footer-actions">
            <button className="btn btn-outline-secondary" onClick={() => navigate('/dashboard/performance')}>Cancel</button>
            <button className="btn btn-success" onClick={handleSubmit}>Submit Evaluation</button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationFormPage;