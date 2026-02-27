import React, { useState } from 'react';
import { Search, UserPlus, User, X, Phone, Mail, Building2, Shield, Eye, Edit2, Trash2 } from 'lucide-react';

const EMPTY = { doctorId: '', doctorName: '', doctorPhone: '', clinicName: '', clinicPhone: '', doctorEmail: '' };

const ManageDoctors = ({ activeBranch = 'Main Clinic', savedDoctors = [], onAddDoctor, onDeleteDoctor }) => {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');
    const [viewDoctor, setViewDoctor] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const filtered = savedDoctors.filter(d => {
        const q = search.toLowerCase();
        return !q || d.doctorName?.toLowerCase().includes(q)
            || d.doctorEmail?.toLowerCase().includes(q)
            || d.clinicName?.toLowerCase().includes(q);
    });

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAdd = () => {
        if (!form.doctorName || !form.doctorEmail) {
            setError('Doctor Name and Email are required.');
            return;
        }
        if (editIndex !== null) {
            // Edit mode: delete old, add updated
            onDeleteDoctor?.(editIndex);
            onAddDoctor?.(form);
            setEditIndex(null);
        } else {
            onAddDoctor?.(form);
        }
        setForm(EMPTY);
        setError('');
        setShowModal(false);
    };

    const handleEdit = (doc, idx) => {
        setForm({ ...doc });
        setEditIndex(idx);
        setShowModal(true);
        setError('');
    };

    const handleDelete = (idx) => {
        setDeleteConfirm(idx);
    };

    const confirmDelete = () => {
        if (deleteConfirm !== null) {
            onDeleteDoctor?.(deleteConfirm);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="md-wrapper">
            {/* Header */}
            <div className="md-header">
                <div>
                    <h1 className="md-title">Manage Doctors</h1>
                    <p className="md-subtitle">Branch: {activeBranch}</p>
                </div>
                <button className="md-btn-add" onClick={() => { setShowModal(true); setEditIndex(null); setForm(EMPTY); setError(''); }}>
                    <UserPlus size={16} />
                    Add Doctor
                </button>
            </div>

            {/* Search */}
            <div className="md-search-bar">
                <Search size={15} className="md-search-icon" />
                <input
                    className="md-search-input"
                    placeholder="Search doctors by name, email, or hospital..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Doctor list / empty state */}
            <div className="md-list-wrap">
                {filtered.length === 0 ? (
                    <div className="md-empty">
                        <div className="md-empty-icon">
                            <User size={36} strokeWidth={1.2} />
                        </div>
                        <p className="md-empty-title">No doctors found</p>
                        <p className="md-empty-sub">Add your first doctor to get started</p>
                        <button className="md-btn-add" onClick={() => { setShowModal(true); setError(''); }}>
                            Add Doctor
                        </button>
                    </div>
                ) : (
                    <div className="md-list">
                        {filtered.map((doc, i) => (
                            <div key={i} className="md-card-v2">
                                <div className="md-card-v2-main">
                                    <div className="md-card-avatar-v2">
                                        <User size={32} />
                                    </div>
                                    <div className="md-card-info-v2">
                                        <h3 className="md-card-name-v2">{doc.doctorName}</h3>
                                        {doc.doctorEmail && (
                                            <p className="md-card-detail-v2">
                                                <Mail size={14} className="md-detail-icon" /> {doc.doctorEmail}
                                            </p>
                                        )}
                                        {doc.doctorPhone && (
                                            <p className="md-card-detail-v2">
                                                <Phone size={14} className="md-detail-icon" /> {doc.doctorPhone}
                                            </p>
                                        )}
                                        {doc.clinicName && (
                                            <p className="md-card-detail-v2">
                                                <Shield size={14} className="md-detail-icon" /> {doc.clinicName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="md-card-actions-divider"></div>
                                <div className="md-card-actions-v2">
                                    <button className="md-action-btn-v2" title="View" onClick={() => setViewDoctor(doc)}><Eye size={14} /></button>
                                    <button className="md-action-btn-v2" title="Edit" onClick={() => handleEdit(doc, i)}><Edit2 size={14} /></button>
                                    <button className="md-action-btn-v2 md-action-delete" title="Delete" onClick={() => handleDelete(i)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Doctor Modal */}
            {viewDoctor && (
                <div className="md-modal-overlay" onClick={() => setViewDoctor(null)}>
                    <div className="md-modal" onClick={e => e.stopPropagation()}>
                        <div className="md-modal-header">
                            <h3>Doctor Details</h3>
                            <button className="md-modal-close" onClick={() => setViewDoctor(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={32} color="#fff" />
                                </div>
                            </div>
                            <h2 style={{ textAlign: 'center', margin: 0, color: '#1f2937' }}>{viewDoctor.doctorName}</h2>
                            {viewDoctor.doctorId && <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}><strong>ID:</strong> {viewDoctor.doctorId}</p>}
                            {viewDoctor.doctorEmail && <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{viewDoctor.doctorEmail}</p>}
                            {viewDoctor.doctorPhone && <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{viewDoctor.doctorPhone}</p>}
                            {viewDoctor.clinicName && <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}><Building2 size={14} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{viewDoctor.clinicName}</p>}
                            {viewDoctor.clinicPhone && <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{viewDoctor.clinicPhone} (Clinic)</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Doctor Modal */}
            {showModal && (
                <div className="md-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="md-modal" onClick={e => e.stopPropagation()}>
                        <div className="md-modal-header">
                            <h3>{editIndex !== null ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                            <button className="md-modal-close" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {error && <div className="md-modal-error">{error}</div>}

                        <div className="md-modal-grid">
                            {[
                                { name: 'doctorId', label: 'Doctor ID', placeholder: 'e.g. DR-001' },
                                { name: 'doctorName', label: 'Doctor Name *', placeholder: 'Full name' },
                                { name: 'doctorPhone', label: 'Doctor Phone', placeholder: '10-digit number' },
                                { name: 'doctorEmail', label: 'Doctor Email *', placeholder: 'email@example.com', type: 'email' },
                                { name: 'clinicName', label: 'Clinic / Hospital', placeholder: 'Clinic name' },
                                { name: 'clinicPhone', label: 'Clinic Phone', placeholder: 'Clinic phone' },
                            ].map(f => (
                                <div key={f.name} className="md-modal-field">
                                    <label className="md-modal-label">{f.label}</label>
                                    <input
                                        className="md-modal-input"
                                        name={f.name}
                                        value={form[f.name]}
                                        onChange={handleChange}
                                        placeholder={f.placeholder}
                                        type={f.type || 'text'}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="md-modal-actions">
                            <button className="md-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="md-btn-add" onClick={handleAdd}>{editIndex !== null ? 'Update Doctor' : 'Save Doctor'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm !== null && (
                <div className="md-modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="md-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="md-modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="md-modal-close" onClick={() => setDeleteConfirm(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
                                Are you sure you want to remove this doctor from your list? This action cannot be undone.
                            </p>
                        </div>
                        <div className="md-modal-actions">
                            <button className="md-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="md-action-delete" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageDoctors;
