<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$analyticsFile = '../data/analytics.json';

function getAnalytics() {
    global $analyticsFile;
    if (!file_exists($analyticsFile)) {
        return [
            'summary' => ['totalVisits' => 0, 'uniqueVisitors' => 0, 'qrScans' => 0, 'tourBookings' => 0, 'audioListens' => 0, 'downloads' => 0],
            'languages' => ['es' => 0, 'en' => 0, 'fr' => 0],
            'topSections' => [],
            'topPanels' => [],
            'monthlyTrend' => [],
            'recentEvents' => []
        ];
    }
    return json_decode(file_get_contents($analyticsFile), true) ?: [];
}

function saveAnalytics($data) {
    global $analyticsFile;
    file_put_contents($analyticsFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: Devolver analíticas (disponible para el panel de administración)
if ($method === 'GET') {
    $data = getAnalytics();
    echo json_encode($data);
    exit;
}

// POST: Registrar un evento anónimo de visitante
if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload || !isset($payload['type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Evento inválido']);
        exit;
    }

    $data = getAnalytics();
    $type = $payload['type'];
    $lang = $payload['lang'] ?? 'es';

    // Incrementar contadores globales
    if ($type === 'page_view') {
        $data['summary']['totalVisits'] = ($data['summary']['totalVisits'] ?? 0) + 1;
        if (!empty($payload['is_unique'])) {
            $data['summary']['uniqueVisitors'] = ($data['summary']['uniqueVisitors'] ?? 0) + 1;
        }
        if (isset($data['languages'][$lang])) {
            $data['languages'][$lang]++;
        }
    } elseif ($type === 'qr_scan') {
        $data['summary']['qrScans'] = ($data['summary']['qrScans'] ?? 0) + 1;
        $panelId = $payload['panel_id'] ?? null;
        if ($panelId) {
            foreach ($data['topPanels'] as &$tp) {
                if ($tp['id'] == $panelId) {
                    $tp['scans'] = ($tp['scans'] ?? 0) + 1;
                    break;
                }
            }
        }
    } elseif ($type === 'audio_play') {
        $data['summary']['audioListens'] = ($data['summary']['audioListens'] ?? 0) + 1;
    } elseif ($type === 'download') {
        $data['summary']['downloads'] = ($data['summary']['downloads'] ?? 0) + 1;
    } elseif ($type === 'booking') {
        $data['summary']['tourBookings'] = ($data['summary']['tourBookings'] ?? 0) + 1;
    }

    // Registrar en eventos recientes (mantener últimos 40)
    $eventRecord = [
        'time' => date('Y-m-d H:i'),
        'type' => $type,
        'lang' => $lang,
        'detail' => $payload['detail'] ?? ($payload['section'] ?? ($payload['panel'] ?? '')),
        'device' => $payload['device'] ?? 'Móvil'
    ];
    array_unshift($data['recentEvents'], $eventRecord);
    if (count($data['recentEvents']) > 40) {
        $data['recentEvents'] = array_slice($data['recentEvents'], 0, 40);
    }

    saveAnalytics($data);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
