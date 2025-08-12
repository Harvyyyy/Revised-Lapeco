import React from 'react';
import RatingScaleRow from './RatingScaleRow';

const CompetencySection = ({ category, competencies, scores, onScoreChange }) => {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">{category}</h5>
      </div>
      <div className="card-body p-0">
        {competencies.map(comp => (
          <RatingScaleRow
            key={comp.id}
            competency={comp}
            scoreData={scores[comp.id]}
            onScoreChange={onScoreChange}
          />
        ))}
      </div>
    </div>
  );
};

export default CompetencySection;