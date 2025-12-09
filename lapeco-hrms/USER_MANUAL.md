# 📘 Lapeco HRMS User Manual

**Version:** 1.0  
**Last Updated:** December 08, 2025

Welcome to the **Lapeco Human Resource Management System (HRMS)**. This manual provides a comprehensive step-by-step guide to using the system's modules to efficiently manage your workforce.

---

## 📋 Table of Contents

1. [Employee Data Management](#1-employee-data-management)
2. [Attendance Management](#2-attendance-management)
3. [Payroll Management](#3-payroll-management)
4. [Leave Management](#4-leave-management)
5. [Recruitment](#5-recruitment)
6. [Performance Management](#6-performance-management)
7. [Training and Development](#7-training-and-development)
8. [Positions Management](#8-positions-management)
9. [Reports](#9-reports)

---

## 1. Employee Data Management

> **Manage the central database of all employees.**

📍 **Location:** `Employee Data` page

### 🛠 Features
*   **View Employees**: Browse a list or card view of all active and inactive employees.
*   **Search & Filter**:
    *   **Search**: Find employees by name or ID.
    *   **Filter**: Filter by **Status** (Active/Inactive), **Position**, or **Joining Date**.
*   **Add Employee**:
    1.  Click the **"New Employee"** button.
    2.  Fill in personal details (Name, Birthday, Gender, Contact).
    3.  Fill in employment information (Position, Role, Joining Date, Statutory IDs).
    4.  Upload documents (Resume, Profile Picture).
    5.  Click **"Save"**.
*   **Edit Employee**: Click the **Edit** (pencil) icon on an employee card to update their information.
*   **Delete Employee**:
    *   Click the **Delete** (trash) icon.
    *   ⚠️ **Note**: This permanently removes the record.
*   **Export**: Generate an Employee List report via the "Generate Report" button.

### 🧩 Components & Modals
*   `AddEditEmployeeModal`: Form to create new employee records or edit existing ones.
*   `ConfirmationModal`: Confirm critical actions like deleting an employee record.
*   `AccountGeneratedModal`: Displays system-generated credentials for new employees.
*   `TerminateEmployeeModal`: Process employee termination with reason and date.

---

## 2. Attendance Management

> **Track and manage daily employee attendance logs.**

📍 **Location:** `Attendance` page

### 🛠 Features
*   **Daily Attendance View**:
    *   Shows attendance for a specific date with indicators for **Present**, **Late**, and **Absent**.
    *   **Filter**: Filter by Status or Department.
*   **History View**:
    *   View attendance summary (Total Present, Late, Absent) by month and year.
    *   **Sort**: Sort by Date or Status.
*   **By Employee View**: Drill down into a specific employee's attendance logs for a date range.
*   **Import Attendance**:
    *   Click **"Import Excel"** to upload logs from a biometric device or spreadsheet (`.xlsx`, `.csv`).
*   **Edit Records**: Manually correct attendance logs (Time In, Time Out) if necessary.
*   **Generate Report**: Download attendance reports directly from this page.

### 🧩 Components & Modals
*   `EditAttendanceModal`: Manually correct or update time-in/time-out records.
*   `ImportPreviewModal`: Preview and validate attendance logs uploaded via Excel/CSV.
*   `ConfirmationModal`: Confirm actions like deleting a log.
*   `ReportConfigurationModal`: Configure attendance report parameters.
*   `ReportPreviewModal`: Preview generated attendance reports.

---

## 3. Payroll Management

> **Manage payroll processing, payslip generation, and statutory deductions.**

📍 **Location:** `Payroll` page

### 🛠 Features
*   **Payroll Generation**:
    1.  Go to the **"Payroll Generation"** tab.
    2.  Select the **Start Date** and **End Date**.
    3.  Review the summary (Employees included, Total Projected Gross).
    4.  Click **"Generate Payroll"**.
*   **Payroll History**:
    *   View past payroll runs in the **"Generated Payrolls"** tab.
    *   **Status**: Check if a run is Paid or Unpaid.
    *   **View Details**: See breakdown of gross pay, deductions, and net pay.
    *   **Mark as Paid**: Finalize the payroll run to lock it.
    *   **Delete Run**: Remove an erroneous payroll run (only if not yet marked as paid).
*   **13th Month Pay**: Manage and generate 13th-month pay computations.
*   **Deduction Rules**: Configure statutory deduction rules (SSS, PhilHealth, Pag-IBIG) and tax brackets.

### 🧩 Components & Modals
*   `GeneratePayrollModal`: Interface to select dates and generate a new payroll run.
*   `PayrollAdjustmentModal`: Add bonuses, deductions, or allowances to a specific payroll record.
*   `ViewPayslipModal`: Detailed view of an employee's payslip for a specific period.
*   `IncomeBreakdownModal`: Visual breakdown of income sources and deductions.
*   `FinalPayModal`: Compute final pay for resigned/terminated employees.
*   `ConfirmationModal`: Confirm actions like locking/paying a payroll run.

---

## 4. Leave Management

> **Handle employee leave requests, approvals, and credit balances.**

📍 **Location:** `Leave Management` page

### 🛠 Features
*   **Leave Requests**:
    *   View pending, approved, and declined leave requests.
    *   **Filter**: Filter by Status or Leave Type.
    *   **Action**: Click **Approve** or **Decline** on a request.
    *   **Attachments**: View uploaded documents (e.g., Medical Certificates).
*   **Leave Credits**:
    *   View leave balances for each employee.
    *   **Adjust Credits**: Manually add or deduct leave credits.
*   **Cash Conversion**:
    *   Convert unused leave credits to cash at the end of the year via the **"Cash Conversion"** tab.
*   **Policies**: Configure **Notice Days** and **Auto-decline** settings.

### 🧩 Components & Modals
*   `RequestLeaveModal`: Form for employees to submit leave requests.
*   `ViewReasonModal`: View the detailed reason/description for a leave request.
*   `ViewAttachmentsModal`: View uploaded documents.
*   `EditLeaveCreditsModal`: Manually adjust leave balances for a single employee.
*   `BulkAddLeaveCreditsModal`: Add leave credits to multiple employees at once.
*   `ResetCreditsModal`: Reset leave credits for a new year or cycle.
*   `EditMaternityDetailsModal` / `EditPaternityDetailsModal`: Specialized modals for parental leave.

---

## 5. Recruitment

> **Manage the hiring pipeline from application to hiring.**

📍 **Location:** `Recruitment` page

### 🛠 Features
*   **Dashboard View**:
    *   **Pipeline Funnel**: Visual overview of applicant counts by stage (**New Applicant**, **Interview**, **Hired**, **Rejected**).
    *   **Applicants Grid**: Card view of applicants showing status and quick actions.
*   **List View**: Switch to a tabular view for sorting and detailed data scanning.
*   **Add Applicant**:
    *   Click **"New Applicant"**.
    *   Manually enter details or upload a resume.
*   **Manage Applicants**:
    *   **View Details**: Click the **View** button on an applicant card.
    *   **Change Status**: Use the **Actions** dropdown:
        *   **Schedule Interview**: Move to "Interview" stage and set date/time.
        *   **Hire**: Move to "Hired" stage and generate employee record.
        *   **Reject**: Move to "Rejected" stage.
*   **Chatbot Management**: Configure the AI chatbot used for initial applicant screening.

### 🧩 Components & Modals
*   `AddApplicantModal`: Form to manually add a new applicant.
*   `ViewApplicantDetailsModal`: View full details, resume, and history.
*   `ScheduleInterviewModal`: Schedule an interview (Online/In-person).
*   `HireApplicantModal`: Convert an applicant into an employee record.
*   `AccountGeneratedModal`: Displays credentials when a new employee account is created.
*   `ChatbotManagementTab`: Manage AI chatbot Q&A.

---

## 6. Performance Management

> **Track and manage employee performance evaluations.**

📍 **Location:** `Performance` page

### 🛠 Features
*   **Overview**: Dashboard showing performance trends and statistics.
*   **Evaluation Tracker**:
    *   Monitor progress of evaluations for the current period.
    *   See which teams/employees have pending evaluations.
*   **Evaluation History**: Access past evaluation records by employee or period.
*   **Manage Periods**:
    *   Create new evaluation cycles (e.g., "Annual Review 2025").
    *   Set start and end dates for the evaluation window.
*   **Reports**: Generate performance summary reports directly from the module.

### 🧩 Components & Modals
*   `ViewEvaluationModal`: View detailed evaluation results and scores.
*   `ReviewSubmissionModal`: For managers/admins to review submitted evaluations.
*   `PerformanceReportModal`: Configure and generate specific performance reports.
*   `AddEditPeriodModal`: Create or edit evaluation periods.
*   `PeriodResultsModal`: View aggregate results for a specific period.
*   **Components**: `EvaluationTracker`, `PerformanceOverview`, `EvaluationHistory`, `ManagePeriods`.

---

## 7. Training and Development

> **Manage training programs and employee enrollments.**

📍 **Location:** `Training` page

### 🛠 Features
*   **Program Management**:
    *   **Create**: Click **"New Program"** to add a training course.
    *   **Edit**: Update program details.
    *   **Delete**: Remove a program (includes "Force Delete" if enrollments exist).
*   **Program Details View**:
    *   Click the **View** (eye) icon to see stats (Total Enrolled, Completion Rates).
*   **Enrollment Management**:
    *   **Enroll Employee**: Add participants to a program.
    *   **Update Status**: Change status (Not Started, In Progress, Completed).
    *   **Unenroll**: Remove an employee from a training program.

### 🧩 Components & Modals
*   `AddEditProgramModal`: Create/Edit training programs.
*   `EnrollEmployeeModal`: Enroll employees into programs.
*   `UpdateEnrollmentStatusModal`: Update training status.
*   `ReportPreviewModal`: Preview training reports.

---

## 8. Positions Management

> **Define job roles and their corresponding compensation structures.**

📍 **Location:** `Positions` page

### 🛠 Features
*   **Manage Positions**:
    *   **Create**: Click **"New Position"** to add a role.
    *   **Compensation**: Set **Monthly Salary**, **Base Rate**, **Overtime Rates**, and **Night Differential**.
    *   **Limits**: Set **Max Team Leaders** for the position.
    *   **Permissions**: Define allowed system modules.
*   **Employee Assignment**:
    *   **Add Employee**: Assign a new employee to a position (includes reassignment confirmation).
    *   **Remove Employee**: Unassign an employee.
    *   **Change Role**: Toggle between **Regular Employee** and **Team Leader**.
*   **Reports**: Generate a positions summary report.

### 🧩 Components & Modals
*   `AddEditPositionModal`: Create or update position details.
*   `AddEmployeeToPositionModal`: Assign employees to a specific position.
*   `ConfirmationModal`: Confirm critical actions.

---

## 9. Reports

> **Generate comprehensive reports and view predictive analytics.**

📍 **Location:** `Reports` page

### 🛠 Features
*   **Report Categories**:
    *   Employee Data, Attendance, Payroll, Leave, Recruitment, Performance, Training, Positions, Offboarding.
*   **Generate Report**:
    1.  Select a report card (e.g., "Payroll Summary").
    2.  Configure parameters in the modal (Date Range, Department).
    3.  Click **"Generate"**.
    4.  Preview and click **"Download PDF"**.
*   **Predictive Analytics**:
    *   **Risk Score**: AI-calculated turnover risk score.
    *   **High Potential**: Indicators for high-performing employees.
    *   **Turnover Risk**: Warnings for employees at risk of resigning.

### 🧩 Components & Modals
*   `ReportConfigurationModal`: Select report parameters before generation.
*   `ReportPreviewModal`: Preview generated PDF reports.
*   `ReportCard`: Interface component for each report type.
