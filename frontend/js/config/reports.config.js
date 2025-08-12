export const ReportParamTypes = {
    DATE_RANGE: 'DATE_RANGE',
    PROGRAM_SELECTOR: 'PROGRAM_SELECTOR',
  };
  
  export const reportCategories = {
    EMPLOYEE_DATA: 'Employee Data',
    ATTENDANCE: 'Attendance & Schedules',
    PAYROLL: 'Payroll & Compensation',
    RECRUITMENT: 'Recruitment',
    TRAINING: 'Training & Development',
  };
  
  export const reportsConfig = [
    {
      id: 'employee_masterlist',
      title: 'Employee Masterlist',
      description: 'A detailed list of all employees, including their personal and statutory information.',
      icon: 'bi-people-fill',
      category: reportCategories.EMPLOYEE_DATA,
      handlerKey: 'generateEmployeeReport',
      requiresParams: false, 
    },
    {
      id: 'daily_attendance_summary',
      title: 'Daily Attendance Report',
      description: 'A summary and detailed log of employee attendance for a specific day or date range.',
      icon: 'bi-calendar-check-fill',
      category: reportCategories.ATTENDANCE,
      handlerKey: 'generateAttendanceReport',
      requiresParams: true,
      paramsComponent: ReportParamTypes.DATE_RANGE,
    },
    {
      id: 'company_positions_list',
      title: 'Company Positions Report',
      description: 'A list of all defined positions, including salary and employee counts.',
      icon: 'bi-diagram-3-fill',
      category: reportCategories.EMPLOYEE_DATA,
      handlerKey: 'generatePositionsReport',
      requiresParams: false,
    },
    {
      id: 'recruitment_activity',
      title: 'Recruitment Activity Report',
      description: 'Summarizes recruitment activities for a given period.',
      icon: 'bi-person-plus-fill',
      category: reportCategories.RECRUITMENT,
      handlerKey: 'generateRecruitmentReport',
      requiresParams: true,
      paramsComponent: ReportParamTypes.DATE_RANGE,
    },
    {
      id: 'training_program_summary',
      title: 'Training Program Report',
      description: 'Generates a report on a specific training program and its participants.',
      icon: 'bi-mortarboard-fill',
      category: reportCategories.TRAINING,
      handlerKey: 'generateTrainingReport',
      requiresParams: true,
      paramsComponent: ReportParamTypes.PROGRAM_SELECTOR,
    },
  ];