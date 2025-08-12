<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['Vacation Leave', 'Sick Leave', 'Emergency Leave', 'Personal Leave', 'Unpaid Leave']);
            $table->date('date_from');
            $table->date('date_to');
            $table->unsignedInteger('days');
            $table->enum('status', ['Pending', 'Approved', 'Declined', 'Canceled'])->default('Pending');
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};


