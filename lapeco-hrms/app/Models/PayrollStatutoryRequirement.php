<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollStatutoryRequirement extends Model
{
    use HasFactory;

    protected $fillable = [
        'employees_payroll_id',
        'requirement_type',
        'requirement_amount',
    ];

    protected $casts = [
        'requirement_amount' => 'decimal:2',
    ];

    public function employeePayroll()
    {
        return $this->belongsTo(EmployeePayroll::class, 'employees_payroll_id');
    }
}
