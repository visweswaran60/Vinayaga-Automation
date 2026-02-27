# Director-Level Branch Management System

## Overview

A comprehensive role-based access control (RBAC) system that enables directors to manage multiple diagnostic branches with centralized control and branch-specific data scoping.

---

## Architecture

### Role System

The system supports two user roles:

1. **Director** (`role: "director"`)
   - Can create, edit, and delete branches
   - Can switch between branches to view branch-specific data
   - Has access to "Manage Branches" module
   - Email stored as `directorEmail` in branch records

2. **Branch User** (`role: "branch"`)
   - Can only access their own branch data
   - Cannot switch branches
   - Cannot see "Manage Branches" module
   - Email stored as `branchEmail`

---

## Key Components

### 1. ManageBranches.jsx

**Purpose**: Director-only module for CRUD operations on branches

**Features**:
- Create new branches with validation
- Edit existing branch details (name, location)
- Soft-delete branches with active patients
- Hard-delete branches without patients
- Toggle branch active/inactive status
- Search and filter branches
- Display patient count per branch

**Branch Data Structure**:
```javascript
{
  id: "branch_123_1234567890",
  branchName: "Downtown Clinic",
  location: "New York, NY",
  branchEmail: "downtown@clinic.com",
  directorEmail: "director@clinic.com",
  hospitalName: "Vinayaga Diagnostics",
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

**Access Control**: Only visible when `isDirector(userEmail) === true`

---

### 2. BranchSwitcher.jsx

**Purpose**: Dropdown component for directors to switch active branch context

**Features**:
- Lists all active branches owned by director
- Shows current active branch
- Persists selection to localStorage (`activeBranch`)
- Reloads page on branch change to refresh all data
- "View All" option to clear branch filter

**UI Location**: Top banner, right side (only for directors)

**Data Flow**:
```
User selects branch → Save to localStorage → Reload page → 
All components read effectiveBranchEmail → Filter data accordingly
```

---

### 3. roleHelpers.js

**Purpose**: Centralized utility functions for role-based logic

**Key Functions**:

```javascript
// Get user role (director or branch)
getUserRole(userEmail) → "director" | "branch"

// Check if user is director
isDirector(userEmail) → boolean

// Get effective branch email for data filtering
getEffectiveBranchEmail(userEmail, userRole) → branchEmail | null

// Get display name for UI
getBranchDisplayName(userEmail, userRole) → string

// Filter data by branch
filterByBranch(items, branchEmail) → filteredItems

// Get branches owned by director
getDirectorBranches(directorEmail) → branches[]

// Get/set active branch
getActiveBranchData() → branchData | null
setActiveBranch(branchData) → void
```

---

## Data Scoping Logic

### For Directors:
1. Check localStorage for `activeBranch`
2. If set, filter data by `activeBranch.branchEmail`
3. If not set, show all data across all owned branches

### For Branch Users:
1. Always filter by their own `branchEmail`
2. No branch switching capability

### Implementation:
```javascript
const effectiveBranchEmail = getEffectiveBranchEmail(userEmail, userRole);

// Filter forms
const filteredForms = effectiveBranchEmail 
  ? forms.filter(f => f.branchEmail === effectiveBranchEmail)
  : forms; // Show all for directors with no branch selected
```

---

## Registration Flow Updates

### ScanCenterRegistration.jsx Changes:

1. **Director Email Linking**:
   - `masterEmail` from organization form becomes `directorEmail`
   - All created branches link to this director

2. **Role Assignment**:
   - Director: `{ email: masterEmail, role: "director" }`
   - Branch users: `{ email: branchEmail, role: "branch" }`
   - Stored in localStorage key: `users`

3. **Branch Data**:
   - Added `directorEmail` field
   - Added `isActive` field (default: true)
   - Added `id` field for unique identification

---

## ReferralForm Integration

### Sidebar Navigation:
- Added conditional "Manage Branches" button
- Only visible when `isDirector(userEmail) === true`

### Top Banner:
- Added `BranchSwitcher` component (director only)
- Updated branch display to use `getBranchDisplayName()`

### State Management:
```javascript
const [userRole, setUserRole] = useState('branch');
const [effectiveBranchEmail, setEffectiveBranchEmail] = useState(null);

useEffect(() => {
  const role = getUserRole(userEmail);
  setUserRole(role);
  const branchEmail = getEffectiveBranchEmail(userEmail, role);
  setEffectiveBranchEmail(branchEmail);
}, [userEmail]);
```

---

## CSS Styling

### New Style Classes:

**Manage Branches Module**:
- `.mb-wrapper` - Main container
- `.mb-header` - Page header with title and actions
- `.mb-search-bar` - Search input with icon
- `.mb-grid` - Responsive card grid
- `.mb-card` - Branch card with hover effects
- `.mb-card-inactive` - Inactive branch styling
- `.mb-badge-active` / `.mb-badge-inactive` - Status badges
- `.mb-btn-edit` / `.mb-btn-toggle` / `.mb-btn-delete` - Action buttons

**Branch Switcher**:
- `.branch-switcher` - Container
- `.branch-switcher-btn` - Dropdown trigger button
- `.branch-switcher-dropdown` - Dropdown menu
- `.branch-switcher-item` - Individual branch option
- `.branch-switcher-check` - Active branch indicator

**Modal Components**:
- `.modal-overlay` - Full-screen backdrop
- `.modal-content` - Modal container
- `.modal-header` / `.modal-body` / `.modal-footer` - Modal sections
- `.modal-input-group` - Form input wrapper
- `.modal-error` - Error message display

---

## localStorage Keys

| Key | Description | Structure |
|-----|-------------|-----------|
| `registeredBranches` | All branch records | Array of branch objects |
| `activeBranch` | Currently selected branch (director) | Single branch object |
| `users` | User roles and metadata | Array of user objects |
| `savedForms` | Patient referral forms | Array with `branchEmail` field |
| `savedDoctors` | Doctor records | Array with `branchEmail` field |

---

## Access Control Rules

### Manage Branches Page:
```javascript
// Only directors can access
{activeSidebarItem === 'Manage Branches' && isDirector(userEmail) && (
  <ManageBranches userEmail={userEmail} userRole={userRole} />
)}
```

### Branch Switcher:
```javascript
// Only show for directors
if (userRole !== 'director') {
  return null;
}
```

### Data Filtering:
```javascript
// Apply branch filter based on role
const effectiveBranchEmail = getEffectiveBranchEmail(userEmail, userRole);
const filteredData = filterByBranch(allData, effectiveBranchEmail);
```

---

## User Workflows

### Director Workflow:

1. **Login** with director email (masterEmail from registration)
2. **See all branches** by default (no filter)
3. **Click "Manage Branches"** to:
   - View all owned branches
   - Create new branches
   - Edit branch details
   - Activate/deactivate branches
   - Delete branches (with validation)
4. **Use Branch Switcher** to:
   - Select specific branch
   - View branch-specific data
   - Switch between branches
   - Clear filter to view all

### Branch User Workflow:

1. **Login** with branch email
2. **See only their branch data** (automatic filter)
3. **No branch switching** capability
4. **No "Manage Branches"** button visible
5. **Standard operations** (create forms, manage doctors, etc.)

---

## Validation Rules

### Branch Creation:
- Branch name required
- Location required
- Branch email required and must be valid
- Email must be unique across all branches
- Auto-link to logged-in director

### Branch Deletion:
- If branch has active patients → Soft delete (set `isActive: false`)
- If branch has no patients → Hard delete (remove from array)
- Confirmation dialog required

### Branch Email:
- Cannot be changed after creation
- Used for Firebase Auth login
- Must be unique system-wide

---

## Security Considerations

1. **Role Verification**: All role checks use `getUserRole()` utility
2. **Data Scoping**: All queries filtered by `effectiveBranchEmail`
3. **UI Hiding**: Sensitive features hidden based on role
4. **Validation**: Server-side validation would be added in production
5. **localStorage**: In production, use secure backend with JWT tokens

---

## Future Enhancements

1. **Multi-Director Support**: Allow multiple directors per organization
2. **Branch Permissions**: Granular permissions per branch
3. **Audit Logs**: Track branch creation, edits, deletions
4. **Branch Analytics**: Performance metrics per branch
5. **Bulk Operations**: Import/export branches
6. **Branch Templates**: Pre-configured branch settings
7. **User Management**: Invite/remove branch users
8. **Backend Integration**: Replace localStorage with API calls

---

## Testing Checklist

### Director Tests:
- [ ] Can see "Manage Branches" button
- [ ] Can create new branch
- [ ] Can edit branch details
- [ ] Can delete branch (with/without patients)
- [ ] Can toggle branch active status
- [ ] Can search/filter branches
- [ ] Can switch between branches
- [ ] Data filters correctly per branch
- [ ] "View All" shows all branch data

### Branch User Tests:
- [ ] Cannot see "Manage Branches" button
- [ ] Cannot see Branch Switcher
- [ ] Only sees own branch data
- [ ] Cannot access other branch data
- [ ] All features work with branch scope

### Edge Cases:
- [ ] Director with no branches
- [ ] Branch with no patients
- [ ] Branch with active patients (soft delete)
- [ ] Duplicate email validation
- [ ] Invalid email format
- [ ] Empty form submission
- [ ] Page reload preserves active branch

---

## Troubleshooting

### Issue: "Manage Branches" not visible
**Solution**: Verify user role is "director" in localStorage `users` array

### Issue: Branch Switcher not showing
**Solution**: Check if director has any active branches (`isActive: true`)

### Issue: Data not filtering correctly
**Solution**: Verify `effectiveBranchEmail` is set correctly and forms have `branchEmail` field

### Issue: Branch deletion fails
**Solution**: Check if branch has active patients (use soft delete instead)

### Issue: Role not detected
**Solution**: Ensure user exists in `users` array or has branches with matching `directorEmail`

---

## Code Examples

### Check if user is director:
```javascript
import { isDirector } from '../utils/roleHelpers';

if (isDirector(userEmail)) {
  // Show director features
}
```

### Filter data by branch:
```javascript
import { getEffectiveBranchEmail, filterByBranch } from '../utils/roleHelpers';

const branchEmail = getEffectiveBranchEmail(userEmail, userRole);
const filteredForms = filterByBranch(allForms, branchEmail);
```

### Get active branch display:
```javascript
import { getBranchDisplayName } from '../utils/roleHelpers';

const displayName = getBranchDisplayName(userEmail, userRole);
// Returns: "Downtown Clinic" or "All Branches"
```

---

## Summary

The Director-level branch management system provides:

✅ Role-based access control (Director vs Branch)  
✅ Centralized branch management for directors  
✅ Branch switching with data scoping  
✅ Secure data filtering per branch  
✅ Professional UI with search and validation  
✅ Soft/hard delete with patient protection  
✅ Comprehensive utility functions  
✅ Clean, maintainable code structure  

All features are localStorage-based, ready for backend integration when needed.
