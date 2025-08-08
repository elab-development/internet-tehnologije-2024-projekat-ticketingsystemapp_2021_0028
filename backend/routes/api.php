<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TimeEntryController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TaskExportController;
use App\Http\Controllers\MotivationController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\ReportController;



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

Route::apiResource('time-entries', TimeEntryController::class)->middleware('auth:sanctum');

Route::apiResource('comments', CommentController::class)->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('messages', MessageController::class)->only([
        'index', 'store', 'show', 'destroy'
    ]);
});

Route::apiResource('events', EventController::class)->middleware('auth:sanctum');

Route::get('/tasks/export', [TaskExportController::class, 'export'])->middleware('auth:sanctum');

Route::get('/motivation', [MotivationController::class, 'index']);

Route::get('/statistics', [StatisticsController::class, 'index']);

Route::get('/report/hours', [ReportController::class, 'userWorkHours']);





