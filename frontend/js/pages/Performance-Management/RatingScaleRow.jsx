import React from 'react';

const RatingScaleRow = ({ competency, scoreData, onScoreChange }) => {
  const rating = scoreData?.score || 0;

  return (
    <div className="rating-scale-row">
      <div className="competency-info">
        <p className="competency-name">{competency.name}</p>
        <p className="competency-description">{competency.description}</p>
      </div>
      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            className={`btn rating-btn ${rating === value ? 'active' : ''}`}
            onClick={() => onScoreChange(competency.id, 'score', value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="rating-comment">
        <input 
          type="text" 
          className="form-control form-control-sm"
          placeholder="Add specific comments (optional)..."
          value={scoreData?.comments || ''}
          onChange={(e) => onScoreChange(competency.id, 'comments', e.target.value)}
        />
      </div>
    </div>
  );
};

export default RatingScaleRow;