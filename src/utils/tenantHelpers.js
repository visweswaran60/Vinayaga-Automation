/**
 * TENANT ISOLATION UTILITIES
 * 
 * Critical security layer that ensures hospital-level data isolation.
 * Every hospital (tenant) can ONLY access their own data.
 */

/**
 * Get the current hospital ID (tenant identifier)
 * This is the PRIMARY key for data isolation
 */
export const getCurrentHospitalId = () => {
    const hospitalId = localStorage.getItem('currentHospital');
    return hospitalId || null;
};

/**
 * Set the current hospital ID on login
 * MUST be called during authentication flow
 */
export const setCurrentHospitalId = (hospitalId) => {
    if (!hospitalId) {
        console.error('⚠️ Attempted to set null hospitalId');
        return;
    }
    localStorage.setItem('currentHospital', hospitalId);
    console.log(`✅ Hospital context set: ${hospitalId}`);
};

/**
 * Clear hospital context on logout
 * MUST be called during logout flow
 */
export const clearHospitalContext = () => {
    localStorage.removeItem('currentHospital');
    localStorage.removeItem('activeBranch');
    console.log('✅ Hospital context cleared');
};

/**
 * Derive hospital ID from director/master email
 * Used during login to establish tenant context
 */
export const deriveHospitalIdFromEmail = (email) => {
    if (!email) return null;
    
    // Check if user is a director
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    const directorBranch = branches.find(b => b.directorEmail === email);
    
    if (directorBranch) {
        // Use existing hospitalId or generate from director email
        return directorBranch.hospitalId || `hospital_${email.split('@')[0]}`;
    }
    
    // Check if user is a branch user
    const branchUser = branches.find(b => b.branchEmail === email);
    if (branchUser) {
        return branchUser.hospitalId || `hospital_${branchUser.directorEmail?.split('@')[0] || 'unknown'}`;
    }
    
    // Fallback: generate from email
    return `hospital_${email.split('@')[0]}`;
};

/**
 * CRITICAL: Filter array by hospital ID
 * This is the PRIMARY filtering function used across the app
 * 
 * @param {Array} items - Array of records to filter
 * @param {string} hospitalId - Current hospital ID (optional, uses current if not provided)
 * @returns {Array} - Filtered records belonging to this hospital only
 */
export const filterByHospital = (items, hospitalId = null) => {
    const currentHospitalId = hospitalId || getCurrentHospitalId();
    
    if (!currentHospitalId) {
        console.warn('⚠️ No hospital context set - returning empty array for security');
        return [];
    }
    
    if (!Array.isArray(items)) {
        console.warn('⚠️ filterByHospital received non-array:', items);
        return [];
    }
    
    // Filter items that belong to this hospital
    return items.filter(item => {
        // If item has no hospitalId, it's legacy data - handle migration
        if (!item.hospitalId) {
            return false; // Exclude until migrated
        }
        return item.hospitalId === currentHospitalId;
    });
};

/**
 * Migrate legacy data to include hospitalId
 * Safe migration that assigns hospitalId based on ownership
 */
export const migrateLegacyData = () => {
    console.log('🔄 Starting data migration...');
    
    // Migrate branches
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    let branchesMigrated = 0;
    
    const migratedBranches = branches.map(branch => {
        if (!branch.hospitalId && branch.directorEmail) {
            branchesMigrated++;
            return {
                ...branch,
                hospitalId: `hospital_${branch.directorEmail.split('@')[0]}`
            };
        }
        return branch;
    });
    
    if (branchesMigrated > 0) {
        localStorage.setItem('registeredBranches', JSON.stringify(migratedBranches));
        console.log(`✅ Migrated ${branchesMigrated} branches`);
    }
    
    // Migrate forms
    const forms = JSON.parse(localStorage.getItem('savedForms') || '[]');
    let formsMigrated = 0;
    
    const migratedForms = forms.map(form => {
        if (!form.hospitalId && form.branchEmail) {
            // Find the branch to get hospitalId
            const branch = migratedBranches.find(b => b.branchEmail === form.branchEmail);
            if (branch && branch.hospitalId) {
                formsMigrated++;
                return {
                    ...form,
                    hospitalId: branch.hospitalId
                };
            }
        }
        return form;
    });
    
    if (formsMigrated > 0) {
        localStorage.setItem('savedForms', JSON.stringify(migratedForms));
        console.log(`✅ Migrated ${formsMigrated} forms`);
    }
    
    // Migrate doctors
    const doctors = JSON.parse(localStorage.getItem('savedDoctors') || '[]');
    let doctorsMigrated = 0;
    
    const migratedDoctors = doctors.map(doctor => {
        if (!doctor.hospitalId && doctor.branchEmail) {
            // Find the branch to get hospitalId
            const branch = migratedBranches.find(b => b.branchEmail === doctor.branchEmail);
            if (branch && branch.hospitalId) {
                doctorsMigrated++;
                return {
                    ...doctor,
                    hospitalId: branch.hospitalId
                };
            }
        }
        return doctor;
    });
    
    if (doctorsMigrated > 0) {
        localStorage.setItem('savedDoctors', JSON.stringify(migratedDoctors));
        console.log(`✅ Migrated ${doctorsMigrated} doctors`);
    }
    
    console.log('✅ Data migration complete');
    return {
        branches: branchesMigrated,
        forms: formsMigrated,
        doctors: doctorsMigrated
    };
};

/**
 * Validate that a record belongs to the current hospital
 * Used for security checks before operations
 */
export const validateHospitalOwnership = (record) => {
    const currentHospitalId = getCurrentHospitalId();
    
    if (!currentHospitalId) {
        console.error('⚠️ No hospital context - operation denied');
        return false;
    }
    
    if (!record || !record.hospitalId) {
        console.error('⚠️ Record missing hospitalId - operation denied');
        return false;
    }
    
    if (record.hospitalId !== currentHospitalId) {
        console.error('⚠️ Hospital ID mismatch - operation denied');
        return false;
    }
    
    return true;
};

/**
 * Get hospital name for display
 */
export const getCurrentHospitalName = () => {
    const hospitalId = getCurrentHospitalId();
    if (!hospitalId) return 'Unknown Hospital';
    
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    const branch = branches.find(b => b.hospitalId === hospitalId);
    
    return branch?.hospitalName || 'Hospital';
};

/**
 * Check if hospital context is set
 * Used to verify user is properly authenticated
 */
export const hasHospitalContext = () => {
    return !!getCurrentHospitalId();
};

/**
 * Get all branches for current hospital
 * Convenience function with built-in filtering
 */
export const getCurrentHospitalBranches = () => {
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    return filterByHospital(branches);
};

/**
 * Get all forms for current hospital
 * Convenience function with built-in filtering
 */
export const getCurrentHospitalForms = () => {
    const forms = JSON.parse(localStorage.getItem('savedForms') || '[]');
    return filterByHospital(forms);
};

/**
 * Get all doctors for current hospital
 * Convenience function with built-in filtering
 */
export const getCurrentHospitalDoctors = () => {
    const doctors = JSON.parse(localStorage.getItem('savedDoctors') || '[]');
    return filterByHospital(doctors);
};

/**
 * Add hospitalId to a new record
 * MUST be called before saving any new record
 */
export const addHospitalId = (record) => {
    const hospitalId = getCurrentHospitalId();
    
    if (!hospitalId) {
        console.error('⚠️ Cannot add hospitalId - no hospital context');
        return record;
    }
    
    return {
        ...record,
        hospitalId
    };
};

/**
 * Debug function to check data isolation
 * Logs statistics about current hospital data
 */
export const debugHospitalIsolation = () => {
    const hospitalId = getCurrentHospitalId();
    console.log('═══════════════════════════════════════');
    console.log('HOSPITAL ISOLATION DEBUG');
    console.log('═══════════════════════════════════════');
    console.log('Current Hospital ID:', hospitalId);
    console.log('Hospital Name:', getCurrentHospitalName());
    
    const allBranches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    const myBranches = filterByHospital(allBranches);
    console.log(`Branches: ${myBranches.length} / ${allBranches.length} total`);
    
    const allForms = JSON.parse(localStorage.getItem('savedForms') || '[]');
    const myForms = filterByHospital(allForms);
    console.log(`Forms: ${myForms.length} / ${allForms.length} total`);
    
    const allDoctors = JSON.parse(localStorage.getItem('savedDoctors') || '[]');
    const myDoctors = filterByHospital(allDoctors);
    console.log(`Doctors: ${myDoctors.length} / ${allDoctors.length} total`);
    
    console.log('═══════════════════════════════════════');
};
