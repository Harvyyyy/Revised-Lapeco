import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import placeholderAvatar from '../../assets/placeholder-profile.jpg';

const TeamLeaderDashboard = ({ 
  currentUser = { name: 'User', employeeId: '' }, 
  employees = [], 
  leaveRequests = [] 
}) => {

  const myTeam = useMemo(() => {
    if (currentUser.employeeId === 'EMP002') {
      return employees.filter(e => ['EMP001', 'EMP004'].includes(e.id));
    }
    return [];
  }, [currentUser, employees]);
  
  const pendingApprovals = useMemo(() => {
      const teamIds = new Set(myTeam.map(e => e.id));
      return leaveRequests.filter(r => r.status === 'Pending' && teamIds.has(r.empId));
  }, [myTeam, leaveRequests]);

  return (
    <div className="dashboard-grid">
      <div className="dashboard-grid-span-4">
        <div className="welcome-header">
          <h2>Welcome back, {currentUser.name.split(' ')[0]}!</h2>
          <p>Here's an overview of your team's status today.</p>
        </div>
      </div>

      <div className="dashboard-grid-span-2 dashboard-card">
        <div className="card-header"><h6>My Team ({myTeam.length})</h6></div>
        <div className="card-body">
            <div className="team-member-list">
                {myTeam.map(member => (
                    <div key={member.id} className="team-member-item">
                        <img src={member.avatarUrl || placeholderAvatar} alt={member.name} />
                        <span>{member.name}</span>
                    </div>
                ))}
            </div>
        </div>
        <div className="card-footer"><Link to="/dashboard/team-employees">Manage Team</Link></div>
      </div>

      <div className="dashboard-grid-span-2 dashboard-card">
        <div className="card-header"><h6>Pending Approvals ({pendingApprovals.length})</h6></div>
        <div className="card-body">
            <ul className="dashboard-list-group">
                {pendingApprovals.length > 0 ? pendingApprovals.map(req => (
                    <li key={req.leaveId}><span>{req.name}</span> <span className="text-muted">{req.leaveType}</span></li>
                )) : <li className="text-muted">No pending approvals.</li>}
            </ul>
        </div>
        <div className="card-footer"><Link to="/dashboard/leave-management">Review Requests</Link></div>
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;