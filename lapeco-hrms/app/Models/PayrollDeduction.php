<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'employees_payroll_id',
        'deduction_type',
        'deduction_pay',
    ];

    protected $casts = [
        'deduction_pay' => 'decimal:2',
    ];

    public function employeePayroll()
    {
        return $this->belongsTo(EmployeePayroll::class, 'employees_payroll_id');
    }
}
