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
$captchaNoncesFile = '../data/captcha_nonces.json';

function safeStrlen($str) {
    return function_exists('mb_strlen') ? mb_strlen($str, 'UTF-8') : strlen($str);
}

function safeSubstr($str, $start, $length = null) {
    if (function_exists('mb_substr')) {
        return $length === null ? mb_substr($str, $start, null, 'UTF-8') : mb_substr($str, $start, $length, 'UTF-8');
    }
    return $length === null ? substr($str, $start) : substr($str, $start, $length);
}

// Registro atómico y global de nonces de CAPTCHA consumidos (impide reutilización entre sesiones distintas)
function consumeCaptchaNonceGlobal($nonce, $now, $ttl = 900) {
    global $captchaNoncesFile;
    $fp = @fopen($captchaNoncesFile, 'c+');
    if (!$fp) {
        return true; // Si no hay permiso de escritura en disco, la comprobación de sesión ya protege
    }
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }
    $raw = stream_get_contents($fp);
    $used = $raw ? json_decode($raw, true) : [];
    if (!is_array($used)) {
        $used = [];
    }
    // Purgar nonces expirados
    foreach ($used as $k => $ts) {
        if ($now - (int)$ts > $ttl) {
            unset($used[$k]);
        }
    }
    if (isset($used[$nonce])) {
        flock($fp, LOCK_UN);
        fclose($fp);
        return false;
    }
    $used[$nonce] = $now;
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($used));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
}

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

// Verificación de permisos modulares por usuario/rol (fail-closed)
function hasModulePermission($module) {
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) return false;
    if (($_SESSION['admin_user'] ?? '') === 'admin') return true;
    $perms = $_SESSION['admin_permissions'] ?? [];
    if (!is_array($perms)) return false;
    if (in_array('all', $perms, true)) return true;
    return in_array($module, $perms, true);
}

// Verificación estricta de administrador con acceso total
function isFullAdmin() {
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) return false;
    if (($_SESSION['admin_user'] ?? '') === 'admin') return true;
    $perms = $_SESSION['admin_permissions'] ?? [];
    return is_array($perms) && in_array('all', $perms, true);
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

// Clave fija para firma criptográfica HMAC de retos CAPTCHA
define('CAPTCHA_HMAC_SECRET', 'cipajarillo_sec_captcha_hmac_2026_98d7f1e4a3c2');

// Generador de CAPTCHA vectorial SVG protegido contra OCR y raspado DOM
function generateCaptchaSvg($questionText) {
    $width = 175;
    $height = 42;
    $noiseLines = '';
    for ($i = 0; $i < 6; $i++) {
        $x1 = random_int(0, $width);
        $y1 = random_int(0, $height);
        $x2 = random_int(0, $width);
        $y2 = random_int(0, $height);
        $col = sprintf('#%02x%02x%02x', random_int(170, 215), random_int(185, 220), random_int(175, 215));
        $w = random_int(1, 2);
        $noiseLines .= "<line x1=\"$x1\" y1=\"$y1\" x2=\"$x2\" y2=\"$y2\" stroke=\"$col\" stroke-width=\"$w\" />";
    }
    for ($i = 0; $i < 18; $i++) {
        $cx = random_int(0, $width);
        $cy = random_int(0, $height);
        $r = random_int(1, 2);
        $noiseLines .= "<circle cx=\"$cx\" cy=\"$cy\" r=\"$r\" fill=\"#cad6cc\" />";
    }
    
    $len = safeStrlen($questionText);
    $textSvg = '';
    $x = 10;
    for ($i = 0; $i < $len; $i++) {
        $ch = safeSubstr($questionText, $i, 1);
        $rot = random_int(-9, 9);
        $y = random_int(26, 29);
        $chEsc = htmlspecialchars($ch, ENT_XML1, 'UTF-8');
        $textSvg .= "<text x=\"$x\" y=\"$y\" font-family=\"monospace, sans-serif\" font-size=\"18\" font-weight=\"bold\" fill=\"#1B3828\" transform=\"rotate($rot, $x, $y)\">$chEsc</text>";
        $x += ($ch === ' ' ? 7 : 11);
    }
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"$width\" height=\"$height\" viewBox=\"0 0 $width $height\" style=\"display:block; user-select:none; background:#f0f5f1; border-radius:4px; border:1px solid #d4ded6;\">$noiseLines$textSvg</svg>";
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
        // 1. Generador multi-operación (Suma, Resta, Multiplicación)
        $mode = random_int(1, 3);
        
        if ($mode === 1) { // Suma
            $n1 = random_int(3, 14);
            $n2 = random_int(2, 9);
            $ans = $n1 + $n2;
            $q = "$n1 + $n2 = ?";
        } elseif ($mode === 2) { // Resta
            $n1 = random_int(9, 22);
            $n2 = random_int(2, $n1 - 2);
            $ans = $n1 - $n2;
            $q = "$n1 - $n2 = ?";
        } else { // Multiplicación sencilla
            $n1 = random_int(2, 5);
            $n2 = random_int(2, 6);
            $ans = $n1 * $n2;
            $q = "$n1 × $n2 = ?";
        }

        $now = time();
        $nonce = bin2hex(random_bytes(10));
        $ipHash = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1') . CAPTCHA_HMAC_SECRET), 0, 10);
        $hmacSig = hash_hmac('sha256', $ans . '|' . $now . '|' . $nonce . '|' . $ipHash, CAPTCHA_HMAC_SECRET);
        $signedToken = $now . '.' . $nonce . '.' . $ipHash . '.' . $hmacSig;

        // Registro de sesión para protección anti-replay
        if (!isset($_SESSION['booking_captchas']) || !is_array($_SESSION['booking_captchas'])) {
            $_SESSION['booking_captchas'] = [];
        }
        foreach ($_SESSION['booking_captchas'] as $tok => $data) {
            if ($now - ($data['time'] ?? 0) > 600) {
                unset($_SESSION['booking_captchas'][$tok]);
            }
        }
        if (count($_SESSION['booking_captchas']) > 6) {
            array_shift($_SESSION['booking_captchas']);
        }
        $_SESSION['booking_captchas'][$signedToken] = [
            'result' => $ans,
            'time' => $now,
            'nonce' => $nonce
        ];

        // Compatibilidad hacia atrás
        $_SESSION['booking_captcha_result'] = $ans;
        $_SESSION['booking_captcha_time'] = $now;

        $svg = generateCaptchaSvg($q);

        echo json_encode([
            'success' => true,
            'question' => "¿Cuánto es $q?",
            'svg' => $svg,
            'token' => $signedToken
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
            echo json_encode(['error' => 'Por favor, espera al menos 10 segundos antes de enviar otra solicitud de reserva.']);
            exit;
        }

        // 3. Verificación OBLIGATORIA, criptográfica y estricta del CAPTCHA
        if (isset($_SESSION['captcha_lockout_until']) && $now < $_SESSION['captcha_lockout_until']) {
            $remain = $_SESSION['captcha_lockout_until'] - $now;
            http_response_code(429);
            echo json_encode(['error' => "Demasiados intentos erróneos del control anti-spam. Por favor, espera $remain segundos antes de volver a intentarlo."]);
            exit;
        }

        if (!isset($booking['captcha']) || trim((string)$booking['captcha']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Debes resolver la operación de seguridad anti-spam.']);
            exit;
        }
        $userCaptcha = filter_var($booking['captcha'], FILTER_VALIDATE_INT);
        if ($userCaptcha === false) {
            http_response_code(400);
            echo json_encode(['error' => 'El valor introducido en el control anti-spam debe ser numérico.']);
            exit;
        }

        $token = trim((string)($booking['captcha_token'] ?? ''));
        $captchaVerified = false;
        $tokenParts = explode('.', $token);

        if (count($tokenParts) === 4) {
            list($genTimeStr, $nonce, $tokenIpHash, $receivedSig) = $tokenParts;
            $genTime = (int)$genTimeStr;
            $currentIpHash = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1') . CAPTCHA_HMAC_SECRET), 0, 10);

            // A) Vinculación estricta a la sesión actual (impide reutilizar retos generados en otra sesión)
            if (empty($_SESSION['booking_captchas']) || !isset($_SESSION['booking_captchas'][$token])) {
                http_response_code(400);
                echo json_encode(['error' => 'El desafío de seguridad no pertenece a esta sesión o ya fue utilizado. Pulsa «Cambiar» para obtener uno nuevo.']);
                exit;
            }
            $sessionChallenge = $_SESSION['booking_captchas'][$token];
            // Quemado inmediato en sesión (un solo uso, incluso si falla)
            unset($_SESSION['booking_captchas'][$token]);
            unset($_SESSION['booking_captcha_result'], $_SESSION['booking_captcha_time']);

            // B) Comprobación de vinculación por dirección IP
            if (!hash_equals($tokenIpHash, $currentIpHash)) {
                http_response_code(403);
                echo json_encode(['error' => 'El control de seguridad no corresponde a este equipo o conexión.']);
                exit;
            }

            // C) Detección de bots: envío inhumano instantáneo (< 2 s)
            if ($now - $genTime < 2) {
                http_response_code(400);
                echo json_encode(['error' => 'Envío instantáneo detectado como posible bot automatizado. Por favor, resuelve la operación manualmente.']);
                exit;
            }

            // D) Caducidad máxima (10 minutos)
            if ($now - $genTime > 600) {
                http_response_code(400);
                echo json_encode(['error' => 'El código de seguridad ha caducado por inactividad. Por favor, pulsa «Cambiar» para obtener uno nuevo.']);
                exit;
            }

            // E) Protección anti-replay global entre sesiones + sesión local
            if (!isset($_SESSION['used_captcha_nonces']) || !is_array($_SESSION['used_captcha_nonces'])) {
                $_SESSION['used_captcha_nonces'] = [];
            }
            if (isset($_SESSION['used_captcha_nonces'][$nonce]) || !consumeCaptchaNonceGlobal($nonce, $now, 900)) {
                http_response_code(400);
                echo json_encode(['error' => 'Este control de seguridad ya ha sido utilizado (ataque de repetición evitado). Pulsa «Cambiar» para resolver uno nuevo.']);
                exit;
            }
            $_SESSION['used_captcha_nonces'][$nonce] = $now;
            if (count($_SESSION['used_captcha_nonces']) > 50) {
                array_shift($_SESSION['used_captcha_nonces']);
            }

            // F) Verificación criptográfica HMAC en tiempo constante + coincidencia con reto en sesión
            $expectedSig = hash_hmac('sha256', $userCaptcha . '|' . $genTime . '|' . $nonce . '|' . $tokenIpHash, CAPTCHA_HMAC_SECRET);
            if (hash_equals($expectedSig, $receivedSig) && (int)($sessionChallenge['result'] ?? -999999) === (int)$userCaptcha) {
                $captchaVerified = true;
            }
        }

        if (!$captchaVerified) {
            $_SESSION['captcha_fails'] = ($_SESSION['captcha_fails'] ?? 0) + 1;
            if ($_SESSION['captcha_fails'] >= 5) {
                $_SESSION['captcha_lockout_until'] = $now + 120; // Bloqueo temporal de 2 minutos
            }
            http_response_code(400);
            echo json_encode(['error' => 'El resultado del control de seguridad anti-spam es incorrecto. Por favor, pulsa «Cambiar» y resuélvelo de nuevo.']);
            exit;
        }

        // Éxito en validación de captcha: reiniciar contador de fallos
        $_SESSION['captcha_fails'] = 0;
        unset($_SESSION['captcha_lockout_until']);

        // 4. Validación exhaustiva y reforzada de cada dato introducido:

        // A) Nombre completo:
        $rawName = (string)($booking['name'] ?? '');
        $name = trim(htmlspecialchars(strip_tags($rawName), ENT_QUOTES, 'UTF-8'));
        if (safeStrlen($name) < 3 || safeStrlen($name) > 70) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre completo debe tener entre 3 y 70 caracteres.']);
            exit;
        }
        if (!preg_match('/^[\p{L}\s\.\'\-]{3,70}$/u', $name)) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre solo puede contener letras y caracteres ortográficos válidos.']);
            exit;
        }
        if (preg_match('/(.)\1{4,}/u', $name)) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre introducido contiene secuencias repetidas no válidas.']);
            exit;
        }
        if (preg_match('/\b(http|https|www|seo|crypto|bitcoin|casino|viagra|loans?|free|test|prueba)\b/i', $name)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nombre rechazado por el filtro de seguridad.']);
            exit;
        }

        // B) Correo electrónico:
        $rawEmail = (string)($booking['email'] ?? '');
        $email = trim(filter_var($rawEmail, FILTER_SANITIZE_EMAIL));
        if (strlen($email) < 6 || strlen($email) > 90 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'El correo electrónico introducido no tiene un formato válido.']);
            exit;
        }
        if (!preg_match('/^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/', $email)) {
            http_response_code(400);
            echo json_encode(['error' => 'La estructura del correo electrónico no es válida.']);
            exit;
        }
        if (strpos($email, "\r") !== false || strpos($email, "\n") !== false || strpos($email, "%0a") !== false || strpos($email, "%0d") !== false) {
            http_response_code(400);
            echo json_encode(['error' => 'Formato de correo no permitido (caracteres de control detectados).']);
            exit;
        }
        $emailParts = explode('@', $email);
        $emailDomain = strtolower(end($emailParts));
        $disposableDomains = ['mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'trashmail.com', 'sharklasers.com', 'throwawaymail.com', 'dispostable.com'];
        if (in_array($emailDomain, $disposableDomains, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'No se admiten correos electrónicos temporales o desechables.']);
            exit;
        }

        // C) Teléfono de contacto:
        $rawPhone = trim((string)($booking['phone'] ?? ''));
        $cleanPhone = preg_replace('/[^0-9+\s\-()]/', '', $rawPhone);
        $digitsOnly = preg_replace('/\D/', '', $cleanPhone);
        $digitCount = strlen($digitsOnly);
        if ($digitCount < 8 || $digitCount > 15 || !preg_match('/^(\+?[0-9]{1,4}[\s\-]?)?[0-9\s\-()]{7,20}$/', $cleanPhone)) {
            http_response_code(400);
            echo json_encode(['error' => 'El número de teléfono debe tener un formato numérico válido (entre 8 y 15 dígitos).']);
            exit;
        }
        $fakePhones = ['123456789', '987654321', '012345678', '000000000', '111111111', '222222222', '333333333', '444444444', '555555555', '666666666', '777777777', '888888888', '999999999'];
        if (in_array($digitsOnly, $fakePhones, true) || preg_match('/^(\d)\1{7,}$/', $digitsOnly)) {
            http_response_code(400);
            echo json_encode(['error' => 'El número de teléfono introducido no parece válido.']);
            exit;
        }

        // D) Fecha de visita:
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
        // Cierres festivos anuales obligatorios
        if (($month === 12 && $day === 25) || ($month === 1 && $day === 1)) {
            http_response_code(400);
            echo json_encode(['error' => 'El centro permanece cerrado en festivos oficiales (25 de diciembre y 1 de enero).']);
            exit;
        }

        // E) Turno horario:
        $validTimes = ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
        $time = trim(htmlspecialchars(strip_tags((string)($booking['time'] ?? '10:30')), ENT_QUOTES, 'UTF-8'));
        if (!in_array($time, $validTimes, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'El turno horario seleccionado no es válido.']);
            exit;
        }
        // Domingos tarde cerrado: solo turnos de mañana hasta las 14:30
        if ((int)date('N', $bookingTs) === 7 && (int)substr($time, 0, 2) >= 15) {
            http_response_code(400);
            echo json_encode(['error' => 'Los domingos el centro abre solo en horario de mañana (hasta las 14:30 h). Elige un turno antes de las 14:00 h.']);
            exit;
        }

        // F) Número de personas:
        $people = filter_var($booking['people'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 25]]);
        if ($people === false) {
            http_response_code(400);
            echo json_encode(['error' => 'El número de visitantes debe ser entre 1 y 25 personas. Para grupos mayores, contacta directamente con Turismo de Huelma.']);
            exit;
        }

        // G) Idioma:
        $rawLang = strtolower(trim((string)($booking['lang'] ?? 'es')));
        $lang = in_array($rawLang, ['es', 'en', 'fr'], true) ? $rawLang : 'es';

        // H) Observaciones / Necesidades especiales:
        $rawNotes = (string)($booking['notes'] ?? '');
        if (preg_match('/https?:\/\/|www\.|\.([a-z]{2,6})\b/i', $rawNotes)) {
            http_response_code(400);
            echo json_encode(['error' => 'El campo de observaciones no puede incluir enlaces web, dominios ni URLs.']);
            exit;
        }
        if (preg_match('/<\s*script|javascript:|onerror|onload|<iframe|<object|SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET|DROP\s+TABLE/i', $rawNotes)) {
            http_response_code(400);
            echo json_encode(['error' => 'El texto de observaciones contiene caracteres o palabras no permitidas.']);
            exit;
        }
        $notes = trim(htmlspecialchars(strip_tags($rawNotes), ENT_QUOTES, 'UTF-8'));
        if (safeStrlen($notes) > 300) {
            $notes = safeSubstr($notes, 0, 300);
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

    // Restaurar copia completa de seguridad (Backup total JSON - SOLO ADMINISTRADOR TOTAL)
    if (isset($input['action']) && $input['action'] === 'restore_full_backup') {
        if (!isFullAdmin()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes: solo un administrador con acceso total puede restaurar una copia de seguridad completa.']);
            exit;
        }
        $backup = $input['backup'] ?? [];
        if (isset($backup['panels']) && is_array($backup['panels'])) {
            writeJson($panelesFile, ['panels' => $backup['panels']]);
        }
        if (isset($backup['gallery'])) {
            writeJson($galleryFile, $backup['gallery']);
        }
        if (isset($backup['locales']) && is_array($backup['locales'])) {
            // Guardar únicamente en data/locales.json (NO sobrescribir los diccionarios UI anidados locales/{es,en,fr}.json)
            writeJson($localesFile, $backup['locales']);
        }
        if (isset($backup['kiosk_videos'])) {
            writeJson('../data/kiosk_videos.json', $backup['kiosk_videos']);
            if (is_array($backup['kiosk_videos'])) {
                $gData = readJson($galleryFile, ['media' => [], 'resources' => [], 'videos' => []]);
                $gData['videos'] = isset($backup['kiosk_videos']['videos']) ? $backup['kiosk_videos']['videos'] : $backup['kiosk_videos'];
                writeJson($galleryFile, $gData);
            }
        }
        if (isset($backup['agenda'])) {
            $ag = is_array($backup['agenda']) ? (isset($backup['agenda']['activities']) ? $backup['agenda'] : ['activities' => $backup['agenda']]) : ['activities' => []];
            writeJson($agendaFile, $ag);
        }
        if (isset($backup['legal'])) {
            writeJson($legalFile, $backup['legal']);
        }
        if (isset($backup['site_config']) && is_array($backup['site_config'])) {
            writeJson($configFile, $backup['site_config']);
        }
        echo json_encode(['success' => true, 'message' => 'Copia de seguridad restaurada correctamente en el servidor.']);
        exit;
    }

    // Guardar / sincronizar todos los paneles a la vez
    if (isset($input['action']) && $input['action'] === 'save_all_panels') {
        if (!hasModulePermission('panels')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar paneles.']);
            exit;
        }
        $panels = $input['panels'] ?? [];
        writeJson($panelesFile, ['panels' => $panels]);
        echo json_encode(['success' => true]);
        exit;
    }

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

    // Guardar traducciones / textos multilingüe del CMS en el servidor (sin contaminar los diccionarios UI anidados locales/*.json)
    if (isset($input['action']) && $input['action'] === 'save_locales') {
        if (!hasModulePermission('contents')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para modificar textos.']);
            exit;
        }
        $locales = $input['locales'] ?? [];
        writeJson($localesFile, $locales);

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
            $galleryData['videos'] = array_values(array_filter($galleryData['videos'] ?? [], function($v) use ($delId) {
                return ($v['id'] ?? '') !== $delId;
            }));
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
        $data['activities'] = array_values(array_filter($data['activities'], function($a) use ($id) { return $a['id'] != $id; }));
        writeJson($agendaFile, $data);
    } elseif ($type === 'booking') {
        if (!hasModulePermission('bookings')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para eliminar reservas.']);
            exit;
        }
        $data = readJson($reservasFile, ['bookings' => []]);
        $data['bookings'] = array_values(array_filter($data['bookings'], function($b) use ($id) { return $b['id'] != $id; }));
        writeJson($reservasFile, $data);
    } else {
        if (!hasModulePermission('panels')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Permisos insuficientes para eliminar paneles.']);
            exit;
        }
        $data = readJson($panelesFile, ['panels' => []]);
        $data['panels'] = array_values(array_filter($data['panels'], function($p) use ($id) { return $p['id'] != $id; }));
        writeJson($panelesFile, $data);
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
