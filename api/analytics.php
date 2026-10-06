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

    $todayStr = date('Y-m-d');
    $monthStr = date('Y-m');
    $yearStr = date('Y');

    if (!isset($data['historyByDay'])) $data['historyByDay'] = [];
    if (!isset($data['historyByMonth'])) $data['historyByMonth'] = [];
    if (!isset($data['historyByYear'])) $data['historyByYear'] = [];

    if (!isset($data['historyByDay'][$todayStr])) {
        $data['historyByDay'][$todayStr] = ['visits' => 0, 'unique' => 0, 'qr' => 0, 'audio' => 0, 'downloads' => 0, 'bookings' => 0, 'es' => 0, 'en' => 0, 'fr' => 0];
    }
    if (!isset($data['historyByMonth'][$monthStr])) {
        $data['historyByMonth'][$monthStr] = ['visits' => 0, 'unique' => 0, 'qr' => 0, 'audio' => 0, 'downloads' => 0, 'bookings' => 0, 'es' => 0, 'en' => 0, 'fr' => 0];
    }
    if (!isset($data['historyByYear'][$yearStr])) {
        $data['historyByYear'][$yearStr] = ['visits' => 0, 'unique' => 0, 'qr' => 0, 'audio' => 0, 'downloads' => 0, 'bookings' => 0, 'es' => 0, 'en' => 0, 'fr' => 0];
    }

    // Incrementar contadores globales y buckets permanentes
    if ($type === 'page_view') {
        $data['summary']['totalVisits'] = ($data['summary']['totalVisits'] ?? 0) + 1;
        $data['historyByDay'][$todayStr]['visits']++;
        $data['historyByMonth'][$monthStr]['visits']++;
        $data['historyByYear'][$yearStr]['visits']++;

        if (!empty($payload['is_unique'])) {
            $data['summary']['uniqueVisitors'] = ($data['summary']['uniqueVisitors'] ?? 0) + 1;
            $data['historyByDay'][$todayStr]['unique']++;
            $data['historyByMonth'][$monthStr]['unique']++;
            $data['historyByYear'][$yearStr]['unique']++;
        }
        if (isset($data['languages'][$lang])) {
            $data['languages'][$lang]++;
        }
        if (isset($data['historyByDay'][$todayStr][$lang])) $data['historyByDay'][$todayStr][$lang]++;
        if (isset($data['historyByMonth'][$monthStr][$lang])) $data['historyByMonth'][$monthStr][$lang]++;
        if (isset($data['historyByYear'][$yearStr][$lang])) $data['historyByYear'][$yearStr][$lang]++;

    } elseif ($type === 'qr_scan') {
        $data['summary']['qrScans'] = ($data['summary']['qrScans'] ?? 0) + 1;
        $data['historyByDay'][$todayStr]['qr']++;
        $data['historyByMonth'][$monthStr]['qr']++;
        $data['historyByYear'][$yearStr]['qr']++;

        $panelId = $payload['panel_id'] ?? null;
        if ($panelId && isset($data['topPanels'])) {
            foreach ($data['topPanels'] as &$tp) {
                if ($tp['id'] == $panelId) {
                    $tp['scans'] = ($tp['scans'] ?? 0) + 1;
                    break;
                }
            }
        }
    } elseif ($type === 'audio_play') {
        $data['summary']['audioListens'] = ($data['summary']['audioListens'] ?? 0) + 1;
        $data['historyByDay'][$todayStr]['audio']++;
        $data['historyByMonth'][$monthStr]['audio']++;
        $data['historyByYear'][$yearStr]['audio']++;
    } elseif ($type === 'download') {
        $data['summary']['downloads'] = ($data['summary']['downloads'] ?? 0) + 1;
        $data['historyByDay'][$todayStr]['downloads']++;
        $data['historyByMonth'][$monthStr]['downloads']++;
        $data['historyByYear'][$yearStr]['downloads']++;
    } elseif ($type === 'booking') {
        $data['summary']['tourBookings'] = ($data['summary']['tourBookings'] ?? 0) + 1;
        $data['historyByDay'][$todayStr]['bookings']++;
        $data['historyByMonth'][$monthStr]['bookings']++;
        $data['historyByYear'][$yearStr]['bookings']++;
    }

    // Registrar en eventos recientes (mantener últimos 40)
    $eventRecord = [
        'time' => date('Y-m-d H:i'),
        'type' => $type,
        'lang' => $lang,
        'detail' => $payload['detail'] ?? ($payload['section'] ?? ($payload['panel'] ?? '')),
        'device' => $payload['device'] ?? 'Móvil'
    ];
    if (!isset($data['recentEvents'])) $data['recentEvents'] = [];
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
