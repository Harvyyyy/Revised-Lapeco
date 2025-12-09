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
            $table->decimal('fixed_employer_amount', 12, 2)->nullable()->after('fixed_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('statutory_deduction_brackets', function (Blueprint $table) {
            $table->dropColumn('fixed_employer_amount');
        });
    }
};
