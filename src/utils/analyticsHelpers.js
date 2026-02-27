/**
 * Analytics calculation utilities for dashboard metrics
 */

/**
 * Get date range based on filter selection
 * @param {string} range - '7days', '30days', or '90days'
 * @returns {Date} Start date for filtering
 */
export const getDateRangeStart = (range) => {
    const now = new Date();
    const days = range === '7days' ? 7 : range === '30days' ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);
    return startDate;
};

/**
 * Filter forms by date range and branch
 * @param {Array} forms - All forms
 * @param {string} dateRange - Date range filter
 * @param {string} branchEmail - Branch email filter (null for all)
 * @returns {Array} Filtered forms
 */
export const filterForms = (forms, dateRange, branchEmail) => {
    const startDate = getDateRangeStart(dateRange);
    
    return forms.filter(form => {
        const formDate = new Date(form.createdAt);
        const dateMatch = formDate >= startDate;
        const branchMatch = !branchEmail || form.branchEmail === branchEmail;
        return dateMatch && branchMatch;
    });
};

/**
 * Calculate total patients (non-archived)
 * @param {Array} forms - Filtered forms
 * @returns {number} Total patients
 */
export const calculateTotalPatients = (forms) => {
    return forms.filter(f => !f.archived).length;
};

/**
 * Calculate reports generated
 * @param {Array} forms - Filtered forms
 * @returns {number} Reports count
 */
export const calculateReportsGenerated = (forms) => {
    return forms.filter(f => f.reportsUploaded === true).length;
};

/**
 * Calculate DICOM uploads
 * @param {Array} forms - Filtered forms
 * @returns {number} DICOM count
 */
export const calculateDicomUploads = (forms) => {
    return forms.filter(f => f.dicomUploaded === true).length;
};

/**
 * Calculate WhatsApp sent count
 * @param {Array} forms - Filtered forms
 * @returns {number} WhatsApp count
 */
export const calculateWhatsAppSent = (forms) => {
    return forms.filter(f => f.whatsappSent === true).length;
};

/**
 * Calculate Email sent count
 * @param {Array} forms - Filtered forms
 * @returns {number} Email count
 */
export const calculateEmailSent = (forms) => {
    return forms.filter(f => f.emailSent === true).length;
};

/**
 * Calculate archived cases
 * @param {Array} forms - Filtered forms
 * @returns {number} Archived count
 */
export const calculateArchivedCases = (forms) => {
    return forms.filter(f => f.archived === true).length;
};

/**
 * Get patients by branch data
 * @param {Array} branches - All branches
 * @param {Array} forms - Filtered forms
 * @returns {Array} Branch statistics
 */
export const getPatientsByBranch = (branches, forms) => {
    return branches.map(branch => {
        const branchForms = forms.filter(f => f.branchEmail === branch.branchEmail && !f.archived);
        const patients = branchForms.length;
        const dicom = branchForms.filter(f => f.dicomUploaded).length;
        const reports = branchForms.filter(f => f.reportsUploaded).length;
        const whatsapp = branchForms.filter(f => f.whatsappSent).length;
        const email = branchForms.filter(f => f.emailSent).length;
        
        // Progress: (reports + notifications) / patients
        const progress = patients > 0 
            ? Math.round(((reports + whatsapp + email) / (patients * 3)) * 100)
            : 0;
        
        return {
            branchName: branch.branchName,
            city: branch.city || branch.location || '—',
            patients,
            dicom,
            reports,
            whatsapp,
            email,
            progress
        };
    }).sort((a, b) => b.progress - a.progress); // Sort by progress descending
};

/**
 * Calculate active branches count
 * @param {Array} branches - All branches
 * @param {Array} forms - All forms
 * @returns {number} Active branches count
 */
export const calculateActiveBranches = (branches, forms) => {
    return branches.filter(branch => {
        return forms.some(f => f.branchEmail === branch.branchEmail && !f.archived);
    }).length;
};

/**
 * Calculate average patients per branch
 * @param {Array} branches - All branches
 * @param {Array} forms - Filtered forms
 * @returns {number} Average patients
 */
export const calculateAvgPatientsPerBranch = (branches, forms) => {
    const activeBranches = calculateActiveBranches(branches, forms);
    const totalPatients = calculateTotalPatients(forms);
    return activeBranches > 0 ? Math.round(totalPatients / activeBranches) : 0;
};

/**
 * Calculate WhatsApp rate
 * @param {Array} forms - Filtered forms
 * @returns {number} WhatsApp rate percentage
 */
export const calculateWhatsAppRate = (forms) => {
    const total = calculateTotalPatients(forms);
    const sent = calculateWhatsAppSent(forms);
    return total > 0 ? Math.round((sent / total) * 100) : 0;
};

/**
 * Calculate Email rate
 * @param {Array} forms - Filtered forms
 * @returns {number} Email rate percentage
 */
export const calculateEmailRate = (forms) => {
    const total = calculateTotalPatients(forms);
    const sent = calculateEmailSent(forms);
    return total > 0 ? Math.round((sent / total) * 100) : 0;
};

/**
 * Calculate overall notification rate
 * @param {Array} forms - Filtered forms
 * @returns {number} Overall notification rate percentage
 */
export const calculateOverallNotificationRate = (forms) => {
    const total = calculateTotalPatients(forms);
    const whatsapp = calculateWhatsAppSent(forms);
    const email = calculateEmailSent(forms);
    const totalNotifications = whatsapp + email;
    const maxPossible = total * 2; // WhatsApp + Email per patient
    return maxPossible > 0 ? Math.round((totalNotifications / maxPossible) * 100) : 0;
};

/**
 * Get all forms from localStorage
 * @returns {Array} All forms
 */
export const getAllForms = () => {
    const saved = localStorage.getItem('savedForms');
    return saved ? JSON.parse(saved) : [];
};

/**
 * Get all branches from localStorage
 * @returns {Array} All branches
 */
export const getAllBranches = () => {
    const saved = localStorage.getItem('registeredBranches');
    return saved ? JSON.parse(saved) : [];
};
