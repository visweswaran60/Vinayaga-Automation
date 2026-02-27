# Analytics Dashboard Documentation

## 📊 Overview
The **Analytics Dashboard** provides comprehensive insights into diagnostic referral metrics, branch performance, and notification statistics. Built with React 18, it uses localStorage for data persistence and features real-time filtering capabilities.

---

## 📁 Files Created

### 1. **AnalyticsDashboard.jsx**
Location: `src/components/AnalyticsDashboard.jsx`

**Purpose:** Main analytics dashboard component with metrics, tables, and statistics

**Features:**
- Date range filtering (7, 30, 90 days)
- Branch filtering (all or specific branch)
- 5 main metric cards
- Patients by branch table with progress tracking
- 6 quick statistics cards
- Memoized calculations for performance
- Responsive design

---

### 2. **analyticsHelpers.js**
Location: `src/utils/analyticsHelpers.js`

**Purpose:** Utility functions for analytics calculations

**Functions:**

```javascript
// Date & Filtering
getDateRangeStart(range) → Date
filterForms(forms, dateRange, branchEmail) → Array

// Main Metrics
calculateTotalPatients(forms) → Number
calculateReportsGenerated(forms) → Number
calculateDicomUploads(forms) → Number
calculateWhatsAppSent(forms) → Number
calculateEmailSent(forms) → Number
calculateArchivedCases(forms) → Number

// Branch Analytics
getPatientsByBranch(branches, forms) → Array
calculateActiveBranches(branches, forms) → Number
calculateAvgPatientsPerBranch(branches, forms) → Number

// Rates & Percentages
calculateWhatsAppRate(forms) → Number (%)
calculateEmailRate(forms) → Number (%)
calculateOverallNotificationRate(forms) → Number (%)

// Data Loaders
getAllForms() → Array
getAllBranches() → Array
```

---

## 🎨 UI Components

### Top Filters
- **Date Range Dropdown:** Last 7/30/90 Days
- **Branch Dropdown:** All Branches or specific branch
- Both filters affect all metrics below

### Metric Cards (5 Cards)
1. **Total Patients** (Blue)
   - Icon: Users
   - Count of non-archived patients

2. **Reports Generated** (Green)
   - Icon: FileText
   - Forms with `reportsUploaded: true`

3. **DICOM Uploads** (Purple)
   - Icon: Upload
   - Forms with `dicomUploaded: true`

4. **WhatsApp Sent** (Teal)
   - Icon: MessageCircle
   - Forms with `whatsappSent: true`

5. **Email Sent** (Orange)
   - Icon: Mail
   - Forms with `emailSent: true`

### Patients by Branch Table
**Columns:**
- Branch Name (with 🏆 trophy for top performer)
- City
- Patients (bold)
- DICOM count
- Reports count
- WhatsApp count
- Email count
- Progress bar with percentage

**Progress Calculation:**
```javascript
progress = ((reports + whatsapp + email) / (patients * 3)) * 100
```

**Sorting:** Descending by progress (best performing first)

### Quick Statistics (6 Cards)
1. **Active Branches** - Branches with active patients
2. **Avg Patients/Branch** - Average distribution
3. **WhatsApp Rate** - (WhatsApp sent / Total patients) * 100
4. **Email Rate** - (Email sent / Total patients) * 100
5. **Overall Notification Rate** - Combined notification success
6. **Archived Cases** - Count of archived forms

---

## 📊 Data Structure

### Form Object (localStorage: `savedForms`):
```javascript
{
    id: 1234567890,
    patientId: "P001",
    patientName: "John Doe",
    branchEmail: "branch@example.com",
    createdAt: "2024-02-27T10:30:00.000Z",
    archived: false,
    reportsUploaded: true,
    dicomUploaded: true,
    emailSent: true,
    whatsappSent: false
}
```

### Branch Object (localStorage: `registeredBranches`):
```javascript
{
    id: 1234567890,
    hospitalName: "Vinayaga Automation",
    branchName: "ANBU Salem Gugai",
    branchEmail: "branch@example.com",
    city: "Salem",
    location: "Salem"
}
```

---

## 🔄 Logic Flow

### 1. Component Mount
```
Load all forms from localStorage
Load all branches from localStorage
Set default filters (30 days, all branches)
```

### 2. Filter Change
```
User changes date range or branch
→ useMemo recalculates filtered forms
→ All metrics update automatically
→ Table data refreshes
→ Quick stats recalculate
```

### 3. Metric Calculations
```
Filtered Forms
    ↓
Calculate each metric
    ↓
Memoize results (performance)
    ↓
Display in UI
```

### 4. Branch Table
```
For each branch:
    Filter forms by branchEmail
    Count patients, DICOM, reports, notifications
    Calculate progress percentage
    Sort by progress descending
    Display with trophy for #1
```

---

## 🎨 CSS Classes

### Main Container
- `.analytics-dashboard` - Main wrapper
- `.analytics-header` - Header section
- `.analytics-title` - Page title
- `.analytics-subtitle` - Subtitle

### Filters
- `.analytics-filters` - Filter container
- `.filter-group` - Individual filter
- `.filter-icon` - Icon in filter
- `.filter-select` - Dropdown select

### Metric Cards
- `.analytics-metrics-grid` - Grid layout
- `.metric-card` - Individual card
- `.metric-icon` - Icon container
- `.metric-card-blue/green/purple/teal/orange` - Color variants
- `.metric-content` - Text content
- `.metric-value` - Large number
- `.metric-label` - Label text

### Table
- `.analytics-table-container` - Table wrapper
- `.analytics-table` - Table element
- `.branch-name-cell` - Branch name with trophy
- `.trophy-icon` - Gold trophy icon
- `.progress-cell` - Progress bar container
- `.progress-bar` - Bar background
- `.progress-fill` - Filled portion
- `.progress-text` - Percentage text

### Quick Stats
- `.analytics-quick-stats` - Grid layout
- `.quick-stat-card` - Individual card
- `.quick-stat-icon` - Icon container
- `.quick-stat-content` - Text content
- `.quick-stat-value` - Number/percentage
- `.quick-stat-label` - Label text

---

## 🎯 Key Features

### 1. **Real-time Filtering**
- All metrics update instantly when filters change
- No page reload required
- Smooth transitions

### 2. **Performance Optimized**
- `useMemo` for expensive calculations
- Memoized filtered forms
- Memoized metrics
- Memoized branch data

### 3. **Visual Hierarchy**
- Color-coded metric cards
- Trophy icon for top branch
- Progress bars for quick scanning
- Clear section separation

### 4. **Responsive Design**
- Desktop: Multi-column grids
- Mobile: Single column, horizontal scroll for table
- Flexible filter layout

### 5. **Empty States**
- Graceful handling of no data
- Clear messaging
- Icon-based empty states

---

## 📱 Responsive Behavior

### Desktop (> 768px)
- Metric cards: Auto-fit grid (min 220px)
- Quick stats: Auto-fit grid (min 200px)
- Table: Full width
- Filters: Horizontal layout

### Mobile (≤ 768px)
- Metric cards: Single column
- Quick stats: Single column
- Table: Horizontal scroll
- Filters: Stacked or wrapped

---

## 🔌 Integration

### Added to ReferralForm.jsx:

```javascript
// Import
import AnalyticsDashboard from './AnalyticsDashboard';

// Render
{activeSidebarItem === 'Analytics' && <AnalyticsDashboard />}
```

---

## 🧮 Calculation Examples

### Example 1: WhatsApp Rate
```javascript
Total Patients: 100
WhatsApp Sent: 75
Rate: (75 / 100) * 100 = 75%
```

### Example 2: Branch Progress
```javascript
Branch: ANBU Salem
Patients: 50
Reports: 40
WhatsApp: 35
Email: 30

Progress = ((40 + 35 + 30) / (50 * 3)) * 100
         = (105 / 150) * 100
         = 70%
```

### Example 3: Overall Notification Rate
```javascript
Total Patients: 100
WhatsApp Sent: 75
Email Sent: 60
Max Possible: 100 * 2 = 200

Rate = ((75 + 60) / 200) * 100
     = (135 / 200) * 100
     = 67.5% → 68% (rounded)
```

---

## 🎨 Color Scheme

### Metric Card Colors
- **Blue** (#3b82f6 → #60a5fa): Total Patients
- **Green** (#059669 → #10b981): Reports
- **Purple** (#7c3aed → #a78bfa): DICOM
- **Teal** (#0d9488 → #14b8a6): WhatsApp
- **Orange** (#ea580c → #fb923c): Email

### Progress Bar
- Background: #e5e7eb (light gray)
- Fill: #059669 → #10b981 (green gradient)

### Trophy Icon
- Color: #f59e0b (gold/amber)

---

## 🧪 Testing Checklist

- [ ] Filters update all metrics correctly
- [ ] Date range filtering works (7/30/90 days)
- [ ] Branch filtering works (all/specific)
- [ ] Metric cards show correct counts
- [ ] Table displays all branches
- [ ] Progress bars calculate correctly
- [ ] Trophy shows on top branch
- [ ] Quick stats calculate correctly
- [ ] Empty states display when no data
- [ ] Responsive on mobile devices
- [ ] Hover effects work smoothly
- [ ] Memoization prevents unnecessary recalculations

---

## 🚀 Usage Example

```javascript
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
    return (
        <div>
            <AnalyticsDashboard />
        </div>
    );
}
```

---

## 🔮 Future Enhancements

1. **Charts & Graphs**
   - Line chart for trends over time
   - Pie chart for branch distribution
   - Bar chart for comparisons

2. **Export Functionality**
   - Export to PDF
   - Export to Excel/CSV
   - Print-friendly view

3. **Advanced Filters**
   - Date picker (custom range)
   - Multiple branch selection
   - Status filters

4. **Real-time Updates**
   - Auto-refresh every X seconds
   - Live data updates
   - Notification on new data

5. **Drill-down Views**
   - Click metric to see details
   - Click branch to see patients
   - Click stat to see breakdown

6. **Comparison Mode**
   - Compare two date ranges
   - Compare two branches
   - Year-over-year comparison

---

## 🐛 Troubleshooting

**Issue:** Metrics show 0
- Check if forms exist in localStorage
- Verify form structure matches expected format
- Check date range filter

**Issue:** Branch table empty
- Verify branches exist in localStorage
- Check if forms have `branchEmail` field
- Ensure forms are within date range

**Issue:** Progress shows 0%
- Check if forms have notification fields
- Verify boolean values (not strings)
- Ensure patients count > 0

**Issue:** Filters don't work
- Check if `useMemo` dependencies are correct
- Verify filter state updates
- Check console for errors

---

## 📝 Notes

- Uses only localStorage (no backend)
- All calculations are client-side
- Memoized for performance
- No chart library required
- Follows existing design patterns
- Fully responsive
- No external dependencies

---

## 📞 Support

For issues or questions, refer to:
- `analyticsHelpers.js` - Calculation logic
- `ManageForms.jsx` - Similar table patterns
- `BranchPatients.jsx` - Similar card layouts
- Main project documentation

---

## 🎯 Summary

The Analytics Dashboard provides a comprehensive view of:
- ✅ Patient metrics across all branches
- ✅ Report and DICOM upload tracking
- ✅ Notification success rates
- ✅ Branch performance comparison
- ✅ Quick statistics overview
- ✅ Real-time filtering capabilities

All data is derived from localStorage with efficient memoized calculations for optimal performance.
