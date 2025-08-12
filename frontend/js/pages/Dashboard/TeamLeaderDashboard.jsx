import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { employeeAPI, leaveAPI } from '../../services/api';
import placeholderAvatar from '../../assets/placeholder-profile.jpg';

const TeamLeaderDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();
  const currentUser = storedUser || { name: 'User', id: '' };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [empRes, leaveRes] = await Promise.all([
          employeeAPI.getAll(),
          leaveAPI.getAll(),
        ]);
        
        const empData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
        setEmployees(empData);
        
        const leaveData = Array.isArray(leaveRes.data) ? leaveRes.data : (leaveRes.data?.data || []);
        const mappedLeaves = leaveData.map(l => ({
          leaveId: l.id,
          empId: l.user?.id ?? l.user_id,
          name: l.user?.name ?? '',
          status: l.status,
          type: l.type,
        }));
        setLeaveRequests(mappedLeaves);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myTeam = useMemo(() => {
    if (currentUser.id === 2) { // Team leader ID
      return employees.filter(e => [1, 4].includes(e.id)); // Team member IDs
    }
    return [];
  }, [currentUser, employees]);
  
  const pendingApprovals = useMemo(() => {
      const teamIds = new Set(myTeam.map(e => e.id));
      return leaveRequests.filter(r => r.status === 'Pending' && teamIds.has(r.empId));
  }, [myTeam, leaveRequests]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard...</p>
      </div>
    );
  }

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
                    <li key={req.leaveId}><span>{req.name}</span> <span className="text-muted">{req.type}</span></li>
                )) : <li className="text-muted">No pending approvals.</li>}
            </ul>
        </div>
        <div className="card-footer"><Link to="/dashboard/leave-management">Review Requests</Link></div>
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;