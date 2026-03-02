import React, { useState, useEffect } from 'react';
import MedicalLogin from './components/MedicalLogin';
import ScanCenterRegistration from './components/ScanCenterRegistration';
import BranchManagement from './components/BranchManagement';
import ReferralForm from './components/ReferralForm';
import './index.css';
import { auth } from './config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  setCurrentHospitalId,
  clearHospitalContext,
  deriveHospitalIdFromEmail,
  migrateLegacyData
} from './utils/tenantHelpers';

function App() {
  const [currentPage, setCurrentPage] = useState('auth');

  // Organization Data Storage (localStorage)
  const [organizations, setOrganizations] = useState(() => {
    const saved = localStorage.getItem('organizations');
    return saved ? JSON.parse(saved) : [];
  });
  const [registeredBranches, setRegisteredBranches] = useState(() => {
    const saved = localStorage.getItem('registeredBranches');
    return saved ? JSON.parse(saved) : [];
  });

  // Session State
  const [loggedInBranch, setLoggedInBranch] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // Legacy state
  const [savedDoctors, setSavedDoctors] = useState(() => {
    const saved = localStorage.getItem('savedDoctors');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedBranches, setSavedBranches] = useState(() => {
    const saved = localStorage.getItem('savedBranches');
    return saved ? JSON.parse(saved) : [];
  });

  // ─── Firebase Auth State Listener (no Firestore) ───
  useEffect(() => {
    console.log('🔄 [App] Setting up Firebase Auth listener...');

    // Run data migration on app start
    migrateLegacyData();

    // Safety timeout — if Firebase doesn't respond in 5s, show login page
    const safetyTimer = setTimeout(() => {
      console.warn('⚠️ [App] Firebase Auth took too long, defaulting to auth page');
      setAuthLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimer);
      if (user) {
        console.log('✅ [App] User detected:', user.email, 'UID:', user.uid);

        // CRITICAL: Set hospital context for tenant isolation
        const hospitalId = deriveHospitalIdFromEmail(user.email);
        setCurrentHospitalId(hospitalId);
        console.log('✅ [App] Hospital context set:', hospitalId);

        // Look up branch data from localStorage
        const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
        const branch = branches.find(b => b.branchEmail.toLowerCase() === user.email.toLowerCase());

        if (branch) {
          console.log('✅ [App] Branch found in localStorage:', branch.branchName);
          setLoggedInBranch(branch);
          setCurrentPage('dashboard');
        } else {
          console.log('⚠️ [App] No branch data in localStorage for this user, using fallback');

          // Try to look up hospitalName from organizations if user is a master/director without associated branch
          const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
          const org = orgs.find(o => o.masterEmail === user.email);
          const activeHospitalName = org ? org.hospitalName : 'Hospital';

          setLoggedInBranch({ branchName: 'Branch', branchEmail: user.email, hospitalName: activeHospitalName });
          setCurrentPage('dashboard');
        }
      } else {
        console.log('ℹ️ [App] No user signed in');
        setLoggedInBranch(null);
        // Clear hospital context on sign out
        clearHospitalContext();
      }
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const navigate = (page) => {
    localStorage.setItem('currentPage', page);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleRegister = (data) => {
    console.log('✅ [App] Registration complete, refreshing branch list');
    const updated = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    setRegisteredBranches(updated);
    navigate('auth');
  };

  const handleLogin = async (email, password) => {
    try {
      setLoginError('');
      setLoginLoading(true);

      console.log('═══════════════════════════════════════');
      console.log('🔐 LOGIN ATTEMPT');
      console.log('═══════════════════════════════════════');
      console.log('📧 Email:', email);

      // Validation
      if (!email || !password) {
        setLoginError('Please enter both email and password.');
        console.warn('❌ Validation: Missing email or password');
        return;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        setLoginError('Please enter a valid email address.');
        console.warn('❌ Validation: Invalid email format');
        return;
      }

      // Firebase Auth sign-in with timeout
      console.log('📤 [Auth] Calling signInWithEmailAndPassword...');
      const loginPromise = signInWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('⏱ Login timed out after 15s. Ensure "localhost" is in Firebase Auth → Authorized Domains.')), 15000)
      );

      const userCredential = await Promise.race([loginPromise, timeoutPromise]);
      console.log('✅ [Auth] Login successful! UID:', userCredential.user.uid);
      // onAuthStateChanged will handle navigation to dashboard

    } catch (err) {
      console.error('❌ [Auth] Login failed:', err);
      console.error('   Code:', err?.code);
      console.error('   Message:', err?.message);

      const code = err?.code || '';
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email. Please register first.',
        'auth/wrong-password': 'Incorrect password. Check your credentials.',
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/invalid-email': 'The email address is not valid.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please wait and try again.',
        'auth/network-request-failed': 'Network error — check your internet connection.',
      };
      setLoginError(errorMessages[code] || `Login failed: ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔓 [Auth] Signing out...');
      await signOut(auth);
      console.log('✅ [Auth] Signed out');

      // CRITICAL: Clear hospital context on logout
      clearHospitalContext();

      localStorage.removeItem('currentPage');
      setLoggedInBranch(null);
      navigate('auth');
    } catch (error) {
      console.error('❌ [Auth] Sign out error:', error);
    }
  };

  const handleSaveSuccess = () => navigate('dashboard');

  const handleAddDoctor = (newDoctor) => {
    const prev = JSON.parse(localStorage.getItem('savedDoctors') || '[]');
    const updated = [...prev, newDoctor];
    localStorage.setItem('savedDoctors', JSON.stringify(updated));
    setSavedDoctors(updated);
  };

  const handleDeleteDoctor = (idx) => {
    const prev = JSON.parse(localStorage.getItem('savedDoctors') || '[]');
    const updated = prev.filter((_, i) => i !== idx);
    localStorage.setItem('savedDoctors', JSON.stringify(updated));
    setSavedDoctors(updated);
  };

  const handleAddBranch = (newBranch) => {
    const prev = JSON.parse(localStorage.getItem('savedBranches') || '[]');
    const updated = [newBranch, ...prev];
    localStorage.setItem('savedBranches', JSON.stringify(updated));
    setSavedBranches(updated);
  };

  const handleDeleteBranch = (id) => {
    const prev = JSON.parse(localStorage.getItem('savedBranches') || '[]');
    const updated = prev.filter(b => b.id !== id);
    localStorage.setItem('savedBranches', JSON.stringify(updated));
    setSavedBranches(updated);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'linear-gradient(135deg, #0d9488, #14b8a6)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p>Connecting to Firebase...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="App">
      {currentPage === 'auth' && (
        <MedicalLogin
          onLogin={handleLogin}
          onNavigateRegister={() => navigate('register')}
          loginError={loginError}
          loginLoading={loginLoading}
        />
      )}

      {currentPage === 'register' && (
        <div style={{ background: 'transparent', minHeight: '100vh', padding: '2rem 0' }}>
          <ScanCenterRegistration
            onRegister={handleRegister}
            onCancel={() => navigate('auth')}
          />
        </div>
      )}

      {currentPage === 'branches' && (
        <BranchManagement
          onLogout={handleLogout}
          onSaveSuccess={handleSaveSuccess}
          userEmail={loggedInBranch?.branchEmail || ''}
          savedBranches={savedBranches}
          onAddBranch={handleAddBranch}
          onDeleteBranch={handleDeleteBranch}
        />
      )}

      {currentPage === 'dashboard' && (
        <ReferralForm
          onLogout={handleLogout}
          savedDoctors={savedDoctors}
          onAddDoctor={handleAddDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          userEmail={loggedInBranch?.branchEmail || ''}
          savedBranches={savedBranches}
          loggedInBranch={loggedInBranch}
        />
      )}
    </div>
  )
}

export default App
