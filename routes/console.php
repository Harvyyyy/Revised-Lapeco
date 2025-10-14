<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('attendance:check-rates')
    ->dailyAt('23:30')
    ->withoutOverlapping()
    ->runInBackground();

