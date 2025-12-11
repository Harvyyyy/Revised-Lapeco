import { format } from 'date-fns';

const MOCK_COMPANY_INFO = {
    employerIdSss: '03-9-1234567-8',
    employerName: 'Lapeco Group of Companies',
    address: '123 Innovation Drive, Tech City',
};

/**
 * Evaluate a simple math formula string.
 * Supported vars: salary, gross, basic, semi_gross
 * Supported functions: min, max, abs, round, floor, ceil
 */
const evaluateFormula = (formula, variables) => {
    if (!formula) return 0;
    
    // Replace variables
    let parsed = formula
        .replace(/salary/g, variables.salary)
        .replace(/gross/g, variables.gross)
        .replace(/basic/g, variables.basic)
        .replace(/semi_gross/g, variables.semi_gross);
        
    // Replace functions
    parsed = parsed
        .replace(/min\(/g, 'Math.min(')
        .replace(/max\(/g, 'Math.max(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/round\(/g, 'Math.round(')
        .replace(/floor\(/g, 'Math.floor(')
        .replace(/ceil\(/g, 'Math.ceil(');
        
    try {
        // Safety check: only allow math characters
        if (!/^[\d\s\+\-\*\/\(\)\.\,Math\>\<\=\?:]+$/.test(parsed)) {
            console.error('Unsafe formula characters detected:', parsed);
            return 0;
        }
        return new Function('return ' + parsed)();
    } catch (e) {
        console.error('Formula evaluation failed:', e);
        return 0;
    }
};

/**
 * Generic Statutory Deduction Calculator
 * Uses the provided rule object to calculate deductions.
 */
export const calculateDeductionFromRule = (salary, rule, isProvisional = false) => {
    if (!rule) return { employeeShare: 0, employerShare: 0, total: 0, breakdown: [] };

    const monthlyEquivalent = isProvisional ? salary * 2 : salary;
    const context = {
        salary: monthlyEquivalent,
        gross: monthlyEquivalent,
        basic: monthlyEquivalent,
        semi_gross: salary, // Actual semi-monthly pay
    };

    let employeeShare = 0;
    let employerShare = 0;
    let breakdown = [];

    // 1. Fixed Percentage
    if (rule.rule_type === 'fixed_percentage') {
        breakdown.push({ type: 'header', label: 'Rule Type', value: 'Fixed Percentage' });
        breakdown.push({ type: 'info', label: 'Basis', value: `${isProvisional ? 'Semi-Monthly Gross x 2' : 'Gross Income'} = ${monthlyEquivalent.toLocaleString()}` });

        if (rule.minimum_salary && monthlyEquivalent < rule.minimum_salary) {
            breakdown.push({ type: 'warning', label: 'Below Minimum Salary', value: `${rule.minimum_salary}. Deduction: 0` });
            return { employeeShare: 0, employerShare: 0, total: 0, breakdown };
        }

        let applicableSalary = monthlyEquivalent;
        if (rule.maximum_salary && monthlyEquivalent > rule.maximum_salary) {
            applicableSalary = rule.maximum_salary;
            breakdown.push({ type: 'warning', label: 'Capped at Maximum Salary', value: rule.maximum_salary.toLocaleString() });
        }

        // Employee Share
        if (rule.employee_rate !== undefined && rule.employee_rate !== null) {
            employeeShare = (applicableSalary * (rule.employee_rate / 100));
            breakdown.push({ type: 'calculation', label: 'Monthly Employee Share', value: `${applicableSalary.toLocaleString()} * ${rule.employee_rate}% = ${employeeShare.toLocaleString()}` });
        } else {
            employeeShare = (applicableSalary * (rule.fixed_percentage / 100));
            breakdown.push({ type: 'calculation', label: 'Monthly Employee Share', value: `${applicableSalary.toLocaleString()} * ${rule.fixed_percentage}% = ${employeeShare.toLocaleString()}` });
        }

        if (isProvisional) {
            breakdown.push({ type: 'result', label: 'Semi-Monthly Share', value: `${employeeShare.toLocaleString()} / 2 = ${(employeeShare / 2).toLocaleString()}` });
        }

        // Employer Share
        if (rule.employer_rate !== undefined && rule.employer_rate !== null) {
            employerShare = (applicableSalary * (rule.employer_rate / 100));
            // breakdown.push({ type: 'calculation', label: 'Employer Share', value: `${applicableSalary.toLocaleString()} * ${rule.employer_rate}% = ${employerShare.toLocaleString()}` });
        } else {
            // Default behavior if employer rate is missing
            employerShare = 0;
        }
    }

    // 2. Salary Bracket
    else if (rule.rule_type === 'salary_bracket' && rule.brackets) {
        breakdown.push({ type: 'header', label: 'Rule Type', value: 'Salary Bracket' });
        breakdown.push({ type: 'info', label: 'Basis', value: `${isProvisional ? 'Semi-Monthly Gross x 2' : 'Gross Income'} = ${monthlyEquivalent.toLocaleString()}` });

        if (rule.minimum_salary && monthlyEquivalent < rule.minimum_salary) {
            breakdown.push({ type: 'warning', label: 'Below Minimum Salary', value: `${rule.minimum_salary}. Deduction: 0` });
            return { employeeShare: 0, employerShare: 0, total: 0, breakdown };
        }

        const brackets = [...rule.brackets].sort((a, b) => a.sort_order - b.sort_order);
        
        for (const bracket of brackets) {
            const from = parseFloat(bracket.salary_from);
            const to = bracket.salary_to ? parseFloat(bracket.salary_to) : Infinity;

            if (monthlyEquivalent >= from && monthlyEquivalent <= to) {
                breakdown.push({ type: 'info', label: 'Bracket Found', value: `${from.toLocaleString()} - ${to === Infinity ? 'Unlimited' : to.toLocaleString()}` });

                // Determine base for calculation (Salary or MSC/Regular SS)
                let calculationBase = monthlyEquivalent;
                
                // If regular_ss (MSC) is defined in the bracket AND it is not Tax, use it as the base
                // For Tax, we always use the actual taxable income (monthlyEquivalent)
                if (rule.deduction_type !== 'Tax' && bracket.regular_ss && parseFloat(bracket.regular_ss) > 0) {
                    calculationBase = parseFloat(bracket.regular_ss);
                    breakdown.push({ type: 'info', label: 'Using Regular SS (MSC) as Base', value: calculationBase.toLocaleString() });
                } else if (rule.deduction_type !== 'Tax' && rule.maximum_salary && calculationBase > rule.maximum_salary) {
                    // Fallback to max salary cap if no MSC is defined (and not Tax)
                    calculationBase = rule.maximum_salary;
                    breakdown.push({ type: 'warning', label: 'Capped at Maximum Salary', value: calculationBase.toLocaleString() });
                }

                // Employee Share
                // For Tax, we calculate based on the excess over the lower bracket limit
                if (rule.deduction_type === 'Tax') {
                    // Standard Tax Formula: Base Tax + ((Income - Lower Limit) * Rate)
                    // If user cleared fixed_amount, Base Tax is 0.
                    const baseTax = bracket.fixed_amount ? parseFloat(bracket.fixed_amount) : 0;
                    const excess = Math.max(0, calculationBase - from);
                    const taxOnExcess = excess * (bracket.employee_rate / 100);
                    
                    employeeShare = baseTax + taxOnExcess;
                    
                    if (baseTax > 0) {
                        breakdown.push({ type: 'formula', label: 'Formula', value: 'Fixed Tax + ((Income - Lower Limit) * Rate)' });
                        breakdown.push({ type: 'info', label: 'Fixed Tax', value: baseTax.toLocaleString() });
                    } else {
                        breakdown.push({ type: 'formula', label: 'Formula', value: '(Income - Lower Limit) * Rate' });
                    }
                    
                    breakdown.push({ type: 'calculation', label: 'Excess', value: `${calculationBase.toLocaleString()} - ${from.toLocaleString()} (Lower Limit) = ${excess.toLocaleString()}` });
            breakdown.push({ type: 'calculation', label: 'Tax on Excess', value: `${excess.toLocaleString()} * ${bracket.employee_rate}% = ${taxOnExcess.toLocaleString()}` });
            breakdown.push({ type: 'result', label: 'Total Monthly Tax', value: employeeShare.toLocaleString() });
            
            if (isProvisional) {
                breakdown.push({ type: 'result', label: 'Semi-Monthly Tax', value: `${employeeShare.toLocaleString()} / 2 = ${(employeeShare / 2).toLocaleString()}` });
            }
        } else if (bracket.fixed_amount > 0) {
                    employeeShare = parseFloat(bracket.fixed_amount);
                    breakdown.push({ type: 'info', label: 'Monthly Employee Share', value: `Fixed Amount = ${employeeShare.toLocaleString()}` });
                    if (isProvisional) {
                        breakdown.push({ type: 'result', label: 'Semi-Monthly Share', value: `${employeeShare.toLocaleString()} / 2 = ${(employeeShare / 2).toLocaleString()}` });
                    }
                } else {
                    employeeShare = calculationBase * (bracket.employee_rate / 100);
                    breakdown.push({ type: 'calculation', label: 'Monthly Employee Share', value: `${calculationBase.toLocaleString()} * ${bracket.employee_rate}% = ${employeeShare.toLocaleString()}` });
                    if (isProvisional) {
                        breakdown.push({ type: 'result', label: 'Semi-Monthly Share', value: `${employeeShare.toLocaleString()} / 2 = ${(employeeShare / 2).toLocaleString()}` });
                    }
                }

                // Employer Share
                if (rule.deduction_type !== 'Tax') {
                    if (bracket.fixed_employer_amount > 0) {
                        employerShare = parseFloat(bracket.fixed_employer_amount);
                        // breakdown.push({ type: 'result', label: 'Employer Share', value: `Fixed Amount = ${employerShare.toLocaleString()}` });
                    } else {
                        employerShare = calculationBase * (bracket.employer_rate / 100);
                        // breakdown.push({ type: 'calculation', label: 'Employer Share', value: `${calculationBase.toLocaleString()} * ${bracket.employer_rate}% = ${employerShare.toLocaleString()}` });
                    }
                }
                break; 
            }
        }
    }

    // 3. Custom Formula
    else if (rule.rule_type === 'custom_formula' && rule.formula) {
        breakdown.push({ type: 'header', label: 'Rule Type', value: 'Custom Formula' });
        let formulaObj = rule.formula;
        
        // Parse JSON string if needed
        if (typeof formulaObj === 'string') {
            try {
                formulaObj = JSON.parse(formulaObj);
            } catch (e) {
                console.error('Failed to parse formula JSON:', e);
                return { employeeShare: 0, employerShare: 0, total: 0, breakdown: [{ type: 'error', label: 'Error', value: 'Invalid Formula JSON' }] };
            }
        }

        if (formulaObj.employee_formula) {
            employeeShare = evaluateFormula(formulaObj.employee_formula, context);
            breakdown.push({ type: 'formula', label: 'Formula (Employee)', value: formulaObj.employee_formula });
            breakdown.push({ type: 'result', label: 'Monthly Employee Share', value: employeeShare.toLocaleString() });

            if (isProvisional) {
                breakdown.push({ type: 'result', label: 'Semi-Monthly Share', value: `${employeeShare.toLocaleString()} / 2 = ${(employeeShare / 2).toLocaleString()}` });
            }
        }
        if (formulaObj.employer_formula) {
            employerShare = evaluateFormula(formulaObj.employer_formula, context);
            // breakdown.push({ type: 'formula', label: 'Formula (Employer)', value: formulaObj.employer_formula });
        }
    }

    // Final Adjustments
    const divisor = isProvisional ? 2 : 1;
    
    // Special handling for Tax (it's usually calculated on the actual semi-monthly income, not monthly equivalent)
    // If the rule is for Tax, we might need to respect that.
    // However, standard statutory rules (SSS/PH/HDMF) are monthly based.
    // If this is Tax, and the rule type is 'salary_bracket' (Tax Table), 
    // we might need to pass 'semi_gross' as the testing value if the brackets are semi-monthly.
    // BUT, the system assumes rules are stored as Monthly or Annual usually.
    // For now, assuming standard monthly calculation divided by 2 for semi-monthly payroll.
    
    return {
        employeeShare: parseFloat((employeeShare / divisor).toFixed(2)),
        employerShare: parseFloat((employerShare / divisor).toFixed(2)),
        total: parseFloat(((employeeShare + employerShare) / divisor).toFixed(2)),
        breakdown,
    };
};

export const generateSssData = (employees, aggregatedRecords, month, isProvisional, activeRules = []) => {
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const sssRule = activeRules.find(r => r.deduction_type === 'SSS');

    const rows = aggregatedRecords.map((record, index) => {
        const emp = employeeMap.get(record.empId);
        if (!emp) return null;
        
        const contribution = calculateDeductionFromRule(record.totalGross, sssRule, isProvisional);

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

export const generatePhilhealthData = (employees, aggregatedRecords, month, isProvisional, activeRules = []) => {
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const philHealthRule = activeRules.find(r => r.deduction_type === 'PhilHealth');
    
    const rows = aggregatedRecords.map((record, index) => {
        const emp = employeeMap.get(record.empId);
        if (!emp) return null;

        const contribution = calculateDeductionFromRule(record.totalGross, philHealthRule, isProvisional);
        
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

export const generatePagibigData = (employees, aggregatedRecords, month, isProvisional, activeRules = []) => {
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const pagIbigRule = activeRules.find(r => r.deduction_type === 'Pag-IBIG');
    
    const rows = aggregatedRecords.map((record, index) => {
        const emp = employeeMap.get(record.empId);
        if (!emp) return null;

        const contribution = calculateDeductionFromRule(record.totalGross, pagIbigRule, isProvisional);

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
            { key: 'pagibigNo', label: 'Pag-IBIG Number', editable: false, isPermanent: true },
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
