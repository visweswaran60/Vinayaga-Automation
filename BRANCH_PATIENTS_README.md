# Branch Patients Feature Documentation

## 📋 Overview
The **Branch Patients** page displays all registered diagnostic branches as interactive cards, showing the active patient count for each branch. Users can click on a branch to view its patients (navigation handler provided).

---

## 📁 Files Created

### 1. **BranchPatients.jsx**
Location: `src/components/BranchPatients.jsx`

**Purpose:** Main component that displays branch cards with patient counts

**Props:**
- `onBranchSelect` (function): Callback when a branch card is clicked
  - Receives the selected branch object as parameter
  - Use this to navigate to branch-specific patient list

**Features:**
- Displays all registered branches as cards
- Shows active patient count per branch
- Click to select branch
- Empty state when no branches exist
- Summary statistics at bottom
- Responsive grid layout
- Hover animations

---

### 2. **branchHelpers.js**
Location: `src/utils/branchHelpers.js`

**Purpose:** Utility functions for branch and patient data operations

**Functions:**

```javascript
// Get all branches
getRegisteredBranches() → Array

// Get all forms/patients
getSavedForms() → Array

// Get active patient count for specific branch
getActivePatientCount(branchEmail) → Number

// Get active patients for specific branch
getActivePatientsForBranch(branchEmail) → Array

// Get patient counts for all branches
getAllBranchPatientCounts() → Object

// Save selected branch
saveSelectedBranch(branch) → void

// Get selected branch
getSelectedBranch() → Object|null

// Clear selected branch
clearSelectedBranch() → void

// Get total active patients
getTotalActivePatients() → Number
```

---

## 🎨 CSS Classes Added

All styles added to `src/index.css`:

### Main Container
- `.branch-patients-wrapper` - Main wrapper
- `.branch-patients-header` - Header section
- `.branch-patients-title` - Page title
- `.branch-patients-subtitle` - Subtitle text

### Branch Cards
- `.branch-patients-grid` - Responsive grid layout
- `.branch-patient-card` - Individual branch card
- `.branch-patient-card-icon` - Left icon container (green gradient)
- `.branch-patient-card-info` - Center info section
- `.branch-patient-card-name` - Branch name
- `.branch-patient-card-city` - City text
- `.branch-patient-card-stats` - Right stats section
- `.branch-patient-count` - Large number display
- `.branch-patient-label` - "Active" label
- `.branch-patient-card-arrow` - Right arrow icon

### Empty State
- `.branch-patients-empty` - Empty state container
- `.branch-patients-empty-icon` - Icon wrapper
- `.branch-patients-empty-title` - Empty title
- `.branch-patients-empty-text` - Empty description

### Summary Stats
- `.branch-patients-summary` - Summary container
- `.branch-summary-stat` - Individual stat item
- `.branch-summary-label` - Stat label
- `.branch-summary-value` - Stat value

---

## 🔌 Integration

### Added to ReferralForm.jsx:

```javascript
// Import
import BranchPatients from './BranchPatients';

// Render in content area
{activeSidebarItem === 'Branch Patients' && (
    <BranchPatients
        onBranchSelect={(branch) => {
            // Handle branch selection
            console.log('Selected branch:', branch);
        }}
    />
)}
```

---

## 📊 Data Structure

### Branch Object (from localStorage: `registeredBranches`):
```javascript
{
    id: 1234567890,
    hospitalName: "Vinayaga Automation",
    branchName: "ANBU Salem Gugai",
    branchEmail: "branch@example.com",
    city: "Salem",
    location: "Salem",
    phone: "1234567890",
    address: "123 Street"
}
```

### Form/Patient Object (from localStorage: `savedForms`):
```javascript
{
    id: 1234567890,
    patientId: "P001",
    patientName: "John Doe",
    branchEmail: "branch@example.com",
    archived: false,
    // ... other form fields
}
```

### Selected Branch (localStorage: `selectedBranch`):
```javascript
// Saved when branch card is clicked
{
    id: 1234567890,
    branchName: "ANBU Salem Gugai",
    branchEmail: "branch@example.com",
    // ... full branch object
}
```

---

## 🎯 Logic Flow

1. **Component Mount:**
   - Load branches from `registeredBranches`
   - Load forms from `savedForms`
   - Calculate active patient count for each branch
   - Filter: `archived === false` AND `branchEmail === branch.branchEmail`

2. **Display:**
   - Show branch cards in responsive grid
   - Each card shows: Icon, Branch Name, City, Active Count, Arrow
   - Summary shows: Total Branches, Total Active Patients

3. **User Clicks Branch:**
   - Save branch to `selectedBranch` in localStorage
   - Call `onBranchSelect(branch)` callback
   - Parent component handles navigation

---

## 🎨 Visual Design

### Card Layout:
```
┌─────────────────────────────────────────────┐
│ [Icon]  Branch Name              [123]  [→] │
│         City                     Active     │
└─────────────────────────────────────────────┘
```

### Colors:
- Icon Background: Green gradient (#059669 → #10b981)
- Card Background: White (#ffffff)
- Border: Light gray (#e5e7eb)
- Hover Border: Green (#059669)
- Count Color: Green (#059669)
- Text: Dark gray (#1f2937)
- Muted Text: Gray (#6b7280)

### Animations:
- Hover: Lift card 4px with shadow
- Arrow: Slide right 4px on hover
- Smooth transitions (0.2s ease)

---

## 📱 Responsive Behavior

### Desktop (> 768px):
- Grid: Auto-fill columns (min 400px)
- Full card layout with all elements

### Mobile (≤ 768px):
- Grid: Single column
- Smaller icon (48px)
- Stacked summary stats

---

## 🔄 Usage Example

```javascript
import BranchPatients from './components/BranchPatients';

function App() {
    const handleBranchSelect = (branch) => {
        // Navigate to patient list for this branch
        console.log('Viewing patients for:', branch.branchName);
        
        // Example: Set state to show patient list
        setSelectedBranch(branch);
        setCurrentView('patient-list');
    };

    return (
        <BranchPatients onBranchSelect={handleBranchSelect} />
    );
}
```

---

## 🧪 Testing Checklist

- [ ] Displays all branches from localStorage
- [ ] Shows correct active patient count per branch
- [ ] Empty state appears when no branches
- [ ] Click saves branch to localStorage
- [ ] Callback fires with correct branch object
- [ ] Hover animations work smoothly
- [ ] Responsive on mobile devices
- [ ] Summary stats calculate correctly
- [ ] Icons display properly

---

## 🚀 Future Enhancements

1. **Patient List View:**
   - Create separate component to show patients for selected branch
   - Filter forms by `branchEmail`
   - Show patient details, status, actions

2. **Search & Filter:**
   - Search branches by name or city
   - Filter by patient count range

3. **Sorting:**
   - Sort by branch name
   - Sort by patient count
   - Sort by city

4. **Export:**
   - Export branch patient data to CSV/PDF

5. **Real-time Updates:**
   - Auto-refresh counts when forms are added/archived

---

## 📝 Notes

- Uses only localStorage (no backend)
- Branch-scoped data via `branchEmail` field
- Counts only non-archived forms
- Integrates seamlessly with existing system
- Follows existing CSS patterns
- Uses Lucide React icons only
- No external dependencies added

---

## 🐛 Troubleshooting

**Issue:** Patient counts show 0
- Check if forms have `branchEmail` field
- Verify `archived` field is boolean
- Ensure branch emails match exactly

**Issue:** Branches don't appear
- Check `registeredBranches` in localStorage
- Verify data structure matches expected format

**Issue:** Click doesn't work
- Check if `onBranchSelect` prop is passed
- Verify callback function is defined

---

## 📞 Support

For issues or questions, refer to the main project documentation or check the existing component patterns in:
- `ManageForms.jsx` - Similar card layout
- `ManageDoctors.jsx` - Similar CRUD operations
- `ReferralForm.jsx` - Navigation patterns
