<?php
// Configuración de cookies de sesión segura
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
           (!empty($_SERVER['HTTP_FRONT_END_HTTPS']) && strtolower($_SERVER['HTTP_FRONT_END_HTTPS']) !== 'off');
if ($isHttps) {
    ini_set('session.cookie_secure', 1);
}
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

session_start();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Verificar sesión de administración estricta y permiso de subida
if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado. Se requiere sesión de administración.']);
    exit;
}

$uploadAllowedPerms = ['all', 'panels', 'gallery', 'agenda', 'contents', 'kiosco'];
$userPerms = $_SESSION['admin_permissions'] ?? [];
if (($_SESSION['admin_user'] ?? '') !== 'admin' && empty(array_intersect($userPerms, $uploadAllowedPerms))) {
    http_response_code(403);
    echo json_encode(['error' => 'Permisos insuficientes para subir archivos al servidor.']);
    exit;
}

// Verificación de protección CSRF
if (!empty($_SESSION['csrf_token'])) {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $token = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? ''));
    if (!$token || !hash_equals($_SESSION['csrf_token'], (string)$token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Petición rechazada: token de seguridad CSRF inválido o ausente.']);
        exit;
    }
}

$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No se recibió ningún archivo']);
        exit;
    }

    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Error al subir el archivo (Código: ' . $file['error'] . ')']);
        exit;
    }

    // Tamaño máximo: 25 MB
    $maxBytes = 25 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        http_response_code(400);
        echo json_encode(['error' => 'El archivo supera el tamaño máximo permitido (25 MB).']);
        exit;
    }

    // Lista blanca estricta de extensiones permitidas (excluye SVG y scripts por seguridad)
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp3', 'wav', 'ogg', 'pdf'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowedExtensions, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Extensión no permitida. Solo imágenes (JPG, PNG, WEBP, GIF), audios (MP3, WAV, OGG) o documentos PDF.']);
        exit;
    }

    // Bloquear archivos con extensiones dobles o sospechosas (ej: exploit.php.png, archivo.phtml)
    $fileNameLower = strtolower($file['name']);
    if (preg_match('/\.(php|phtml|phar|pl|py|cgi|sh|exe|bat|js|svg|html|htm)(\.|$)/i', $fileNameLower)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre de archivo o formato potencialmente peligroso rechazado.']);
        exit;
    }

    // Comprobación de tipo MIME real del contenido
    $allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav',
        'application/pdf', 'application/x-pdf', 'application/octet-stream'
    ];

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedMimes, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Tipo de contenido no permitido (' . htmlspecialchars($mimeType) . ').']);
            exit;
        }
    }

    // Validación profunda del formato real:
    // 1. Imágenes ráster: deben ser imágenes binarias válidas comprobadas por getimagesize
    $imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (in_array($ext, $imageExts, true)) {
        $imgInfo = @getimagesize($file['tmp_name']);
        if ($imgInfo === false || empty($imgInfo[0]) || empty($imgInfo[1])) {
            http_response_code(400);
            echo json_encode(['error' => 'El archivo de imagen está dañado o no es una imagen gráfica válida.']);
            exit;
        }
    }

    // 2. Documentos PDF: deben comenzar con la cabecera mágica binaria %PDF-
    if ($ext === 'pdf') {
        $handle = @fopen($file['tmp_name'], 'rb');
        $header = $handle ? fread($handle, 5) : '';
        if ($handle) fclose($handle);
        if ($header !== '%PDF-') {
            http_response_code(400);
            echo json_encode(['error' => 'El archivo no es un documento PDF válido.']);
            exit;
        }
    }

    // Generar nombre de archivo completamente seguro y aleatorio
    $safeName = 'pajarillo_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $destination = $uploadDir . $safeName;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        @chmod($destination, 0644);
        echo json_encode([
            'success' => true,
            'url' => './uploads/' . $safeName,
            'name' => $safeName
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo guardar el archivo. Comprueba los permisos de escritura de la carpeta uploads/.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
