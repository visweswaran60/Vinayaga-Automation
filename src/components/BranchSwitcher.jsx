import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, CheckCircle } from 'lucide-react';

const BranchSwitcher = ({ userEmail, userRole, onBranchChange }) => {
    const [branches, setBranches] = useState([]);
    const [activeBranch, setActiveBranch] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadBranches();
        loadActiveBranch();

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userEmail]);

    const loadBranches = () => {
        const saved = localStorage.getItem('registeredBranches');
        const allBranches = saved ? JSON.parse(saved) : [];

        // Filter active branches owned by this director (using both directorEmail and masterEmail for generic masters)
        const directorBranches = allBranches.filter(
            b => (b.directorEmail === userEmail || b.masterEmail === userEmail) && b.isActive !== false
        );
        setBranches(directorBranches);
    };

    const loadActiveBranch = () => {
        const saved = localStorage.getItem('activeBranch');
        if (saved) {
            const branchData = JSON.parse(saved);
            setActiveBranch(branchData);
        }
    };

    const handleSelectBranch = (branch) => {
        const branchData = {
            id: branch.id,
            branchName: branch.branchName,
            branchEmail: branch.branchEmail,
            location: branch.location
        };

        localStorage.setItem('activeBranch', JSON.stringify(branchData));
        setActiveBranch(branchData);
        setIsOpen(false);

        // Notify parent component
        if (onBranchChange) {
            onBranchChange(branchData);
        }

        // Reload the page to refresh all data
        window.location.reload();
    };

    const handleClearSelection = () => {
        localStorage.removeItem('activeBranch');
        setActiveBranch(null);
        setIsOpen(false);

        if (onBranchChange) {
            onBranchChange(null);
        }

        window.location.reload();
    };

    // Only show for directors
    if (userRole !== 'director') {
        return null;
    }

    if (branches.length === 0) {
        return null;
    }

    return (
        <div className="branch-switcher" ref={dropdownRef}>
            <button
                className="branch-switcher-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Building2 size={18} />
                <div className="branch-switcher-text">
                    <span className="branch-switcher-label">Active Branch</span>
                    <span className="branch-switcher-name">
                        {activeBranch ? activeBranch.branchName : 'All Branches'}
                    </span>
                </div>
                <ChevronDown size={18} className={`branch-switcher-icon ${isOpen ? 'rotated' : ''}`} />
            </button>

            {isOpen && (
                <div className="branch-switcher-dropdown">
                    <div className="branch-switcher-header">
                        <span>Select Branch</span>
                        {activeBranch && (
                            <button
                                className="branch-switcher-clear"
                                onClick={handleClearSelection}
                            >
                                View All
                            </button>
                        )}
                    </div>

                    <div className="branch-switcher-list">
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                className={`branch-switcher-item ${activeBranch?.id === branch.id ? 'active' : ''}`}
                                onClick={() => handleSelectBranch(branch)}
                            >
                                <div className="branch-switcher-item-icon">
                                    <Building2 size={16} />
                                </div>
                                <div className="branch-switcher-item-info">
                                    <span className="branch-switcher-item-name">{branch.branchName}</span>
                                    <span className="branch-switcher-item-location">{branch.location}</span>
                                </div>
                                {activeBranch?.id === branch.id && (
                                    <CheckCircle size={16} className="branch-switcher-check" />
                                )}
                            </button>
                        ))}
                    </div>

                    {branches.length === 0 && (
                        <div className="branch-switcher-empty">
                            No active branches available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BranchSwitcher;
