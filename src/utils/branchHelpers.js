/**
 * Helper functions for Branch Patients functionality
 * INCLUDES HOSPITAL-LEVEL (TENANT) ISOLATION
 */

import { filterByHospital } from './tenantHelpers';

/**
 * Get all registered branches from localStorage with hospital isolation
 * CRITICAL: Only returns branches belonging to current hospital
 * @returns {Array} Array of branch objects for current hospital
 */
export const getRegisteredBranches = () => {
    const saved = localStorage.getItem('registeredBranches');
    const allBranches = saved ? JSON.parse(saved) : [];
    
    // CRITICAL: Filter by hospital ID first
    return filterByHospital(allBranches);
};

/**
 * Get all saved forms/patients from localStorage with hospital isolation
 * CRITICAL: Only returns forms belonging to current hospital
 * @returns {Array} Array of form objects for current hospital
 */
export const getSavedForms = () => {
    const saved = localStorage.getItem('savedForms');
    const allForms = saved ? JSON.parse(saved) : [];
    
    // CRITICAL: Filter by hospital ID first
    return filterByHospital(allForms);
};

/**
 * Get active patient count for a specific branch
 * @param {string} branchEmail - The branch email to filter by
 * @returns {number} Count of active patients
 */
export const getActivePatientCount = (branchEmail) => {
    const forms = getSavedForms();
    return forms.filter(form => 
        form.branchEmail === branchEmail && 
        form.archived === false
    ).length;
};

/**
 * Get all active patients for a specific branch
 * @param {string} branchEmail - The branch email to filter by
 * @returns {Array} Array of active patient forms
 */
export const getActivePatientsForBranch = (branchEmail) => {
    const forms = getSavedForms();
    return forms.filter(form => 
        form.branchEmail === branchEmail && 
        form.archived === false
    );
};

/**
 * Get branch patient counts for all branches
 * @returns {Object} Object with branchEmail as key and count as value
 */
export const getAllBranchPatientCounts = () => {
    const branches = getRegisteredBranches();
    const forms = getSavedForms();
    
    const counts = {};
    branches.forEach(branch => {
        const activePatients = forms.filter(form => 
            form.branchEmail === branch.branchEmail && 
            form.archived === false
        );
        counts[branch.branchEmail] = activePatients.length;
    });
    
    return counts;
};

/**
 * Save selected branch to localStorage
 * @param {Object} branch - The branch object to save
 */
export const saveSelectedBranch = (branch) => {
    localStorage.setItem('selectedBranch', JSON.stringify(branch));
};

/**
 * Get selected branch from localStorage
 * @returns {Object|null} The selected branch object or null
 */
export const getSelectedBranch = () => {
    const saved = localStorage.getItem('selectedBranch');
    return saved ? JSON.parse(saved) : null;
};

/**
 * Clear selected branch from localStorage
 */
export const clearSelectedBranch = () => {
    localStorage.removeItem('selectedBranch');
};

/**
 * Get total active patients across all branches
 * @returns {number} Total count of active patients
 */
export const getTotalActivePatients = () => {
    const forms = getSavedForms();
    return forms.filter(form => form.archived === false).length;
};
