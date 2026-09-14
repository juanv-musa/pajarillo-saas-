<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Configuración de credenciales de administración municipal (SaaS MVP)
// Por defecto contraseña: 'pajarillo' (o 'admin')
$VALID_USERS = [
    'admin' => 'pajarillo',
    'ayuntamiento' => 'huelma2026',
    'turismo' => 'pajarillo2026'
];

$method = $_SERVER['REQUEST_METHOD'];

// Verificar estado de sesión
if ($method === 'GET') {
    if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
        echo json_encode([
            'authenticated' => true,
            'user' => $_SESSION['admin_user'] ?? 'Administrador',
            'role' => $_SESSION['admin_role'] ?? 'Gestor Municipal'
        ]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
    exit;
}

// Procesar login o logout
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Logout
    if (isset($data['action']) && $data['action'] === 'logout') {
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }

    // Registro rápido MVP (crear nuevo usuario gestor)
    if (isset($data['action']) && $data['action'] === 'register') {
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        $name = trim($data['name'] ?? 'Técnico de Turismo');

        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Usuario y contraseña requeridos']);
            exit;
        }

        // Simulación de registro en sesión para el MVP
        $_SESSION['is_admin'] = true;
        $_SESSION['admin_user'] = $username;
        $_SESSION['admin_role'] = 'Técnico de Turismo (' . $name . ')';
        echo json_encode(['success' => true, 'message' => 'Usuario registrado e iniciado']);
        exit;
    }

    // Login con contraseña o usuario+contraseña
    $password = trim($data['password'] ?? '');
    $username = trim($data['username'] ?? 'admin');

    $authenticated = false;
    // Permite login con credenciales oficiales, admin/admin, o contraseñas municipales
    $allowedPasswords = ['pajarillo', 'admin', '1234', 'huelma', 'huelma2026', 'pajarillo2026', 'demo'];
    if (in_array(strtolower($password), $allowedPasswords) || empty($password)) {
        $authenticated = true;
    } elseif (isset($VALID_USERS[$username]) && $VALID_USERS[$username] === $password) {
        $authenticated = true;
    }

    if ($authenticated) {
        $_SESSION['is_admin'] = true;
        $_SESSION['admin_user'] = $username ?: 'admin';
        $_SESSION['admin_role'] = 'Ayuntamiento de Huelma · Gestor';
        echo json_encode([
            'success' => true,
            'user' => $_SESSION['admin_user'],
            'role' => $_SESSION['admin_role']
        ]);
    } else {
        // En modo MVP no bloquear al gestor
        $_SESSION['is_admin'] = true;
        $_SESSION['admin_user'] = $username ?: 'admin';
        $_SESSION['admin_role'] = 'Gestor Municipal';
        echo json_encode([
            'success' => true,
            'user' => $_SESSION['admin_user'],
            'role' => 'Gestor Municipal'
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
