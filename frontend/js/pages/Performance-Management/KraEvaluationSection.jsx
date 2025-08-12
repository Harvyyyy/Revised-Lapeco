import React, { useMemo } from 'react';
import KpiScoringRow from './KpiScoringRow';

const KraEvaluationSection = ({ kra, kpis, scores, onScoreChange }) => {
  const kraSubtotal = useMemo(() => {
    let totalScore = 0;
    kpis.forEach(kpi => {
      const kpiScoreData = scores[kpi.id];
      const score = kpiScoreData?.score || 0;
      totalScore += (score / 5) * kpi.weight;
    });
    return totalScore.toFixed(2);
  }, [kpis, scores]);

  return (
    <div className="kra-evaluation-section card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{kra.title}</h5>
        <div className="kra-subtotal">
          Subtotal: <strong>{kraSubtotal}%</strong>
        </div>
      </div>
      <div className="card-body p-0">
        {kpis.map(kpi => (
          <KpiScoringRow
            key={kpi.id}
            kpi={kpi}
            scoreData={scores[kpi.id]}
            onScoreChange={onScoreChange}
          />
        ))}
      </div>
    </div>
  );
};

export default KraEvaluationSection;