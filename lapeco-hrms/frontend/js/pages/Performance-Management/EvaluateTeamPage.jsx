import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ViewEvaluationModal from '../../modals/ViewEvaluationModal';
import EvaluationSelectorCard from './EvaluationSelectorCard';
import './EvaluationPages.css';

const EvaluateTeamPage = ({ currentUser, employees, positions, evaluations, kras, kpis, evaluationFactors, activeEvaluationPeriod }) => {
  const navigate = useNavigate();
  const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p.title])), [positions]);
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEvaluation, setViewingEvaluation] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const teamMembersWithStatus = useMemo(() => {
    if (!currentUser?.isTeamLeader) return [];
    
    const team = employees.filter(emp => emp.positionId === currentUser.positionId && !emp.isTeamLeader);

    return team.map(member => {
      const memberEvals = (evaluations || [])
        .filter(ev => ev.employeeId === member.id)
        .sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd));
      
      const lastEvaluation = memberEvals[0] || null;
      let status = 'Due';
      
      if(lastEvaluation) {
        const lastEvalDate = new Date(lastEvaluation.periodEnd);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (lastEvalDate > sixMonthsAgo) {
          status = 'Completed';
        }
      }

      // Find the specific submission for the CURRENT active period
      const submissionForActivePeriod = activeEvaluationPeriod ? memberEvals.find(ev => 
        ev.evaluatorId === currentUser.id &&
        ev.periodStart === activeEvaluationPeriod.evaluationStart &&
        ev.periodEnd === activeEvaluationPeriod.evaluationEnd
      ) : null;
      
      const isEditable = activeEvaluationPeriod ? new Date() <= new Date(activeEvaluationPeriod.activationEnd) : false;

      return { ...member, lastEvaluation, evaluationStatus: status, submissionForActivePeriod, isEditable };
    });
  }, [currentUser, employees, evaluations, activeEvaluationPeriod]);

  const filteredTeamMembers = useMemo(() => {
    return teamMembersWithStatus.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || member.evaluationStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [teamMembersWithStatus, searchTerm, statusFilter]);

  const summaryStats = useMemo(() => ({
    total: teamMembersWithStatus.length,
    due: teamMembersWithStatus.filter(m => m.evaluationStatus === 'Due').length,
    completed: teamMembersWithStatus.filter(m => m.evaluationStatus === 'Completed').length,
  }), [teamMembersWithStatus]);

  const handleAction = (action, data) => {
    if (action === 'start' || action === 'edit') {
      const state = { 
        employeeId: data.employee.id, 
        evaluationStart: activeEvaluationPeriod.evaluationStart,
        evaluationEnd: activeEvaluationPeriod.evaluationEnd
      };
      // If editing, pass the existing evaluation ID
      if (action === 'edit' && data.submission) {
        state.evalId = data.submission.id;
      }
      navigate('/dashboard/performance/evaluate', { state });
    } else if (action === 'review') {
      setViewingEvaluation(data);
      setShowViewModal(true);
    }
  };

  const modalProps = useMemo(() => {
    if (!viewingEvaluation) return null;
    const employee = employeeMap.get(viewingEvaluation.employeeId);
    const position = employee ? positions.find(p => p.id === employee.positionId) : null;
    return { evaluation: viewingEvaluation, employee, position };
  }, [viewingEvaluation, employeeMap, positions]);

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header mb-4">
        <h1 className="page-main-title">Evaluate Team</h1>
        <p className="page-subtitle text-muted">Manage and conduct performance evaluations for your team members.</p>
      </header>

      {activeEvaluationPeriod ? (
        <div className="alert alert-success d-flex align-items-center" role="alert">
          <i className="bi bi-broadcast-pin me-3 fs-4"></i>
          <div>
            <h6 className="alert-heading mb-0">ACTIVE: {activeEvaluationPeriod.name}</h6>
            <small>You are evaluating performance for the period of <strong>{activeEvaluationPeriod.evaluationStart} to {activeEvaluationPeriod.evaluationEnd}</strong>. Submissions are open until <strong>{activeEvaluationPeriod.activationEnd}</strong>.</small>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
          <div>
            <h6 className="alert-heading mb-0">Evaluations Currently Closed</h6>
            <small>There is no active evaluation period. Please wait for HR to open a new evaluation cycle.</small>
          </div>
        </div>
      )}

      <div className="status-summary-bar">
        <div className={`summary-card interactive ${statusFilter === 'All' ? 'active' : ''}`} onClick={() => setStatusFilter('All')}>
            <div className="summary-icon icon-team"><i className="bi bi-people-fill"></i></div>
            <div className="summary-info">
                <span className="summary-value">{summaryStats.total}</span>
                <span className="summary-label"> Total Members</span>
            </div>
        </div>
        <div className={`summary-card interactive ${statusFilter === 'Due' ? 'active' : ''}`} onClick={() => setStatusFilter('Due')}>
            <div className="summary-icon icon-due"><i className="bi bi-hourglass-split"></i></div>
            <div className="summary-info">
                <span className="summary-value">{summaryStats.due}</span>
                <span className="summary-label"> Due for Review</span>
            </div>
        </div>
        <div className={`summary-card interactive ${statusFilter === 'Completed' ? 'active' : ''}`} onClick={() => setStatusFilter('Completed')}>
            <div className="summary-icon icon-completed"><i className="bi bi-check2-circle"></i></div>
            <div className="summary-info">
                <span className="summary-value">{summaryStats.completed}</span>
                <span className="summary-label"> Completed</span>
            </div>
        </div>
      </div>
      
      <div className="controls-bar page-controls-bar d-flex justify-content-between mb-4">
        <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="evaluation-selector-grid">
        {filteredTeamMembers.length > 0 ? (
          filteredTeamMembers.map(member => (
            <EvaluationSelectorCard
              key={member.id}
              employee={member}
              positionTitle={positionMap.get(member.positionId) || 'Unassigned'}
              lastEvaluation={member.lastEvaluation}
              onAction={handleAction}
              activePeriod={activeEvaluationPeriod}
              submissionForActivePeriod={member.submissionForActivePeriod}
              isEditable={member.isEditable}
            />
          ))
        ) : (
          <div className="text-center p-5 bg-light rounded">
            <p>No team members match your current filters.</p>
          </div>
        )}
      </div>

      {modalProps && (
        <ViewEvaluationModal
          show={showViewModal}
          onClose={() => setShowViewModal(false)}
          evaluation={modalProps.evaluation}
          employee={modalProps.employee}
          position={modalProps.position}
          evaluationFactors={evaluationFactors}
        />
      )}
    </div>
  );
};

export default EvaluateTeamPage;