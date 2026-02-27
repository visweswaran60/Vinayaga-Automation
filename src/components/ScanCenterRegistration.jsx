import React, { useState } from 'react';
import { Building2, MapPin, Mail, Save, ArrowLeft } from 'lucide-react';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const ScanCenterRegistration = ({ onRegister, onCancel }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState('');
    const [orgData, setOrgData] = useState({
        hospitalName: '',
        directorName: '',
        masterEmail: '',
        phone: '',
        numBranches: 1
    });

    const [branches, setBranches] = useState([
        { id: 1, branchName: '', location: '', branchEmail: '', password: '' }
    ]);

    const handleOrgChange = (e) => {
        const { name, value } = e.target;
        setOrgData(prev => ({ ...prev, [name]: value }));

        if (name === 'numBranches') {
            const count = parseInt(value, 10) || 1;
            setBranches(prev => {
                const newBranches = [...prev];
                if (newBranches.length > count) {
                    newBranches.splice(count);
                }
                while (newBranches.length < count) {
                    newBranches.push({
                        id: newBranches.length + 1,
                        branchName: '',
                        location: '',
                        branchEmail: '',
                        password: ''
                    });
                }
                return newBranches;
            });
        }
    };

    const handleBranchChange = (index, field, value) => {
        setBranches(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Timeout wrapper to prevent silent hangs
    const withTimeout = (promise, ms, label) => {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`⏱ TIMEOUT: ${label} took longer than ${ms / 1000}s. Check Firebase Console → Auth → Settings → Authorized Domains and ensure "localhost" is listed.`)), ms)
            )
        ]);
    };

    // Human-readable Firebase error messages
    const getFirebaseErrorMessage = (error) => {
        const code = error?.code || '';
        const errorMap = {
            'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
            'auth/invalid-email': 'The email address is not valid.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/network-request-failed': 'Network error — check your internet connection.',
            'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
            'auth/operation-not-allowed': 'Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method and enable Email/Password.',
            'auth/unauthorized-domain': 'This domain (localhost) is not authorized. Go to Firebase Console → Auth → Settings → Authorized Domains and add "localhost".',
        };
        return errorMap[code] || `Firebase Error [${code}]: ${error.message}`;
    };

    const handleCompleteRegistration = async () => {
        // ─── STEP 1: Validate ───
        console.log('═══════════════════════════════════════');
        console.log('🏥 REGISTRATION STARTED');
        console.log('═══════════════════════════════════════');

        if (!orgData.hospitalName || !orgData.masterEmail) {
            console.warn('❌ Validation failed: Missing hospital name or email');
            alert('Please fill out the main hospital name and email.');
            return;
        }

        const validBranches = branches.filter(b => b.branchName && b.branchEmail && b.password);
        if (validBranches.length !== parseInt(orgData.numBranches)) {
            console.warn('❌ Validation failed: Not all branches have name, email, and password');
            alert('Please fill out all branch names, emails, and passwords completely.');
            return;
        }

        // Password length check
        const weakPassword = validBranches.find(b => b.password.length < 6);
        if (weakPassword) {
            console.warn('❌ Validation failed: Password too short for', weakPassword.branchEmail);
            alert(`Password for ${weakPassword.branchEmail} must be at least 6 characters.`);
            return;
        }

        console.log('✅ Form validation passed');
        console.log('📋 Organization:', JSON.stringify(orgData, null, 2));
        console.log('📋 Branches:', JSON.stringify(validBranches, null, 2));

        setIsRegistering(true);
        setRegistrationStatus('Validating details...');

        const orgId = `org_${Date.now()}`;
        const createdBranches = [];

        try {
            // ─── STEP 2: Create Firebase Auth user for each branch ───
            for (let i = 0; i < validBranches.length; i++) {
                const branch = validBranches[i];
                const password = branch.password;
                const branchId = `branch_${branch.id}_${Date.now()}`;

                setRegistrationStatus(`Creating branch ${i + 1}/${validBranches.length}: ${branch.branchName}...`);
                console.log(`\n── Branch ${i + 1}/${validBranches.length}: ${branch.branchName} ──`);
                console.log(`📧 Email: ${branch.branchEmail}`);
                console.log(`🔑 Password: ${password}`);

                // Create Firebase Auth user
                console.log(`📤 [Auth] Creating user for ${branch.branchEmail}...`);
                let authUid = 'none';
                try {
                    const userCredential = await withTimeout(
                        createUserWithEmailAndPassword(auth, branch.branchEmail, password),
                        15000,
                        `Auth user creation for ${branch.branchEmail}`
                    );
                    authUid = userCredential.user.uid;
                    console.log(`✅ [Auth] User created — UID: ${authUid}`);
                } catch (authErr) {
                    const msg = getFirebaseErrorMessage(authErr);
                    console.error(`❌ [Auth] Failed for ${branch.branchEmail}:`, authErr);
                    console.error(`   → ${msg}`);
                    if (authErr?.code === 'auth/email-already-in-use') {
                        console.warn(`⚠️ [Auth] User already exists, continuing...`);
                    } else {
                        throw authErr;
                    }
                }

                const branchData = {
                    branchName: branch.branchName,
                    location: branch.location,
                    branchEmail: branch.branchEmail,
                    hospitalName: orgData.hospitalName,
                    directorName: orgData.directorName,
                    masterEmail: orgData.masterEmail,
                    password: password,
                    orgId: orgId,
                    branchId: branchId,
                    authUid: authUid,
                    createdAt: new Date().toISOString()
                };

                createdBranches.push(branchData);
            }

            // ─── STEP 3: Save to localStorage ───
            setRegistrationStatus('Saving data locally...');
            console.log('\n📦 [localStorage] Saving branch data...');

            const existing = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
            const updated = [...existing, ...createdBranches];
            localStorage.setItem('registeredBranches', JSON.stringify(updated));

            const existingOrgs = JSON.parse(localStorage.getItem('organizations') || '[]');
            existingOrgs.push({ ...orgData, id: orgId, createdAt: new Date().toISOString() });
            localStorage.setItem('organizations', JSON.stringify(existingOrgs));

            console.log('✅ [localStorage] Data saved');

            // ─── STEP 4: Sign out (createUserWithEmailAndPassword auto-signs in) ───
            console.log('🔓 [Auth] Signing out (auto-sign-in from createUser)...');
            await auth.signOut();
            console.log('✅ [Auth] Signed out');

            // ─── STEP 5: Success ───
            setRegistrationStatus('Registration complete!');
            console.log('\n═══════════════════════════════════════');
            console.log('🎉 REGISTRATION COMPLETE!');
            console.log('═══════════════════════════════════════');
            console.log('📊 Summary:');
            console.log(`   Organization: ${orgData.hospitalName} (${orgId})`);
            console.log(`   Branches created: ${createdBranches.length}`);
            createdBranches.forEach(b => {
                console.log(`   • ${b.branchEmail} → ${b.password} (UID: ${b.authUid})`);
            });

            alert(
                `✅ Registration Successful!\n\n` +
                `Organization: ${orgData.hospitalName}\n` +
                `${createdBranches.length} branch(es) registered in Firebase Auth.\n\n` +
                `Login credentials:\n` +
                createdBranches.map(b => `• ${b.branchEmail} → ${b.password}`).join('\n')
            );

            onRegister({ organization: orgData, branches: createdBranches });

        } catch (error) {
            const msg = getFirebaseErrorMessage(error);
            console.error('\n═══════════════════════════════════════');
            console.error('❌ REGISTRATION FAILED');
            console.error('═══════════════════════════════════════');
            console.error('Error object:', error);
            console.error('Error code:', error?.code);
            console.error('Error message:', error?.message);
            console.error('Human message:', msg);

            setRegistrationStatus(`Error: ${msg}`);
            alert(`❌ Registration Error\n\n${msg}\n\nCheck browser console (F12) for full details.`);
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'Inter, sans-serif',
            position: 'absolute',
            top: 0, left: 0, right: 0,
            background: 'transparent',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button onClick={onCancel} style={{ background: 'rgba(20, 184, 166, 0.1)', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'var(--primary)' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1f2937' }}>Create Account</h1>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Register your Hospital or Scan Center organization.</p>
                </div>
            </div>

            {/* Organization Details */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                    <Building2 size={20} color="var(--primary)" />
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#374151' }}>Organization Details</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>Hospital / Scan Center Name *</label>
                        <input type="text" name="hospitalName" value={orgData.hospitalName} onChange={handleOrgChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} placeholder="e.g., Vinayaga Diagnostics" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>Director Name</label>
                        <input type="text" name="directorName" value={orgData.directorName} onChange={handleOrgChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} placeholder="Dr. First Last" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>Master Email ID *</label>
                        <input type="email" name="masterEmail" value={orgData.masterEmail} onChange={handleOrgChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} placeholder="admin@hospital.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>Phone Number</label>
                        <input type="text" name="phone" value={orgData.phone} onChange={handleOrgChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} placeholder="Contact Number" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>Number of Branches</label>
                        <select name="numBranches" value={orgData.numBranches} onChange={handleOrgChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#fff' }}>
                            {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Configure login details for each branch below.</p>
                    </div>
                </div>
            </div>

            {/* Dynamic Branches */}
            <h3 style={{ fontSize: '1.15rem', color: '#374151', marginBottom: '1rem', marginTop: '2rem' }}>Configure Branches</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {branches.map((branch, index) => (
                    <div key={branch.id} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.7)', position: 'relative', backdropFilter: 'blur(10px)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: 'var(--primary)', borderRadius: '12px 0 0 12px' }}></div>
                        <h4 style={{ margin: '0 0 1rem 0.5rem', fontSize: '1rem', color: '#1f2937' }}>
                            Branch {index + 1}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
                                    <MapPin size={14} /> Branch Name *
                                </label>
                                <input type="text" value={branch.branchName} onChange={(e) => handleBranchChange(index, 'branchName', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} placeholder="e.g., Tiruchengode Branch" />
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
                                    <Building2 size={14} /> Location
                                </label>
                                <input type="text" value={branch.location} onChange={(e) => handleBranchChange(index, 'location', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} placeholder="City / Area" />
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
                                    <Mail size={14} /> Branch Email *
                                </label>
                                <input type="email" value={branch.branchEmail} onChange={(e) => handleBranchChange(index, 'branchEmail', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} placeholder="branch@hospital.com" />
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--primary)' }}>Used for login</p>
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
                                    🔑 Password *
                                </label>
                                <input type="password" value={branch.password} onChange={(e) => handleBranchChange(index, 'password', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} placeholder="Min 6 characters" />
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#6b7280' }}>Used with email to login</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status bar */}
            {registrationStatus && (
                <div style={{
                    marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
                    background: registrationStatus.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
                    color: registrationStatus.startsWith('Error') ? '#dc2626' : '#15803d',
                    fontSize: '0.85rem', fontWeight: 500,
                    border: `1px solid ${registrationStatus.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`
                }}>
                    {registrationStatus}
                </div>
            )}

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
                <button type="button" onClick={onCancel} disabled={isRegistering} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                </button>
                <button type="button" onClick={handleCompleteRegistration} disabled={isRegistering}
                    style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: isRegistering ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(20, 184, 166, 0.4)', opacity: isRegistering ? 0.7 : 1 }}
                >
                    <Save size={18} /> {isRegistering ? 'Registering...' : 'Complete Registration'}
                </button>
            </div>
        </div>
    );
};

export default ScanCenterRegistration;
