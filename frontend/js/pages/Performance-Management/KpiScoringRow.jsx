import React, { useState } from 'react';

const StarRating = ({ score, onRate }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <i
          key={star}
          className={`bi ${score >= star ? 'bi-star-fill' : 'bi-star'}`}
          onClick={() => onRate(star)}
        />
      ))}
    </div>
  );
};

const KpiScoringRow = ({ kpi, scoreData, onScoreChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleScoreChange = (field, value) => {
    onScoreChange(kpi.id, field, value);
  };
  
  return (
    <div className="kpi-scoring-row">
      <div className="kpi-info">
        <p className="kpi-title">{kpi.title} <span className="kpi-weight-display">({kpi.weight}%)</span></p>
        <p className="kpi-description">{kpi.description}</p>
      </div>
      <div className="kpi-scoring">
        <StarRating score={scoreData?.score || 0} onRate={(newScore) => handleScoreChange('score', newScore)} />
      </div>
      <div className="kpi-comments">
        <button className="btn btn-sm btn-light" onClick={() => setIsExpanded(!isExpanded)}>
          <i className={`bi ${isExpanded ? 'bi-chat-dots-fill' : 'bi-chat-dots'}`}></i>
        </button>
      </div>
      {isExpanded && (
        <div className="kpi-comment-box">
          <textarea
            className="form-control"
            rows="2"
            placeholder={`Comments for ${kpi.title}...`}
            value={scoreData?.comments || ''}
            onChange={(e) => handleScoreChange('comments', e.target.value)}
          ></textarea>
        </div>
      )}
    </div>
  );
};

export default KpiScoringRow;