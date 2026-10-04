<?php

declare(strict_types=1);

function startTemperatureSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start([
            'cookie_httponly' => true,
            'cookie_samesite' => 'Lax',
            'use_strict_mode' => true,
        ]);
    }
}

function csrfToken(): string
{
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function validCsrfToken(mixed $token): bool
{
    return is_string($token) && hash_equals(csrfToken(), $token);
}

function escapeHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function formatTemperature(float $value): string
{
    return number_format($value, 1, ',', '.');
}

function redirectTo(string $page): never
{
    header('Location: ' . $page, true, 303);
    exit;
}
