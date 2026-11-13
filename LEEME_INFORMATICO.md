# CENTRO DE INTERPRETACIÓN SANTUARIO IBÉRICO DE “EL PAJARILLO” (HUELMA, JAÉN)
## MANUAL TÉCNICO DE INSTALACIÓN Y DESPLIEGUE PARA EL ADMINISTRADOR / INFORMÁTICO
**Versión:** Entrega Final Consolidada (Noviembre 2026)  
**Entidad Titular:** Excmo. Ayuntamiento de Huelma · Concejalía de Patrimonio y Turismo  
**Repositorio GitHub:** [https://github.com/juanv-musa/pajarillo-saas-](https://github.com/juanv-musa/pajarillo-saas-)  
**Web Demo / Producción GitHub Pages:** [https://juanv-musa.github.io/pajarillo-saas-/](https://juanv-musa.github.io/pajarillo-saas-/)  

---

### 1. DESCRIPCIÓN DEL PROYECTO
Plataforma digital integral para el Centro de Interpretación Santuario Ibérico de “El Pajarillo”. Consta de:
1. **Portal Web Oficial Multidispositivo:** Accesible universalmente (WCAG 2.1 AA), responsive para móviles, tablets y ordenadores de sobremesa, multilingüe (Español, Inglés, Francés), con visor 3D interactivo (Sketchfab) y motor de reservas telemáticas.
2. **Panel de Gestión y CMS Municipal (`admin.html`):** Panel administrativo seguro para la gestión de contenidos, horarios, tarifas, línea temporal de hitos, catálogo multimedia, gestión de vídeos de sala, agenda de eventos y solicitudes de reserva.
3. **Módulo Kiosco Pantalla 0 (`audiovisual_p0.html`):** Para la TV táctil de 65" situada en la entrada / planta baja. Dispone de menú interactivo para reproducir los 4 mini-vídeos temáticos (*Naturaleza, Agua, Castillo, Iglesia*), tráiler y salvapantallas con audio atenuado.
4. **Módulo Kiosco Pantalla 1 (`audiovisual_p1.html`):** Para la pantalla / proyector de la sala superior. Reproduce el documental histórico en bucle continuo, con selector para alternar a la versión con audiodescripción accesible.
5. **Fichas QR de Sala (`punto.html?id=X`):** Diseñadas para escanear con el móvil de los visitantes in situ frente a las vitrinas y paneles expositivos.

---

### 2. REQUISITOS DEL SERVIDOR WEB
* **Servidor Web:** Apache 2.4+ (Linux recomendado) o Nginx.
* **PHP:** Versión 7.4 o superior (PHP 8.1 / 8.2 / 8.3 totalmente soportado).
* **Módulos PHP necesarios:** `php-json`, `php-fileinfo`, `php-session`.
* **Conexión Segura (HTTPS):** Requerida en producción para geolocalización, cookies seguras SameSite y políticas CSP.

---

### 3. ESTRUCTURA DE ARCHIVOS Y DIRECTORIOS

```
├── index.html                   -> Web pública oficial
├── admin.html                   -> Panel de administración (CMS municipal)
├── audiovisual_p0.html          -> Kiosco táctil interactivo (TV 65" Entrada)
├── audiovisual_p1.html          -> Bucle continuo de sala (TV Planta Alta)
├── punto.html                   -> Ficha QR interpretativa para móviles
├── legal.html                   -> Textos legales (Aviso Legal, RGPD, Cookies, Accesibilidad)
├── favicon.ico / favicon*.png   -> Iconos oficiales para todos los dispositivos
├── .htaccess                    -> Configuración de seguridad, compresión y caché de Apache
│
├── api/                         -> Endpoints PHP seguros de persistencia
│   ├── auth.php                 -> Autenticación segura (Bcrypt, hash_equals, regeneración de sesión)
│   ├── data.php                 -> Lectura y guardado de contenidos y reservas
│   ├── analytics.php            -> Analítica disociada y métricas de afluencia
│   └── upload.php               -> Subida validada de imágenes y documentos
│
├── assets/
│   ├── docs/                    -> Documentación oficial (heroe_de_iltiraka.pdf)
│   ├── icons/                   -> Iconografía SVG accesible
│   ├── images/                  -> Fotografías, ilustraciones y logos institucionales
│   │   └── logos/               -> Logos individuales oficiales (UE, Hacienda, Junta, Ayto)
│   └── videos/                  -> Archivos MP4 para reproducción web y tótems de sala
│
├── css/                         -> Hojas de estilo modulares (main, admin, audiovisual, accessibility)
├── data/                        -> Base de datos JSON (protegida contra descargas externas por .htaccess)
│   ├── site_config.json         -> Configuración global del sitio y pantallas
│   ├── locales.json             -> Textos del CMS organizados por idioma (ES, EN, FR)
│   ├── paneles.json             -> Catálogo de puntos de visita y paneles QR
│   ├── kiosk_videos.json        -> Listado y asignación de vídeos para pantallas P0 y P1
│   ├── gallery.json             -> Archivo multimedia, modelos 3D y recursos
│   ├── legal.json               -> Contenido íntegro de textos legales
│   ├── users.json               -> Usuarios y contraseñas hasheadas
│   └── reservas.json            -> Registro de solicitudes de visitas guiadas
│
├── js/                          -> JavaScript cliente modular (app, admin, audiovisual, i18n...)
├── locales/                     -> Diccionarios i18n estáticos (es.json, en.json, fr.json)
└── uploads/                     -> Directorio de subidas (con ejecución de scripts desactivada)
```

---

### 4. INSTALACIÓN Y PERMISOS EN SERVIDOR LINUX (PASO A PASO)

1. **Subir los archivos:** Descomprimir el contenido de este paquete en el directorio raíz web (por ejemplo `/var/www/html/pajarillo/`).
2. **Asignar permisos al usuario web (`www-data`):**
   ```bash
   cd /var/www/html/pajarillo/
   sudo chown -R www-data:www-data data/ uploads/
   sudo chmod 775 data/ uploads/
   sudo chmod 664 data/*.json
   ```
3. **Comprobar soporte de `.htaccess` en Apache:**
   Asegurarse de que `AllowOverride All` está activado en el VirtualHost de Apache para que se apliquen las reglas de `data/.htaccess` (evita que usuarios externos descarguen directamente los archivos JSON de reservas y usuarios).

---

### 5. CREDENCIALES DE ACCESO AL PANEL DE GESTIÓN (`admin.html`)

El panel dispone de tres cuentas preconfiguradas:

1. **Administrador General (Acceso Total):**
   * **Usuario:** `admin`
   * **Contraseña inicial:** `Pajarillo2026!`
2. **Gestión Municipal (Acceso Total):**
   * **Usuario:** `ayuntamiento`
   * **Contraseña inicial:** `HuelmaPajarillo2026!`
3. **Gestor de Agenda y Reservas (Perfil Restringido):**
   * **Usuario:** `actividades`
   * **Contraseña inicial:** `Actividades2026!`
   *(Solo tiene acceso a las pestañas de calendario y reservas de visitas)*

> **Cambio de Contraseña:** Desde la pestaña *«Ajustes & Usuarios»* dentro de `admin.html`, el administrador puede cambiar las contraseñas en cualquier momento con validación segura.

---

### 6. CONFIGURACIÓN DE PANTALLAS Y TOTEMS EN EL MUSEO

Si las pantallas de sala o tótems interactivos funcionan con mini PCs locales (Windows / Raspberry Pi / Android / Linux) conectados a monitores en modo kiosco:

* **Pantalla de Entrada (TV 65" Táctil):**
  * Abrir en el navegador (en pantalla completa / modo kiosco `F11`):
    `http://localhost/audiovisual_p0.html` (o `https://dominio-municipal/audiovisual_p0.html`)
  * Permite a los visitantes interactuar tocando los botones de vídeos y reproduce automáticamente el tráiler en reposo con volumen atenuado.
* **Pantalla de Sala Superior (Planta Alta):**
  * Abrir en el navegador en pantalla completa:
    `http://localhost/audiovisual_p1.html`
  * Reproduce continuamente el documental en bucle.
* **Archivos de vídeo en alta definición:**
  * Deben estar situados en la subcarpeta `assets/videos/`.

---

### 7. COPIAS DE SEGURIDAD Y CONSOLIDACIÓN
El panel de control (`admin.html`) incluye en la cabecera el botón:
* **«💾 Descargar Cambios (JSON)»** y en la pestaña *Ajustes* la opción **«Copia de Seguridad Completa»**.
Esto genera un archivo JSON con todos los datos y textos del centro para restaurar o migrar el sistema en segundos sin necesidad de base de datos MySQL externa.
