import React, { useState, useMemo } from 'react';
import RequestLeaveModal from '../../modals/RequestLeaveModal';
import LeaveHistoryModal from '../../modals/LeaveHistoryModal';
import LeaveRequestCard from './LeaveRequestCard';
import './MyLeavePage.css'; 

const MyLeavePage = ({ leaveRequests, createLeaveRequest }) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const leaveBalances = { vacation: 12, sick: 8 };

  const upcomingLeave = useMemo(() => {
    const today = new Date();
    return leaveRequests
      .filter(req => req.status === 'Approved' && new Date(req.dateFrom) >= today)
      .sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom))[0];
  }, [leaveRequests]);

  const filteredRequests = useMemo(() => {
    const sortedRequests = [...leaveRequests].sort((a, b) => new Date(b.dateFrom) - new Date(a.dateFrom));
    if (statusFilter === 'All') {
      return sortedRequests;
    }
    return sortedRequests.filter(req => req.status === statusFilter);
  }, [leaveRequests, statusFilter]);
  
  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-main-title">My Leave</h1>
        <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => setShowHistoryModal(true)}>
                <i className="bi bi-clock-history me-2"></i>View History
            </button>
            <button className="btn btn-success" onClick={() => setShowRequestModal(true)}>
                <i className="bi bi-plus-circle-fill me-2"></i>New Leave Request
            </button>
        </div>
      </header>

      <div className="my-leave-dashboard">
        <div className="leave-balances">
            <div className="balance-card">
                <div className="balance-icon icon-vacation"><i className="bi bi-sun-fill"></i></div>
                <div className="balance-info"><span className="balance-value">{leaveBalances.vacation}</span><span className="balance-label">Vacation Days Left</span></div>
            </div>
            <div className="balance-card">
                <div className="balance-icon icon-sick"><i className="bi bi-heart-pulse-fill"></i></div>
                <div className="balance-info"><span className="balance-value">{leaveBalances.sick}</span><span className="balance-label">Sick Days Left</span></div>
            </div>
        </div>
        <div className="upcoming-leave-card">
            <h6><i className="bi bi-calendar-check-fill text-success me-2"></i>Upcoming Leave</h6>
            {upcomingLeave ? (
                <div>
                    <p className="upcoming-type">{upcomingLeave.leaveType}</p>
                    <p className="upcoming-dates">{upcomingLeave.dateFrom} to {upcomingLeave.dateTo}</p>
                </div>
            ) : (
                <p className="text-muted no-upcoming">No upcoming approved leave.</p>
            )}
        </div>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-header">
            <h5 className="mb-0">My Requests</h5>
        </div>
        <div className="card-body">
            <div className="leave-filters btn-group w-100" role="group">
                <button type="button" className={`btn ${statusFilter === 'All' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setStatusFilter('All')}>All</button>
                <button type="button" className={`btn ${statusFilter === 'Pending' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setStatusFilter('Pending')}>Pending</button>
                <button type="button" className={`btn ${statusFilter === 'Approved' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setStatusFilter('Approved')}>Approved</button>
                <button type="button" className={`btn ${statusFilter === 'Declined' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setStatusFilter('Declined')}>Declined</button>
                <button type="button" className={`btn ${statusFilter === 'Canceled' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setStatusFilter('Canceled')}>Canceled</button>
            </div>

            <div className="leave-requests-list mt-4">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map(req => <LeaveRequestCard key={req.leaveId} request={req} />)
                ) : (
                    <div className="text-center p-5 bg-light rounded">
                        <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                        <h5 className="text-muted">No Requests Found</h5>
                        <p className="text-muted">You have no {statusFilter.toLowerCase()} leave requests.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {showRequestModal && (
        <RequestLeaveModal
          show={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSave={createLeaveRequest}
        />
      )}

      <LeaveHistoryModal
        show={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        leaveHistory={leaveRequests} 
      />
    </div>
  );
};

export default MyLeavePage;