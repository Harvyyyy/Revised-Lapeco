import React from 'react';

const ScheduleListView = ({
  listSearchTerm,
  onSearchChange,
  listSortLabel,
  listSortConfig,
  onSortChange,
  sortedAndFilteredSchedules,
  onEditSchedule,
  onDeleteSchedule,
  onViewDetails,
  isLoading = false
}) => {
  const handleSortClick = (event, key, direction) => {
    event.preventDefault();
    onSortChange({ key, direction });
  };

  return (
    <div className="schedule-list-container">
      <div className="schedule-list-controls">
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-search"></i></span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by schedule name..."
            value={listSearchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="dropdown sort-dropdown">
          <button
            className="btn btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="bi bi-funnel me-2"></i>
            {listSortLabel}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><h6 className="dropdown-header">Sort by Date</h6></li>
            <li>
              <a
                className={`dropdown-item ${listSortConfig.key === 'date' && listSortConfig.direction === 'descending' ? 'active' : ''}`}
                href="#"
                onClick={(e) => handleSortClick(e, 'date', 'descending')}
              >
                Newest First
              </a>
            </li>
            <li>
              <a
                className={`dropdown-item ${listSortConfig.key === 'date' && listSortConfig.direction === 'ascending' ? 'active' : ''}`}
                href="#"
                onClick={(e) => handleSortClick(e, 'date', 'ascending')}
              >
                Oldest First
              </a>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><h6 className="dropdown-header">Sort by Name</h6></li>
            <li>
              <a
                className={`dropdown-item ${listSortConfig.key === 'name' && listSortConfig.direction === 'ascending' ? 'active' : ''}`}
                href="#"
                onClick={(e) => handleSortClick(e, 'name', 'ascending')}
              >
                A to Z
              </a>
            </li>
            <li>
              <a
                className={`dropdown-item ${listSortConfig.key === 'name' && listSortConfig.direction === 'descending' ? 'active' : ''}`}
                href="#"
                onClick={(e) => handleSortClick(e, 'name', 'descending')}
              >
                Z to A
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="schedule-card-grid mt-3">
        {isLoading ? (
          <div className="w-100 text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading schedules...</p>
          </div>
        ) : sortedAndFilteredSchedules.length > 0 ? (
          sortedAndFilteredSchedules.map((scheduleInfo) => (
            <div key={scheduleInfo.date} className="schedule-item-card type-schedule">
              <div className="card-header">
                <h5 className="card-title">{scheduleInfo.name}</h5>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">Date:</span>
                  <span className="info-value">
                    {new Date(scheduleInfo.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Employees Scheduled:</span>
                  <span className="info-value">{scheduleInfo.employeeCount}</span>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => onEditSchedule(scheduleInfo.date)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDeleteSchedule(scheduleInfo)}
                >
                  Delete
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => onViewDetails(scheduleInfo)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="w-100">
            <p className="text-muted text-center mt-4">No schedules match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleListView;
