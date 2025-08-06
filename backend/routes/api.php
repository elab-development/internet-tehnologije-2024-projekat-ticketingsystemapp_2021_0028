<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;


Route::get('/test', function () {
    return ['message' => 'API working!'];
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::middleware(['auth:sanctum', 'admin'])->get('/admin-only', function () {
    return response()->json(['message' => 'Hello Admin']);
});

Route::middleware(['auth:sanctum', 'manager'])->get('/manager-only', function () {
    return response()->json(['message' => 'Hello Manager']);
});

Route::middleware(['auth:sanctum', 'employee'])->get('/employee-only', function () {
    return response()->json(['message' => 'Hello Employee']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('projects', ProjectController::class);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);
});