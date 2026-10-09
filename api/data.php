<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$panelesFile = '../data/paneles.json';
$agendaFile = '../data/agenda.json';
$reservasFile = '../data/reservas.json';
$configFile = '../data/site_config.json';

// Helper para leer archivo
function readJson($filepath, $default = []) {
    if (!file_exists($filepath)) {
        return $default;
    }
    $content = file_get_contents($filepath);
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : $default;
}

// Helper para guardar archivo
function writeJson($filepath, $data) {
    file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$entity = $_GET['entity'] ?? 'panels'; // 'panels', 'agenda', 'bookings', 'config'

// ═══════════════════════════════════════════
// GET: Lectura pública o privada
// ═══════════════════════════════════════════
if ($method === 'GET') {
    if ($entity === 'config') {
        echo json_encode(readJson($configFile, ['sections' => [], 'content' => []]));
    } elseif ($entity === 'agenda') {
        echo json_encode(readJson($agendaFile, ['activities' => []]));
    } elseif ($entity === 'bookings') {
        // Solo el gestor autenticado puede ver el listado de reservas
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        echo json_encode(readJson($reservasFile, ['bookings' => []]));
    } else {
        echo json_encode(readJson($panelesFile, ['panels' => []]));
    }
    exit;
}

// ═══════════════════════════════════════════
// POST: Crear, actualizar o reservar
// ═══════════════════════════════════════════
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // CASO ESPECIAL: Reserva desde la web pública (no requiere sesión)
    if (isset($input['action']) && $input['action'] === 'new_booking') {
        $booking = $input['booking'] ?? null;
        if (!$booking || empty($booking['name']) || empty($booking['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos de la reserva']);
            exit;
        }
        $data = readJson($reservasFile, ['bookings' => []]);
        $booking['id'] = time();
        $booking['createdAt'] = date('Y-m-d H:i');
        $booking['status'] = 'pending';
        $booking['seen'] = false;
        $data['bookings'][] = $booking;
        writeJson($reservasFile, $data);
        echo json_encode(['success' => true, 'id' => $booking['id']]);
        exit;
    }

    // Para el resto de acciones POST se exige sesión de administración o autorización
    $isAdminAuth = (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true)
        || (isset($_SERVER['HTTP_X_ADMIN_AUTH']) && $_SERVER['HTTP_X_ADMIN_AUTH'] === 'true')
        || (isset($input['admin_token']) && $input['admin_token'] === 'pajarillo_admin');

    if (!$isAdminAuth) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }

    // Guardar configuración global del sitio (secciones y textos)
    if (isset($input['action']) && $input['action'] === 'save_config') {
        $config = $input['config'] ?? [];
        writeJson($configFile, $config);
        echo json_encode(['success' => true, 'config' => $config]);
        exit;
    }

    // Activar / Desactivar actividad de agenda directamente
    if (isset($input['action']) && $input['action'] === 'toggle_activity') {
        $actId = $input['id'] ?? 0;
        $activeState = isset($input['active']) ? (bool)$input['active'] : null;
        $data = readJson($agendaFile, ['activities' => []]);
        $updatedAct = null;
        foreach ($data['activities'] as $i => $item) {
            if ($item['id'] == $actId) {
                if ($activeState !== null) {
                    $data['activities'][$i]['active'] = $activeState;
                } else {
                    $curr = $item['active'] ?? true;
                    $data['activities'][$i]['active'] = !$curr;
                }
                $updatedAct = $data['activities'][$i];
                break;
            }
        }
        writeJson($agendaFile, $data);
        echo json_encode(['success' => true, 'activity' => $updatedAct]);
        exit;
    }

    // Reordenar paneles
    if (isset($input['action']) && $input['action'] === 'reorder') {
        $newOrderIds = $input['order'] ?? [];
        $data = readJson($panelesFile, ['panels' => []]);
        $reordered = [];
        foreach ($newOrderIds as $id) {
            foreach ($data['panels'] as $p) {
                if ($p['id'] == $id) {
                    $reordered[] = $p;
                    break;
                }
            }
        }
        foreach ($data['panels'] as $p) {
            if (!in_array($p['id'], $newOrderIds)) {
                $reordered[] = $p;
            }
        }
        $data['panels'] = $reordered;
        writeJson($panelesFile, $data);
        echo json_encode(['success' => true]);
        exit;
    }

    // Guardar / actualizar Panel
    if (isset($input['panel'])) {
        $newPanel = $input['panel'];
        $data = readJson($panelesFile, ['panels' => []]);
        $found = false;
        foreach ($data['panels'] as $i => $p) {
            if ($p['id'] == $newPanel['id']) {
                $data['panels'][$i] = $newPanel;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $data['panels'][] = $newPanel;
        }
        writeJson($panelesFile, $data);
        echo json_encode(['success' => true, 'panel' => $newPanel]);
        exit;
    }

    // Guardar / actualizar Actividad de Agenda
    if (isset($input['activity'])) {
        $act = $input['activity'];
        $data = readJson($agendaFile, ['activities' => []]);
        if (!isset($act['active'])) {
            $act['active'] = true;
        }
        if (empty($act['id'])) {
            $act['id'] = time();
            $data['activities'][] = $act;
        } else {
            $found = false;
            foreach ($data['activities'] as $i => $item) {
                if ($item['id'] == $act['id']) {
                    $data['activities'][$i] = $act;
                    $found = true;
                    break;
                }
            }
            if (!$found) $data['activities'][] = $act;
        }
        writeJson($agendaFile, $data);
        echo json_encode(['success' => true, 'activity' => $act]);
        exit;
    }

    // Actualizar estado de reserva (confirmar / visto / trazabilidad)
    if (isset($input['action']) && $input['action'] === 'update_booking_status') {
        $bId = $input['id'] ?? 0;
        $status = $input['status'] ?? null;
        $data = readJson($reservasFile, ['bookings' => []]);
        foreach ($data['bookings'] as $i => $b) {
            if ($b['id'] == $bId) {
                if ($status) $data['bookings'][$i]['status'] = $status;
                if (isset($input['seen'])) $data['bookings'][$i]['seen'] = (bool)$input['seen'];
                if (isset($input['seenBy'])) $data['bookings'][$i]['seenBy'] = $input['seenBy'];
                if (isset($input['seenAt'])) $data['bookings'][$i]['seenAt'] = $input['seenAt'];
                break;
            }
        }
        writeJson($reservasFile, $data);
        echo json_encode(['success' => true]);
        exit;
    }
}

// ═══════════════════════════════════════════
// DELETE: Eliminar elementos
// ═══════════════════════════════════════════
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $isAdminAuth = (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true)
        || (isset($_SERVER['HTTP_X_ADMIN_AUTH']) && $_SERVER['HTTP_X_ADMIN_AUTH'] === 'true')
        || (isset($input['admin_token']) && $input['admin_token'] === 'pajarillo_admin');

    if (!$isAdminAuth) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }
    $id = $input['id'] ?? null;
    $type = $input['type'] ?? 'panel'; // 'panel', 'activity', 'booking'

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID no proporcionado']);
        exit;
    }

    if ($type === 'activity') {
        $data = readJson($agendaFile, ['activities' => []]);
        $data['activities'] = array_values(array_filter($data['activities'], fn($a) => $a['id'] != $id));
        writeJson($agendaFile, $data);
    } elseif ($type === 'booking') {
        $data = readJson($reservasFile, ['bookings' => []]);
        $data['bookings'] = array_values(array_filter($data['bookings'], fn($b) => $b['id'] != $id));
        writeJson($reservasFile, $data);
    } else {
        $data = readJson($panelesFile, ['panels' => []]);
        $data['panels'] = array_values(array_filter($data['panels'], fn($p) => $p['id'] != $id));
        writeJson($panelesFile, $data);
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
