<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'monthly_salary',
        'base_rate_per_hour',
        'overtime_rate_per_hour',
        'night_diff_rate_per_hour',
        'late_deduction_per_minute',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
} 