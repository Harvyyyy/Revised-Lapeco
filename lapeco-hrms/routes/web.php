<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Since this is now an API-only application, these routes are minimal.
| The main functionality is in routes/api.php
|
*/

Route::get('/', function () {
    return view('api-docs');
});

Route::any('{any}', function () {
    view('api-docs');
})->where('any', '.*');