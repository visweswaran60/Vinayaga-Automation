import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import DiagnosticServices from './DiagnosticServices';
import ManageForms from './ManageForms';
import EmailSettings from './EmailSettings';
import ManageDoctors from './ManageDoctors';
import BranchPatients from './BranchPatients';
import AnalyticsDashboard from './AnalyticsDashboard';
import ManageBranches from './ManageBranches';
import BranchSwitcher from './BranchSwitcher';
import { getUserRole, isDirector, getEffectiveBranchEmail, getBranchDisplayName } from '../utils/roleHelpers';
import { addHospitalId } from '../utils/tenantHelpers';
import {
    PlusSquare,
    FileText,
    Users,
    UserPlus,
    Building2,
    BarChart3,
    Settings,
    LogOut,
    MapPin,
    Stethoscope,
    ChevronRight,
    User,
    Check,
    Pencil,
    UploadCloud,
    List,
    Calendar,
    X
} from 'lucide-react';

const ReferralForm = ({ onLogout, loggedInBranch, savedDoctors = [], onAddDoctor, onDeleteDoctor, userEmail = '', savedBranches = [] }) => {
    const [userRole, setUserRole] = useState('branch');
    const [effectiveBranchEmail, setEffectiveBranchEmail] = useState(null);
    const [activeBranch, setActiveBranch] = useState(null);
    const [hospitalName, setHospitalName] = useState('');

    // Initialize user role and active branch on mount
    useEffect(() => {
        const role = getUserRole(userEmail);
        setUserRole(role);
        const branchEmail = getEffectiveBranchEmail(userEmail, role);
        setEffectiveBranchEmail(branchEmail);
        
        // Load active branch for directors
        if (role === 'director') {
            const savedActiveBranch = localStorage.getItem('activeBranch');
            if (savedActiveBranch) {
                setActiveBranch(JSON.parse(savedActiveBranch));
            }
            
            // Load hospital name
            const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
            const userBranch = branches.find(b => b.directorEmail === userEmail);
            setHospitalName(userBranch?.hospitalName || 'Hospital');
        } else {
            // For branch users, use their branch name
            setHospitalName(loggedInBranch?.branchName || 'Branch');
        }
    }, [userEmail, loggedInBranch]);
    const [activeStep, setActiveStep] = useState(1);
    const diagnosticRef = useRef(null);
    const dicomRef = useRef(null);
    const [diagnosticFile, setDiagnosticFile] = useState(null);
    const [dicomFile, setDicomFile] = useState(null);
    const [formData, setFormData] = useState({
        doctorId: '',
        doctorName: '',
        doctorPhone: '',
        clinicName: '',
        clinicPhone: '',
        doctorEmail: ''
    });
    const [patientData, setPatientData] = useState({
        patientId: '',
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientPhone: '',
        scanDate: '',
        referringDoctor: ''
    });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const [activeSidebarItem, setActiveSidebarItem] = useState('Create Form');
    const [referralReasons, setReferralReasons] = useState([]);
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [savedForms, setSavedForms] = useState(() => {
        const saved = localStorage.getItem('savedForms');
        return saved ? JSON.parse(saved) : [];
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [submittedPatient, setSubmittedPatient] = useState('');
    const [diagnosticServices, setDiagnosticServices] = useState({});
    const [validationError, setValidationError] = useState('');

    const resetForm = () => {
        setActiveStep(1);
        setFormData({ doctorId: '', doctorName: '', doctorPhone: '', clinicName: '', clinicPhone: '', doctorEmail: '' });
        setPatientData({ patientId: '', patientName: '', patientAge: '', patientGender: '', patientPhone: '', scanDate: '', referringDoctor: '' });
        setReferralReasons([]);
        setClinicalNotes('');
        setDiagnosticServices({});
        setDiagnosticFile(null);
        setDicomFile(null);
        setValidationError('');
    };

    const validateStep = (step) => {
        setValidationError('');
        
        switch(step) {
            case 1: // Doctor Info
                if (!formData.doctorName.trim()) {
                    setValidationError('Doctor Name is required');
                    return false;
                }
                if (!formData.doctorPhone.trim()) {
                    setValidationError('Doctor Phone Number is required');
                    return false;
                }
                if (!formData.doctorEmail.trim()) {
                    setValidationError('Doctor Email is required');
                    return false;
                }
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(formData.doctorEmail)) {
                    setValidationError('Please enter a valid email address');
                    return false;
                }
                return true;

            case 2: // Patient Info
                if (!patientData.patientId.trim()) {
                    setValidationError('Patient ID is required');
                    return false;
                }
                if (!patientData.patientName.trim()) {
                    setValidationError('Patient Name is required');
                    return false;
                }
                if (!patientData.patientPhone.trim()) {
                    setValidationError('Patient Phone Number is required');
                    return false;
                }
                if (!dicomFile) {
                    setValidationError('DICOM file upload is required');
                    return false;
                }
                return true;

            case 3: // Diagnostic Services
                const selectedServices = Object.values(diagnosticServices).filter(s => s.checked);
                if (selectedServices.length === 0) {
                    setValidationError('Please select at least one diagnostic service');
                    return false;
                }
                
                // Validate tooth selection for services that need it
                for (let serviceId in diagnosticServices) {
                    const service = diagnosticServices[serviceId];
                    if (service.checked && service.needsTooth) {
                        if (service.maxTeeth === 1 && service.teeth.length !== 1) {
                            setValidationError(`Please select exactly one tooth for ${service.label}`);
                            return false;
                        }
                        if (service.maxTeeth > 1 && service.teeth.length === 0) {
                            setValidationError(`Please select at least one tooth for ${service.label}`);
                            return false;
                        }
                    }
                }
                return true;

            case 4: // Referral Reason
                if (referralReasons.length === 0) {
                    setValidationError('Please select at least one reason for referral');
                    return false;
                }
                return true;

            case 5: // Clinical Notes (optional, always valid)
                return true;

            default:
                return true;
        }
    };

    const handleSubmit = () => {
        // SAFETY CHECK: Directors must have a branch selected
        if (isDirector(userEmail) && !activeBranch) {
            alert('Please select a branch before creating a referral form.');
            return;
        }
        
        // Final validation before submission
        if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
            alert('Please complete all required fields before submitting the form.');
            return;
        }

        // Determine branch email: use activeBranch for directors, loggedInBranch for branch users
        const targetBranchEmail = isDirector(userEmail) 
            ? activeBranch?.branchEmail 
            : (loggedInBranch?.branchEmail || userEmail);

        // CRITICAL: Add hospitalId for tenant isolation
        const newForm = addHospitalId({
            id: Date.now(),
            createdAt: new Date().toISOString(),
            archived: false,
            doctorName: formData.doctorName,
            doctorId: formData.doctorId,
            doctorEmail: formData.doctorEmail,
            doctorPhone: formData.doctorPhone,
            clinicName: formData.clinicName,
            patientName: patientData.patientName,
            patientId: patientData.patientId,
            patientAge: patientData.patientAge,
            patientGender: patientData.patientGender,
            patientPhone: patientData.patientPhone,
            scanDate: patientData.scanDate,
            referralReasons,
            clinicalNotes,
            diagnosticServices,
            services: referralReasons,
            branchEmail: targetBranchEmail // Use determined branch email
        });
        
        setSavedForms(prev => {
            const updated = [newForm, ...prev];
            localStorage.setItem('savedForms', JSON.stringify(updated));
            return updated;
        });
        
        setSubmittedPatient(patientData.patientId || patientData.patientName || '123');
        setShowSuccessModal(true);
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        resetForm();
        setActiveSidebarItem('Manage Forms');
    };

    const handleUpdateForm = (updatedForm) => {
        setSavedForms(prev => {
            const updated = prev.map(f => f.id === updatedForm.id ? updatedForm : f);
            localStorage.setItem('savedForms', JSON.stringify(updated));
            return updated;
        });
    };

    const handleDeleteForm = (formId) => {
        setSavedForms(prev => {
            const updated = prev.filter(f => f.id !== formId);
            localStorage.setItem('savedForms', JSON.stringify(updated));
            return updated;
        });
    };

    const referralReasonOptions = [
        ['Implant Planning', 'Cyst / Tumour / Malignancy'],
        ['Teeth / Root / Bone Fracture', 'Root Canal / Endodontic Purpose'],
        ['Impacted / Supernumerary Tooth', 'Post Operative / Post Implant'],
        ['TMJ Pain / Clicking', 'Chronic / Idiopathic Pain'],
        ['Sinus Pathology', 'Periapical / Periodontal Lesion / Bone Loss'],
        ['Orthodontic', 'Airway Analysis'],
    ];

    const toggleReason = (reason) => {
        setReferralReasons(prev =>
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
        );
    };

    const steps = [
        { id: 1, name: 'Doctor Info' },
        { id: 2, name: 'Patient Info' },
        { id: 3, name: 'Diagnostic Services' },
        { id: 4, name: 'Referral Reason' },
        { id: 5, name: 'Clinical Notes' },
    ];

    const sidebarItems = [
        { icon: PlusSquare, label: 'Create Form' },
        { icon: FileText, label: 'Manage Forms' },
        { icon: Users, label: 'Branch Patients' },
        { icon: UserPlus, label: 'Manage Doctors' },
        { icon: BarChart3, label: 'Analytics' },
        { icon: Settings, label: 'Email Settings' },
    ];

    // Add Manage Branches for directors only
    const directorItems = isDirector(userEmail) 
        ? [{ icon: Building2, label: 'Manage Branches' }]
        : [];

    const allSidebarItems = [...sidebarItems, ...directorItems];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'doctorId' || name === 'doctorName') {
            setActiveField(name);
            if (value.length > 0) {
                const filtered = savedDoctors.filter(doc =>
                    doc[name].toLowerCase().includes(value.toLowerCase())
                );
                setSuggestions(filtered);
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (doc) => {
        setFormData({
            doctorId: doc.doctorId,
            doctorName: doc.doctorName,
            doctorPhone: doc.doctorPhone,
            clinicName: doc.clinicName,
            clinicPhone: doc.clinicPhone,
            doctorEmail: doc.doctorEmail
        });
        setShowSuggestions(false);
    };

    const handleSaveDoctor = () => {
        if (!formData.doctorName || !formData.doctorEmail) {
            alert("Please fill in at least the Doctor Name and Email to save.");
            return;
        }
        const exists = savedDoctors.some(doc => doc.doctorEmail === formData.doctorEmail && doc.branchEmail === loggedInBranch?.branchEmail);
        if (exists) {
            alert("This doctor is already in your managed list.");
            return;
        }
        // CRITICAL: Add hospitalId for tenant isolation
        const doctorData = addHospitalId({ 
            ...formData, 
            branchEmail: loggedInBranch?.branchEmail 
        });
        onAddDoctor(doctorData);
        alert("Doctor saved to Manage Doctors list!");
    };

    // Check if current doctor already exists in saved doctors
    const isDoctorAlreadySaved = () => {
        if (!formData.doctorEmail) return false;
        return savedDoctors.some(doc => 
            doc.doctorEmail === formData.doctorEmail && 
            doc.branchEmail === loggedInBranch?.branchEmail
        );
    };

    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    const handleNextStep = () => {
        if (!validateStep(activeStep)) {
            return;
        }
        setActiveStep(prev => Math.min(prev + 1, steps.length));
        setShowSuggestions(false);
    };

    const handlePrevStep = () => {
        setActiveStep(prev => Math.max(prev - 1, 1));
    };

    return (
        <div className="referral-page">
            {/* Sidebar */}
            <aside className="referral-sidebar">
                <div className="sidebar-brand">
                    <h2>{loggedInBranch?.hospitalName || 'Dental Cloud'}</h2>
                    <p>{loggedInBranch?.branchName || 'Diagnostics'}</p>
                    <span className="brand-subtext">MEDICAL VISUALIZATION &amp; REFERRAL</span>
                </div>

                <nav className="sidebar-nav">
                    {allSidebarItems.map((item, idx) => {
                        // Check if Create Form should be disabled for directors without active branch
                        const isCreateForm = item.label === 'Create Form';
                        const isDisabled = isCreateForm && isDirector(userEmail) && !activeBranch;
                        
                        return (
                            <button
                                key={idx}
                                className={`nav-item ${activeSidebarItem === item.label ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => {
                                    if (isDisabled) {
                                        alert('Please select a branch from the dropdown above to create a referral form.');
                                        return;
                                    }
                                    setActiveSidebarItem(item.label);
                                }}
                                disabled={isDisabled}
                                title={isDisabled ? 'Select a branch to create referrals' : ''}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                                {isDisabled && (
                                    <span style={{ 
                                        marginLeft: 'auto', 
                                        fontSize: '0.7rem', 
                                        opacity: 0.6,
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px'
                                    }}>
                                        Select Branch
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="profile-img" style={{ position: 'relative', overflow: 'hidden', borderRadius: '50%' }}>
                            {userEmail ? (
                                <img
                                    src={`https://unavatar.io/${encodeURIComponent(userEmail)}?fallback=false`}
                                    alt={userEmail[0].toUpperCase()}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div style={{
                                display: userEmail ? 'none' : 'flex',
                                width: '100%', height: '100%',
                                alignItems: 'center', justifyContent: 'center',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                color: '#fff', fontWeight: 700, fontSize: '1rem',
                                borderRadius: '50%', position: 'absolute', top: 0, left: 0
                            }}>
                                {userEmail ? userEmail[0].toUpperCase() : <User size={20} />}
                            </div>
                        </div>
                        <div className="profile-info">
                            <p className="user-email" title={userEmail}>{userEmail || 'user@dentalcloud.com'}</p>
                            <p className="user-role">Administrator</p>
                        </div>
                    </div>
                    <button className="btn-sidebar-logout" onClick={onLogout}>
                        <LogOut size={18} /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="referral-content">
                <div className="top-banner glass-morphism">
                    {/* Branch Switcher for Directors */}
                    {isDirector(userEmail) && (
                        <BranchSwitcher 
                            userEmail={userEmail}
                            userRole={userRole}
                            onBranchChange={(branch) => {
                                const branchEmail = branch ? branch.branchEmail : null;
                                setEffectiveBranchEmail(branchEmail);
                                setActiveBranch(branch); // Update active branch state
                            }}
                        />
                    )}
                    
                    {/* Hospital/Branch Name Display */}
                    <div className="active-branch-chip">
                        {isDirector(userEmail) ? (
                            <>
                                {/* Director: Show Hospital Name */}
                                <Building2 size={14} />
                                <span>{hospitalName}</span>
                                {activeBranch && (
                                    <>
                                        <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>•</span>
                                        <MapPin size={14} />
                                        <span className="branch-name">{activeBranch.branchName}</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Branch User: Show Branch Name */}
                                <MapPin size={14} />
                                <span>Active Branch:</span>
                                <span className="branch-name">{loggedInBranch?.branchName || 'Branch'}</span>
                                {loggedInBranch?.location && (
                                    <span style={{ marginLeft: '8px', opacity: 0.8, fontSize: '0.9em' }}>
                                        ({loggedInBranch.location})
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="content-container">

                    {/* ── MANAGE FORMS VIEW ── */}
                    {activeSidebarItem === 'Manage Forms' && (
                        <ManageForms
                            activeBranch={loggedInBranch?.branchName || 'Main Clinic'}
                            forms={savedForms.filter(f => !f.branchEmail || f.branchEmail === loggedInBranch?.branchEmail)}
                            onNewForm={() => setActiveSidebarItem('Create Form')}
                            onUpdateForm={handleUpdateForm}
                            onDeleteForm={handleDeleteForm}
                        />
                    )}

                    {/* ── EMAIL SETTINGS VIEW ── */}
                    {activeSidebarItem === 'Email Settings' && <EmailSettings />}

                    {/* ── BRANCH PATIENTS VIEW ── */}
                    {activeSidebarItem === 'Branch Patients' && (
                        <BranchPatients
                            onBranchSelect={(branch) => {
                                // Future: Navigate to branch-specific patient list
                                console.log('Selected branch:', branch);
                                alert(`Viewing patients for: ${branch.branchName}`);
                            }}
                        />
                    )}

                    {/* ── ANALYTICS DASHBOARD VIEW ── */}
                    {activeSidebarItem === 'Analytics' && <AnalyticsDashboard userEmail={userEmail} />}

                    {/* ── MANAGE DOCTORS VIEW ── */}
                    {activeSidebarItem === 'Manage Doctors' && (
                        <ManageDoctors
                            activeBranch={loggedInBranch?.branchName || 'Main Clinic'}
                            savedDoctors={savedDoctors.filter(d => !d.branchEmail || d.branchEmail === loggedInBranch?.branchEmail)}
                            onAddDoctor={(doc) => onAddDoctor(addHospitalId({ ...doc, branchEmail: loggedInBranch?.branchEmail }))}
                            onDeleteDoctor={onDeleteDoctor}
                        />
                    )}

                    {/* ── MANAGE BRANCHES VIEW (DIRECTOR ONLY) ── */}
                    {activeSidebarItem === 'Manage Branches' && isDirector(userEmail) && (
                        <ManageBranches 
                            userEmail={userEmail}
                            userRole={userRole}
                        />
                    )}

                    {/* ── CREATE FORM VIEW ── */}
                    {activeSidebarItem === 'Create Form' && (
                        <>
                            <header className="content-header">
                                <div className="header-titles">
                                    <h1>Create Referral Form</h1>
                                    <p>Fill in the diagnostic referral details</p>
                                </div>
                            </header>

                            {/* Progress Bar */}
                            <div className="referral-steps-container glass-morphism">
                                <div className="steps-row">
                                    {/* Background track + green fill */}
                                    <div className="steps-track">
                                        <div
                                            className="steps-track-fill"
                                            style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
                                        />
                                    </div>
                                    {steps.map((step) => (
                                        <div
                                            key={step.id}
                                            className={`step-item ${activeStep > step.id ? 'completed' : ''} ${activeStep === step.id ? 'active' : ''}`}
                                        >
                                            <div className="step-number">{step.id}</div>
                                            <span className="step-label">{step.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Form Section */}
                            <section className="referral-form-section glass-morphism">
                                {/* Step 1: Doctor Info */}
                                {activeStep === 1 && (
                                    <>
                                        {validationError && (
                                            <div className="validation-error-banner">
                                                {validationError}
                                            </div>
                                        )}
                                        <div className="form-section-header">
                                            <div className="section-icon"><Stethoscope size={20} /></div>
                                            <h2>Doctor Information</h2>
                                        </div>
                                        <form className="doctor-info-form">
                                            <div className="referral-form-grid">
                                                <div className="input-group search-group">
                                                    <label>Doctor ID</label>
                                                    <input type="text" name="doctorId" value={formData.doctorId} onChange={handleInputChange} placeholder="e.g., DR-2024-001" autoComplete="off" />
                                                    {showSuggestions && activeField === 'doctorId' && suggestions.length > 0 && (
                                                        <ul className="suggestions-list">
                                                            {suggestions.map((doc, idx) => (
                                                                <li key={idx} onClick={() => handleSuggestionClick(doc)}>
                                                                    <strong>{doc.doctorId}</strong> - {doc.doctorName}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="input-group search-group">
                                                    <label>Doctor Name *</label>
                                                    <input type="text" name="doctorName" value={formData.doctorName} onChange={handleInputChange} placeholder="Enter doctor's full name" required autoComplete="off" />
                                                    {showSuggestions && activeField === 'doctorName' && suggestions.length > 0 && (
                                                        <ul className="suggestions-list">
                                                            {suggestions.map((doc, idx) => (
                                                                <li key={idx} onClick={() => handleSuggestionClick(doc)}>
                                                                    <strong>{doc.doctorName}</strong> ({doc.doctorId})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="input-group">
                                                    <label>Doctor Phone Number *</label>
                                                    <input type="text" name="doctorPhone" value={formData.doctorPhone} onChange={handleInputChange} placeholder="10-digit phone number" required />
                                                </div>
                                                <div className="input-group">
                                                    <label>Clinic Name</label>
                                                    <input type="text" name="clinicName" value={formData.clinicName} onChange={handleInputChange} placeholder="Enter clinic name" />
                                                </div>
                                                <div className="input-group">
                                                    <label>Clinic Phone Number</label>
                                                    <input type="text" name="clinicPhone" value={formData.clinicPhone} onChange={handleInputChange} placeholder="Clinic contact number" />
                                                </div>
                                                <div className="input-group">
                                                    <label>Doctor Email *</label>
                                                    <input type="email" name="doctorEmail" value={formData.doctorEmail} onChange={handleInputChange} placeholder="Email address" required />
                                                </div>
                                            </div>
                                            <div className="form-actions">
                                                {isDoctorAlreadySaved() ? (
                                                    <button 
                                                        type="button" 
                                                        className="btn-doctor-saved" 
                                                        disabled
                                                        title="This doctor is already in your managed list"
                                                    >
                                                        <Check size={18} /> Doctor Already Saved
                                                    </button>
                                                ) : (
                                                    <button 
                                                        type="button" 
                                                        className="btn-add-secondary" 
                                                        onClick={handleSaveDoctor}
                                                        disabled={!formData.doctorName || !formData.doctorEmail}
                                                    >
                                                        <UserPlus size={18} /> + Add to Manage Doctors
                                                    </button>
                                                )}
                                                <button type="button" className="btn-next" onClick={handleNextStep}>
                                                    Next Step <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {/* Step 2: Patient Info */}
                                {activeStep === 2 && (
                                    <>
                                        {validationError && (
                                            <div className="validation-error-banner">
                                                {validationError}
                                            </div>
                                        )}
                                        <div className="patient-info-card">
                                            <div className="patient-info-header-v2">
                                                <div className="patient-info-icon-v2"><User size={20} /></div>
                                                <div className="patient-info-title-v2">Patient Information</div>
                                            </div>

                                            <div className="patient-grid-v2">
                                                <div className="custom-input-card">
                                                    <label>Patient ID <span className="req">*</span></label>
                                                    <input type="text" name="patientId" value={patientData.patientId} onChange={handlePatientChange} placeholder="e.g., P-2024-001" required />
                                                </div>
                                                <div className="custom-input-card">
                                                    <label>Patient Name <span className="req">*</span></label>
                                                    <input type="text" name="patientName" value={patientData.patientName} onChange={handlePatientChange} placeholder="Enter patient's full name" required />
                                                </div>
                                                <div className="custom-input-card">
                                                    <label>Age</label>
                                                    <input type="number" name="patientAge" value={patientData.patientAge} onChange={handlePatientChange} placeholder="Age in years" />
                                                </div>
                                                <div className="custom-input-card">
                                                    <label>Gender</label>
                                                    <select name="patientGender" value={patientData.patientGender} onChange={handlePatientChange}>
                                                        <option value="">Select gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="custom-input-card">
                                                    <label>Phone Number <span className="req">*</span></label>
                                                    <input type="text" name="patientPhone" value={patientData.patientPhone} onChange={handlePatientChange} placeholder="10-digit phone number" required />
                                                </div>
                                                <div className="custom-input-card">
                                                    <label>Scan Date</label>
                                                    <input type="date" name="scanDate" value={patientData.scanDate} onChange={handlePatientChange} />
                                                </div>
                                                <div className="custom-input-card full-width">
                                                    <label>Referring Doctor</label>
                                                    <input type="text" name="referringDoctor" value={patientData.referringDoctor} onChange={handlePatientChange} placeholder="Name of referring doctor" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="upload-boxes-container">
                                            <div className="upload-section">
                                                <div className="upload-section-title">Upload Diagnostic Report <span className="optional-badge">(Optional)</span></div>
                                                <div className={`upload-box primary-dash ${diagnosticFile ? 'has-file' : ''}`} onClick={() => diagnosticRef.current?.click()}>
                                                    <input type="file" ref={diagnosticRef} style={{ display: 'none' }} accept=".pdf,.doc,.docx" onChange={(e) => { if (e.target.files?.[0]) setDiagnosticFile(e.target.files[0]) }} />
                                                    {diagnosticFile ? (
                                                        <>
                                                            <FileText size={32} strokeWidth={1.5} color="#16a34a" className="upload-icon" />
                                                            <span className="upload-text" style={{ color: '#16a34a', fontWeight: '600' }}>{diagnosticFile.name}</span>
                                                            <span className="upload-hint">{(diagnosticFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText size={32} strokeWidth={1.5} className="upload-icon" />
                                                            <span className="upload-text">Drag and drop your file here</span>
                                                            <span className="upload-or">or</span>
                                                            <button type="button" className="upload-btn" onClick={(e) => { e.stopPropagation(); diagnosticRef.current?.click(); }}>Browse Files</button>
                                                            <span className="upload-hint">Accepted: PDF, DOC, DOCX</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="upload-section">
                                                <div className="upload-section-title">Upload DICOM Files <span className="req">*</span></div>
                                                <div className={`upload-box ${dicomFile ? 'has-file' : ''} ${!dicomFile ? 'upload-required' : ''}`} onClick={() => dicomRef.current?.click()}>
                                                    <input type="file" ref={dicomRef} style={{ display: 'none' }} accept=".dcm,.zip" onChange={(e) => { if (e.target.files?.[0]) setDicomFile(e.target.files[0]) }} />
                                                    {dicomFile ? (
                                                        <>
                                                            <List size={32} strokeWidth={1.5} color="#16a34a" className="upload-icon" />
                                                            <span className="upload-text" style={{ color: '#16a34a', fontWeight: '600' }}>{dicomFile.name}</span>
                                                            <span className="upload-hint">{(dicomFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <List size={32} strokeWidth={1.5} className="upload-icon" />
                                                            <span className="upload-text">Drag and drop your file here</span>
                                                            <span className="upload-or">or</span>
                                                            <button type="button" className="upload-btn" onClick={(e) => { e.stopPropagation(); dicomRef.current?.click(); }}>Browse Files</button>
                                                            <span className="upload-hint">Accepted: DCM or ZIP file</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bottom-action-card">
                                            <button type="button" className="btn-reset" onClick={resetForm}>Reset Form</button>
                                            <div className="bottom-action-right">
                                                <button type="button" className="btn-neutral" onClick={handlePrevStep}>Previous</button>
                                                <button type="button" className="btn-primary-action" onClick={handleNextStep}>Next</button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Step 3: 3D Diagnostic Services */}
                                {activeStep === 3 && (
                                    <>
                                        {validationError && (
                                            <div className="validation-error-banner">
                                                {validationError}
                                            </div>
                                        )}
                                        <DiagnosticServices
                                            services={diagnosticServices}
                                            onServicesChange={setDiagnosticServices}
                                            onPrev={handlePrevStep}
                                            onNext={handleNextStep}
                                        />
                                    </>
                                )}


                                {/* Step 4: Reason for Referral */}
                                {activeStep === 4 && (
                                    <>
                                        {validationError && (
                                            <div className="validation-error-banner">
                                                {validationError}
                                            </div>
                                        )}
                                        <div className="form-section-header">
                                            <div className="section-icon"><FileText size={20} /></div>
                                            <h2>Reason for Referral</h2>
                                        </div>
                                        <div className="reason-grid">
                                            {referralReasonOptions.map((pair, rowIdx) =>
                                                pair.map((reason) => (
                                                    <label
                                                        key={reason}
                                                        className={`reason-checkbox-card ${referralReasons.includes(reason) ? 'checked' : ''}`}
                                                        onClick={() => toggleReason(reason)}
                                                    >
                                                        <span className={`svc-checkbox ${referralReasons.includes(reason) ? 'svc-checkbox--on' : ''}`}>
                                                            {referralReasons.includes(reason) && <Check size={12} strokeWidth={3.5} />}
                                                        </span>
                                                        <span className="reason-label">{reason}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                                            <button type="button" className="btn-add-secondary" onClick={handlePrevStep}>← Back</button>
                                            <button type="button" className="btn-next" onClick={handleNextStep}>Next Step <ChevronRight size={18} /></button>
                                        </div>
                                    </>
                                )}

                                {/* Step 5: Clinical Notes */}
                                {activeStep === 5 && (
                                    <>
                                        <div className="form-section-header">
                                            <div className="section-icon"><Pencil size={20} /></div>
                                            <h2>Clinical Notes</h2>
                                        </div>
                                        <div className="clinical-notes-section">
                                            <label className="clinical-notes-label">Doctor's Notes</label>
                                            <textarea
                                                className="clinical-notes-textarea"
                                                placeholder="Enter any additional clinical information, observations, or special instructions for the diagnostic center..."
                                                value={clinicalNotes}
                                                onChange={e => setClinicalNotes(e.target.value)}
                                                rows={6}
                                            />
                                        </div>
                                        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                                            <button type="button" className="btn-add-secondary" onClick={handlePrevStep}>← Back</button>
                                            <button type="button" className="btn-submit" onClick={handleSubmit}>
                                                Submit Form
                                            </button>
                                        </div>
                                    </>
                                )}
                            </section>
                        </>
                    )}

                    {/* ── OTHER SIDEBAR ITEMS (placeholder) ── */}
                    {activeSidebarItem !== 'Create Form' && 
                     activeSidebarItem !== 'Manage Branches' && 
                     activeSidebarItem !== 'Manage Forms' && 
                     activeSidebarItem !== 'Email Settings' && 
                     activeSidebarItem !== 'Manage Doctors' && 
                     activeSidebarItem !== 'Branch Patients' && 
                     activeSidebarItem !== 'Analytics' && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <h2 style={{ marginBottom: '0.5rem' }}>{activeSidebarItem}</h2>
                            <p>This section is coming soon.</p>
                        </div>
                    )}
                </div>

                <footer className="referral-footer">
                    <p>© 2026 Dental Cloud Technologies</p>
                </footer>
            </main>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="success-modal-overlay">
                    <div className="success-modal">
                        <div className="success-modal-header">
                            <h3>Form Submitted Successfully</h3>
                            <button className="success-modal-close" onClick={() => setShowSuccessModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="success-modal-body">
                            <div className="success-check-icon">
                                <Check size={48} strokeWidth={4} color="white" />
                            </div>
                            <p className="success-message">The referral form has been saved successfully.</p>
                            <p className="success-patient">Patient: <strong>{submittedPatient}</strong></p>
                        </div>
                        <div className="success-modal-footer">
                            <button className="btn-view-forms" onClick={handleCloseModal}>View All Forms</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferralForm;
