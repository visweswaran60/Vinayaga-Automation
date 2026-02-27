/**
 * Role-based access control and data filtering utilities
 */

/**
 * Get the effective branch email for data filtering
 * Directors can switch branches, branch users see only their own data
 */
export const getEffectiveBranchEmail = (userEmail, userRole) => {
    if (userRole === 'director') {
        const activeBranch = localStorage.getItem('activeBranch');
        if (activeBranch) {
            const branchData = JSON.parse(activeBranch);
            return branchData.branchEmail;
        }
        // If no branch selected, return null to show all data
        return null;
    }
    
    // Branch users see only their own data
    return userEmail;
};

/**
 * Filter forms/patients by branch email
 */
export const filterByBranch = (items, branchEmail) => {
    if (!branchEmail) {
        // No filter - return all items (for directors viewing all branches)
        return items;
    }
    
    return items.filter(item => item.branchEmail === branchEmail);
};

/**
 * Get user role from localStorage or determine from email
 */
export const getUserRole = (userEmail) => {
    // Check if user is stored as director
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === userEmail);
    
    if (user && user.role) {
        return user.role;
    }
    
    // Check if user email matches any branch's directorEmail
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    const isDirector = branches.some(b => b.directorEmail === userEmail);
    
    if (isDirector) {
        return 'director';
    }
    
    // Default to branch role
    return 'branch';
};

/**
 * Check if user has director privileges
 */
export const isDirector = (userEmail) => {
    return getUserRole(userEmail) === 'director';
};

/**
 * Get all branches owned by a director
 */
export const getDirectorBranches = (directorEmail) => {
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    return branches.filter(b => b.directorEmail === directorEmail);
};

/**
 * Get active branch data for display
 */
export const getActiveBranchData = () => {
    const saved = localStorage.getItem('activeBranch');
    return saved ? JSON.parse(saved) : null;
};

/**
 * Set active branch for director
 */
export const setActiveBranch = (branchData) => {
    if (branchData) {
        localStorage.setItem('activeBranch', JSON.stringify(branchData));
    } else {
        localStorage.removeItem('activeBranch');
    }
};

/**
 * Get branch display name for UI
 */
export const getBranchDisplayName = (userEmail, userRole) => {
    if (userRole === 'director') {
        const activeBranch = getActiveBranchData();
        return activeBranch ? activeBranch.branchName : 'All Branches';
    }
    
    // For branch users, get their branch name
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    const branch = branches.find(b => b.branchEmail === userEmail);
    return branch ? branch.branchName : 'Branch';
};

/**
 * Check if user can access branch management
 */
export const canManageBranches = (userEmail) => {
    return isDirector(userEmail);
};

/**
 * Filter branches by director email
 */
export const filterBranchesByDirector = (directorEmail) => {
    const branches = JSON.parse(localStorage.getItem('registeredBranches') || '[]');
    return branches.filter(b => b.directorEmail === directorEmail);
};

/**
 * Get statistics for a specific branch
 */
export const getBranchStats = (branchEmail) => {
    const forms = JSON.parse(localStorage.getItem('savedForms') || '[]');
    const branchForms = forms.filter(f => f.branchEmail === branchEmail);
    
    return {
        totalPatients: branchForms.length,
        activePatients: branchForms.filter(f => !f.archived).length,
        archivedPatients: branchForms.filter(f => f.archived).length,
        reportsGenerated: branchForms.filter(f => f.reportsUploaded).length,
        dicomUploads: branchForms.filter(f => f.dicomUploaded).length
    };
};
