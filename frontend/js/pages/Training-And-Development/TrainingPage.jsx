import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './TrainingPage.css';
import AddEditProgramModal from '../../modals/AddEditProgramModal';
import Layout from '@/layout/Layout';

const TrainingPage = (props) => {
  // Defensive defaults for required props
  const trainingPrograms = props.trainingPrograms || [];
  const enrollments = props.enrollments || [];
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const programStats = useMemo(() => {
    const activeProgramIds = new Set(enrollments.filter(e => e.status === 'In Progress').map(e => e.programId));
    return {
      totalPrograms: trainingPrograms.length,
      activePrograms: activeProgramIds.size,
      totalEnrolled: new Set(enrollments.map(e => e.employeeId)).size,
    };
  }, [trainingPrograms, enrollments]);

  const programsWithStats = useMemo(() => {
    return trainingPrograms.map(prog => {
      const relevantEnrollments = enrollments.filter(e => e.programId === prog.id);
      const enrolledCount = relevantEnrollments.length;
      const completedCount = relevantEnrollments.filter(e => e.status === 'Completed').length;
      const completionRate = enrolledCount > 0 ? (completedCount / enrolledCount) * 100 : 0;
      return { ...prog, enrolledCount, completionRate };
    });
  }, [trainingPrograms, enrollments]);

  const filteredPrograms = useMemo(() => {
    if (!searchTerm) return programsWithStats;
    const lowerSearch = searchTerm.toLowerCase();
    return programsWithStats.filter(p => p.title.toLowerCase().includes(lowerSearch) || p.provider.toLowerCase().includes(lowerSearch));
  }, [programsWithStats, searchTerm]);

  const handleOpenProgramModal = (program = null) => { setEditingProgram(program); setShowProgramModal(true); };
  const handleCloseProgramModal = () => { setEditingProgram(null); setShowProgramModal(false); };
  const handleSaveProgram = (formData, programId) => { props.handlers.saveProgram(formData, programId); handleCloseProgramModal(); };

  return (
    <div className="container-fluid p-0 page-module-container">
      <header className="page-header d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-main-title">Training & Development</h1>
        <button className="btn btn-success" onClick={() => handleOpenProgramModal()}><i className="bi bi-plus-circle-fill me-2"></i>New Program</button>
      </header>
      
      <div className="training-stats-bar">
        <div className="training-stat-card"><div className="stat-icon total-programs"><i className="bi bi-journal-album"></i></div><div><span className="stat-value">{programStats.totalPrograms}</span><span className="stat-label">Total Programs</span></div></div>
        <div className="training-stat-card"><div className="stat-icon active-programs"><i className="bi bi-activity"></i></div><div><span className="stat-value">{programStats.activePrograms}</span><span className="stat-label">Active Programs</span></div></div>
        <div className="training-stat-card"><div className="stat-icon total-enrolled"><i className="bi bi-people-fill"></i></div><div><span className="stat-value">{programStats.totalEnrolled}</span><span className="stat-label">Total Enrolled</span></div></div>
      </div>
      
      <div className="card data-table-card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
            <span>All Programs</span>
            <div className="input-group" style={{maxWidth: '350px'}}>
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control" placeholder="Search programs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </div>
        <div className="table-responsive">
          <table className="table data-table mb-0">
            <thead>
              <tr>
                <th>Program Title</th>
                <th>Provider</th>
                <th>Enrolled</th>
                <th style={{ width: '20%' }}>Completion</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map(prog => (
                <tr key={prog.id}>
                  <td>{prog.title}</td><td>{prog.provider}</td><td>{prog.enrolledCount}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${prog.completionRate}%` }}></div></div>
                      <span className="progress-text">{prog.completionRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <Link to={`/dashboard/training/${prog.id}`} className="btn btn-sm btn-outline-primary">View</Link>
                  </td>
                </tr>
              ))}
              {filteredPrograms.length === 0 && (<tr><td colSpan="5" className="text-center p-5">No training programs found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <AddEditProgramModal show={showProgramModal} onClose={handleCloseProgramModal} onSave={handleSaveProgram} programData={editingProgram} />
    </div>
  );
};

export default TrainingPage;