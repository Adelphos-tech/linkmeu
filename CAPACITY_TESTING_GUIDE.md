# EventsX Capacity Management - Testing Guide

## 📋 Overview

This comprehensive testing suite validates all new capacity management features implemented in EventsX, including:

- ✅ **Date Range Support** (Start Date / End Date)
- ✅ **Event Capacity Management**
- ✅ **Registration Beyond Capacity with Warning**
- ✅ **Attendance Limited to Capacity**
- ✅ **Admin Capacity Increase Functionality**
- ✅ **Capacity Display Across All Views**

## 🎯 Test Coverage

### Total Test Cases: **12**
### Iterations Per Test: **10**
### Total Tests Executed: **120**

## 📊 Test Categories

### 1. Event Creation (2 test cases)
- TC1: Create Event with Date Range and Capacity
- TC2: View Event with Date Range and Capacity

### 2. Registration (2 test cases)
- TC3: Register When Under Capacity
- TC4: Register Over Capacity with Warning

### 3. Authentication & Access (1 test case)
- TC5: Admin Login and Access Check-in

### 4. Check-in Features (2 test cases)
- TC6: Check-in Attendee Under Capacity
- TC7: Check-in Blocked When Capacity Reached

### 5. Admin Features (1 test case)
- TC8: Admin Increase Capacity Modal

### 6. Display & UI (2 test cases)
- TC9: Date Range Display on Event List
- TC10: Public Event View with Capacity

### 7. Validation (2 test cases)
- TC11: Capacity Validation in Event Form
- TC12: Date Range Validation

## 🚀 Running the Tests

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Server should be running at `http://localhost:5173`

### Method 1: Full Automated Test Suite (Recommended)

```bash
# Run capacity tests (120 tests)
npm run test:capacity
```

This will:
- Execute all 12 test cases 10 times each
- Generate CSV report with detailed results
- Create summary report with statistics

### Method 2: Generate Excel Report Only

```bash
# Generate formatted Excel report
npm run test:excel
```

This creates a comprehensive Excel workbook with:
- **Test Results Sheet**: All 120 test results with color coding
- **Summary Sheet**: Overall statistics and feature coverage
- **Test Cases Details Sheet**: Detailed test case information
- **Feature Coverage Sheet**: Component-level coverage analysis

### Method 3: Full Test with Excel Report

```bash
# Run full test suite + generate Excel report
npm run test:capacity:full
```

## 📁 Generated Reports

After running tests, you'll find:

1. **EventsX_Capacity_Test_Results.csv**
   - Excel-compatible CSV file
   - All test results with details
   - Can be opened in Excel/Google Sheets

2. **EventsX_Capacity_Test_Summary.txt**
   - Human-readable summary
   - Overall statistics
   - Pass/Fail breakdown
   - Recommendations

3. **EventsX_Capacity_Management_Test_Report.xlsx** (when using `test:excel`)
   - Professional Excel workbook
   - Multiple sheets with charts
   - Color-coded results
   - Feature coverage analysis

## 📝 Test Case Details

### TC1: Create Event with Date Range and Capacity
**Purpose**: Validate event creation with new fields  
**Tests**:
- Start date and end date input
- Capacity field validation
- Form submission with date range
- Data persistence

**Expected**: Event created with startDate, endDate, and capacity stored correctly

---

### TC2: View Event with Date Range and Capacity
**Purpose**: Verify date range and capacity display  
**Tests**:
- Event details page shows date range
- Capacity information visible
- Formatting correct (single date vs range)

**Expected**: Date range displayed as "Start - End" and capacity shown

---

### TC3: Register When Under Capacity
**Purpose**: Normal registration flow  
**Tests**:
- Registration form accessible
- No capacity warning shown
- Registration completes successfully
- Attendee count updated

**Expected**: Smooth registration with no warnings

---

### TC4: Register Over Capacity with Warning
**Purpose**: Test over-capacity registration warning  
**Tests**:
- Yellow warning banner displays
- Warning message accurate
- Registration still allowed
- "Capacity Exceeded" text visible

**Expected**: Warning shown but registration proceeds

---

### TC5: Admin Login and Access Check-in
**Purpose**: Admin authentication and permissions  
**Tests**:
- Admin login successful
- Check-in features accessible
- Admin panel visible
- Capacity management available

**Expected**: Full admin access granted

---

### TC6: Check-in Attendee Under Capacity
**Purpose**: Normal check-in flow  
**Tests**:
- Check-in button enabled
- Attendee can be checked in
- Stats updated correctly
- No capacity warnings

**Expected**: Successful check-in with stats update

---

### TC7: Check-in Blocked When Capacity Reached
**Purpose**: Capacity enforcement on attendance  
**Tests**:
- Check-in button disabled at capacity
- Red warning banner shown
- Button text changes to "Capacity Full"
- Alert message on attempted check-in

**Expected**: Check-in blocked with clear messaging

---

### TC8: Admin Increase Capacity Modal
**Purpose**: Capacity increase functionality  
**Tests**:
- "Increase Capacity" button appears
- Modal opens correctly
- New capacity input validation
- Capacity update persists
- Success message shown

**Expected**: Capacity successfully increased

---

### TC9: Date Range Display on Event List
**Purpose**: Date range in list view  
**Tests**:
- Event list shows dates
- Single date vs range formatting
- Date icon present
- Dates clickable

**Expected**: Correct date format in list

---

### TC10: Public Event View with Capacity
**Purpose**: Public-facing capacity info  
**Tests**:
- Capacity visible on public page
- Registration count shown
- "Full" indicator when appropriate
- Register button accessible

**Expected**: Clear capacity status for public

---

### TC11: Capacity Validation in Event Form
**Purpose**: Capacity field validation  
**Tests**:
- Capacity accepts numbers only
- Positive number validation
- Optional field behavior
- Hint text visible

**Expected**: Proper validation and hints

---

### TC12: Date Range Validation
**Purpose**: Date range constraints  
**Tests**:
- Start date field present
- End date field present
- End date >= start date validation
- Error message on invalid range

**Expected**: Validation prevents invalid date ranges

## 🎨 Status Color Coding

In Excel reports:
- 🟢 **Green (PASS)**: Test passed successfully
- 🔴 **Red (FAIL)**: Test failed
- 🟡 **Yellow (PARTIAL)**: Partially passed (some conditions met)
- ⚪ **Gray (SKIP)**: Test skipped (conditions not met)

## 📈 Expected Results

Based on implementation:

| Metric | Expected Value |
|--------|----------------|
| **Total Tests** | 120 |
| **Pass Rate** | ≥ 90% |
| **Critical Failures** | 0 |
| **Feature Coverage** | 100% |

### Feature-Specific Expectations:

✅ **Date Range**: 100% pass rate  
✅ **Capacity Field**: 100% pass rate  
✅ **Registration Warning**: ≥ 95% pass rate (minor UI timing acceptable)  
✅ **Attendance Limit**: 100% pass rate  
✅ **Admin Increase**: 100% pass rate  
✅ **Display Components**: 100% pass rate  

## 🐛 Troubleshooting

### Test Suite Won't Start
**Issue**: Server not running  
**Solution**: Run `npm run dev` in another terminal first

### Browser Opens but Tests Fail
**Issue**: Timing issues  
**Solution**: Check if server is fully loaded, wait a few seconds after starting

### Excel File Not Generated
**Issue**: ExcelJS not installed  
**Solution**: Run `npm install`

### Some Tests Show PARTIAL
**Issue**: UI timing or specific conditions not met  
**Solution**: This is acceptable for <5% of tests. PARTIAL often indicates feature works but timing varies.

## 📞 Support

For issues or questions:
- Check test output in terminal
- Review generated CSV for error details
- Verify all dependencies installed
- Ensure dev server is running

## 🎉 Success Criteria

Tests are considered successful if:
1. ✅ Pass rate ≥ 90%
2. ✅ Zero critical failures
3. ✅ All 6 new features have ≥ 95% pass rate
4. ✅ Excel report generates without errors

---

**Last Updated**: December 24, 2025  
**Version**: 1.0.0  
**Test Suite**: Capacity Management Comprehensive Testing
