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
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

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
    $raw = @file_get_contents($analyticsFile);
    $decoded = $raw ? json_decode($raw, true) : null;
    return is_array($decoded) ? $decoded : [];
}

function saveAnalytics($data) {
    global $analyticsFile;
    $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    @file_put_contents($analyticsFile, $encoded, LOCK_EX);
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: Devolver analíticas (restringido exclusivamente a gestores autenticados)
if ($method === 'GET') {
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }
    $data = getAnalytics();
    echo json_encode($data);
    exit;
}

// POST: Registrar un evento anónimo de visitante o acciones administrativas
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload) || !isset($payload['type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Evento inválido']);
        exit;
    }

    // Descartar automáticamente cualquier tráfico procedente del panel de administración
    if (!empty($payload['is_admin'])) {
        echo json_encode(['success' => true, 'ignored' => 'admin_traffic']);
        exit;
    }

    $type = $payload['type'];

    // Restablecer analíticas a cero (exige sesión administrativa)
    if ($type === 'reset_all') {
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        $fresh = [
            'summary' => ['totalVisits' => 0, 'uniqueVisitors' => 0, 'qrScans' => 0, 'tourBookings' => 0, 'audioListens' => 0, 'downloads' => 0],
            'languages' => ['es' => 0, 'en' => 0, 'fr' => 0],
            'historyByDay' => [],
            'historyByMonth' => [],
            'historyByYear' => [],
            'topSections' => [],
            'topPanels' => [],
            'recentEvents' => []
        ];
        saveAnalytics($fresh);
        echo json_encode(['success' => true, 'reset' => true]);
        exit;
    }

    // Sincronización analítica desde administración (exige sesión administrativa)
    if ($type === 'sync_analytics' && !empty($payload['data'])) {
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            exit;
        }
        $inc = $payload['data'];
        $cur = getAnalytics();

        if (isset($inc['summary'])) {
            $cur['summary']['totalVisits'] = max((int)($cur['summary']['totalVisits'] ?? 0), (int)($inc['summary']['totalVisits'] ?? 0));
            $cur['summary']['uniqueVisitors'] = max((int)($cur['summary']['uniqueVisitors'] ?? 0), (int)($inc['summary']['uniqueVisitors'] ?? 0));
            $cur['summary']['qrScans'] = max((int)($cur['summary']['qrScans'] ?? 0), (int)($inc['summary']['qrScans'] ?? 0));
            $cur['summary']['tourBookings'] = max((int)($cur['summary']['tourBookings'] ?? 0), (int)($inc['summary']['tourBookings'] ?? 0));
            $cur['summary']['audioListens'] = max((int)($cur['summary']['audioListens'] ?? 0), (int)($inc['summary']['audioListens'] ?? 0));
            $cur['summary']['downloads'] = max((int)($cur['summary']['downloads'] ?? 0), (int)($inc['summary']['downloads'] ?? 0));
        }

        if (isset($inc['languages'])) {
            $cur['languages']['es'] = max((int)($cur['languages']['es'] ?? 0), (int)($inc['languages']['es'] ?? 0));
            $cur['languages']['en'] = max((int)($cur['languages']['en'] ?? 0), (int)($inc['languages']['en'] ?? 0));
            $cur['languages']['fr'] = max((int)($cur['languages']['fr'] ?? 0), (int)($inc['languages']['fr'] ?? 0));
        }

        if (isset($inc['historyByMonth']) && is_array($inc['historyByMonth'])) {
            if (!isset($cur['historyByMonth'])) $cur['historyByMonth'] = [];
            foreach ($inc['historyByMonth'] as $mKey => $mData) {
                if (!isset($cur['historyByMonth'][$mKey])) {
                    $cur['historyByMonth'][$mKey] = $mData;
                } else {
                    $cur['historyByMonth'][$mKey]['visits'] = max((int)($cur['historyByMonth'][$mKey]['visits'] ?? 0), (int)($mData['visits'] ?? 0));
                    $cur['historyByMonth'][$mKey]['unique'] = max((int)($cur['historyByMonth'][$mKey]['unique'] ?? 0), (int)($mData['unique'] ?? 0));
                    $cur['historyByMonth'][$mKey]['qr'] = max((int)($cur['historyByMonth'][$mKey]['qr'] ?? 0), (int)($mData['qr'] ?? 0));
                }
            }
        }

        if (isset($inc['historyByYear']) && is_array($inc['historyByYear'])) {
            if (!isset($cur['historyByYear'])) $cur['historyByYear'] = [];
            foreach ($inc['historyByYear'] as $yKey => $yData) {
                if (!isset($cur['historyByYear'][$yKey])) {
                    $cur['historyByYear'][$yKey] = $yData;
                } else {
                    $cur['historyByYear'][$yKey]['visits'] = max((int)($cur['historyByYear'][$yKey]['visits'] ?? 0), (int)($yData['visits'] ?? 0));
                    $cur['historyByYear'][$yKey]['unique'] = max((int)($cur['historyByYear'][$yKey]['unique'] ?? 0), (int)($yData['unique'] ?? 0));
                    $cur['historyByYear'][$yKey]['qr'] = max((int)($cur['historyByYear'][$yKey]['qr'] ?? 0), (int)($yData['qr'] ?? 0));
                }
            }
        }

        if (isset($inc['historyByDay']) && is_array($inc['historyByDay'])) {
            if (!isset($cur['historyByDay'])) $cur['historyByDay'] = [];
            foreach ($inc['historyByDay'] as $dKey => $dData) {
                if (!isset($cur['historyByDay'][$dKey])) {
                    $cur['historyByDay'][$dKey] = $dData;
                } else {
                    $cur['historyByDay'][$dKey]['visits'] = max((int)($cur['historyByDay'][$dKey]['visits'] ?? 0), (int)($dData['visits'] ?? 0));
                    $cur['historyByDay'][$dKey]['unique'] = max((int)($cur['historyByDay'][$dKey]['unique'] ?? 0), (int)($dData['unique'] ?? 0));
                    $cur['historyByDay'][$dKey]['qr'] = max((int)($cur['historyByDay'][$dKey]['qr'] ?? 0), (int)($dData['qr'] ?? 0));
                }
            }
        }

        saveAnalytics($cur);
        echo json_encode(['success' => true, 'data' => $cur]);
        exit;
    }

    $data = getAnalytics();
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
        if (!empty($payload['is_new_session'])) {
            $data['summary']['totalVisits'] = ($data['summary']['totalVisits'] ?? 0) + 1;
            $data['historyByDay'][$todayStr]['visits']++;
            $data['historyByMonth'][$monthStr]['visits']++;
            $data['historyByYear'][$yearStr]['visits']++;
        }

        if (!empty($payload['is_unique_ever'])) {
            $data['summary']['uniqueVisitors'] = ($data['summary']['uniqueVisitors'] ?? 0) + 1;
        }
        if (!empty($payload['is_unique_today'])) {
            $data['historyByDay'][$todayStr]['unique']++;
        }
        if (!empty($payload['is_unique_month'])) {
            $data['historyByMonth'][$monthStr]['unique']++;
        }
        if (!empty($payload['is_unique_year'])) {
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
