<?php

use App\Http\Controllers\InvoiceNormalizationController;
use Illuminate\Http\Request;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PayementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes publiques (pas besoin d'être connecté)
Route::post('/login', [UserController::class, 'login']);
Route::post('/organizations',         [OrganizationController::class, 'store']);
Route::post('/verifier-paiement',[PayementController::class, 'verifier']);

Route::middleware('auth:sanctum')->group(function () {

    // Organizations
    Route::get('/organizations',          [OrganizationController::class, 'index']);
    Route::post('/organizations/change-plan', [OrganizationController::class, 'changePlan']);
    Route::put('/organizations/emcef',    [OrganizationController::class, 'updateemcef']);
    Route::get('/organizations/{organization}',    [OrganizationController::class, 'show']);
    Route::put('/organizations/{organization}',    [OrganizationController::class, 'update']);
    Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy']);

    Route::post('logout', [UserController::class, 'logout']);
    Route::get('me', [UserController::class, 'me']);

    // Users / membres
    Route::get('users', [UserController::class, 'index']);
    Route::post('users/invite', [UserController::class, 'invite']);
    Route::get('users/{user}', [UserController::class, 'show']);
    Route::put('users/{user}', [UserController::class, 'update']);
    Route::delete('users/{user}', [UserController::class, 'destroy']);

    // Customers
    Route::apiResource('customers', CustomerController::class);

    // Invoices
    Route::apiResource('invoices', InvoiceController::class);
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);
    Route::put('invoices/{invoice}/status', [InvoiceController::class, 'updateStatus']);
    Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'send']);
    Route::post('/invoices/{invoice}/normalize', [InvoiceNormalizationController::class, 'normalize']);

    
});
