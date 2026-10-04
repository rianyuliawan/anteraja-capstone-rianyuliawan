<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('couriers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 120);
            $table->decimal('rating', 2, 1)->default(5.0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('thermal_assets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 120);
            $table->string('type', 30);
            $table->decimal('target_c', 5, 2);
            $table->decimal('normal_low_c', 5, 2);
            $table->decimal('normal_high_c', 5, 2);
            $table->decimal('warning_low_c', 5, 2);
            $table->decimal('warning_high_c', 5, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('awb', 50)->unique();
            $table->string('sender_name', 160);
            $table->string('recipient_name', 160);
            $table->string('origin', 180);
            $table->string('destination', 180);
            $table->decimal('weight_kg', 8, 2);
            $table->string('status', 30)->index();
            $table->foreignId('courier_id')->constrained()->restrictOnDelete();
            $table->foreignId('thermal_asset_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('temperature_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thermal_asset_id')->constrained()->cascadeOnDelete();
            $table->string('source', 30);
            $table->string('message_id', 120);
            $table->decimal('temperature_c', 5, 2);
            $table->string('temperature_status', 20);
            $table->timestampTz('observed_at');
            $table->timestamps();
            $table->unique(['source', 'message_id']);
            $table->index(['thermal_asset_id', 'observed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temperature_readings');
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('thermal_assets');
        Schema::dropIfExists('couriers');
    }
};
