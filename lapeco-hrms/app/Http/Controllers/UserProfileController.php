<?php

namespace App\Http\Controllers;

use App\Models\Position;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    /**
     * Return the authenticated user's profile information with additional derived fields.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $userData = $user?->toArray() ?? [];

        // Add position name if available
        if ($user && $user->position_id) {
            $position = Position::find($user->position_id);
            $userData['position_name'] = $position ? $position->name : null;
        } else {
            $userData['position_name'] = null;
        }

        // Include fully-qualified profile picture URL
        $userData['profile_picture_url'] = $user && $user->image_url
            ? asset('storage/' . $user->image_url)
            : null;

        return response()->json($userData);
    }
}
