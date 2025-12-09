<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayrollPeriod;
use App\Models\EmployeePayroll;
use App\Models\PayrollEarning;
use App\Models\PayrollDeduction;
use App\Models\PayrollStatutoryRequirement;
use App\Models\User;
use App\Models\Resignation;
use App\Services\StatutoryDeductionService;
use Carbon\Carbon;

class PayrollSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $service = new StatutoryDeductionService();

        // Generate payroll periods for the last three years (two periods per month)
        $periods = collect();
        for ($monthOffset = 0; $monthOffset < 36; $monthOffset++) {
            $baseDate = $now->copy()->subMonths($monthOffset)->startOfMonth();
            $periodYear = (int) $baseDate->year;

            $firstStart = $baseDate->copy()->toDateString();
            $firstEnd = $baseDate->copy()->addDays(14)->toDateString();
            $secondStart = $baseDate->copy()->addDays(15)->toDateString();
            $secondEnd = $baseDate->copy()->endOfMonth()->toDateString();

            $periods->push(
                PayrollPeriod::firstOrCreate(
                    ['period_start' => $firstStart, 'period_end' => $firstEnd],
                    ['period_year' => $periodYear]
                )
            );

            $periods->push(
                PayrollPeriod::firstOrCreate(
                    ['period_start' => $secondStart, 'period_end' => $secondEnd],
                    ['period_year' => $periodYear]
                )
            );
        }

        // Target employees with approved resignations effective today or earlier
        $resignedIds = Resignation::where('status', 'approved')
            ->whereDate('effective_date', '<=', Carbon::today())
            ->pluck('employee_id')
            ->unique()
            ->values();

        $targetEmployees = User::whereIn('id', $resignedIds)->get();
        if ($targetEmployees->isEmpty()) {
            // Fallback: seed a small sample of active employees
            $targetEmployees = User::where('account_status', 'Active')
                ->whereIn('employment_status', ['active', null])
                ->limit(10)
                ->get();
        }

        foreach ($periods as $period) {
            foreach ($targetEmployees as $employee) {
                $position = $employee->position;
                // Basic gross estimate: half-month of salary or 10 work days * base rate * 8 hours
                $baseRate = (float) ($position?->base_rate_per_hour ?? 0);
                $monthlySalary = (float) ($position?->monthly_salary ?? 0);
                $estimatedGross = $monthlySalary > 0
                    ? round($monthlySalary / 2, 2)
                    : round($baseRate * 8 * 10, 2);

                $statusOptions = ['Paid', 'Pending'];
                $paidStatus = $statusOptions[array_rand($statusOptions)];

                $payDate = Carbon::parse($period->period_end)->addDays(rand(0, 5));

                $payroll = EmployeePayroll::create([
                    'period_id' => $period->id,
                    'employee_id' => $employee->id,
                    'paid_status' => $paidStatus,
                    'pay_date' => $paidStatus === 'Paid' ? $payDate : null,
                    'gross_earning' => $estimatedGross,
                    'total_deductions' => 0, // will update after creating deductions
                    'absences_summary' => [],
                    'leave_balances_summary' => [],
                    'leave_earnings_summary' => [],
                ]);

                // Create a simple earning line
                $regularHours = $monthlySalary > 0 ? 0 : 80; // 10 days * 8 hours if hourly
                PayrollEarning::create([
                    'employees_payroll_id' => $payroll->id,
                    'earning_type' => $monthlySalary > 0 ? 'Regular Salary (Half-Month)' : 'Regular Hours',
                    'earning_hours' => $regularHours,
                    'earning_pay' => $estimatedGross,
                ]);

                $monthlyEquivalent = $monthlySalary > 0 ? $monthlySalary : ($baseRate * 22 * 8);
                
                // Calculate Statutory Deductions using Service
                // SSS (Monthly -> Split)
                try {
                    $sssResult = $service->calculateDeduction('SSS', $monthlyEquivalent);
                    $sssSemi = $sssResult['employeeShare'] / 2;
                    $sssEmployer = $sssResult['employerShare'] / 2;
                } catch (\Exception $e) {
                    $sssSemi = 0.0;
                    $sssEmployer = 0.0;
                }

                // PhilHealth (Monthly -> Split)
                try {
                    $philResult = $service->calculateDeduction('PhilHealth', $monthlyEquivalent);
                    $philSemi = $philResult['employeeShare'] / 2;
                    $philEmployer = $philResult['employerShare'] / 2;
                } catch (\Exception $e) {
                    $philSemi = 0.0;
                    $philEmployer = 0.0;
                }

                // Pag-IBIG (Monthly -> Split)
                try {
                    $pagResult = $service->calculateDeduction('Pag-IBIG', $monthlyEquivalent);
                    $pagibigSemi = $pagResult['employeeShare'] / 2;
                    $pagEmployer = $pagResult['employerShare'] / 2;
                } catch (\Exception $e) {
                    $pagibigSemi = 0.0;
                    $pagEmployer = 0.0;
                }

                // Tax (Semi-Monthly Taxable Income)
                $taxableSemi = max(0, $estimatedGross - ($sssSemi + $philSemi + $pagibigSemi));
                try {
                    $taxResult = $service->calculateDeduction('Tax', $taxableSemi);
                    $taxSemi = $taxResult['employeeShare'];
                    $taxEmployer = $taxResult['employerShare'];
                } catch (\Exception $e) {
                    $taxSemi = 0.0;
                    $taxEmployer = 0.0;
                }

                $statutory = [
                    'SSS' => ['ee' => round($sssSemi, 2), 'er' => round($sssEmployer, 2)],
                    'PhilHealth' => ['ee' => round($philSemi, 2), 'er' => round($philEmployer, 2)],
                    'Pag-IBIG' => ['ee' => round($pagibigSemi, 2), 'er' => round($pagEmployer, 2)],
                    'Tax' => ['ee' => round(max(0, $taxSemi), 2), 'er' => round($taxEmployer, 2)],
                ];
                $totalStatutory = 0;
                foreach ($statutory as $type => $amounts) {
                    PayrollStatutoryRequirement::create([
                        'employees_payroll_id' => $payroll->id,
                        'requirement_type' => $type,
                        'requirement_amount' => $amounts['ee'],
                        'employer_amount' => $amounts['er'],
                    ]);
                    $totalStatutory += $amounts['ee'];
                }

                // Other deductions
                $otherDeductions = [
                    ['type' => 'Late', 'amount' => 150.00],
                    ['type' => 'Uniform', 'amount' => 0.00],
                ];
                $totalOther = 0;
                foreach ($otherDeductions as $d) {
                    if ($d['amount'] > 0) {
                        PayrollDeduction::create([
                            'employees_payroll_id' => $payroll->id,
                            'deduction_type' => $d['type'],
                            'deduction_pay' => $d['amount'],
                        ]);
                        $totalOther += $d['amount'];
                    }
                }

                // Update totals on payroll
                $payroll->total_deductions = round($totalStatutory + $totalOther, 2);
                $payroll->save();
            }
        }

        $this->command?->info('Payroll periods and records seeded for final pay display.');
    }
}