import React from 'react';

const DailyScheduleView = ({
  currentDate,
  onDateChange,
  scheduledEmployeesForDate,
  sortedAndFilteredDailyEmployees,
  dailyViewColumns,
  formatTimeToAMPM,
  onEditSchedule,
  positionFilter,
  isLoading = false
}) => {
  return (
    <>
      <div className="daily-view-header">
        <h4 className="daily-view-title">Daily Schedule</h4>
        <div className="daily-view-controls">
          <input
            type="date"
            className="form-control form-control-lg"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
          {scheduledEmployeesForDate.length > 0 && (
            <button
              className="btn btn-lg btn-outline-secondary"
              onClick={() => onEditSchedule(currentDate)}
              title="Edit Schedule"
            >
              <i className="bi bi-pencil-fill"></i>
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading schedule data...</p>
        </div>
      ) : sortedAndFilteredDailyEmployees.length > 0 ? (
        <>
          <div className="card data-table-card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table data-table mb-0">
                  <thead>
                    <tr>
                      {dailyViewColumns.map((col) => (
                        <th key={col.key}>{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredDailyEmployees.map((sch, idx) => (
                      <tr key={idx}>
                        {dailyViewColumns.map((col) => {
                          const value = sch[col.key];
                          if (['start_time', 'end_time', 'break_start', 'break_end'].includes(col.key)) {
                            return <td key={col.key}>{formatTimeToAMPM(value)}</td>;
                          } else if (col.key === 'ot_hours') {
                            return (
                              <td key={col.key}>
                                {value && parseFloat(value) > 0 ? value : '---'}
                              </td>
                            );
                          }
                          return <td key={col.key}>{value || '---'}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-5 bg-light rounded">
          <i className="bi bi-calendar2-x fs-1 text-muted mb-3 d-block"></i>
          <h4 className="text-muted">
            {scheduledEmployeesForDate.length > 0 && positionFilter
              ? 'No employees match the filter.'
              : `No schedule created for ${new Date(
                  currentDate + 'T00:00:00'
                ).toLocaleDateString()}.`}
          </h4>
        </div>
      )}
    </>
  );
};

export default DailyScheduleView;
