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
use App\Http\Controllers\UserController;

Route::get('/test', function () {
    return ['message' => 'API working!'];
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', [UserController::class, 'me']);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']); 
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

    // CHANGE: members rute za projekte
    Route::get('/projects/{id}/members', [ProjectController::class, 'membersIndex']);   // CHANGE
    Route::post('/projects/{id}/members', [ProjectController::class, 'membersStore']);  // CHANGE
    Route::delete('/projects/{id}/members/{userId}', [ProjectController::class, 'membersDestroy']); // CHANGE
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

// NOTE: tvoja ruta za izveštaj je /report/hours (ostavljam kako je)
Route::get('/report/hours', [ReportController::class, 'userWorkHours']);
