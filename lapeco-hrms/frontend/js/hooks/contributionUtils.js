import { format } from 'date-fns';

const MOCK_COMPANY_INFO = {
    employerIdSss: '03-9-1234567-8',
    employerName: 'Lapeco Group of Companies',
    address: '123 Innovation Drive, Tech City',
};

export const calculateSssContribution = (salary, isProvisional = false) => {
    const monthlyEquivalent = isProvisional ? salary * 2 : salary;
    let msc = Math.min(monthlyEquivalent, 30000);
    if (msc < 4000) msc = 4000;

    if (msc < 30000) {
        const remainder = msc % 500;
        if (remainder < 250) {
            msc = msc - remainder;
        } else {
            msc = msc - remainder + 500;
        }
    }
    
    const monthlyEmployeeShare = msc * 0.045;
    const monthlyEmployerShare = msc * 0.095;

    const divisor = isProvisional ? 2 : 1;

    return {
        employeeShare: monthlyEmployeeShare / divisor,
        employerShare: monthlyEmployerShare / divisor,
        total: (monthlyEmployeeShare + monthlyEmployerShare) / divisor,
    };
};

export const calculatePhilhealthContribution = (salary, isProvisional = false) => {
    const monthlyEquivalent = isProvisional ? salary * 2 : salary;
    const rate = 0.05;
    const incomeFloor = 10000;
    const incomeCeiling = 100000;

    let baseSalary = Math.max(monthlyEquivalent, incomeFloor);
    baseSalary = Math.min(baseSalary, incomeCeiling);

    const totalPremium = baseSalary * rate;
    const divisor = isProvisional ? 2 : 1;

    return {
        employeeShare: (totalPremium / 2) / divisor,
        employerShare: (totalPremium / 2) / divisor,
        total: totalPremium / divisor,
    };
};

export const calculatePagibigContribution = (salary, isProvisional = false) => {
    const monthlyEquivalent = isProvisional ? salary * 2 : salary;
    let employeeShare;
    if (monthlyEquivalent <= 1500) {
        employeeShare = monthlyEquivalent * 0.01;
    } else {
        employeeShare = monthlyEquivalent * 0.02;
    }
    
    employeeShare = Math.min(employeeShare, 100);
    const employerShare = Math.min(monthlyEquivalent * 0.02, 100);
    const divisor = isProvisional ? 2 : 1;

    return {
        employeeShare: employeeShare / divisor,
        employerShare: employerShare / divisor,
        total: (employeeShare + employerShare) / divisor,
    };
};

export const calculateTin = (taxableSemiMonthlySalary) => {
    let tax = 0;
    if (taxableSemiMonthlySalary > 10417 && taxableSemiMonthlySalary <= 16666) {
        tax = (taxableSemiMonthlySalary - 10417) * 0.15;
    } else if (taxableSemiMonthlySalary > 16667 && taxableSemiMonthlySalary <= 33332) {
        tax = 937.50 + (taxableSemiMonthlySalary - 16667) * 0.20;
    } else if (taxableSemiMonthlySalary > 33333 && taxableSemiMonthlySalary <= 83332) {
        tax = 4270.70 + (taxableSemiMonthlySalary - 33333) * 0.25;
    } else if (taxableSemiMonthlySalary > 83333 && taxableSemiMonthlySalary <= 333332) {
        tax = 16770.70 + (taxableSemiMonthlySalary - 83333) * 0.30;
    } else if (taxableSemiMonthlySalary > 333333) {
        tax = 91770.70 + (taxableSemiMonthlySalary - 333333) * 0.35;
    }
    return { taxWithheld: tax > 0 ? tax : 0 };
};

export const generateSssData = (employees, aggregatedRecords, month, isProvisional) => {
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    const rows = aggregatedRecords.map((record, index) => {
        const emp = employeeMap.get(record.empId);
        if (!emp) return null;
        
        const contribution = calculateSssContribution(record.totalGross, isProvisional);

        return {
            no: index + 1,
            sssNo: emp.sssNo || '',
            lastName: emp.lastName || '',
            firstName: emp.firstName || '',
            middleName: emp.middleName || '',
            employeeContribution: contribution.employeeShare,
            employerContribution: contribution.employerShare,
            totalContribution: contribution.total,
        };
    }).filter(Boolean);

    return {
        title: 'SSS Contribution Report',
        headerData: {
            'Employer ID Number': MOCK_COMPANY_INFO.employerIdSss,
            'Employer Name': MOCK_COMPANY_INFO.employerName,
            'Contribution Month': format(new Date(month), 'MMMM yyyy'),
        },
        columns: [
            { key: 'no', label: 'No.', editable: false, isPermanent: true },
            { key: 'sssNo', label: 'SSS Number', editable: false, isPermanent: true },
            { key: 'lastName', label: 'Last Name', editable: false, isPermanent: true },
            { key: 'firstName', label: 'First Name', editable: false, isPermanent: true },
            { key: 'middleName', label: 'Middle Name', editable: false, isPermanent: true },
            { key: 'employeeContribution', label: 'EE Share', editable: false, isPermanent: true },
            { key: 'employerContribution', label: 'ER Share', editable: false, isPermanent: true },
            { key: 'totalContribution', label: 'Total', editable: false, isPermanent: true },
        ],
        rows,
    };
};

export const generatePhilhealthData = (employees, aggregatedRecords, month, isProvisional) => {
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    const rows = aggregatedRecords.map((record, index) => {
        const emp = employeeMap.get(record.empId);
        if (!emp) return null;

        const contribution = calculatePhilhealthContribution(record.totalGross, isProvisional);
        
        return {
            no: index + 1,
            philhealthNo: emp.philhealthNo || '',
            lastName: emp.lastName || '',
            firstName: emp.firstName || '',
            middleName: emp.middleName || '',
            employeeContribution: contribution.employeeShare,
            employerContribution: contribution.employerShare,
            totalContribution: contribution.total,
        };
    }).filter(Boolean);

    return {
        title: 'PhilHealth Contribution Report',
        headerData: {
            'Employer Name': MOCK_COMPANY_INFO.employerName,
            'Contribution Month': format(new Date(month), 'MMMM yyyy'),
        },
        columns: [
            { key: 'no', label: 'No.', editable: false, isPermanent: true },
            { key: 'philhealthNo', label: 'PhilHealth Number', editable: false, isPermanent: true },
            { key: 'lastName', label: 'Last Name', editable: false, isPermanent: true },
            { key: 'firstName', label: 'First Name', editable: false, isPermanent: true },
            { key: 'middleName', label: 'Middle Name', editable: false, isPermanent: true },
            { key: 'employeeContribution', label: 'EE Share', editable: false, isPermanent: true },
            { key: 'employerContribution', label: 'ER Share', editable: false, isPermanent: true },
            { key: 'totalContribution', label: 'Total', editable: false, isPermanent: true },
        ],
        rows,
    };
};

export const generatePagibigData = (employees, aggregatedRecords, month, isProvisional) => {
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    const rows = aggregatedRecords.map((record, index) => {
        const emp = employeeMap.get(record.empId);
        if (!emp) return null;

        const contribution = calculatePagibigContribution(record.totalGross, isProvisional);

        return {
            no: index + 1,
            pagibigNo: emp.pagIbigNo || '',
            lastName: emp.lastName || '',
            firstName: emp.firstName || '',
            middleName: emp.middleName || '',
            employeeContribution: contribution.employeeShare,
            employerContribution: contribution.employerShare,
            totalContribution: contribution.total,
        };
    }).filter(Boolean);
    
    return {
        title: 'Pag-IBIG Contribution Report',
        headerData: {
            'Employer Name': MOCK_COMPANY_INFO.employerName,
            'Contribution Month': format(new Date(month), 'MMMM yyyy'),
        },
        columns: [
            { key: 'no', label: 'No.', editable: false, isPermanent: true },
            { key: 'pagibigNo', label: 'Pag-IBIG MID No.', editable: false, isPermanent: true },
            { key: 'lastName', label: 'Last Name', editable: false, isPermanent: true },
            { key: 'firstName', label: 'First Name', editable: false, isPermanent: true },
            { key: 'middleName', label: 'Middle Name', editable: false, isPermanent: true },
            { key: 'employeeContribution', label: 'EE Share', editable: false, isPermanent: true },
            { key: 'employerContribution', label: 'ER Share', editable: false, isPermanent: true },
            { key: 'totalContribution', label: 'Total', editable: false, isPermanent: true },
        ],
        rows,
    };
};

export const generateTinData = (employees, aggregatedRecords, month) => {
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    const rows = aggregatedRecords.map((record, index) => {
        const emp = employeeMap.get(record.empId);
        if (!emp) return null;

        return {
            no: index + 1,
            tinNo: emp.tinNo || '',
            lastName: emp.lastName || '',
            firstName: emp.firstName || '',
            middleName: emp.middleName || '',
            grossCompensation: record.totalGross,
            taxWithheld: record.totalTaxWithheld,
        };
    }).filter(Boolean);
    
    return {
        title: 'Withholding Tax (TIN) Report',
        headerData: {
            'Employer Name': MOCK_COMPANY_INFO.employerName,
            'For the Month of': format(new Date(month), 'MMMM yyyy'),
        },
        columns: [
            { key: 'no', label: 'No.', editable: false, isPermanent: true },
            { key: 'tinNo', label: 'TIN', editable: false, isPermanent: true },
            { key: 'lastName', label: 'Last Name', editable: false, isPermanent: true },
            { key: 'firstName', label: 'First Name', editable: false, isPermanent: true },
            { key: 'middleName', label: 'MI', editable: false, isPermanent: true },
            { key: 'grossCompensation', label: 'Gross Compensation', editable: false, isPermanent: true },
            { key: 'taxWithheld', label: 'Tax Withheld', editable: false, isPermanent: true },
        ],
        rows,
    };
};