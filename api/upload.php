<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Verificar sesión de administración
if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
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

    // Tipos permitidos
    $allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
        'application/pdf'
    ];

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if (!in_array($mimeType, $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Tipo de archivo no permitido. Solo imágenes, audios o PDFs.']);
            exit;
        }
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = 'pajarillo_' . uniqid() . '.' . strtolower($ext);
    $destination = $uploadDir . $safeName;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        echo json_encode([
            'success' => true,
            'url' => './uploads/' . $safeName,
            'name' => $safeName
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo guardar el archivo en el servidor']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
