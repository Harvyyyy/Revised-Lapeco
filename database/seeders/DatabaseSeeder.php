<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Position;
use App\Models\Holiday;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed positions
        $positions = [
            [
                'name' => 'HR Personnel',
                'description' => 'Handles recruitment, payroll, and employee relations.',
                'monthly_salary' => 35000,
            ],
            [
                'name' => 'Packer',
                'description' => 'Prepares and packs finished products for shipment.',
                'monthly_salary' => 18000,
            ],
            [
                'name' => 'Lifter',
                'description' => 'Operates lifting equipment to move heavy materials.',
                'monthly_salary' => 22000,
            ],
            [
                'name' => 'Picker',
                'description' => 'Selects items from inventory to fulfill orders.',
                'monthly_salary' => 18500,
            ],
            [
                'name' => 'Mover',
                'description' => 'Transports materials and goods within the facility.',
                'monthly_salary' => 19000,
            ],
        ];
        $positionIds = [];
        foreach ($positions as $pos) {
            $position = Position::create($pos);
            $positionIds[$pos['name']] = $position->id;
        }

        // Seed users, at least one for each position
        \App\Models\User::factory()->create([
            'name' => 'HR Personnel',
            'email' => 'hr@example.com',
            'role' => 'HR_PERSONNEL',
            'position_id' => $positionIds['HR Personnel'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Packer Team Leader',
            'email' => 'packer.leader@example.com',
            'role' => 'TEAM_LEADER',
            'position_id' => $positionIds['Packer'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Lifter Team Leader',
            'email' => 'lifter.leader@example.com',
            'role' => 'TEAM_LEADER',
            'position_id' => $positionIds['Lifter'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Picker Team Leader',
            'email' => 'picker.leader@example.com',
            'role' => 'TEAM_LEADER',
            'position_id' => $positionIds['Picker'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Mover Team Leader',
            'email' => 'mover.leader@example.com',
            'role' => 'TEAM_LEADER',
            'position_id' => $positionIds['Mover'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Packer',
            'email' => 'packer@example.com',
            'role' => 'REGULAR_EMPLOYEE',
            'position_id' => $positionIds['Packer'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Lifter',
            'email' => 'lifter@example.com',
            'role' => 'REGULAR_EMPLOYEE',
            'position_id' => $positionIds['Lifter'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Picker',
            'email' => 'picker@example.com',
            'role' => 'REGULAR_EMPLOYEE',
            'position_id' => $positionIds['Picker'],
        ]);
        \App\Models\User::factory()->create([
            'name' => 'Mover',
            'email' => 'mover@example.com',
            'role' => 'REGULAR_EMPLOYEE',
            'position_id' => $positionIds['Mover'],
        ]);

        // Create additional users distributed among positions
        $allPositionIds = array_values($positionIds);
        \App\Models\User::factory(65)->create()->each(function ($user) use ($allPositionIds) {
            $role = rand(1, 10) === 1 ? 'TEAM_LEADER' : 'REGULAR_EMPLOYEE'; // ~10% team leaders
            $user->update([
                'role' => $role,
                'position_id' => $allPositionIds[array_rand($allPositionIds)],
            ]);
        });

        // Seed 15 real PH holidays (sample/common list for current year)
        
        // Seed some leave requests
        \App\Models\Leave::factory()->create([
            'user_id' => \App\Models\User::where('email', 'packer@example.com')->first()->id,
            'type' => 'Sick Leave',
            'date_from' => date('Y-m-d', strtotime('2025-03-15')),
            'date_to' => date('Y-m-d', strtotime('2025-03-17')),
            'days' => 3,
            'status' => 'Approved',
            'reason' => 'Medical appointment and recovery',
        ]);
        
        // Create additional random leave requests
        \App\Models\Leave::factory(15)->create();

        $year = (int) date('Y');
        $phHolidays = [
            ['New Year\'s Day', "$year-01-01", 'REGULAR'],
            ['Araw ng Kagitingan', "$year-04-09", 'REGULAR'],
            ['Labor Day', "$year-05-01", 'REGULAR'],
            ['Independence Day', "$year-06-12", 'REGULAR'],
            ['National Heroes Day', date('Y-m-d', strtotime("last Monday of August $year")), 'REGULAR'],
            ['Bonifacio Day', "$year-11-30", 'REGULAR'],
            ['Christmas Day', "$year-12-25", 'REGULAR'],
            ['Rizal Day', "$year-12-30", 'REGULAR'],
            ['Chinese New Year', date('Y-m-d', strtotime("third Saturday of January $year")), 'SPECIAL'],
            ['EDSA People Power Revolution Anniversary', "$year-02-25", 'SPECIAL'],
            ['Black Saturday', date('Y-m-d', strtotime("next Saturday", strtotime("Good Friday $year"))), 'SPECIAL'],
            ['All Saints\' Day', "$year-11-01", 'SPECIAL'],
            ['Feast of the Immaculate Conception of Mary', "$year-12-08", 'SPECIAL'],
            ['Ninoy Aquino Day', "$year-08-21", 'SPECIAL'],
            ['All Souls\' Day', "$year-11-02", 'SPECIAL'],
        ];

        foreach ($phHolidays as [$title, $date, $type]) {
            Holiday::create([
                'title' => $title,
                'date' => $date,
                'type' => $type,
                'is_recurring' => true,
            ]);
        }
    }
}
