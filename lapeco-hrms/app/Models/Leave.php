<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'date_from',
        'date_to',
        'days',
        'status',
        'reason',
        'document_name',
        'document_path',
        'maternity_details',
        'paternity_details',
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
        'days' => 'integer',
        'maternity_details' => 'array',
        'paternity_details' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::updated(function ($leave) {
            $leave->handleCreditUpdate();
        });

        static::created(function ($leave) {
            if ($leave->status === 'Approved') {
                $leave->handleCreditUpdate();
            }
        });

        static::deleted(function ($leave) {
            if ($leave->status === 'Approved') {
                $leave->returnCredits();
            }
        });
    }

    protected function handleCreditUpdate()
    {
        $originalStatus = $this->getOriginal('status');
        $currentStatus = $this->status;

        if ($originalStatus !== 'Approved' && $currentStatus === 'Approved') {
            $this->useCredits();
        }

        if ($originalStatus === 'Approved' && in_array($currentStatus, ['Declined', 'Canceled'])) {
            $this->returnCredits();
        }
    }

    protected function useCredits()
    {

        if (in_array($this->type, ['Unpaid Leave', 'Paternity Leave'])) {
            return;
        }

        $creditType = $this->type === 'Emergency Leave' ? 'Vacation Leave' : $this->type;
        $leaveCredit = LeaveCredit::getOrCreateForUser(
            $this->user_id,
            $creditType,
            date('Y', strtotime($this->date_from))
        );

        $leaveCredit->useCredits($this->days);
    }

    protected function returnCredits()
    {

        if (in_array($this->type, ['Unpaid Leave', 'Paternity Leave'])) {
            return;
        }

        $creditType = $this->type === 'Emergency Leave' ? 'Vacation Leave' : $this->type;
        $leaveCredit = LeaveCredit::getOrCreateForUser(
            $this->user_id,
            $creditType,
            date('Y', strtotime($this->date_from))
        );

        $leaveCredit->returnCredits($this->days);
    }

    public function hasEnoughCredits()
    {

        if (in_array($this->type, ['Unpaid Leave', 'Paternity Leave'])) {
            return true;
        }

        $creditType = $this->type === 'Emergency Leave' ? 'Vacation Leave' : $this->type;
        $leaveCredit = LeaveCredit::getOrCreateForUser(
            $this->user_id,
            $creditType,
            date('Y', strtotime($this->date_from))
        );

        return $leaveCredit->hasEnoughCredits($this->days);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }


    public function scopeCurrentYear($query)
    {
        return $query->whereYear('date_from', date('Y'));
    }
}
