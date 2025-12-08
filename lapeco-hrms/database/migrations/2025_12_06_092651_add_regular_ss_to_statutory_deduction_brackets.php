<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('statutory_deduction_brackets', function (Blueprint $table) {
            $table->decimal('regular_ss', 12, 2)->nullable()->after('salary_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('statutory_deduction_brackets', function (Blueprint $table) {
            $table->dropColumn('regular_ss');
        });
    }
};
