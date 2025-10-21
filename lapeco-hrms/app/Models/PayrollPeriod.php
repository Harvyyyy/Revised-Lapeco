<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_start',
        'period_end',
        'period_year',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'period_year' => 'integer',
    ];

    public function employeePayrolls()
    {
        return $this->hasMany(EmployeePayroll::class, 'period_id');
    }
}
