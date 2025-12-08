import React, { useState, useEffect } from 'react';
import { generateSssData, generatePhilhealthData, generatePagibigData } from '../../hooks/contributionUtils';
import ContributionTypeToggle from '../pages/Contributions-Management/ContributionTypeToggle';
import api from '../services/api';

const ViewContributionsModal = ({ show, onClose, run, employees, positions }) => {
    const [activeReport, setActiveReport] = useState('sss');
    const [reportData, setReportData] = useState({ columns: [], rows: [] });
    const [activeRules, setActiveRules] = useState([]);

    useEffect(() => {
        if (show) {
            const fetchRules = async () => {
                try {
                    const response = await api.get('/statutory-deduction-rules');
                    setActiveRules(response.data?.data || []);
                } catch (error) {
                    console.error('Failed to fetch statutory rules:', error);
                }
            };
            fetchRules();
        }
    }, [show]);

    useEffect(() => {
        if (run && activeRules.length > 0) {
            let data;
            // Assuming 'run' acts as 'month' and isProvisional is false for archived reports
            if (activeReport === 'sss') {
                data = generateSssData(employees, positions, run, false, activeRules);
            } else if (activeReport === 'philhealth') {
                data = generatePhilhealthData(employees, positions, run, false, activeRules);
            } else {
                data = generatePagibigData(employees, positions, run, false, activeRules);
            }
            setReportData(data);
        }
    }, [run, activeReport, employees, positions, activeRules]);

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <div>
                            <h5 className="modal-title">Archived Contributions</h5>
                            <p className="modal-subtitle mb-0">For Pay Period: {run.cutOff}</p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <ContributionTypeToggle
                            activeReport={activeReport}
                            onSelectReport={setActiveReport}
                        />
                        <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                            <table className="table data-table table-sm table-striped">
                                <thead>
                                    <tr>
                                        {reportData.columns.map(col => <th key={col.key}>{col.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.rows.map((row, index) => (
                                        <tr key={index}>
                                            {reportData.columns.map(col => <td key={col.key}>{row[col.key]}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewContributionsModal;