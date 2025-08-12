<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Holiday;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $holidays = Holiday::orderBy('date')->get();
        if ($request->boolean('groupByMonth')) {
            $grouped = $holidays->groupBy(function ($h) {
                return date('Y-m', strtotime($h->date));
            });
            return response()->json($grouped);
        }
        return response()->json($holidays);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'nullable|in:REGULAR,SPECIAL',
            'is_recurring' => 'boolean',
            'description' => 'nullable|string',
        ]);
        $holiday = Holiday::create($data);
        return response()->json($holiday, 201);
    }

    public function update(Request $request, Holiday $holiday)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'date' => 'sometimes|date',
            'type' => 'sometimes|in:REGULAR,SPECIAL',
            'is_recurring' => 'sometimes|boolean',
            'description' => 'sometimes|nullable|string',
        ]);
        $holiday->update($data);
        return response()->json($holiday);
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();
        return response()->json(null, 204);
    }
}
