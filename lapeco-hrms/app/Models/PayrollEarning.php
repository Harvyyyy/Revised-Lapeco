<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollEarning extends Model
{
    use HasFactory;

    protected $fillable = [
        'employees_payroll_id',
        'earning_type',
        'earning_hours',
        'earning_pay',
    ];

    protected $casts = [
        'earning_hours' => 'decimal:2',
        'earning_pay' => 'decimal:2',
    ];

    public function employeePayroll()
    {
        return $this->belongsTo(EmployeePayroll::class, 'employees_payroll_id');
    }
}
