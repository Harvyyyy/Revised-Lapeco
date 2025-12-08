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
        Schema::table('payroll_statutory_requirements', function (Blueprint $table) {
            $table->text('employer_amount')->nullable()->after('requirement_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_statutory_requirements', function (Blueprint $table) {
            $table->dropColumn('employer_amount');
        });
    }
};
