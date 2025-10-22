import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import ScoreDonutChart from '../pages/Performance-Management/ScoreDonutChart';
import StarRating from '../pages/Performance-Management/StarRating';
import ScoreIndicator from '../pages/Performance-Management/ScoreIndicator';
import './ViewEvaluationModal.css';
import { evaluationFactorsConfig } from '../config/evaluation.config';
import placeholderAvatar from '../assets/placeholder-profile.jpg';

const ViewEvaluationModal = ({
    show,
    onClose,
    evaluationContext,
    employeeHistoryContext,
    employees,
    positions,
    evaluations,
    evaluationFactors,
    periodSummary,
    periodResponses = [],
    onSelectPeriod,
    onLoadEvaluationDetail,
    isLoadingPeriodResponses = false,
    isLoadingResponseDetail = false,
}) => {
    const [view, setView] = useState('history'); // 'history', 'list', or 'detail'
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
    const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p.title])), [positions]);

    const factorsCatalog = useMemo(() => {
        if (evaluationFactors && evaluationFactors.length > 0) {
            return evaluationFactors;
        }
        return evaluationFactorsConfig;
    }, [evaluationFactors]);
    
    // Determine the primary context and subject employee
    const primaryContext = useMemo(() => employeeHistoryContext || evaluationContext, [employeeHistoryContext, evaluationContext]);
    const subjectEmployee = useMemo(() => {
        if (!primaryContext) return null;
        return employeeMap.get(primaryContext.employeeId) || primaryContext.employee || null;
    }, [primaryContext, employeeMap]);

    // Initialize modal state based on the context provided
    useEffect(() => {
        if (!show) return;

        const historyEntries = employeeHistoryContext?.history || [];

        if (periodResponses.length > 0) {
            setSelectedEvaluation(periodResponses[0]);
            setView('list');
            return;
        }

        if (evaluationContext && !employeeHistoryContext) {
            setSelectedEvaluation(evaluationContext);
            setView('list');
            return;
        }

        if (historyEntries.length > 0) {
            setSelectedEvaluation(null);
            setView('history');
        }
    }, [show, employeeHistoryContext, evaluationContext, periodResponses]);

    useEffect(() => {
        if (!show) return;
        if (periodResponses.length > 0) {
            setSelectedEvaluation(periodResponses[0]);
            setView('list');
        }
    }, [periodResponses, show]);

    // Derived data for the 'history' view
    const employeeHistory = useMemo(() => {
        if (!employeeHistoryContext) return [];

        const historyEntries = employeeHistoryContext.history || [];
        if (!historyEntries.length) return [];

        const groupedByPeriod = historyEntries.reduce((acc, ev) => {
            const periodKey = `${ev.periodStart}_${ev.periodEnd}`;
            if (!acc[periodKey]) {
                acc[periodKey] = { periodStart: ev.periodStart, periodEnd: ev.periodEnd, evals: [] };
            }
            acc[periodKey].evals.push(ev);
            return acc;
        }, {});

        return Object.values(groupedByPeriod).sort((a,b) => new Date(b.periodStart) - new Date(a.periodStart));
    }, [employeeHistoryContext]);

    // Derived data for the 'list' view
    const { positionTitle, evaluatorList, currentPeriodContext } = useMemo(() => {
        const baseContext = selectedEvaluation
            || evaluationContext
            || (employeeHistoryContext?.history?.[0] ?? null);

        if (!baseContext || !subjectEmployee) {
            return { positionTitle: '', evaluatorList: [], currentPeriodContext: null };
        }

        const title = positionMap.get(subjectEmployee.positionId) || 'Unassigned';
        const buildEvaluator = (rawEvaluator, fallbackId) => {
            const evaluatorFromMap = fallbackId ? employeeMap.get(fallbackId) : null;
            const source = evaluatorFromMap || rawEvaluator || null;

            if (!source) return null;

            const firstName = source.first_name ?? source.firstName ?? null;
            const middleName = source.middle_name ?? source.middleName ?? null;
            const lastName = source.last_name ?? source.lastName ?? null;
            const name = source.name || [firstName, middleName, lastName].filter(Boolean).join(' ');
            const positionName = source.position
                || (source.positionId ? positionMap.get(source.positionId) : null)
                || source.position_name
                || (source.position?.name ?? null)
                || 'N/A';
            const imageUrl = source.imageUrl
                || source.profilePictureUrl
                || (source.image_url ? `${source.image_url.startsWith('http') ? '' : ''}${source.image_url}` : null);

            return {
                id: source.id ?? fallbackId ?? null,
                name: name || 'Unknown Evaluator',
                position: positionName,
                positionId: source.positionId ?? source.position_id ?? null,
                imageUrl,
            };
        };

        const evaluatorEntries = periodResponses.length > 0
            ? periodResponses.map(ev => ({
                evaluator: buildEvaluator(ev.evaluator, ev.evaluatorId),
                evaluation: ev,
            }))
            : [{
                evaluator: buildEvaluator(baseContext?.evaluator, baseContext?.evaluatorId),
                evaluation: baseContext,
            }];

        return { positionTitle: title, evaluatorList: evaluatorEntries, currentPeriodContext: baseContext };
    }, [selectedEvaluation, evaluationContext, employeeHistoryContext, periodResponses, employeeMap, positionMap, subjectEmployee]);

    if (!show || !subjectEmployee) return null;

    const handleSelectPeriod = (period) => {
        if (!period) return;
        const firstEval = period.evals?.[0];
        if (firstEval) {
            setSelectedEvaluation(firstEval);
            setView('list');
            onSelectPeriod?.(firstEval);
        }
    };

    const handleViewDetails = async (evaluation) => {
        if (!evaluation || evaluation.isPlaceholder) return;

        setView('detail');

        if (!onLoadEvaluationDetail) {
            setSelectedEvaluation(evaluation);
            return;
        }

        setIsDetailLoading(true);
        try {
            const detail = await onLoadEvaluationDetail(evaluation.id);

            if (detail) {
                setSelectedEvaluation(prev => ({
                    ...evaluation,
                    ...detail,
                    factorScores: detail.factorScores || evaluation.factorScores || {},
                    commentSummary: detail.commentSummary ?? evaluation.commentSummary,
                    commentDevelopment: detail.commentDevelopment ?? evaluation.commentDevelopment,
                    evaluator: detail.evaluator || evaluation.evaluator || null,
                    overallScore: typeof detail.overallScore === 'number' ? detail.overallScore : evaluation.overallScore,
                    periodStart: detail.periodStart || evaluation.periodStart,
                    periodEnd: detail.periodEnd || evaluation.periodEnd,
                    periodName: detail.periodName || evaluation.periodName,
                }));
            } else {
                setSelectedEvaluation(evaluation);
            }
        } finally {
            setIsDetailLoading(false);
        }
    };
    
    const handleBackToList = () => {
        setView(employeeHistoryContext ? 'history' : 'list');
        setSelectedEvaluation(null); // Clear detailed selection
    };
    
    const handleBackToHistory = () => {
        setView('history');
        setSelectedEvaluation(null);
    };

    // --- RENDER FUNCTIONS ---
    const renderHistoryView = () => (
        <>
            <div className="modal-header"><h5 className="modal-title">Evaluation History for {subjectEmployee.name}</h5></div>
            <div className="modal-body evaluator-list-body">
                <p className="text-muted">Showing all evaluation periods for this employee. Select a period to view the evaluators.</p>
                <div className="evaluator-list">
                    {employeeHistory.map(period => {
                        const responseCount = period.evals[0]?.responsesCount ?? period.evals.filter(ev => !ev.isPlaceholder).length;
                        return (
                        <div key={`${period.periodStart}-${period.periodEnd}`} className="evaluator-card period-card" onClick={() => handleSelectPeriod(period)}>
                            <div className="evaluator-info">
                                <i className="bi bi-calendar-range fs-4 text-primary"></i>
                                <div>
                                    <div className="evaluator-name">{period.periodStart} to {period.periodEnd}</div>
                                    <div className="evaluator-position">{responseCount} submission(s)</div>
                                </div>
                            </div>
                            <div className="evaluation-actions">
                                <button className="btn btn-sm btn-outline-primary">View</button>
                            </div>
                        </div>
                    );
                    })}
                </div>
            </div>
        </>
    );

    const renderListView = () => (
        <>
            <div className="modal-header">
                {employeeHistoryContext && <button className="btn btn-sm btn-light me-2 back-to-list-btn" onClick={handleBackToHistory}><i className="bi bi-arrow-left"></i></button>}
                <div className="header-info">
                    <h5 className="modal-title">Evaluations for {subjectEmployee.name}</h5>
                    {currentPeriodContext ? (
                        <p className="text-muted mb-0">Period: {currentPeriodContext.periodStart} to {currentPeriodContext.periodEnd}</p>
                    ) : (
                        <p className="text-muted mb-0">Select a period to view evaluator responses.</p>
                    )}
                </div>
            </div>
            <div className="modal-body evaluator-list-body">
                {!currentPeriodContext ? (
                    <div className="text-center text-muted">No evaluation period selected.</div>
                ) : evaluatorList.length === 0 || evaluatorList.every(item => item.evaluation.isPlaceholder) ? (
                    <div className="text-center text-muted">No evaluations submitted for this period yet.</div>
                ) : (
                    evaluatorList.map(({ evaluator, evaluation }) => (
                        <div key={evaluation.id} className="evaluator-card">
                            <div className="evaluator-info">
                                {evaluator ? (
                                    <>
                                        <img src={evaluator.imageUrl || placeholderAvatar} alt={evaluator.name} className="evaluator-avatar" />
                                        <div>
                                            <div className="evaluator-name">{evaluator.name}</div>
                                            <div className="evaluator-position">{evaluator.position || (evaluator.positionId ? positionMap.get(evaluator.positionId) : null) || 'N/A'}</div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <div className="evaluator-name">Pending evaluator submission</div>
                                        <div className="evaluator-position text-muted">Awaiting response</div>
                                    </div>
                                )}
                            </div>
                            <div className="evaluation-summary">
                                {typeof evaluation.overallScore === 'number'
                                    ? <ScoreIndicator score={evaluation.overallScore} />
                                    : <span className="text-muted">N/A</span>}
                            </div>
                            <div className="evaluation-actions">
                                {!evaluation.isPlaceholder && (
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetails(evaluation)}>View Evaluation</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    const renderDetailView = () => {
        if (!selectedEvaluation) {
            return (
                <>
                    <div className="modal-header">
                        <button className="btn btn-sm btn-light me-2 back-to-list-btn" onClick={handleBackToList}><i className="bi bi-arrow-left"></i></button>
                        <div className="header-info">
                            <h5 className="modal-title">Evaluation details</h5>
                            <p className="text-muted mb-0">Select an evaluation to see the details.</p>
                        </div>
                    </div>
                    <div className="modal-body text-center text-muted" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        No evaluation selected.
                    </div>
                </>
            );
        }
        
        const evaluator = employeeMap.get(selectedEvaluation.evaluatorId) || selectedEvaluation.evaluator || null;
        const criteria = factorsCatalog.filter(f => f.type === 'criterion');
        const textAreas = factorsCatalog.filter(f => f.type === 'textarea');
        const getFactorData = (factorId) => selectedEvaluation.factorScores?.[factorId] || {};

        return (
            <>
                <div className="modal-header">
                    <button className="btn btn-sm btn-light me-2 back-to-list-btn" onClick={handleBackToList}><i className="bi bi-arrow-left"></i></button>
                    <ScoreDonutChart score={selectedEvaluation.overallScore} />
                    <div className="header-info">
                        <h5 className="modal-title">{subjectEmployee.name}</h5>
                        <p className="text-muted mb-0">Period: {selectedEvaluation.periodStart} to {selectedEvaluation.periodEnd}</p>
                        {evaluator && (
                            <div className="evaluator-info d-flex align-items-center gap-2">
                                <img src={evaluator.imageUrl || placeholderAvatar} alt={evaluator.name} className="evaluator-avatar" />
                                <div>
                                    <div><strong>{evaluator.name}</strong></div>
                                    <small className="text-muted">{evaluator.position || (evaluator.positionId ? positionMap.get(evaluator.positionId) : null) || 'N/A'}</small>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                    {(isDetailLoading || isLoadingResponseDetail) && (
                        <div className="text-center text-muted py-4">Loading evaluation details…</div>
                    )}

                    {!(isDetailLoading || isLoadingResponseDetail) && criteria.map(criterion => (
                        <div className="card mb-3" key={criterion.id}><div className="card-header fw-bold">{criterion.title}</div>
                            <ul className="list-group list-group-flush">
                                {criterion.items.map(item => {
                                    const data = getFactorData(item.id);
                                    return (
                                    <li key={item.id} className="list-group-item">
                                        <div className="evaluation-item">
                                            <div className="evaluation-item-info"><p className="name mb-0">{item.title}</p>{data.comments && <p className="comment mb-0">"{data.comments}"</p>}</div>
                                            <div className="evaluation-item-score"><StarRating score={data.score || 0} onRate={() => {}} /></div>
                                        </div>
                                    </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}

                    {!(isDetailLoading || isLoadingResponseDetail) && textAreas.length > 0 && (
                        <div className="card">
                            <div className="card-body">
                                {textAreas.map(area => {
                                    const data = getFactorData(area.id);
                                    const value = data.comments || selectedEvaluation[area.id === 'factor_evaluator_summary' ? 'commentSummary' : area.id === 'factor_development_areas' ? 'commentDevelopment' : ''];
                                    if (!value) return null;
                                    return (
                                        <div key={area.id} className="mb-3">
                                            <h6 className="fw-bold mb-1">{area.title}</h6>
                                            <p className="text-muted mb-0">{value}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    };

    const renderContent = () => {
        switch (view) {
            case 'history': return renderHistoryView();
            case 'list': return renderListView();
            case 'detail': return renderDetailView();
            default: return null;
        }
    };

    return (
        <div className="modal fade show d-block view-evaluation-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    {renderContent()}
                    <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button></div>
                </div>
            </div>
        </div>
    );
};

export default ViewEvaluationModal;