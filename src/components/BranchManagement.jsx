import React, { useState } from 'react';
import { LogOut, Building2, Plus, Trash2, MapPin, Phone } from 'lucide-react';

const BranchManagement = ({
    onLogout,
    onSaveSuccess,
    userEmail,
    savedBranches,
    onAddBranch,
    onDeleteBranch,
    onSelectBranch
}) => {
    const [newBranch, setNewBranch] = useState({ name: '', city: '', address: '', phone: '' });

    const handleAdd = (e) => {
        e.preventDefault();
        if (newBranch.name && newBranch.city) {
            onAddBranch({ ...newBranch, id: Date.now().toString() });
            setNewBranch({ name: '', city: '', address: '', phone: '' });
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-header glass-morphism">
                <div>
                    <h1>Manage Branches</h1>
                    <p>Logged in as: {userEmail}</p>
                </div>
                <button className="btn-logout" onClick={onLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </div>

            <div className="dashboard-content">
                <div className="form-section glass-morphism">
                    <div className="section-title">
                        <Building2 className="icon-teal" size={24} />
                        <h2>Add New Branch</h2>
                    </div>

                    <form onSubmit={handleAdd}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Branch Name</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Downtown Clinic"
                                        value={newBranch.name}
                                        onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>City</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. New York"
                                        value={newBranch.city}
                                        onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="input-group full-width">
                                <label>Address</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full branch address"
                                        value={newBranch.address}
                                        onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <div className="input-wrapper">
                                    <input
                                        type="tel"
                                        required
                                        placeholder="e.g. (555) 123-4567"
                                        value={newBranch.phone}
                                        onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary">
                            <Plus size={20} /> Add Branch
                        </button>
                    </form>
                </div>

                <div className="form-section glass-morphism" style={{ flex: 1.5 }}>
                    <div className="section-title">
                        <MapPin className="icon-teal" size={24} />
                        <h2>Active Branches</h2>
                    </div>

                    <div className="branch-list">
                        {savedBranches && savedBranches.length > 0 ? (
                            savedBranches.map((branch) => (
                                <div key={branch.id} className="branch-card">
                                    <div className="branch-info" onClick={() => onSelectBranch(branch)} style={{ cursor: 'pointer', flex: 1 }}>
                                        <h3>{branch.name}</h3>
                                        <p><MapPin size={14} /> {branch.city}</p>
                                        <p><Phone size={14} /> {branch.phone}</p>
                                    </div>
                                    <button
                                        className="btn-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteBranch(branch.id);
                                        }}
                                        title="Delete Branch"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-msg">
                                No branches added yet. Add your first branch to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchManagement;
