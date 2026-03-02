import React, { useState, useRef } from 'react';
import { BarChart2, Search, PlusSquare, Archive, ClipboardList, Upload, Eye, Edit2, Bell, Download, Calendar, X, FileUp, FileText } from 'lucide-react';

const ManageForms = ({ forms = [], activeBranch = 'Main Clinic', onNewForm, onUpdateForm, onDeleteForm, onEditForm }) => {
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedUploadForm, setSelectedUploadForm] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedFilesMap, setUploadedFilesMap] = useState(() => {
        const saved = localStorage.getItem('uploadedFiles');
        return saved ? JSON.parse(saved) : {};
    });
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewForm, setViewForm] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteFormId, setDeleteFormId] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0] && selectedUploadForm) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Save to localStorage
            const updatedFiles = {
                ...uploadedFilesMap,
                [selectedUploadForm.patientId]: file.name
            };
            setUploadedFilesMap(updatedFiles);
            localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
        }
    };

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
        setSelectedFile(null);
    };

    const handleViewForm = (form) => {
        setViewForm(form);
        setViewModalOpen(true);
    };

    const handleEditForm = (form) => {
        setEditForm({ ...form });
        setEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (editForm && onUpdateForm) {
            onUpdateForm(editForm);
            setEditModalOpen(false);
            setEditForm(null);
        }
    };

    const handleDeleteClick = (formId) => {
        setDeleteFormId(formId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteFormId && onDeleteForm) {
            onDeleteForm(deleteFormId);
        }
        setDeleteConfirmOpen(false);
        setDeleteFormId(null);
    };

    const handleArchiveToggle = (form) => {
        if (onUpdateForm) {
            onUpdateForm({ ...form, archived: !form.archived });
        }
    };

    const activeForms = forms.filter(f => !f.archived);
    const archivedForms = forms.filter(f => f.archived);

    const displayed = (showArchived ? archivedForms : activeForms).filter(f => {
        const q = search.toLowerCase();
        const matchQ = !q || f.patientName?.toLowerCase().includes(q) || f.patientId?.toLowerCase().includes(q);
        const date = new Date(f.createdAt);
        const matchFrom = !fromDate || date >= new Date(fromDate);
        const matchTo = !toDate || date <= new Date(toDate);
        return matchQ && matchFrom && matchTo;
    });

    return (
        <div className="mf-wrapper">
            {/* Header */}
            <div className="mf-header">
                <div>
                    <h1 className="mf-title">Manage Forms</h1>
                    <p className="mf-subtitle">View, edit, or archive submitted referral forms</p>
                </div>
                <div className="mf-header-actions">
                    <button
                        className={`mf-btn-archived ${showArchived ? 'mf-btn-archived--on' : ''}`}
                        onClick={() => setShowArchived(v => !v)}
                    >
                        <Archive size={15} />
                        {showArchived ? 'View Active' : 'View Archived'}
                    </button>
                    <button className="mf-btn-new" onClick={onNewForm}>
                        <PlusSquare size={16} />
                        New Form
                    </button>
                </div>
            </div>

            {/* Stat tiles */}
            <div className="mf-stats">
                <div className="mf-stat mf-stat--green">
                    <span className="mf-stat-num">{activeForms.length}</span>
                    <span className="mf-stat-label">Active Forms</span>
                </div>
                <div className="mf-stat mf-stat--grey">
                    <span className="mf-stat-num">{archivedForms.length}</span>
                    <span className="mf-stat-label">Archived</span>
                </div>
                <div className="mf-stat mf-stat--dark">
                    <span className="mf-stat-num">{forms.length}</span>
                    <span className="mf-stat-label">Total</span>
                </div>
            </div>

            {/* Search + date filters */}
            <div className="mf-filters-card">
                <div className="mf-search-wrap">
                    <Search size={18} className="mf-search-icon" />
                    <input
                        className="mf-search-input"
                        type="text"
                        placeholder="Search by Patient ID or Name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="mf-date-filters">
                    <div className="mf-date-wrap">
                        <label className="mf-date-label">From:</label>
                        <div className="date-input-container">
                            <input type="date" className="mf-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            <Calendar size={14} className="date-icon" />
                        </div>
                    </div>
                    <div className="mf-date-wrap">
                        <label className="mf-date-label">To:</label>
                        <div className="date-input-container">
                            <input type="date" className="mf-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                            <Calendar size={14} className="date-icon" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table / Empty state */}
            <div className="mf-table-container">
                {displayed.length === 0 ? (
                    <div className="mf-empty">
                        <BarChart2 size={52} className="mf-empty-icon" />
                        <p className="mf-empty-text">
                            No referral forms yet. Create your first form to get started.
                        </p>
                    </div>
                ) : (
                    <table className="mf-table-v2">
                        <thead>
                            <tr>
                                <th>NO.</th>
                                <th>PATIENT ID</th>
                                <th>PATIENT NAME</th>
                                <th>CASE STATUS</th>
                                <th>REPORT</th>
                                <th>NOTIFICATIONS</th>
                                <th>DOCTOR</th>
                                <th>DATE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((f, i) => {
                                const formDate = f.createdAt ? new Date(f.createdAt) : null;
                                const formattedDate = formDate ? formDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                                return (
                                    <tr key={f.id || i}>
                                        <td>{i + 1}</td>
                                        <td><strong>{f.patientId || '—'}</strong></td>
                                        <td>{f.patientName || '—'}</td>
                                        <td>
                                            <div className="chip-status">
                                                <ClipboardList size={14} /> Created
                                            </div>
                                        </td>
                                        <td>
                                            {uploadedFilesMap[f.patientId] ? (
                                                <div
                                                    className="chip-view"
                                                    onClick={() => {
                                                        const fileURL = URL.createObjectURL(uploadedFilesMap[f.patientId]);
                                                        window.open(fileURL, '_blank');
                                                    }}
                                                >
                                                    <FileText size={14} /> View
                                                </div>
                                            ) : (
                                                <div
                                                    className="chip-report"
                                                    onClick={() => {
                                                        setSelectedUploadForm(f);
                                                        setUploadModalOpen(true);
                                                    }}
                                                >
                                                    <Upload size={14} /> Upload
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="notification-chips">
                                                <div className="chip-notif">
                                                    <span className="notif-dot phone"></span> Not Sent
                                                </div>
                                                <div className="chip-notif">
                                                    <span className="notif-dot email"></span> Not Sent
                                                </div>
                                            </div>
                                        </td>
                                        <td>{f.doctorName || '—'}</td>
                                        <td>
                                            {formattedDate !== '—' ? (
                                                <div className="table-date">
                                                    <span style={{ fontWeight: 600 }}>{formattedDate.split(', ')[0]}</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{formattedDate.split(', ')[1]}</span>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="action-btn view"
                                                    data-tooltip="View"
                                                    title="View"
                                                    onClick={() => handleViewForm(f)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="action-btn edit"
                                                    data-tooltip="Edit"
                                                    title="Edit"
                                                    onClick={() => handleEditForm(f)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn archive"
                                                    data-tooltip={f.archived ? "Unarchive" : "Archive"}
                                                    title={f.archived ? "Unarchive" : "Archive"}
                                                    onClick={() => handleArchiveToggle(f)}
                                                >
                                                    <Archive size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    data-tooltip="Delete"
                                                    title="Delete"
                                                    onClick={() => handleDeleteClick(f.id)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Upload Diagnostic Report Modal */}
            {uploadModalOpen && (
                <div className="success-modal-overlay">
                    <div className="upload-modal">
                        <div className="upload-modal-header">
                            <h3>Upload Diagnostic Report</h3>
                            <button className="success-modal-close" onClick={handleCloseUploadModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="upload-modal-body">
                            <div className="patient-upload-info">
                                <span className="p-id-badge">{selectedUploadForm?.patientId || 'N/A'}</span>
                                <span className="p-name">{selectedUploadForm?.patientName || 'Unknown Patient'}</span>
                                <div className="p-doctor">Referring Doctor: Dr. {selectedUploadForm?.doctorName || 'Not Specified'}</div>
                            </div>
                            <div className={`upload-dropzone ${selectedFile ? 'has-file' : ''}`} onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf" onChange={handleFileChange} />
                                {selectedFile ? (
                                    <>
                                        <div className="dropzone-icon has-file-icon">
                                            <FileUp size={42} strokeWidth={1.5} color="#16a34a" />
                                        </div>
                                        <h4 style={{ color: '#16a34a' }}>{selectedFile.name}</h4>
                                        <p>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="dropzone-icon">
                                            <FileUp size={42} strokeWidth={1.5} />
                                        </div>
                                        <h4>Click to select PDF file</h4>
                                        <p>Diagnostic report (PDF only, max 10MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="upload-modal-footer">
                            <button className="btn-cancel" onClick={handleCloseUploadModal}>Cancel</button>
                            <button className="btn-upload-action" onClick={() => selectedFile ? handleCloseUploadModal() : fileInputRef.current?.click()}>
                                <Upload size={16} /> {selectedFile ? 'Upload Report' : 'Select File'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Form Modal */}
            {viewModalOpen && viewForm && (
                <div className="success-modal-overlay" onClick={() => setViewModalOpen(false)}>
                    <div className="view-form-modal" onClick={e => e.stopPropagation()}>
                        <div className="upload-modal-header">
                            <h3>Form Details</h3>
                            <button className="success-modal-close" onClick={() => setViewModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="view-form-body">
                            <div className="view-section">
                                <h4 className="view-section-title">Patient Information</h4>
                                <div className="view-grid">
                                    <div className="view-item">
                                        <span className="view-label">Patient ID:</span>
                                        <span className="view-value">{viewForm.patientId || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Patient Name:</span>
                                        <span className="view-value">{viewForm.patientName || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Age:</span>
                                        <span className="view-value">{viewForm.patientAge || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Gender:</span>
                                        <span className="view-value">{viewForm.patientGender || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Phone:</span>
                                        <span className="view-value">{viewForm.patientPhone || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Scan Date:</span>
                                        <span className="view-value">{viewForm.scanDate || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="view-section">
                                <h4 className="view-section-title">Doctor Information</h4>
                                <div className="view-grid">
                                    <div className="view-item">
                                        <span className="view-label">Doctor Name:</span>
                                        <span className="view-value">{viewForm.doctorName || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Doctor ID:</span>
                                        <span className="view-value">{viewForm.doctorId || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Email:</span>
                                        <span className="view-value">{viewForm.doctorEmail || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Phone:</span>
                                        <span className="view-value">{viewForm.doctorPhone || '—'}</span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Clinic:</span>
                                        <span className="view-value">{viewForm.clinicName || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {viewForm.referralReasons && viewForm.referralReasons.length > 0 && (
                                <div className="view-section">
                                    <h4 className="view-section-title">Referral Reasons</h4>
                                    <div className="view-tags">
                                        {viewForm.referralReasons.map((reason, idx) => (
                                            <span key={idx} className="view-tag">{reason}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewForm.clinicalNotes && (
                                <div className="view-section">
                                    <h4 className="view-section-title">Clinical Notes</h4>
                                    <p className="view-notes">{viewForm.clinicalNotes}</p>
                                </div>
                            )}

                            <div className="view-section">
                                <h4 className="view-section-title">Form Details</h4>
                                <div className="view-grid">
                                    <div className="view-item">
                                        <span className="view-label">Created:</span>
                                        <span className="view-value">
                                            {new Date(viewForm.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="view-item">
                                        <span className="view-label">Status:</span>
                                        <span className="view-value">{viewForm.archived ? 'Archived' : 'Active'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="upload-modal-footer">
                            <button className="btn-cancel" onClick={() => setViewModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Form Modal */}
            {editModalOpen && editForm && (
                <div className="success-modal-overlay" onClick={() => setEditModalOpen(false)}>
                    <div className="view-form-modal" onClick={e => e.stopPropagation()}>
                        <div className="upload-modal-header">
                            <h3>Edit Form</h3>
                            <button className="success-modal-close" onClick={() => setEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="view-form-body">
                            <div className="view-section">
                                <h4 className="view-section-title">Patient Information</h4>
                                <div className="edit-grid">
                                    <div className="edit-field">
                                        <label className="edit-label">Patient ID</label>
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editForm.patientId || ''}
                                            onChange={(e) => setEditForm({ ...editForm, patientId: e.target.value })}
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label className="edit-label">Patient Name</label>
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editForm.patientName || ''}
                                            onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })}
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label className="edit-label">Age</label>
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editForm.patientAge || ''}
                                            onChange={(e) => setEditForm({ ...editForm, patientAge: e.target.value })}
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label className="edit-label">Gender</label>
                                        <select
                                            className="edit-input"
                                            value={editForm.patientGender || ''}
                                            onChange={(e) => setEditForm({ ...editForm, patientGender: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="edit-field">
                                        <label className="edit-label">Phone</label>
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editForm.patientPhone || ''}
                                            onChange={(e) => setEditForm({ ...editForm, patientPhone: e.target.value })}
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label className="edit-label">Scan Date</label>
                                        <input
                                            type="date"
                                            className="edit-input"
                                            value={editForm.scanDate || ''}
                                            onChange={(e) => setEditForm({ ...editForm, scanDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="view-section">
                                <h4 className="view-section-title">Clinical Notes</h4>
                                <textarea
                                    className="edit-textarea"
                                    rows="4"
                                    value={editForm.clinicalNotes || ''}
                                    onChange={(e) => setEditForm({ ...editForm, clinicalNotes: e.target.value })}
                                    placeholder="Enter clinical notes..."
                                />
                            </div>
                        </div>
                        <div className="upload-modal-footer">
                            <button className="btn-cancel" onClick={() => setEditModalOpen(false)}>Cancel</button>
                            <button className="btn-upload-action" onClick={handleSaveEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="success-modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
                    <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="upload-modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="success-modal-close" onClick={() => setDeleteConfirmOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="delete-modal-body">
                            <div className="delete-icon-wrapper">
                                <X size={48} color="#dc2626" />
                            </div>
                            <p className="delete-message">
                                Are you sure you want to delete this form? This action cannot be undone.
                            </p>
                        </div>
                        <div className="upload-modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
                            <button className="btn-delete-confirm" onClick={handleConfirmDelete}>
                                Delete Form
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageForms;
