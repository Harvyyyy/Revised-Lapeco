<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TrainingController extends Controller
{
    public function index()
    {
        // TODO: Implement training listing
        return response()->json([]);
    }

    public function programs()
    {
        // TODO: Implement programs listing
        return response()->json([]);
    }

    public function storeProgram(Request $request)
    {
        // TODO: Implement program creation
        return response()->json(['message' => 'Program created'], 201);
    }

    public function updateProgram(Request $request, $id)
    {
        // TODO: Implement program update
        return response()->json(['message' => 'Program updated']);
    }

    public function destroyProgram($id)
    {
        // TODO: Implement program deletion
        return response()->json(null, 204);
    }
}
