<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\CustomVerifyEmail;
use App\Notifications\CustomResetPassword;
use Illuminate\Database\Eloquent\Casts\Attribute;
use App\Traits\HasEncryptedAttributes;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasEncryptedAttributes;

    protected $encrypted = [
        'contact_number',
        'sss_no',
        'tin_no',
        'pag_ibig_no',
        'philhealth_no',
        'address',
    ];

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'username',
        'email',
        'password',
        'role',
        'is_team_leader',
        'position_id',
        'joining_date',
        'birthday',
        'gender',
        'address',
        'contact_number',
        'image_url',
        'sss_no',
        'tin_no',
        'pag_ibig_no',
        'philhealth_no',
        'resume_file',
        'theme_preference',
        'account_status',
        'attendance_status',
        'login_attempts',
        'last_failed_login',
        'locked_until',
        'password_changed',
        'employment_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_failed_login' => 'datetime',
        'locked_until' => 'datetime',
        'login_attempts' => 'integer',
        'is_team_leader' => 'boolean',
    ];


    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function scheduleAssignments()
    {
        return $this->hasMany(ScheduleAssignment::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function leaveCredits()
    {
        return $this->hasMany(LeaveCredit::class);
    }

    public function schedules()
    {
        return $this->belongsToMany(Schedule::class, 'schedule_assignments')
            ->withPivot(['start_time', 'end_time', 'notes'])
            ->withTimestamps();
    }

    public function resignations()
    {
        return $this->hasMany(Resignation::class, 'employee_id');
    }

    public function terminations()
    {
        return $this->hasMany(Termination::class, 'employee_id');
    }

    public function approvedResignations()
    {
        return $this->hasMany(Resignation::class, 'approved_by');
    }

    public function terminatedEmployees()
    {
        return $this->hasMany(Termination::class, 'terminated_by');
    }

    public function getProfilePictureUrlAttribute()
    {
        return $this->image_url ? asset('storage/' . $this->image_url) : null;
    }

    public function getResumeUrlAttribute()
    {
        return $this->resume_file ? asset('storage/' . $this->resume_file) : null;
    }

    public static function createFromApplicant($applicantData, $positionId, $employeeId = null)
    {

        $nullIfEmpty = fn($value) => (isset($value) && $value !== '') ? $value : null;


        $employeeData = [
            'name' => trim($applicantData['first_name'] . ' ' .
                ($applicantData['middle_name'] ? $applicantData['middle_name'] . ' ' : '') .
                $applicantData['last_name']),
            'first_name' => $applicantData['first_name'],
            'middle_name' => $nullIfEmpty($applicantData['middle_name'] ?? null),
            'last_name' => $applicantData['last_name'],
            'email' => $applicantData['email'],
            'password' => bcrypt('temporary'),
            'role' => 'REGULAR_EMPLOYEE',
            'position_id' => $positionId,
            'joining_date' => now()->toDateString(),
            'birthday' => isset($applicantData['birthday']) ? date('Y-m-d', strtotime($applicantData['birthday'])) : null,
            'gender' => $nullIfEmpty($applicantData['gender'] ?? null),
            'contact_number' => $nullIfEmpty($applicantData['phone'] ?? null),
            'address' => $nullIfEmpty($applicantData['address'] ?? null),
            'sss_no' => $nullIfEmpty($applicantData['sss_no'] ?? null),
            'tin_no' => $nullIfEmpty($applicantData['tin_no'] ?? null),
            'pag_ibig_no' => $nullIfEmpty($applicantData['pag_ibig_no'] ?? null),
            'philhealth_no' => $nullIfEmpty($applicantData['philhealth_no'] ?? null),
            'resume_file' => $nullIfEmpty($applicantData['resume_file'] ?? null),
            'image_url' => $nullIfEmpty($applicantData['profile_picture'] ?? null),
            'account_status' => 'Active',
            'login_attempts' => 0,
            'password_changed' => false,
        ];

        $employee = self::create($employeeData);


        $defaultPassword = 'lapeco' . $employee->id;
        $employee->update([
            'password' => bcrypt($defaultPassword)
        ]);

        return $employee;
    }

    public function calculateAttendanceRate($days = 30)
    {
        $startDate = now()->subDays($days);
        $endDate = now();


        $scheduleAssignments = $this->scheduleAssignments()
            ->with(['schedule', 'attendance'])
            ->whereHas('schedule', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            })
            ->get();

        if ($scheduleAssignments->isEmpty()) {
            return 100;
        }

        $totalScheduled = $scheduleAssignments->count();
        $attendedCount = 0;

        foreach ($scheduleAssignments as $assignment) {
            $attendance = $assignment->attendance;

            if ($attendance) {
                $status = $attendance->calculated_status;

                if (in_array($status, ['present', 'late'])) {
                    $attendedCount++;
                }
            } else {

                $scheduleDate = $assignment->schedule->date;
                if ($scheduleDate->isPast()) {

                    continue;
                } else {

                    $totalScheduled--;
                }
            }
        }

        if ($totalScheduled <= 0) {
            return 100;
        }

        return round(($attendedCount / $totalScheduled) * 100, 2);
    }

    public function setFullNameFromComponents(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ]);

        return trim(implode(' ', $parts));
    }

    public static function splitFullName(?string $name): array
    {
        $name = trim((string) $name);

        if ($name === '') {
            return [null, null, null];
        }

        $parts = preg_split('/\s+/', $name);
        $first = array_shift($parts) ?? null;
        $last = array_pop($parts) ?? null;
        $middle = $parts ? implode(' ', $parts) : null;

        if ($last === null) {
            $last = null;
        }

        return [$first, $middle, $last];
    }

    public function fillNameComponents(array $data): void
    {
        if (isset($data['first_name'])) {
            $this->first_name = $data['first_name'];
        }
        if (array_key_exists('middle_name', $data)) {
            $this->middle_name = $data['middle_name'];
        }
        if (isset($data['last_name'])) {
            $this->last_name = $data['last_name'];
        }

        $this->setFullNameFromComponents();
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->setFullNameFromComponents()
        );
    }

    public function checkAndUpdateAttendanceStatus($threshold = 80)
    {
        $attendanceRate = $this->calculateAttendanceRate();

        if ($attendanceRate < $threshold) {
            $this->update(['attendance_status' => 'Inactive']);
            return true;
        } else {
            $this->update(['attendance_status' => 'Active']);
            return false;
        }
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail);
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPassword($token));
    }
}
