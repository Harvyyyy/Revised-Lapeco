<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('chatbot_qas')
            ->where('question', 'What positions are available?')
            ->update([
                'dynamic_handler' => 'available_positions',
                // Optional: Update answer to indicate it's dynamic, though controller overrides it
                'answer' => 'This answer is dynamically generated based on available positions.'
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('chatbot_qas')
            ->where('question', 'What positions are available?')
            ->update([
                'dynamic_handler' => null,
                'answer' => "We are always looking for talented individuals! You can see the list of available positions like Software Engineer, Product Manager, and more in the 'Applying For' dropdown when you open the application form."
            ]);
    }
};
