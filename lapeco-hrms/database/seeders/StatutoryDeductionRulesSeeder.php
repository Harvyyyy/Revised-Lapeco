<?php

namespace Database\Seeders;

use App\Models\StatutoryDeductionRule;
use App\Models\StatutoryDeductionBracket;
use Illuminate\Database\Seeder;

class StatutoryDeductionRulesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // SSS Rule - Salary Bracket (2025 Table)
        $sssRule = StatutoryDeductionRule::updateOrCreate(
            ['deduction_type' => 'SSS'],
            [
                'rule_name' => 'SSS 2025',
                'rule_type' => 'salary_bracket',
                'minimum_salary' => 5000,
                'maximum_salary' => 35000,
                'is_active' => true,
                'is_default' => true,
                'description' => 'SSS contribution based on 2025 table (5% Employee, 10% Employer, Min MSC 5k, Max MSC 35k)',
            ]
        );

        // SSS Brackets Generation
        StatutoryDeductionBracket::where('rule_id', $sssRule->id)->delete();
        
        $sortOrder = 1;
        
        // First bracket: Below 5,250 -> MSC 5,000
        // EC: 10.00 (since 5,000 < 15,000)
        StatutoryDeductionBracket::create([
            'rule_id' => $sssRule->id,
            'salary_from' => 0,
            'salary_to' => 5249.99,
            'fixed_amount' => 5000 * 0.05, // 250
            'fixed_employer_amount' => (5000 * 0.10) + 10.00, // 500 + 10 = 510
            'employee_rate' => 0,
            'employer_rate' => 0,
            'sort_order' => $sortOrder++,
        ]);

        // Middle brackets: 5,250 to 34,750
        $currentMSC = 5500;
        $startSalary = 5250;
        
        while ($currentMSC < 35000) {
            $endSalary = $startSalary + 499.99;
            $ec = $currentMSC >= 15000 ? 30.00 : 10.00;
            
            StatutoryDeductionBracket::create([
                'rule_id' => $sssRule->id,
                'salary_from' => $startSalary,
                'salary_to' => $endSalary,
                'fixed_amount' => $currentMSC * 0.05,
                'fixed_employer_amount' => ($currentMSC * 0.10) + $ec,
                'employee_rate' => 0,
                'employer_rate' => 0,
                'sort_order' => $sortOrder++,
            ]);
            $startSalary += 500;
            $currentMSC += 500;
        }

        // Last bracket: 34,750 and above -> MSC 35,000
        // EC: 30.00 (since 35,000 >= 15,000)
        StatutoryDeductionBracket::create([
            'rule_id' => $sssRule->id,
            'salary_from' => 34750,
            'salary_to' => null,
            'fixed_amount' => 35000 * 0.05, // 1750
            'fixed_employer_amount' => (35000 * 0.10) + 30.00, // 3500 + 30 = 3530
            'employee_rate' => 0,
            'employer_rate' => 0,
            'sort_order' => $sortOrder++,
        ]);

        // PhilHealth Rule - Custom Formula
        $philhealthRule = StatutoryDeductionRule::updateOrCreate(
            ['deduction_type' => 'PhilHealth'],
            [
                'rule_name' => 'PhilHealth 2025',
                'rule_type' => 'custom_formula',
                'is_active' => true,
                'is_default' => true,
                'description' => 'PhilHealth contribution at 5% (split 50/50), Min Salary 10k, Max Salary 100k',
                'formula' => json_encode([
                    'employee_formula' => 'min(max(salary, 10000), 100000) * 0.025',
                    'employer_formula' => 'min(max(salary, 10000), 100000) * 0.025'
                ]),
                'minimum_salary' => 10000,
                'maximum_salary' => 100000,
            ]
        );
        // Clear brackets if any existed
        StatutoryDeductionBracket::where('rule_id', $philhealthRule->id)->delete();

        // Pag-IBIG Rule - Mixed Brackets
        $pagibigRule = StatutoryDeductionRule::updateOrCreate(
            ['deduction_type' => 'Pag-IBIG'],
            [
                'rule_name' => 'Pag-IBIG 2025',
                'rule_type' => 'salary_bracket',
                'minimum_salary' => 0,
                'is_active' => true,
                'is_default' => true,
                'description' => 'Pag-IBIG contribution (1%/2% <= 1500, 2%/2% > 1500, Max 200)',
            ]
        );

        // Pag-IBIG Brackets
        StatutoryDeductionBracket::where('rule_id', $pagibigRule->id)->delete();
        
        // Bracket 1: 0 - 1,500: EE 1%, ER 2%
        StatutoryDeductionBracket::create([
            'rule_id' => $pagibigRule->id,
            'salary_from' => 0,
            'salary_to' => 1500,
            'employee_rate' => 1.0,
            'employer_rate' => 2.0,
            'sort_order' => 1,
        ]);

        // Bracket 2: 1,500.01 - 10,000: EE 2%, ER 2%
        StatutoryDeductionBracket::create([
            'rule_id' => $pagibigRule->id,
            'salary_from' => 1500.01,
            'salary_to' => 10000,
            'employee_rate' => 2.0,
            'employer_rate' => 2.0,
            'sort_order' => 2,
        ]);

        // Bracket 3: 10,000.01+: Fixed 200 EE, 200 ER
        StatutoryDeductionBracket::create([
            'rule_id' => $pagibigRule->id,
            'salary_from' => 10000.01,
            'salary_to' => null,
            'fixed_amount' => 200,
            'fixed_employer_amount' => 200,
            'employee_rate' => 0,
            'employer_rate' => 0,
            'sort_order' => 3,
        ]);

        // Tax Rule - Custom Formula with Brackets
        $taxRule = StatutoryDeductionRule::updateOrCreate(
            ['deduction_type' => 'Tax'],
            [
                'rule_name' => 'Tax Standard',
                'rule_type' => 'salary_bracket',
                'is_active' => true,
                'is_default' => true,
                'description' => 'Withholding tax based on taxable income brackets',
            ]
        );

        // Tax Brackets (Philippine tax brackets for semi-monthly)
        StatutoryDeductionBracket::where('rule_id', $taxRule->id)->delete();
        
        // 0 - 10,416.67: 0%
        StatutoryDeductionBracket::create([
            'rule_id' => $taxRule->id,
            'salary_from' => 0,
            'salary_to' => 10416.67,
            'employee_rate' => 0,
            'sort_order' => 1,
        ]);

        // 10,416.68 - 16,666.67: 15% on excess
        StatutoryDeductionBracket::create([
            'rule_id' => $taxRule->id,
            'salary_from' => 10416.68,
            'salary_to' => 16666.67,
            'employee_rate' => 15,
            'sort_order' => 2,
        ]);

        // 16,666.68 - 33,332.50: 937.50 + 20% on excess
        StatutoryDeductionBracket::create([
            'rule_id' => $taxRule->id,
            'salary_from' => 16666.68,
            'salary_to' => 33332.50,
            'employee_rate' => 20,
            'fixed_amount' => 937.50,
            'sort_order' => 3,
        ]);

        // 33,332.51 - 83,332.50: 4,270.70 + 25% on excess
        StatutoryDeductionBracket::create([
            'rule_id' => $taxRule->id,
            'salary_from' => 33332.51,
            'salary_to' => 83332.50,
            'employee_rate' => 25,
            'fixed_amount' => 4270.70,
            'sort_order' => 4,
        ]);

        // 83,332.51 - 333,332.50: 16,770.70 + 30% on excess
        StatutoryDeductionBracket::create([
            'rule_id' => $taxRule->id,
            'salary_from' => 83332.51,
            'salary_to' => 333332.50,
            'employee_rate' => 30,
            'fixed_amount' => 16770.70,
            'sort_order' => 5,
        ]);

        // 333,332.51+: 91,770.70 + 35% on excess
        StatutoryDeductionBracket::create([
            'rule_id' => $taxRule->id,
            'salary_from' => 333332.51,
            'salary_to' => null,
            'employee_rate' => 35,
            'fixed_amount' => 91770.70,
            'sort_order' => 6,
        ]);
    }
}
