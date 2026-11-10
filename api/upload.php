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

// Verificar sesión de administración estricta
if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado. Se requiere sesión de administración.']);
    exit;
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

    // Lista blanca estricta de extensiones permitidas
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp3', 'wav', 'ogg', 'pdf'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowedExtensions, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Extensión no permitida. Solo imágenes, audios o documentos PDF.']);
        exit;
    }

    // Bloquear archivos con extensiones dobles sospechosas (ej: exploit.php.png)
    $fileNameLower = strtolower($file['name']);
    if (preg_match('/\.(php|phtml|phar|pl|py|cgi|sh|exe|bat|js)(\.|$)/i', $fileNameLower)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre de archivo potencialmente peligroso rechazado.']);
        exit;
    }

    // Comprobación de tipo MIME real del contenido
    $allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav',
        'application/pdf', 'application/x-pdf'
    ];

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedMimes, true) && $mimeType !== 'text/plain') {
            http_response_code(400);
            echo json_encode(['error' => 'Tipo MIME no permitido (' . htmlspecialchars($mimeType) . '). Solo imágenes, audios o PDFs válidos.']);
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
