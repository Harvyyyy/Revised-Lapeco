import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import AddColumnModal from './AddColumnModal';
import '../pages/Schedule-Management/ScheduleManagementPage.css';

const EditScheduleModal = ({ show, onClose, onSave, scheduleDate, initialScheduleEntries, allEmployees = [], positions }) => {
  const [scheduleName, setScheduleName] = useState('');
  const [columns, setColumns] = useState([
    { key: 'start_time', name: 'Start Time' },
    { key: 'end_time', name: 'End Time' },
  ]);
  const [gridData, setGridData] = useState([]);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);

  const employeeOptions = useMemo(() => (allEmployees || []).map(e => ({ value: e.id, label: `${e.name} (${e.id})` })), [allEmployees]);
  const positionsMap = useMemo(() => new Map((positions || []).map(p => [p.id, p.title])), [positions]);
  
  useEffect(() => {
    if (show && initialScheduleEntries) {
      setScheduleName(initialScheduleEntries[0]?.name || `Schedule for ${scheduleDate}`);
      // Always include start_time and end_time columns
      const existingColumns = new Set(['start_time', 'end_time']);
      initialScheduleEntries.forEach(entry => {
        Object.keys(entry).forEach(key => {
          if (!['scheduleId', 'empId', 'employee_id', 'date', 'name', 'start_time', 'end_time', 'user_name', 'position_name'].includes(key)) {
            existingColumns.add(key);
          }
        });
      });
      const dynamicColumns = Array.from(existingColumns).map(key => ({ key, name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ') }));
      setColumns(dynamicColumns);
      
      // Map the data correctly - backend sends employee_id, frontend expects empId
      const initialGrid = initialScheduleEntries.map(entry => {
        const row = { 
          empId: entry.employee_id || entry.empId, // Handle both backend and frontend field names
          employeeName: entry.user_name || '',
          employeeId: entry.employee_id || '',
          positionName: entry.position_name || ''
        };
        dynamicColumns.forEach(col => { 
          row[col.key] = entry[col.key] || ''; 
        });
        return row;
      });
      setGridData(initialGrid);
    }
  }, [show, initialScheduleEntries, scheduleDate]);

  const addEmployeeRow = () => {
    const newRow = columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), { empId: '' });
    setGridData(prev => [...prev, newRow]);
  };
  const removeEmployeeRow = (rowIndex) => setGridData(prev => prev.filter((_, index) => index !== rowIndex));
  
  const handleAddColumn = (newColumn) => {
    if (columns.some(c => c.key === newColumn.key)) return;
    setColumns(prev => [...prev, newColumn]);
    setGridData(prevGrid => prevGrid.map(row => ({ ...row, [newColumn.key]: '' })));
  };

  const handleDeleteColumn = (keyToDelete) => {
    if (keyToDelete === 'start_time' || keyToDelete === 'end_time') {
      alert('The Start Time and End Time columns cannot be deleted.');
      return;
    }
    setColumns(prev => prev.filter(col => col.key !== keyToDelete));
    setGridData(prevGrid => prevGrid.map(row => {
      const newRow = { ...row };
      delete newRow[keyToDelete];
      return newRow;
    }));
  };
  
  const handleGridChange = (rowIndex, field, value) => {
    const newGrid = [...gridData];
    newGrid[rowIndex][field] = value;
    setGridData(newGrid);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedScheduleEntries = [];
    const uniqueEmpIds = new Set();
    let hasDuplicates = false;
    gridData.forEach(row => {
      if (row.empId) {
        if(uniqueEmpIds.has(row.empId)) { hasDuplicates = true; }
        uniqueEmpIds.add(row.empId);
        const entryData = columns.reduce((acc, col) => { if(row[col.key] && String(row[col.key]).trim() !== '') acc[col.key] = row[col.key]; return acc; }, {});
        // Require both start_time and end_time
        if (Object.keys(entryData).length > 0 && entryData.start_time && entryData.end_time) {
          updatedScheduleEntries.push({ ...entryData, empId: row.empId, date: scheduleDate, name: scheduleName });
        }
      }
    });
    if (hasDuplicates) { alert("Error: Each employee can only be listed once per schedule."); return; }
    onSave(scheduleDate, updatedScheduleEntries);
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Schedule for {scheduleDate}</h5>
              <div className="ms-auto"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAddColumnModal(true)}><i className="bi bi-layout-three-columns me-1"></i> Add Column</button></div>
              <button type="button" className="btn-close ms-2" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3"><label className="form-label">Schedule Name (Optional)</label><input type="text" className="form-control" value={scheduleName} onChange={e => setScheduleName(e.target.value)} /></div>
              <div className="table-responsive schedule-builder-table">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th className="employee-name-column">Employee Name</th>
                      <th className="employee-id-column">Employee ID</th>
                      <th className="position-column">Position</th>
                      {columns.map(col => (
                        (col.key !== 'user_name' && col.key !== 'employee_id' && col.key !== 'position_name') && (
                          <th key={col.key} className="text-center custom-column">
                            {col.name}
                            {(col.key !== 'start_time' && col.key !== 'end_time') && (<button type="button" className="btn btn-sm btn-outline-danger p-0 ms-2 delete-column-btn" onClick={() => handleDeleteColumn(col.key)} title={`Delete '${col.name}' column`}><i className="bi bi-x"></i></button>)}
                          </th>
                        )
                      ))}
                      <th className="action-column"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.map((row, rowIndex) => {
                      const selectedEmployee = allEmployees.find(e => e.id === row.empId);
                      const positionTitle = selectedEmployee ? (positionsMap.get(selectedEmployee.positionId) || 'Unassigned') : '';
                      return (
                        <tr key={rowIndex}>
                          <td>
                            <div className="react-select-container">
                              <Select 
                                options={employeeOptions} 
                                isClearable 
                                placeholder="Select..." 
                                value={employeeOptions.find(o => o.value === row.empId)} 
                                onChange={opt => handleGridChange(rowIndex, 'empId', opt ? opt.value : '')} 
                                menuPortalTarget={document.body} 
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }} 
                              />
                            </div>
                          </td>
                          <td>
                            <input type="text" className="form-control form-control-sm readonly-input" value={selectedEmployee?.id || ''} readOnly disabled />
                          </td>
                          <td>
                            <input type="text" className="form-control form-control-sm readonly-input" value={positionTitle} readOnly disabled />
                          </td>
                          {columns.map(col => (
                            (col.key !== 'user_name' && col.key !== 'employee_id' && col.key !== 'position_name') && (
                              <td key={col.key}>
                                {col.key === 'start_time' || col.key === 'end_time' ? (
                                  <input type="time" className="form-control form-control-sm shift-input" value={row[col.key] || ''} onChange={e => handleGridChange(rowIndex, col.key, e.target.value)} />
                                ) : (
                                  <input type="text" className="form-control form-control-sm shift-input" value={row[col.key] || ''} onChange={e => handleGridChange(rowIndex, col.key, e.target.value)} />
                                )}
                              </td>
                            )
                          ))}
                          <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeEmployeeRow(rowIndex)} title="Remove Row"><i className="bi bi-x-lg"></i></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={addEmployeeRow}><i className="bi bi-plus-lg"></i> Add Row</button>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary action-button-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
      <AddColumnModal show={showAddColumnModal} onClose={() => setShowAddColumnModal(false)} onAddColumn={handleAddColumn} />
    </div>
  );
};
export default EditScheduleModal;