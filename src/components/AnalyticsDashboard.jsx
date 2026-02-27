import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    FileText, 
    Upload, 
    MessageCircle, 
    Mail, 
    Building2, 
    TrendingUp, 
    Award,
    Calendar,
    Filter
} from 'lucide-react';
import { getUserRole, isDirector } from '../utils/roleHelpers';
import {
    getAllForms,
    getAllBranches,
    filterForms,
    calculateTotalPatients,
    calculateReportsGenerated,
    calculateDicomUploads,
    calculateWhatsAppSent,
    calculateEmailSent,
    calculateArchivedCases,
    getPatientsByBranch,
    calculateActiveBranches,
    calculateAvgPatientsPerBranch,
    calculateWhatsAppRate,
    calculateEmailRate,
    calculateOverallNotificationRate
} from '../utils/analyticsHelpers';

const AnalyticsDashboard = ({ userEmail }) => {
    const [dateRange, setDateRange] = useState('30days');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [allForms, setAllForms] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [userRole, setUserRole] = useState('branch');

    useEffect(() => {
        // Determine user role
        const role = getUserRole(userEmail);
        setUserRole(role);
        
        // For branch users, set selectedBranch to their email
        if (role === 'branch') {
            setSelectedBranch(userEmail);
        }
        
        loadData();
    }, [userEmail]);

    const loadData = () => {
        setAllForms(getAllForms());
        setAllBranches(getAllBranches());
    };

    // Memoized filtered forms with role-based access control
    const filteredForms = useMemo(() => {
        let branchFilter = null;
        
        if (userRole === 'branch') {
            // Branch users can ONLY see their own data
            branchFilter = userEmail;
        } else if (userRole === 'director') {
            // Directors can see all or specific branch
            branchFilter = selectedBranch === 'all' ? null : selectedBranch;
        }
        
        return filterForms(allForms, dateRange, branchFilter);
    }, [allForms, dateRange, selectedBranch, userRole, userEmail]);

    // Memoized branches with role-based filtering
    const visibleBranches = useMemo(() => {
        if (userRole === 'branch') {
            // Branch users only see their own branch
            return allBranches.filter(b => b.branchEmail === userEmail);
        }
        // Directors see all branches
        return allBranches;
    }, [allBranches, userRole, userEmail]);

    // Memoized metrics
    const metrics = useMemo(() => ({
        totalPatients: calculateTotalPatients(filteredForms),
        reportsGenerated: calculateReportsGenerated(filteredForms),
        dicomUploads: calculateDicomUploads(filteredForms),
        whatsappSent: calculateWhatsAppSent(filteredForms),
        emailSent: calculateEmailSent(filteredForms),
        archivedCases: calculateArchivedCases(filteredForms),
        activeBranches: calculateActiveBranches(visibleBranches, filteredForms),
        avgPatientsPerBranch: calculateAvgPatientsPerBranch(visibleBranches, filteredForms),
        whatsappRate: calculateWhatsAppRate(filteredForms),
        emailRate: calculateEmailRate(filteredForms),
        overallNotificationRate: calculateOverallNotificationRate(filteredForms)
    }), [filteredForms, visibleBranches]);

    // Memoized branch data with role-based filtering
    const branchData = useMemo(() => {
        return getPatientsByBranch(visibleBranches, filteredForms);
    }, [visibleBranches, filteredForms]);

    const dateRangeOptions = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: '90days', label: 'Last 90 Days' }
    ];

    return (
        <div className="analytics-dashboard">
            {/* Header */}
            <div className="analytics-header">
                <div>
                    <h1 className="analytics-title">Analytics Dashboard</h1>
                    <p className="analytics-subtitle">Overview of diagnostic referral metrics</p>
                </div>
            </div>

            {/* Filters */}
            <div className="analytics-filters">
                <div className="filter-group">
                    <Calendar size={18} className="filter-icon" />
                    <select 
                        className="filter-select"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        {dateRangeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Branch filter - ONLY visible to directors */}
                {isDirector(userEmail) && (
                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select 
                            className="filter-select"
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                            <option value="all">All Branches</option>
                            {allBranches.map(branch => (
                                <option key={branch.id} value={branch.branchEmail}>
                                    {branch.branchName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Metric Cards */}
            <div className="analytics-metrics-grid">
                <MetricCard
                    icon={<Users size={24} />}
                    value={metrics.totalPatients}
                    label="Total Patients"
                    color="blue"
                />
                <MetricCard
                    icon={<FileText size={24} />}
                    value={metrics.reportsGenerated}
                    label="Reports Generated"
                    color="green"
                />
                <MetricCard
                    icon={<Upload size={24} />}
                    value={metrics.dicomUploads}
                    label="DICOM Uploads"
                    color="purple"
                />
                <MetricCard
                    icon={<MessageCircle size={24} />}
                    value={metrics.whatsappSent}
                    label="WhatsApp Sent"
                    color="teal"
                />
                <MetricCard
                    icon={<Mail size={24} />}
                    value={metrics.emailSent}
                    label="Email Sent"
                    color="orange"
                />
            </div>

            {/* Patients by Branch Table */}
            <div className="analytics-section">
                <h2 className="analytics-section-title">Patients by Branch</h2>
                <div className="analytics-table-container">
                    {branchData.length === 0 ? (
                        <div className="analytics-empty">
                            <Building2 size={48} strokeWidth={1.5} />
                            <p>No branch data available</p>
                        </div>
                    ) : (
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Branch Name</th>
                                    <th>City</th>
                                    <th>Patients</th>
                                    <th>DICOM</th>
                                    <th>Reports</th>
                                    <th>WhatsApp</th>
                                    <th>Email</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchData.map((branch, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="branch-name-cell">
                                                {idx === 0 && branch.progress > 0 && (
                                                    <Award size={16} className="trophy-icon" />
                                                )}
                                                {branch.branchName}
                                            </div>
                                        </td>
                                        <td>{branch.city}</td>
                                        <td><strong>{branch.patients}</strong></td>
                                        <td>{branch.dicom}</td>
                                        <td>{branch.reports}</td>
                                        <td>{branch.whatsapp}</td>
                                        <td>{branch.email}</td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${branch.progress}%` }}
                                                    />
                                                </div>
                                                <span className="progress-text">{branch.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="analytics-section">
                <h2 className="analytics-section-title">Quick Statistics</h2>
                <div className="analytics-quick-stats">
                    <QuickStatCard
                        icon={<Building2 size={20} />}
                        value={metrics.activeBranches}
                        label="Active Branches"
                    />
                    <QuickStatCard
                        icon={<Users size={20} />}
                        value={metrics.avgPatientsPerBranch}
                        label="Avg Patients/Branch"
                    />
                    <QuickStatCard
                        icon={<MessageCircle size={20} />}
                        value={`${metrics.whatsappRate}%`}
                        label="WhatsApp Rate"
                    />
                    <QuickStatCard
                        icon={<Mail size={20} />}
                        value={`${metrics.emailRate}%`}
                        label="Email Rate"
                    />
                    <QuickStatCard
                        icon={<TrendingUp size={20} />}
                        value={`${metrics.overallNotificationRate}%`}
                        label="Overall Notification Rate"
                    />
                    <QuickStatCard
                        icon={<FileText size={20} />}
                        value={metrics.archivedCases}
                        label="Archived Cases"
                    />
                </div>
            </div>
        </div>
    );
};

// Metric Card Component
const MetricCard = ({ icon, value, label, color }) => {
    const colorClasses = {
        blue: 'metric-card-blue',
        green: 'metric-card-green',
        purple: 'metric-card-purple',
        teal: 'metric-card-teal',
        orange: 'metric-card-orange'
    };

    return (
        <div className="metric-card">
            <div className={`metric-icon ${colorClasses[color]}`}>
                {icon}
            </div>
            <div className="metric-content">
                <div className="metric-value">{value}</div>
                <div className="metric-label">{label}</div>
            </div>
        </div>
    );
};

// Quick Stat Card Component
const QuickStatCard = ({ icon, value, label }) => {
    return (
        <div className="quick-stat-card">
            <div className="quick-stat-icon">
                {icon}
            </div>
            <div className="quick-stat-content">
                <div className="quick-stat-value">{value}</div>
                <div className="quick-stat-label">{label}</div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
