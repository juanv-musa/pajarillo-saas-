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

$panelesFile = '../data/paneles.json';
$agendaFile = '../data/agenda.json';
$reservasFile = '../data/reservas.json';
$configFile = '../data/site_config.json';
$localesFile = '../data/locales.json';
$galleryFile = '../data/gallery.json';
$legalFile = '../data/legal.json';

// Helper para leer archivo
function readJson($filepath, $default = []) {
    if (!file_exists($filepath)) {
        return $default;
    }
    $content = file_get_contents($filepath);
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : $default;
}

// Helper para guardar archivo de forma segura con verificación de permisos
function writeJson($filepath, $data) {
    $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $res = @file_put_contents($filepath, $encoded, LOCK_EX);
    if ($res === false) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error de permisos: el servidor web no puede escribir en ' . basename($filepath) . '. Comprueba los permisos de la carpeta data/ y sus archivos (chmod 775 data/ y chmod 664 data/*.json).'
        ]);
        exit;
    }
    return true;
}

// Verificación de permisos modulares por usuario/rol
function hasModulePermission($module) {
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) return false;
    $perms = $_SESSION['admin_permissions'] ?? ['all'];
    if (in_array('all', $perms)) return true;
    return in_array($module, $perms);
}

// Verificación de protección CSRF para acciones administrativas
function verifyCsrfToken($inputData = null) {
    if (empty($_SESSION['is_admin'])) return;
    if (!empty($_SESSION['csrf_token'])) {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $token = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        if (!$token && is_array($inputData) && isset($inputData['csrf_token'])) {
            $token = $inputData['csrf_token'];
        }
        if (!$token || !hash_equals($_SESSION['csrf_token'], (string)$token)) {
            http_response_code(403);
            echo json_encode(['error' => 'Petición rechazada: token de seguridad CSRF inválido o ausente.']);
            exit;
        }
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$entity = $_GET['entity'] ?? 'panels'; // 'panels', 'agenda', 'bookings', 'config'

// ═══════════════════════════════════════════
// GET: Lectura pública o privada
// ═══════════════════════════════════════════
if ($method === 'GET') {
    if ($entity === 'config') {
        echo json_encode(readJson($configFile, ['sections' => [], 'content' => []]));
    } elseif ($entity === 'locales') {
        echo json_encode(readJson($localesFile, []));
    } elseif ($entity === 'gallery') {
        echo json_encode(readJson($galleryFile, ['media' => [], 'resources' => [], 'videos' => []]));
    } elseif ($entity === 'legal') {
        echo json_encode(readJson($legalFile, []));
    } elseif ($entity === 'agenda') {
        echo json_encode(readJson($agendaFile, ['activities' => []]));
    } elseif ($entity === 'bookings') {
        // Solo el gestor autenticado con permiso de reservas puede verlas
        if (!hasModulePermission('bookings')) {
            http_response_code(403);
            echo json_encode(['error' => 'No autorizado para consultar reservas']);
            exit;
        }
        echo json_encode(readJson($reservasFile, ['bookings' => []]));
    } elseif ($entity === 'captcha') {
        $ops = ['+', '-'];
        $op = $ops[random_int(0, 1)];
        if ($op === '+') {
            $n1 = random_int(2, 9);
            $n2 = random_int(1, 9);
            $ans = $n1 + $n2;
            $q = "¿Cuánto es $n1 + $n2?";
        } else {
            $n1 = random_int(6, 15);
            $n2 = random_int(1, $n1 - 1);
            $ans = $n1 - $n2;
            $q = "¿Cuánto es $n1 - $n2?";
        }
        $_SESSION['booking_captcha_result'] = $ans;
        $_SESSION['booking_captcha_time'] = time();

        echo json_encode([
            'success' => true,
            'question' => $q
        ]);
        exit;
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

    // CASO ESPECIAL: Reserva desde la web pública (no requiere sesión administrativa)
    if (isset($input['action']) && $input['action'] === 'new_booking') {
        $booking = $input['booking'] ?? null;
        if (!is_array($booking)) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos de reserva inválidos']);
            exit;
        }

        // 1. Verificación Honeypot anti-bot
        if (!empty($booking['website_hp'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Solicitud rechazada por detección automática de bot.']);
            exit;
        }

        // 2. Control de frecuencia / Rate-limiting por sesión
        $now = time();
        if (isset($_SESSION['last_booking_ts']) && ($now - $_SESSION['last_booking_ts'] < 10)) {
            http_response_code(429);
            echo json_encode(['error' => 'Por favor, espera unos segundos antes de enviar otra solicitud de reserva.']);
            exit;
        }

        // 3. Verificación OBLIGATORIA y estricta del CAPTCHA anti-spam
        if (!isset($_SESSION['booking_captcha_result']) || !isset($_SESSION['booking_captcha_time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Sesión de seguridad no encontrada o expirada. Por favor, pulsa «Cambiar» o recarga la página.']);
            exit;
        }

        // Detección de bots: envío inhumano en menos de 2 segundos desde que se generó el captcha
        if ($now - $_SESSION['booking_captcha_time'] < 2) {
            http_response_code(400);
            echo json_encode(['error' => 'Envío demasiado rápido detectado como posible bot automatizado.']);
            exit;
        }

        // Caducidad del captcha: máximo 15 minutos
        if ($now - $_SESSION['booking_captcha_time'] > 900) {
            unset($_SESSION['booking_captcha_result']);
            unset($_SESSION['booking_captcha_time']);
            http_response_code(400);
            echo json_encode(['error' => 'El código de seguridad ha caducado. Por favor, pulsa «Cambiar» y resuelve la nueva operación.']);
            exit;
        }

        if (!isset($booking['captcha']) || trim((string)$booking['captcha']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Debes resolver la operación matemática de seguridad anti-spam.']);
            exit;
        }

        $userCaptcha = filter_var($booking['captcha'], FILTER_VALIDATE_INT);
        $expectedCaptcha = (int)$_SESSION['booking_captcha_result'];

        // Destruir el captcha inmediatamente para que sea de un solo uso (prevención de ataques replay)
        unset($_SESSION['booking_captcha_result']);
        unset($_SESSION['booking_captcha_time']);

        if ($userCaptcha === false || $userCaptcha !== $expectedCaptcha) {
            http_response_code(400);
            echo json_encode(['error' => 'El resultado del control de seguridad anti-spam es incorrecto.']);
            exit;
        }

        // 4. Validación exhaustiva y reforzada de cada dato introducido:

        // A) Nombre completo
        $name = trim(htmlspecialchars(strip_tags((string)($booking['name'] ?? '')), ENT_QUOTES, 'UTF-8'));
        if (mb_strlen($name) < 3 || mb_strlen($name) > 70) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre completo debe tener entre 3 y 70 caracteres.']);
            exit;
        }
        if (!preg_match('/^[\p{L}\s\.\'\-]{3,70}$/u', $name)) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre solo puede contener letras y caracteres ortográficos válidos.']);
            exit;
        }

        // B) Correo electrónico
        $email = trim(filter_var((string)($booking['email'] ?? ''), FILTER_SANITIZE_EMAIL));
        if (strlen($email) < 6 || strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'El correo electrónico introducido no tiene un formato válido.']);
            exit;
        }
        if (strpos($email, "\r") !== false || strpos($email, "\n") !== false) {
            http_response_code(400);
            echo json_encode(['error' => 'Formato de correo no permitido.']);
            exit;
        }

        // C) Teléfono de contacto
        $rawPhone = trim((string)($booking['phone'] ?? ''));
        $cleanPhone = preg_replace('/[^0-9+\s\-()]/', '', $rawPhone);
        $digitCount = strlen(preg_replace('/\D/', '', $cleanPhone));
        if ($digitCount < 7 || $digitCount > 15 || !preg_match('/^(\+?[0-9]{1,4}[\s\-]?)?[0-9\s\-()]{7,20}$/', $cleanPhone)) {
            http_response_code(400);
            echo json_encode(['error' => 'El número de teléfono debe tener un formato numérico válido (entre 7 y 15 dígitos).']);
            exit;
        }

        // D) Fecha de visita
        $date = trim((string)($booking['date'] ?? ''));
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches)) {
            http_response_code(400);
            echo json_encode(['error' => 'La fecha debe tener el formato AAAA-MM-DD.']);
            exit;
        }
        $year = (int)$matches[1];
        $month = (int)$matches[2];
        $day = (int)$matches[3];
        if (!checkdate($month, $day, $year)) {
            http_response_code(400);
            echo json_encode(['error' => 'La fecha seleccionada no existe en el calendario.']);
            exit;
        }

        $bookingTs = strtotime($date);
        $todayTs = strtotime(date('Y-m-d'));
        if ($bookingTs < $todayTs) {
            http_response_code(400);
            echo json_encode(['error' => 'No es posible solicitar reservas para fechas pasadas.']);
            exit;
        }
        $maxFutureTs = strtotime('+180 days', $todayTs);
        if ($bookingTs > $maxFutureTs) {
            http_response_code(400);
            echo json_encode(['error' => 'La fecha seleccionada no puede superar los 6 meses de antelación.']);
            exit;
        }
        // Comprobación de horario del centro: Lunes cerrado por mantenimiento
        if ((int)date('N', $bookingTs) === 1) {
            http_response_code(400);
            echo json_encode(['error' => 'El centro permanece cerrado los lunes por mantenimiento. Por favor, selecciona una fecha de martes a domingo.']);
            exit;
        }

        // E) Turno horario
        $validTimes = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'];
        $time = trim(htmlspecialchars(strip_tags((string)($booking['time'] ?? '11:00')), ENT_QUOTES, 'UTF-8'));
        if (!in_array($time, $validTimes, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'El turno horario seleccionado no es válido.']);
            exit;
        }

        // F) Número de personas
        $people = filter_var($booking['people'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 25]]);
        if ($people === false) {
            http_response_code(400);
            echo json_encode(['error' => 'El número de visitantes debe ser entre 1 y 25 personas. Para grupos mayores, contacta directamente con Turismo de Huelma.']);
            exit;
        }

        // G) Idioma
        $rawLang = strtolower(trim((string)($booking['lang'] ?? 'es')));
        $lang = in_array($rawLang, ['es', 'en', 'fr'], true) ? $rawLang : 'es';

        // H) Observaciones / Necesidades especiales
        $rawNotes = (string)($booking['notes'] ?? '');
        if (preg_match('/https?:\/\/|www\./i', $rawNotes)) {
            http_response_code(400);
            echo json_encode(['error' => 'El campo de observaciones no puede incluir enlaces web ni URLs.']);
            exit;
        }
        $notes = trim(htmlspecialchars(strip_tags($rawNotes), ENT_QUOTES, 'UTF-8'));
        if (mb_strlen($notes) > 300) {
            $notes = mb_substr($notes, 0, 300);
        }

        // 5. Asignación de ID anti-colisión y código de localizador
        $data = readJson($reservasFile, ['bookings' => []]);
        $maxId = 0;
        foreach ($data['bookings'] as $b) {
            $bNum = isset($b['id']) ? (int)$b['id'] : 0;
            if ($bNum > $maxId) $maxId = $bNum;
        }
        $newId = max($maxId + 1, (int)(microtime(true) * 1000));
        $refCode = 'RES-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

        $cleanBooking = [
            'id' => $newId,
            'ref' => $refCode,
            'name' => $name,
            'email' => $email,
            'phone' => $cleanPhone,
            'date' => $date,
            'time' => $time,
            'people' => $people,
            'lang' => $lang,
            'notes' => $notes,
            'createdAt' => date('Y-m-d H:i'),
            'status' => 'pending',
            'seen' => false
        ];

        $_SESSION['last_booking_ts'] = $now;
        $data['bookings'][] = $cleanBooking;
        writeJson($reservasFile, $data);
        echo json_encode(['success' => true, 'id' => $cleanBooking['id'], 'ref' => $cleanBooking['ref']]);
        exit;
    }

    // Para el resto de acciones POST se exige sesión de administración activa y verificación CSRF
    $isAdminAuth = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;

    if (!$isAdminAuth) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado. Se requiere sesión de administración.']);
        exit;
    }

    verifyCsrfToken($input);

    // Guardar configuración global del sitio (secciones y textos)
    if (isset($input['action']) && $input['action'] === 'save_config') {
        if (!hasModulePermission('sections') && !hasModulePermission('contents')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para editar la configuración del sitio.']);
            exit;
        }
        $config = $input['config'] ?? [];
        writeJson($configFile, $config);
        echo json_encode(['success' => true, 'config' => $config]);
        exit;
    }

    // Guardar traducciones / textos multilingüe en el servidor
    if (isset($input['action']) && $input['action'] === 'save_locales') {
        if (!hasModulePermission('contents')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar textos.']);
            exit;
        }
        $locales = $input['locales'] ?? [];
        writeJson($localesFile, $locales);

        // Si incluye español, sincronizar claves clave en locales/es.json
        if (isset($locales['es']) && is_array($locales['es'])) {
            $esFile = '../locales/es.json';
            $esData = readJson($esFile, []);
            if (!isset($esData['galeria'])) $esData['galeria'] = [];
            if (!empty($locales['es']['galeria_tab_fotos'])) $esData['galeria']['tab_fotos'] = $locales['es']['galeria_tab_fotos'];
            if (!empty($locales['es']['galeria_tab_modelo3d'])) $esData['galeria']['tab_modelo3d'] = $locales['es']['galeria_tab_modelo3d'];
            if (!empty($locales['es']['galeria_tab_recursos'])) $esData['galeria']['tab_recursos'] = $locales['es']['galeria_tab_recursos'];
            if (!empty($locales['es']['galeria_tab_videos'])) $esData['galeria']['tab_videos'] = $locales['es']['galeria_tab_videos'];
            if (!empty($locales['es']['galeria_title'])) $esData['galeria']['title'] = $locales['es']['galeria_title'];
            if (!empty($locales['es']['galeria_subtitle'])) $esData['galeria']['subtitle'] = $locales['es']['galeria_subtitle'];
            writeJson($esFile, $esData);
        }

        echo json_encode(['success' => true]);
        exit;
    }

    // Guardar o sincronizar vídeos del kiosco y web pública
    if (isset($input['action']) && ($input['action'] === 'save_kiosk_videos' || $input['action'] === 'delete_kiosk_video')) {
        if (!hasModulePermission('kiosco') && !hasModulePermission('gallery')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar vídeos y pantallas.']);
            exit;
        }
        $galleryData = readJson($galleryFile, ['media' => [], 'resources' => [], 'videos' => []]);
        if ($input['action'] === 'save_kiosk_videos') {
            $galleryData['videos'] = $input['videos'] ?? [];
        } elseif ($input['action'] === 'delete_kiosk_video') {
            $delId = $input['id'] ?? '';
            $galleryData['videos'] = array_values(array_filter($galleryData['videos'] ?? [], fn($v) => ($v['id'] ?? '') !== $delId));
        }
        writeJson($galleryFile, $galleryData);
        echo json_encode(['success' => true, 'videos' => $galleryData['videos']]);
        exit;
    }

    // Guardar o sincronizar elementos de galería (fotos, pdf, etc.)
    if (isset($input['action']) && $input['action'] === 'save_gallery_items') {
        if (!hasModulePermission('gallery')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar la galería.']);
            exit;
        }
        $galleryData = readJson($galleryFile, ['media' => [], 'resources' => [], 'videos' => []]);
        $items = $input['items'] ?? [];
        $media = [];
        $resources = [];
        foreach ($items as $item) {
            $type = $item['type'] ?? 'foto';
            if ($type === 'foto') {
                $media[] = [
                    'id' => 'foto_' . ($item['id'] ?? uniqid()),
                    'type' => 'photo',
                    'src' => $item['full'] ?? '',
                    'thumb' => $item['thumb'] ?? ($item['full'] ?? ''),
                    'caption' => $item['title'] ?? '',
                    'author' => 'Centro de Interpretación',
                    'category' => is_array($item['category'] ?? null) ? ($item['category']['es'] ?? 'Patrimonio') : ($item['category'] ?? 'Patrimonio')
                ];
            } elseif ($type === 'pdf' || $type === 'web' || $type === 'enlace') {
                $isWeb = ($type === 'web' || $type === 'enlace');
                $targetUrl = $isWeb ? ($item['full'] ?? ($item['file'] ?? '')) : ($item['file'] ?? ($item['full'] ?? ''));
                $resources[] = [
                    'id' => 'res_' . ($item['id'] ?? uniqid()),
                    'type' => $isWeb ? 'web' : 'pdf',
                    'title' => $item['title'] ?? '',
                    'file' => $targetUrl,
                    'format' => $isWeb ? 'Sitio Web / Enlace' : 'PDF / Digital',
                    'icon' => $isWeb ? '🌐' : '📄',
                    'badge' => is_array($item['category'] ?? null) ? ($item['category']['es'] ?? ($isWeb ? 'Enlace Web' : 'Documentación')) : ($item['category'] ?? ($isWeb ? 'Enlace Web' : 'Documentación')),
                    'description' => $item['desc'] ?? '',
                    'url' => $targetUrl
                ];
            }
        }
        $galleryData['media'] = $media;
        $galleryData['resources'] = $resources;
        writeJson($galleryFile, $galleryData);
        echo json_encode(['success' => true]);
        exit;
    }

    // Guardar / Sincronizar información de Legal y Calidad
    if (isset($input['action']) && $input['action'] === 'save_legal') {
        if (!hasModulePermission('legal') && !hasModulePermission('settings') && !hasModulePermission('contents')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar Legal y Calidad.']);
            exit;
        }
        $legalData = $input['data'] ?? [];
        writeJson($legalFile, $legalData);
        echo json_encode(['success' => true]);
        exit;
    }

    // Guardar / Sincronizar toda la lista de actividades de la agenda
    if (isset($input['action']) && $input['action'] === 'save_all_activities') {
        if (!hasModulePermission('agenda')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar la agenda.']);
            exit;
        }
        $activities = is_array($input['activities'] ?? null) ? $input['activities'] : [];
        $data = ['activities' => $activities];
        writeJson($agendaFile, $data);
        echo json_encode(['success' => true, 'count' => count($activities)]);
        exit;
    }

    // Activar / Desactivar actividad de agenda directamente
    if (isset($input['action']) && $input['action'] === 'toggle_activity') {
        if (!hasModulePermission('agenda')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar la agenda.']);
            exit;
        }
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
        if (!hasModulePermission('panels')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar paneles.']);
            exit;
        }
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
        if (!hasModulePermission('panels')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar paneles.']);
            exit;
        }
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
        if (!hasModulePermission('agenda')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar la agenda.']);
            exit;
        }
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
        if (!hasModulePermission('bookings')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para gestionar reservas.']);
            exit;
        }
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
    $isAdminAuth = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;

    if (!$isAdminAuth) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado. Se requiere sesión de administración.']);
        exit;
    }

    verifyCsrfToken($input);
    $id = $input['id'] ?? null;
    $type = $input['type'] ?? 'panel'; // 'panel', 'activity', 'booking'

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID no proporcionado']);
        exit;
    }

    if ($type === 'activity') {
        if (!hasModulePermission('agenda')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para eliminar actividades.']);
            exit;
        }
        $data = readJson($agendaFile, ['activities' => []]);
        $data['activities'] = array_values(array_filter($data['activities'], fn($a) => $a['id'] != $id));
        writeJson($agendaFile, $data);
    } elseif ($type === 'booking') {
        if (!hasModulePermission('bookings')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para eliminar reservas.']);
            exit;
        }
        $data = readJson($reservasFile, ['bookings' => []]);
        $data['bookings'] = array_values(array_filter($data['bookings'], fn($b) => $b['id'] != $id));
        writeJson($reservasFile, $data);
    } else {
        if (!hasModulePermission('panels')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para eliminar paneles.']);
            exit;
        }
        $data = readJson($panelesFile, ['panels' => []]);
        $data['panels'] = array_values(array_filter($data['panels'], fn($p) => $p['id'] != $id));
        writeJson($panelesFile, $data);
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
