import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    Plus, 
    Pencil, 
    Trash2, 
    MapPin, 
    Mail, 
    Users, 
    CheckCircle, 
    XCircle,
    Search,
    X
} from 'lucide-react';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
    getCurrentHospitalId, 
    filterByHospital, 
    addHospitalId,
    validateHospitalOwnership 
} from '../utils/tenantHelpers';

const ManageBranches = ({ userEmail, userRole }) => {
    const [branches, setBranches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        branchName: '',
        location: '',
        branchEmail: '',
        password: ''
    });
    const [formError, setFormError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Load branches on mount
    useEffect(() => {
        loadBranches();
    }, [userEmail]);

    const loadBranches = () => {
        const saved = localStorage.getItem('registeredBranches');
        const allBranches = saved ? JSON.parse(saved) : [];
        
        // CRITICAL: Filter by hospital ID first
        const hospitalBranches = filterByHospital(allBranches);
        
        // Then filter branches owned by this director
        const directorBranches = hospitalBranches.filter(b => b.directorEmail === userEmail);
        setBranches(directorBranches);
    };

    const getPatientCount = (branchEmail) => {
        const forms = JSON.parse(localStorage.getItem('savedForms') || '[]');
        // CRITICAL: Filter by hospital ID first
        const hospitalForms = filterByHospital(forms);
        return hospitalForms.filter(f => f.branchEmail === branchEmail && !f.archived).length;
    };

    const handleOpenModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                branchName: branch.branchName,
                location: branch.location,
                branchEmail: branch.branchEmail,
                password: '' // Don't show existing password
            });
        } else {
            setEditingBranch(null);
            setFormData({ branchName: '', location: '', branchEmail: '', password: '' });
        }
        setFormError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBranch(null);
        setFormData({ branchName: '', location: '', branchEmail: '', password: '' });
        setFormError('');
        setIsCreating(false);
    };

    const validateEmail = (email) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.branchName.trim()) {
            setFormError('Branch name is required');
            return;
        }
        if (!formData.location.trim()) {
            setFormError('Location is required');
            return;
        }
        if (!formData.branchEmail.trim()) {
            setFormError('Branch email is required');
            return;
        }
        if (!validateEmail(formData.branchEmail)) {
            setFormError('Please enter a valid email address');
            return;
        }

        const allBranches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');

        // Check for duplicate email (excluding current branch if editing)
        const duplicate = allBranches.find(b => 
            b.branchEmail.toLowerCase() === formData.branchEmail.toLowerCase() &&
            (!editingBranch || b.id !== editingBranch.id)
        );

        if (duplicate) {
            setFormError('A branch with this email already exists');
            return;
        }

        if (editingBranch) {
            // Update existing branch (no password change)
            const updated = allBranches.map(b => 
                b.id === editingBranch.id 
                    ? { ...b, branchName: formData.branchName, location: formData.location }
                    : b
            );
            localStorage.setItem('registeredBranches', JSON.stringify(updated));
            loadBranches();
            handleCloseModal();
        } else {
            // Create new branch - requires password
            if (!formData.password || formData.password.trim().length < 6) {
                setFormError('Password is required and must be at least 6 characters');
                return;
            }

            setIsCreating(true);
            setFormError('');

            try {
                // Create Firebase Auth account for the branch
                console.log(`Creating Firebase Auth account for ${formData.branchEmail}...`);
                
                let authUid = 'none';
                try {
                    const userCredential = await createUserWithEmailAndPassword(
                        auth, 
                        formData.branchEmail, 
                        formData.password
                    );
                    authUid = userCredential.user.uid;
                    console.log(`✅ Branch account created — UID: ${authUid}`);
                } catch (authErr) {
                    console.error('Firebase Auth Error:', authErr);
                    if (authErr?.code === 'auth/email-already-in-use') {
                        setFormError('This email is already registered in Firebase Auth');
                    } else if (authErr?.code === 'auth/weak-password') {
                        setFormError('Password must be at least 6 characters');
                    } else if (authErr?.code === 'auth/invalid-email') {
                        setFormError('Invalid email format');
                    } else {
                        setFormError(`Firebase Error: ${authErr.message}`);
                    }
                    setIsCreating(false);
                    return;
                }

                // Get organization details
                const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
                const org = orgs.find(o => o.masterEmail === userEmail);

                // CRITICAL: Get current hospital ID for tenant isolation
                const hospitalId = getCurrentHospitalId();
                if (!hospitalId) {
                    setFormError('Hospital context not set. Please re-login.');
                    setIsCreating(false);
                    return;
                }

                // Create new branch record with hospitalId
                const newBranch = addHospitalId({
                    id: Date.now().toString(),
                    branchName: formData.branchName,
                    location: formData.location,
                    branchEmail: formData.branchEmail,
                    password: formData.password,
                    directorEmail: userEmail,
                    hospitalName: org?.hospitalName || 'Hospital',
                    authUid: authUid,
                    createdAt: new Date().toISOString(),
                    isActive: true
                });

                allBranches.push(newBranch);
                localStorage.setItem('registeredBranches', JSON.stringify(allBranches));

                // Add user role
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                if (!users.find(u => u.email === formData.branchEmail)) {
                    users.push({
                        email: formData.branchEmail,
                        role: 'branch',
                        branchName: formData.branchName,
                        hospitalId: hospitalId, // Add hospitalId to user record
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem('users', JSON.stringify(users));
                }

                // Sign out (createUserWithEmailAndPassword auto-signs in)
                await auth.signOut();

                console.log(`✅ Branch created successfully: ${formData.branchName}`);
                alert(`✅ Branch Created!\n\nBranch: ${formData.branchName}\nLogin: ${formData.branchEmail}\nPassword: ${formData.password}\n\nThe branch user can now login with these credentials.`);

                loadBranches();
                handleCloseModal();
            } catch (error) {
                console.error('Error creating branch:', error);
                setFormError(`Error: ${error.message}`);
            } finally {
                setIsCreating(false);
            }
        }
    };

    const handleDelete = (branch) => {
        const patientCount = getPatientCount(branch.branchEmail);
        
        if (patientCount > 0) {
            if (!confirm(`This branch has ${patientCount} active patient(s). Are you sure you want to deactivate it?`)) {
                return;
            }
        } else {
            if (!confirm(`Are you sure you want to delete "${branch.branchName}"?`)) {
                return;
            }
        }

        const allBranches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
        
        if (patientCount > 0) {
            // Soft delete - mark as inactive
            const updated = allBranches.map(b => 
                b.id === branch.id ? { ...b, isActive: false } : b
            );
            localStorage.setItem('registeredBranches', JSON.stringify(updated));
        } else {
            // Hard delete
            const updated = allBranches.filter(b => b.id !== branch.id);
            localStorage.setItem('registeredBranches', JSON.stringify(updated));
        }

        loadBranches();
    };

    const toggleStatus = (branch) => {
        const allBranches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
        const updated = allBranches.map(b => 
            b.id === branch.id ? { ...b, isActive: !b.isActive } : b
        );
        localStorage.setItem('registeredBranches', JSON.stringify(updated));
        loadBranches();
    };

    const filteredBranches = branches.filter(b => 
        b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.branchEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mb-wrapper">
            <div className="mb-header">
                <div>
                    <h1 className="mb-title">Manage Branches</h1>
                    <p className="mb-subtitle">Create and manage diagnostic branches</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Add Branch
                </button>
            </div>

            <div className="mb-search-bar">
                <Search size={20} />
                <input 
                    type="text" 
                    placeholder="Search branches by name, location, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="mb-grid">
                {filteredBranches.length > 0 ? (
                    filteredBranches.map(branch => (
                        <div key={branch.id} className={`mb-card ${!branch.isActive ? 'mb-card-inactive' : ''}`}>
                            <div className="mb-card-header">
                                <div className="mb-card-icon">
                                    <Building2 size={24} />
                                </div>
                                <div className="mb-card-status">
                                    {branch.isActive ? (
                                        <span className="mb-badge mb-badge-active">
                                            <CheckCircle size={14} /> Active
                                        </span>
                                    ) : (
                                        <span className="mb-badge mb-badge-inactive">
                                            <XCircle size={14} /> Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-card-body">
                                <h3 className="mb-card-title">{branch.branchName}</h3>
                                
                                <div className="mb-card-info">
                                    <div className="mb-info-row">
                                        <MapPin size={16} />
                                        <span>{branch.location}</span>
                                    </div>
                                    <div className="mb-info-row">
                                        <Mail size={16} />
                                        <span>{branch.branchEmail}</span>
                                    </div>
                                    <div className="mb-info-row">
                                        <Users size={16} />
                                        <span>{getPatientCount(branch.branchEmail)} Active Patients</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-card-actions">
                                <button 
                                    className="mb-btn-edit"
                                    onClick={() => handleOpenModal(branch)}
                                    title="Edit Branch"
                                >
                                    <Pencil size={16} /> Edit
                                </button>
                                <button 
                                    className="mb-btn-toggle"
                                    onClick={() => toggleStatus(branch)}
                                    title={branch.isActive ? "Deactivate" : "Activate"}
                                >
                                    {branch.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                    {branch.isActive ? "Deactivate" : "Activate"}
                                </button>
                                <button 
                                    className="mb-btn-delete"
                                    onClick={() => handleDelete(branch)}
                                    title="Delete Branch"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mb-empty">
                        <Building2 size={48} />
                        <h3>No branches found</h3>
                        <p>{searchQuery ? 'Try a different search term' : 'Create your first branch to get started'}</p>
                        {!searchQuery && (
                            <button className="btn-primary" onClick={() => handleOpenModal()}>
                                <Plus size={20} /> Add Branch
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {formError && (
                                <div className="modal-error">
                                    {formError}
                                </div>
                            )}

                            <div className="modal-input-group">
                                <label>Branch Name <span className="req">*</span></label>
                                <input 
                                    type="text"
                                    placeholder="e.g., Downtown Clinic"
                                    value={formData.branchName}
                                    onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                                />
                            </div>

                            <div className="modal-input-group">
                                <label>Location <span className="req">*</span></label>
                                <input 
                                    type="text"
                                    placeholder="e.g., New York, NY"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                />
                            </div>

                            <div className="modal-input-group">
                                <label>Branch Email <span className="req">*</span></label>
                                <input 
                                    type="email"
                                    placeholder="e.g., branch@clinic.com"
                                    value={formData.branchEmail}
                                    onChange={(e) => setFormData({...formData, branchEmail: e.target.value})}
                                    disabled={!!editingBranch}
                                />
                                {editingBranch ? (
                                    <small style={{color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block'}}>
                                        Email cannot be changed after creation
                                    </small>
                                ) : (
                                    <small style={{color: '#059669', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', fontWeight: 600}}>
                                        Used for branch login
                                    </small>
                                )}
                            </div>

                            {!editingBranch && (
                                <div className="modal-input-group">
                                    <label>Password <span className="req">*</span></label>
                                    <input 
                                        type="password"
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                    <small style={{color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block'}}>
                                        Branch user will login with email and this password
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={handleCloseModal} disabled={isCreating}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave} disabled={isCreating}>
                                {isCreating ? 'Creating...' : (editingBranch ? 'Update Branch' : 'Create Branch')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBranches;
