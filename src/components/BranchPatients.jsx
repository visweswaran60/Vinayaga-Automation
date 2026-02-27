import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Users, Building2 } from 'lucide-react';
import { 
    getRegisteredBranches, 
    getAllBranchPatientCounts,
    saveSelectedBranch,
    getTotalActivePatients 
} from '../utils/branchHelpers';

const BranchPatients = ({ onBranchSelect }) => {
    const [branches, setBranches] = useState([]);
    const [branchPatientCounts, setBranchPatientCounts] = useState({});

    useEffect(() => {
        loadBranchesAndCounts();
    }, []);

    const loadBranchesAndCounts = () => {
        // Load branches and calculate counts using helper functions
        const branchesData = getRegisteredBranches();
        const counts = getAllBranchPatientCounts();

        setBranches(branchesData);
        setBranchPatientCounts(counts);
    };

    const handleBranchClick = (branch) => {
        // Save selected branch using helper function
        saveSelectedBranch(branch);
        
        // Call parent callback to navigate
        if (onBranchSelect) {
            onBranchSelect(branch);
        }
    };

    const totalActivePatients = getTotalActivePatients();

    return (
        <div className="branch-patients-wrapper">
            {/* Header */}
            <div className="branch-patients-header">
                <div>
                    <h1 className="branch-patients-title">Branch Patients</h1>
                    <p className="branch-patients-subtitle">Select a branch to view patients</p>
                </div>
            </div>

            {/* Branch Cards Grid */}
            {branches.length === 0 ? (
                <div className="branch-patients-empty">
                    <div className="branch-patients-empty-icon">
                        <Building2 size={48} strokeWidth={1.5} />
                    </div>
                    <p className="branch-patients-empty-title">No Branches Found</p>
                    <p className="branch-patients-empty-text">
                        Register branches to view their patients
                    </p>
                </div>
            ) : (
                <div className="branch-patients-grid">
                    {branches.map((branch) => (
                        <div
                            key={branch.id}
                            className="branch-patient-card"
                            onClick={() => handleBranchClick(branch)}
                        >
                            {/* Left: Location Icon */}
                            <div className="branch-patient-card-icon">
                                <MapPin size={24} />
                            </div>

                            {/* Center: Branch Info */}
                            <div className="branch-patient-card-info">
                                <h3 className="branch-patient-card-name">
                                    {branch.branchName}
                                </h3>
                                <p className="branch-patient-card-city">
                                    {branch.city || branch.location || '—'}
                                </p>
                            </div>

                            {/* Right: Patient Count */}
                            <div className="branch-patient-card-stats">
                                <div className="branch-patient-count">
                                    {branchPatientCounts[branch.branchEmail] || 0}
                                </div>
                                <div className="branch-patient-label">Active</div>
                            </div>

                            {/* Arrow Icon */}
                            <div className="branch-patient-card-arrow">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Stats */}
            {branches.length > 0 && (
                <div className="branch-patients-summary">
                    <div className="branch-summary-stat">
                        <Building2 size={18} />
                        <span className="branch-summary-label">Total Branches:</span>
                        <span className="branch-summary-value">{branches.length}</span>
                    </div>
                    <div className="branch-summary-stat">
                        <Users size={18} />
                        <span className="branch-summary-label">Total Active Patients:</span>
                        <span className="branch-summary-value">{totalActivePatients}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchPatients;
