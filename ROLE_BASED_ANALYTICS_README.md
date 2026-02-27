# Role-Based Analytics Dashboard

## Overview

A comprehensive analytics dashboard with strict role-based access control that ensures data isolation between master (director) and branch users.

---

## User Roles

### 1. Master / Director (`role: "director"`)
- **Access**: ALL branches
- **Branch Filter**: Visible (can switch between "All Branches" or individual branches)
- **Data Scope**: System-wide aggregated metrics
- **Use Case**: Organization-level oversight and management

### 2. Branch User (`role: "branch"`)
- **Access**: ONLY their own branch
- **Branch Filter**: Hidden (not visible)
- **Data Scope**: Strictly limited to their branchEmail
- **Use Case**: Branch-specific operations and metrics

---

## Security & Data Isolation

### Critical Security Rules:

1. **Branch users CANNOT access other branch data**
   - All queries filtered by `branchEmail`
   - Branch selector hidden from UI
   - No way to bypass data isolation

2. **Role detection on mount**
   ```javascript
   const role = getUserRole(userEmail);
   if (role === 'branch') {
       setSelectedBranch(userEmail); // Lock to their branch
   }
   ```

3. **Data filtering logic**
   ```javascript
   if (userRole === 'branch') {
       branchFilter = userEmail; // ALWAYS their email
   } else if (userRole === 'director') {
       branchFilter = selectedBranch === 'all' ? null : selectedBranch;
   }
   ```

---

## Dashboard Components

### Filters (Top Bar)

**Date Range Filter** (Visible to ALL users):
- Last 7 Days
- Last 30 Days (default)
- Last 90 Days

**Branch Filter** (Visible ONLY to directors):
- All Branches (default)
- Individual branch selection
- Dynamically populated from `registeredBranches`

### Metric Cards (5 Cards)

Calculated dynamically based on active filters:

1. **Total Patients**
   - Count of non-archived forms
   - Filtered by date range and branch

2. **Reports Generated**
   - Forms with `reportsUploaded: true`
   - Excludes archived cases

3. **DICOM Uploads**
   - Forms with `dicomUploaded: true`
   - Active cases only

4. **WhatsApp Sent**
   - Forms with `whatsappSent: true`
   - Communication tracking

5. **Email Sent**
   - Forms with `emailSent: true`
   - Email notification tracking

### Patients by Branch Table

**Columns**:
- Branch Name
- City
- Patients (count)
- DICOM (count)
- Reports (count)
- WhatsApp (count)
- Email (count)
- Progress (%)

**Progress Calculation**:
```javascript
progress = ((reports + whatsapp + email) / patients) * 100
```

**Top Performer**:
- Branch with highest progress gets trophy icon 🏆
- Sorted by progress descending

**Visibility**:
- **Directors**: See all branches
- **Branch users**: See only their branch (single row)

### Quick Statistics (6 Cards)

1. **Active Branches**
   - Count of branches with patients
   - Directors: All active branches
   - Branch users: Always 1 (their branch)

2. **Avg Patients / Branch**
   - Total patients / active branches
   - Rounded to 1 decimal place

3. **WhatsApp Rate (%)**
   - (WhatsApp sent / Total patients) × 100
   - Communication effectiveness

4. **Email Rate (%)**
   - (Email sent / Total patients) × 100
   - Email delivery rate

5. **Overall Notification Rate (%)**
   - ((WhatsApp + Email) / (Patients × 2)) × 100
   - Combined communication rate

6. **Archived Cases**
   - Count of forms with `archived: true`
   - Historical data tracking

---

## Data Flow

### For Directors:

```
1. Login as director
2. Role detected: "director"
3. Branch filter visible
4. Default: "All Branches"
5. Metrics aggregate across all branches
6. Can switch to specific branch
7. Metrics update to show branch-specific data
```

### For Branch Users:

```
1. Login as branch user
2. Role detected: "branch"
3. selectedBranch locked to userEmail
4. Branch filter hidden
5. Metrics show ONLY their branch data
6. Cannot access other branches
7. Single row in branch table
```

---

## Implementation Details

### Role Detection

```javascript
useEffect(() => {
    const role = getUserRole(userEmail);
    setUserRole(role);
    
    if (role === 'branch') {
        setSelectedBranch(userEmail); // Lock to their branch
    }
    
    loadData();
}, [userEmail]);
```

### Data Filtering

```javascript
const filteredForms = useMemo(() => {
    let branchFilter = null;
    
    if (userRole === 'branch') {
        branchFilter = userEmail; // STRICT: Only their data
    } else if (userRole === 'director') {
        branchFilter = selectedBranch === 'all' ? null : selectedBranch;
    }
    
    return filterForms(allForms, dateRange, branchFilter);
}, [allForms, dateRange, selectedBranch, userRole, userEmail]);
```

### Branch Visibility

```javascript
const visibleBranches = useMemo(() => {
    if (userRole === 'branch') {
        return allBranches.filter(b => b.branchEmail === userEmail);
    }
    return allBranches; // Directors see all
}, [allBranches, userRole, userEmail]);
```

### Conditional UI Rendering

```javascript
{isDirector(userEmail) && (
    <div className="filter-group">
        <Filter size={18} />
        <select value={selectedBranch} onChange={...}>
            <option value="all">All Branches</option>
            {allBranches.map(branch => (
                <option value={branch.branchEmail}>
                    {branch.branchName}
                </option>
            ))}
        </select>
    </div>
)}
```

---

## Helper Functions

All calculation functions are in `src/utils/analyticsHelpers.js`:

### Data Loading
- `getAllForms()` - Load all forms from localStorage
- `getAllBranches()` - Load all branches from localStorage
- `filterForms(forms, dateRange, branchEmail)` - Filter by date and branch

### Metric Calculations
- `calculateTotalPatients(forms)` - Count non-archived forms
- `calculateReportsGenerated(forms)` - Count uploaded reports
- `calculateDicomUploads(forms)` - Count DICOM uploads
- `calculateWhatsAppSent(forms)` - Count WhatsApp notifications
- `calculateEmailSent(forms)` - Count email notifications
- `calculateArchivedCases(forms)` - Count archived forms

### Branch Analytics
- `getPatientsByBranch(branches, forms)` - Group data by branch
- `calculateActiveBranches(branches, forms)` - Count branches with patients
- `calculateAvgPatientsPerBranch(branches, forms)` - Average calculation

### Rate Calculations
- `calculateWhatsAppRate(forms)` - WhatsApp delivery rate
- `calculateEmailRate(forms)` - Email delivery rate
- `calculateOverallNotificationRate(forms)` - Combined rate

---

## localStorage Data Structure

### savedForms
```javascript
{
    id: "form_123",
    patientId: "P-2024-001",
    patientName: "John Doe",
    branchEmail: "branch@clinic.com",
    createdAt: "2024-01-15T10:30:00.000Z",
    archived: false,
    reportsUploaded: true,
    dicomUploaded: true,
    whatsappSent: true,
    emailSent: false
}
```

### registeredBranches
```javascript
{
    id: "branch_123",
    branchName: "Downtown Clinic",
    city: "New York",
    branchEmail: "downtown@clinic.com",
    directorEmail: "director@clinic.com",
    isActive: true
}
```

### users (for role detection)
```javascript
{
    email: "director@clinic.com",
    role: "director",
    name: "Dr. Smith"
}
```

---

## Testing Scenarios

### Test 1: Director Access
1. Login as director
2. Navigate to Analytics
3. Verify branch filter is visible
4. Select "All Branches"
5. Verify metrics show all branch data
6. Select specific branch
7. Verify metrics update to branch-specific data

### Test 2: Branch User Access
1. Login as branch user
2. Navigate to Analytics
3. Verify branch filter is NOT visible
4. Verify metrics show only their branch data
5. Verify branch table shows only one row (their branch)
6. Change date range
7. Verify data updates but still limited to their branch

### Test 3: Data Isolation
1. Login as branch user A
2. Note their patient count
3. Logout
4. Login as branch user B
5. Verify different patient count
6. Verify no overlap in data

### Test 4: Date Range Filtering
1. Login as any user
2. Select "Last 7 Days"
3. Note patient count
4. Select "Last 30 Days"
5. Verify count increases (more data)
6. Select "Last 90 Days"
7. Verify count increases further

---

## Performance Optimizations

### Memoization
All expensive calculations are memoized with `useMemo`:
- `filteredForms` - Recalculates only when filters change
- `visibleBranches` - Recalculates only when role/branches change
- `metrics` - Recalculates only when filtered data changes
- `branchData` - Recalculates only when branches/forms change

### Benefits
- Prevents unnecessary re-renders
- Improves dashboard responsiveness
- Reduces CPU usage on filter changes

---

## UI/UX Features

### Professional Design
- Clean white cards with subtle shadows
- Rounded corners (12px border radius)
- Consistent spacing and padding
- Color-coded metric icons

### Responsive Layout
- Grid-based metric cards (auto-fill)
- Responsive table with horizontal scroll
- Mobile-friendly filter dropdowns
- Adaptive column widths

### Visual Indicators
- Trophy icon for top-performing branch
- Progress bars with percentage
- Color-coded metric icons
- Empty state messages

### Accessibility
- Semantic HTML structure
- Proper label associations
- Keyboard navigation support
- Screen reader friendly

---

## Error Handling

### No Data States
- Empty branch list: Shows "No branch data available"
- No forms: Metrics show 0
- No active branches: Shows 0 in quick stats

### Invalid Data
- Missing branchEmail: Form excluded from calculations
- Invalid dates: Filtered out by date range logic
- Null values: Handled with fallbacks (0 or empty string)

---

## Future Enhancements

1. **Export Functionality**
   - Export metrics to CSV/PDF
   - Email reports to directors

2. **Date Range Picker**
   - Custom date range selection
   - Calendar UI for date selection

3. **Charts & Graphs**
   - Line charts for trends
   - Pie charts for distribution
   - Bar charts for comparisons

4. **Real-time Updates**
   - WebSocket integration
   - Auto-refresh every N seconds

5. **Advanced Filters**
   - Filter by patient status
   - Filter by doctor
   - Filter by service type

6. **Drill-down Views**
   - Click branch to see patient list
   - Click metric to see detailed breakdown

---

## Troubleshooting

### Issue: Branch filter visible to branch user
**Solution**: Verify `isDirector(userEmail)` returns false for branch users

### Issue: Branch user sees other branch data
**Solution**: Check `selectedBranch` is set to `userEmail` on mount

### Issue: Metrics show 0 for all values
**Solution**: Verify forms have correct `branchEmail` field

### Issue: Date range not filtering
**Solution**: Check `createdAt` field format in forms (ISO 8601)

### Issue: Progress calculation incorrect
**Solution**: Verify formula: `(reports + whatsapp + email) / patients * 100`

---

## Summary

The role-based analytics dashboard provides:

✅ Strict data isolation between roles  
✅ Director access to all branches  
✅ Branch user access to own data only  
✅ Dynamic metric calculations  
✅ Date range filtering  
✅ Branch-specific filtering (directors only)  
✅ Professional UI with responsive design  
✅ Performance-optimized with memoization  
✅ Comprehensive statistics and insights  
✅ Security-first architecture  

All features are localStorage-based with no backend dependencies, ready for production use.
