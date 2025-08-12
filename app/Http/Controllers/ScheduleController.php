<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Position;
use Inertia\Inertia;
use App\Models\ScheduleTemplate;

class ScheduleController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'schedules' => 'required|array',
            'schedules.*.empId' => 'required|exists:users,id',
            'schedules.*.date' => 'required|date',
            'schedules.*.name' => 'required|string',
            'schedules.*.start_time' => 'required',
            'schedules.*.end_time' => 'required',
            // Add other fields as needed
        ]);
        foreach ($data['schedules'] as $entry) {
            Schedule::updateOrCreate(
                [
                    'user_id' => $entry['empId'],
                    'date' => $entry['date'],
                ],
                [
                    'name' => $entry['name'],
                    'start_time' => $entry['start_time'],
                    'end_time' => $entry['end_time'],
                    'notes' => $entry['notes'] ?? null,
                ]
            );
        }
        return redirect('/dashboard/schedule-management')->with('success', 'Schedule saved!');
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'schedules' => 'required|array',
            'schedules.*.empId' => 'required|exists:users,id',
            'schedules.*.start_time' => 'required',
            'schedules.*.end_time' => 'required',
            'schedules.*.name' => 'required|string',
        ]);
        
        // Delete existing schedules for this date
        Schedule::where('date', $data['date'])->delete();
        
        // Create new schedules
        foreach ($data['schedules'] as $entry) {
            Schedule::create([
                'user_id' => $entry['empId'],
                'date' => $data['date'],
                'name' => $entry['name'],
                'start_time' => $entry['start_time'],
                'end_time' => $entry['end_time'],
                'notes' => $entry['notes'] ?? null,
            ]);
        }
        
        return redirect('/dashboard/schedule-management')->with('success', 'Schedule updated!');
    }

    public function templatesIndex()
    {
        $templates = ScheduleTemplate::all();
        return response()->json($templates);
    }

    public function templatesStore(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'columns' => 'required|array',
            'applicable_positions' => 'nullable|array',
        ]);
        $template = ScheduleTemplate::create($data);
        return response()->json($template, 201);
    }

    public function templatesUpdate(Request $request, $id)
    {
        $template = ScheduleTemplate::findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'columns' => 'required|array',
            'applicable_positions' => 'nullable|array',
        ]);
        $template->update($data);
        return response()->json($template);
    }

    public function templatesDestroy($id)
    {
        $template = ScheduleTemplate::findOrFail($id);
        $template->delete();
        return response()->json(['success' => true]);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role;
        $query = Schedule::query();
        $schedules = $query->with(['user', 'user.position'])->get()->map(function ($schedule) {
            return [
                'date' => $schedule->date,
                'name' => $schedule->name,
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
                'user_name' => $schedule->user ? $schedule->user->name : null,
                'employee_id' => $schedule->user ? $schedule->user->id : null,
                'position_name' => $schedule->user && $schedule->user->position ? $schedule->user->position->name : null,
            ];
        });
        $employees = User::all()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'positionId' => $user->position_id,
            ];
        });
        $positions = Position::all()->map(function ($position) {
            return [
                'id' => $position->id,
                'title' => $position->name,
            ];
        });
        $templates = ScheduleTemplate::all();
        return Inertia::render('Schedule-Management/ScheduleManagementPage', [
            'currentUser' => $user,
            'userRole' => $role,
            'schedules' => $schedules,
            'employees' => $employees,
            'positions' => $positions,
            'templates' => $templates,
        ]);
    }
} 