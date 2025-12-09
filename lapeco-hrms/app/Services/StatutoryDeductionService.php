<?php

namespace App\Services;

use App\Models\StatutoryDeductionRule;
use App\Models\StatutoryDeductionAuditLog;
use App\Support\SafeMathEvaluator;
use Exception;

class StatutoryDeductionService
{
    /**
     * Calculate statutory deduction based on dynamic rules.
     *
     * @param string $deductionType The type of deduction (SSS, PhilHealth, Pag-IBIG, Tax)
     * @param float $salary The salary to calculate deduction from
     * @param array $context Additional context variables (gross, basic, semi_gross, etc.)
     * @return array ['employeeShare' => float, 'employerShare' => float, 'total' => float]
     * @throws Exception If rule not found or calculation fails
     */
    public function calculateDeduction(string $deductionType, float $salary, array $context = []): array
    {
        $rule = StatutoryDeductionRule::getByType($deductionType);

        if (!$rule) {
            throw new Exception("No active deduction rule found for type: {$deductionType}");
        }

        // Prepare context variables
        $variables = array_merge([
            'salary' => $salary,
            'gross' => $salary,
            'basic' => $salary,
            'semi_gross' => $salary,
        ], $context);

        return match ($rule->rule_type) {
            'fixed_percentage' => $this->calculateFixedPercentage($rule, $salary, $variables),
            'salary_bracket' => $this->calculateSalaryBracket($rule, $salary, $variables),
            'custom_formula' => $this->calculateCustomFormula($rule, $salary, $variables),
            default => throw new Exception("Unknown rule type: {$rule->rule_type}"),
        };
    }

    /**
     * Calculate deduction using fixed percentage rule.
     */
    private function calculateFixedPercentage(StatutoryDeductionRule $rule, float $salary, array $variables): array
    {
        $percentage = (float) $rule->fixed_percentage;

        // Apply minimum salary threshold if set
        if ($rule->minimum_salary && $salary < (float) $rule->minimum_salary) {
            return ['employeeShare' => 0.0, 'employerShare' => 0.0, 'total' => 0.0];
        }

        // Apply maximum salary threshold if set
        $applicableSalary = $salary;
        if ($rule->maximum_salary && $salary > (float) $rule->maximum_salary) {
            $applicableSalary = (float) $rule->maximum_salary;
        }

        $employeeShare = round($applicableSalary * ($percentage / 100), 2);
        $employerShare = 0.0;

        return [
            'employeeShare' => $employeeShare,
            'employerShare' => $employerShare,
            'total' => $employeeShare,
        ];
    }

    /**
     * Calculate deduction using salary bracket rule.
     */
    private function calculateSalaryBracket(StatutoryDeductionRule $rule, float $salary, array $variables): array
    {
        // Apply minimum salary threshold if set
        if ($rule->minimum_salary && $salary < (float) $rule->minimum_salary) {
            return ['employeeShare' => 0.0, 'employerShare' => 0.0, 'total' => 0.0];
        }

        $brackets = $rule->brackets()->orderBy('sort_order')->get();

        if ($brackets->isEmpty()) {
            throw new Exception("No brackets defined for rule: {$rule->deduction_type}");
        }

        $employeeShare = 0.0;
        $employerShare = 0.0;

        foreach ($brackets as $bracket) {
            if (!$bracket->containsSalary($salary)) {
                continue;
            }

            // Determine calculation base (Salary or MSC/Regular SS)
            $calculationBase = $salary;

            // If regular_ss (MSC) is defined in the bracket, use it as the base
            if ($bracket->regular_ss && (float) $bracket->regular_ss > 0) {
                $calculationBase = (float) $bracket->regular_ss;
            } elseif ($rule->maximum_salary && $calculationBase > (float) $rule->maximum_salary) {
                // Fallback to max salary cap if no MSC is defined
                $calculationBase = (float) $rule->maximum_salary;
            }

            // If fixed amount is set, use that
            if ($bracket->fixed_amount) {
                $employeeShare = (float) $bracket->fixed_amount;
            } else {
                $employeeShare = round($calculationBase * ((float) $bracket->employee_rate / 100), 2);
            }

            if ($bracket->fixed_employer_amount) {
                $employerShare = (float) $bracket->fixed_employer_amount;
            } elseif ($bracket->employer_rate) {
                $employerShare = round($calculationBase * ((float) $bracket->employer_rate / 100), 2);
            }

            break;
        }

        return [
            'employeeShare' => $employeeShare,
            'employerShare' => $employerShare,
            'total' => $employeeShare + $employerShare,
        ];
    }

    /**
     * Calculate deduction using custom formula.
     */
    private function calculateCustomFormula(StatutoryDeductionRule $rule, float $salary, array $variables): array
    {
        if (!$rule->formula) {
            throw new Exception("No formula defined for rule: {$rule->deduction_type}");
        }

        $formula = json_decode($rule->formula, true);

        if (!is_array($formula)) {
            throw new Exception("Invalid formula format for rule: {$rule->deduction_type}");
        }

        $employeeShare = 0.0;
        $employerShare = 0.0;

        // Evaluate employee share formula
        if (isset($formula['employee_formula'])) {
            try {
                $employeeShare = round(SafeMathEvaluator::evaluate($formula['employee_formula'], $variables), 2);
            } catch (Exception $e) {
                throw new Exception("Failed to evaluate employee formula: " . $e->getMessage());
            }
        }

        // Evaluate employer share formula if present
        if (isset($formula['employer_formula'])) {
            try {
                $employerShare = round(SafeMathEvaluator::evaluate($formula['employer_formula'], $variables), 2);
            } catch (Exception $e) {
                throw new Exception("Failed to evaluate employer formula: " . $e->getMessage());
            }
        }

        return [
            'employeeShare' => max(0, $employeeShare),
            'employerShare' => max(0, $employerShare),
            'total' => max(0, $employeeShare + $employerShare),
        ];
    }

    /**
     * Calculate all statutory deductions for an employee.
     */
    public function calculateAllDeductions(float $salary, array $context = []): array
    {
        $activeRules = StatutoryDeductionRule::active()->get();
        $results = [];

        foreach ($activeRules as $rule) {
            $type = $rule->deduction_type;
            try {
                // Use the rule object directly to avoid fetching it again
                // But calculateDeduction expects a type string and refetches.
                // For efficiency, we should refactor calculateDeduction to accept a rule object,
                // or just call the internal methods directly.
                // However, to keep it simple and consistent with existing public API:
                $results[$type] = $this->calculateDeduction($type, $salary, $context);
            } catch (Exception $e) {
                // Log but don't fail - return zero deduction
                $results[$type] = ['employeeShare' => 0.0, 'employerShare' => 0.0, 'total' => 0.0];
            }
        }

        // Ensure standard keys exist even if no rule is active (for frontend compatibility if needed)
        // But truly dynamic systems shouldn't enforce this.
        // Given the frontend expects 'SSS', 'PhilHealth', etc., we might want to ensure they are zero if missing.
        $standardTypes = ['SSS', 'PhilHealth', 'Pag-IBIG', 'Tax'];
        foreach ($standardTypes as $type) {
            if (!isset($results[$type])) {
                $results[$type] = ['employeeShare' => 0.0, 'employerShare' => 0.0, 'total' => 0.0];
            }
        }

        return $results;
    }

    /**
     * Get all active deduction rules.
     */
    public function getAllActiveRules()
    {
        return StatutoryDeductionRule::active()->with('brackets')->get();
    }

    /**
     * Create or update a deduction rule.
     */
    public function saveRule(array $data, ?int $ruleId = null): StatutoryDeductionRule
    {
        $rule = $ruleId 
            ? StatutoryDeductionRule::with('brackets')->findOrFail($ruleId) 
            : new StatutoryDeductionRule();

        // Capture original state for logging
        $originalAttributes = $ruleId ? $rule->getAttributes() : [];
        
        $originalBrackets = $ruleId ? $rule->brackets->map(function ($bracket) {
            return $bracket->only([
                'salary_from', 'salary_to', 'regular_ss', 'employee_rate', 'employer_rate', 
                'fixed_amount', 'fixed_employer_amount', 'sort_order'
            ]);
        })->toArray() : [];

        $rule->fill($data);
        $rule->save();

        $bracketsChanged = false;
        $newBrackets = [];

        // Handle brackets if provided in data
        if (isset($data['brackets'])) {
            // Delete existing brackets
            $rule->brackets()->delete();
            
            // Create new brackets
            foreach ($data['brackets'] as $index => $bracketData) {
                // Ensure sort_order is set
                $bracketData['sort_order'] = $bracketData['sort_order'] ?? $index;
                $rule->brackets()->create($bracketData);
                
                // Clean data for comparison/logging
                $newBrackets[] = array_intersect_key($bracketData, array_flip([
                    'salary_from', 'salary_to', 'regular_ss', 'employee_rate', 'employer_rate', 
                    'fixed_amount', 'fixed_employer_amount', 'sort_order'
                ]));
            }
            $bracketsChanged = true;
        }

        // Calculate changes
        $changes = [];
        
        // Rule attribute changes
        if ($ruleId) {
            // Get changes from the last save
            $dirty = $rule->getChanges();
            $attributeChanges = [];
            
            foreach ($dirty as $key => $newValue) {
                // Skip updated_at timestamp
                if ($key === 'updated_at') continue;
                
                $attributeChanges[$key] = [
                    'old' => $originalAttributes[$key] ?? null,
                    'new' => $newValue
                ];
            }
            
            if (!empty($attributeChanges)) {
                $changes['attributes'] = $attributeChanges;
            }
        } else {
            $changes['attributes'] = $rule->getAttributes();
        }

        // Bracket changes
        if ($bracketsChanged) {
            // Compare serialized arrays to check for actual changes
            // We only log brackets if they actually changed or if it's a new rule
            if (!$ruleId || json_encode($originalBrackets) !== json_encode($newBrackets)) {
                $changes['brackets'] = [
                    'old' => $originalBrackets,
                    'new' => $newBrackets
                ];
            }
        }

        // Log the change if anything changed
        if (!empty($changes)) {
            $action = $ruleId ? 'updated' : 'created';
            
            StatutoryDeductionAuditLog::create([
                'rule_id' => $rule->id,
                'action' => $action,
                'changes' => $changes,
                'user_id' => optional(auth()->guard()->user())->id,
            ]);
        }

        return $rule;
    }

    /**
     * Delete a deduction rule.
     */
    public function deleteRule(int $ruleId): bool
    {
        $rule = StatutoryDeductionRule::with('brackets')->findOrFail($ruleId);

        StatutoryDeductionAuditLog::create([
            'rule_id' => $rule->id,
            'action' => 'deleted',
            'changes' => $rule->toArray(), // This will now include brackets
            'user_id' => optional(auth()->guard()->user())->id,
        ]);

        return (bool) $rule->delete();
    }
}
