<?php
// Configuración de cookies de sesión segura
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

session_start();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$usersFile = '../data/users.json';

// Cargar usuarios desde data/users.json o inicializar con contraseñas seguras por defecto
function getUsers() {
    global $usersFile;
    if (file_exists($usersFile)) {
        $content = @file_get_contents($usersFile);
        $decoded = $content ? json_decode($content, true) : null;
        if (is_array($decoded) && !empty($decoded)) {
            return $decoded;
        }
    }

    // Usuarios y Roles Oficiales por Defecto:
    // 1. ayuntamiento -> Gestor de Patrimonio y Turismo · Ayto. Huelma (Contraseña: HuelmaPajarillo2026!)
    // 2. admin -> Administrador del Sistema (Contraseña: Pajarillo2026!)
    $initial = [
        'ayuntamiento' => [
            'name' => 'Técnico de Patrimonio y Turismo',
            'role' => 'Gestor de Patrimonio y Turismo · Ayto. Huelma',
            'hash' => password_hash('HuelmaPajarillo2026!', PASSWORD_DEFAULT),
            'updated_at' => date('Y-m-d H:i')
        ],
        'admin' => [
            'name' => 'Administrador',
            'role' => 'Administrador del Sistema',
            'hash' => password_hash('Pajarillo2026!', PASSWORD_DEFAULT),
            'updated_at' => date('Y-m-d H:i')
        ]
    ];
    saveUsers($initial);
    return $initial;
}

function saveUsers($users) {
    global $usersFile;
    $encoded = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return @file_put_contents($usersFile, $encoded, LOCK_EX);
}

$method = $_SERVER['REQUEST_METHOD'];

// Verificar estado de sesión actual o listar usuarios
if ($method === 'GET') {
    // Listar usuarios (solo accesible para gestores con sesión activa)
    if (isset($_GET['action']) && $_GET['action'] === 'get_users') {
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'No autorizado']);
            exit;
        }
        $users = getUsers();
        $list = [];
        foreach ($users as $uKey => $uData) {
            $list[] = [
                'username' => $uKey,
                'name' => $uData['name'] ?? $uKey,
                'role' => $uData['role'] ?? 'Gestor',
                'permissions' => $uData['permissions'] ?? ['all'],
                'updated_at' => $uData['updated_at'] ?? '',
                'protected' => in_array($uKey, ['admin', 'ayuntamiento'])
            ];
        }
        echo json_encode(['success' => true, 'users' => $list]);
        exit;
    }

    if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
        echo json_encode([
            'authenticated' => true,
            'user' => $_SESSION['admin_user'] ?? 'ayuntamiento',
            'role' => $_SESSION['admin_role'] ?? 'Gestor de Patrimonio y Turismo',
            'name' => $_SESSION['admin_name'] ?? 'Técnico Municipal',
            'permissions' => $_SESSION['admin_permissions'] ?? ['all']
        ]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
    exit;
}

// Procesar login, logout o cambio de contraseña
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Petición inválida']);
        exit;
    }

    // ──────────────────────────────────────────
    // 1. CERRAR SESIÓN (LOGOUT)
    // ──────────────────────────────────────────
    if (isset($data['action']) && $data['action'] === 'logout') {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }

    // ──────────────────────────────────────────
    // 2. CAMBIO DE CONTRASEÑA (REQUIERE SESIÓN ACTIVA)
    // ──────────────────────────────────────────
    if (isset($data['action']) && $data['action'] === 'change_password') {
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'No autorizado. Debes iniciar sesión para cambiar la contraseña.']);
            exit;
        }

        $currentPass = trim($data['current_password'] ?? '');
        $newPass = trim($data['new_password'] ?? '');
        $confirmPass = trim($data['confirm_password'] ?? '');
        $currentUser = $_SESSION['admin_user'] ?? 'ayuntamiento';

        if (empty($currentPass) || empty($newPass)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Debes introducir la contraseña actual y la nueva.']);
            exit;
        }

        if (strlen($newPass) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'La nueva contraseña debe tener al menos 6 caracteres.']);
            exit;
        }

        if ($newPass !== $confirmPass) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'La nueva contraseña y su confirmación no coinciden.']);
            exit;
        }

        $users = getUsers();
        if (!isset($users[$currentUser])) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Usuario actual no encontrado en el sistema.']);
            exit;
        }

        // Verificar la contraseña actual
        $validCurrent = false;
        if (password_verify($currentPass, $users[$currentUser]['hash'])) {
            $validCurrent = true;
        } elseif ($users[$currentUser]['hash'] === $currentPass) {
            $validCurrent = true;
        }

        if (!$validCurrent) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'La contraseña actual introducida no es correcta.']);
            exit;
        }

        // Hashear y actualizar la nueva contraseña con Bcrypt
        $users[$currentUser]['hash'] = password_hash($newPass, PASSWORD_DEFAULT);
        $users[$currentUser]['updated_at'] = date('Y-m-d H:i');

        if (saveUsers($users)) {
            echo json_encode([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente para el usuario ' . $currentUser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error de permisos: no se pudo guardar el archivo en data/users.json']);
        }
        exit;
    }

    // ──────────────────────────────────────────
    // 3. CREAR / ACTUALIZAR USUARIO CON PERMISOS
    // ──────────────────────────────────────────
    if (isset($data['action']) && $data['action'] === 'create_user') {
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'No autorizado.']);
            exit;
        }

        // Solo usuarios con permisos 'all' o 'admin' pueden gestionar usuarios
        $currentPerms = $_SESSION['admin_permissions'] ?? ['all'];
        if (!in_array('all', $currentPerms) && ($_SESSION['admin_user'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para gestionar usuarios.']);
            exit;
        }

        $newUsername = strtolower(trim(preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $data['username'] ?? '')));
        $newName = trim($data['name'] ?? '');
        $newPass = trim($data['password'] ?? '');
        $newRole = trim($data['role'] ?? 'Gestor');
        $newPerms = is_array($data['permissions'] ?? null) && !empty($data['permissions']) ? $data['permissions'] : ['agenda', 'bookings'];

        if (empty($newUsername) || empty($newPass)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Usuario y contraseña requeridos.']);
            exit;
        }

        if (strlen($newPass) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres.']);
            exit;
        }

        $users = getUsers();
        $users[$newUsername] = [
            'name' => $newName ?: $newUsername,
            'role' => $newRole,
            'permissions' => $newPerms,
            'hash' => password_hash($newPass, PASSWORD_DEFAULT),
            'updated_at' => date('Y-m-d H:i')
        ];

        if (saveUsers($users)) {
            echo json_encode([
                'success' => true,
                'message' => "Usuario '$newUsername' guardado con éxito con permisos restringidos."
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar usuario en data/users.json']);
        }
        exit;
    }

    // ──────────────────────────────────────────
    // 4. ELIMINAR USUARIO
    // ──────────────────────────────────────────
    if (isset($data['action']) && $data['action'] === 'delete_user') {
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'No autorizado.']);
            exit;
        }

        $currentPerms = $_SESSION['admin_permissions'] ?? ['all'];
        if (!in_array('all', $currentPerms) && ($_SESSION['admin_user'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para eliminar usuarios.']);
            exit;
        }

        $targetUser = trim($data['username'] ?? '');
        if (in_array($targetUser, ['admin', 'ayuntamiento'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No se pueden eliminar las cuentas principales del sistema.']);
            exit;
        }

        $users = getUsers();
        if (isset($users[$targetUser])) {
            unset($users[$targetUser]);
            saveUsers($users);
            echo json_encode(['success' => true, 'message' => "Usuario '$targetUser' eliminado con éxito."]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'El usuario no existe.']);
        }
        exit;
    }

    // ──────────────────────────────────────────
    // 5. INICIO DE SESIÓN (LOGIN)
    // ──────────────────────────────────────────
    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');

    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Usuario y contraseña requeridos']);
        exit;
    }

    $users = getUsers();

    $authenticated = false;
    $matchedUserKey = null;

    if (isset($users[$username])) {
        $userRecord = $users[$username];
        if (password_verify($password, $userRecord['hash'])) {
            $authenticated = true;
            $matchedUserKey = $username;
        } elseif ($userRecord['hash'] === $password) {
            // Actualizar hash si venía de migración previa
            $users[$username]['hash'] = password_hash($password, PASSWORD_DEFAULT);
            saveUsers($users);
            $authenticated = true;
            $matchedUserKey = $username;
        }
    }

    if ($authenticated && $matchedUserKey) {
        session_regenerate_id(true);

        $_SESSION['is_admin'] = true;
        $_SESSION['admin_user'] = $matchedUserKey;
        $_SESSION['admin_name'] = $users[$matchedUserKey]['name'] ?? 'Técnico Municipal';
        $_SESSION['admin_role'] = $users[$matchedUserKey]['role'] ?? 'Gestor de Patrimonio y Turismo';
        $_SESSION['admin_permissions'] = $users[$matchedUserKey]['permissions'] ?? ['all'];

        echo json_encode([
            'success' => true,
            'user' => $_SESSION['admin_user'],
            'role' => $_SESSION['admin_role'],
            'name' => $_SESSION['admin_name'],
            'permissions' => $_SESSION['admin_permissions']
        ]);
        exit;
    }

    // Credenciales erróneas: denegar con código 401
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Credenciales incorrectas. Comprueba tu usuario y contraseña.'
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
