/**
 * Recopilador Real de Métricas de Uso y Analítica de Visitantes (SaaS MVP)
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo" · Ayuntamiento de Huelma
 * Registra métricas de navegación, escaneos QR, audioguías y reservas en LocalStorage y backend.
 */

const STORAGE_KEY = 'pajarillo_real_analytics';

class AnalyticsTracker {
  constructor() {
    this.endpoint = './api/analytics.php';
    this.sessionId = this.getOrCreateSession();
    this.visitorId = this.getOrCreateVisitorId();

    // EXCLUSIÓN ESTRICTA: El panel de administración NUNCA contabiliza visitas ni visitantes
    if (this.isAdminContext()) {
      return;
    }

    this.init();
  }

  isAdminContext() {
    if (typeof window === 'undefined') return false;
    if (window.PAJARILLO_IS_ADMIN === true) return true;
    const path = (window.location.pathname || '').toLowerCase();
    const href = (window.location.href || '').toLowerCase();
    if (path.includes('admin') || href.includes('admin.html')) return true;
    if (document.getElementById('login-view') || document.getElementById('dashboard-view')) return true;
    try {
      if (localStorage.getItem('pajarillo_admin_auth') || localStorage.getItem('pajarillo_logged_user')) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  getOrCreateSession() {
    try {
      let s = sessionStorage.getItem('pajarillo_sid');
      if (!s) {
        s = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        sessionStorage.setItem('pajarillo_sid', s);
      }
      return s;
    } catch (e) {
      return 's_' + Date.now();
    }
  }

  getOrCreateVisitorId() {
    try {
      let vid = localStorage.getItem('pajarillo_vid');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        localStorage.setItem('pajarillo_vid', vid);
      }
      return vid;
    } catch (e) {
      return 'v_' + Date.now();
    }
  }

  detectDevice() {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return 'Móvil (iOS)';
    if (/Android/.test(ua)) return 'Móvil (Android)';
    if (/Mobi|Mobile/.test(ua)) return 'Móvil';
    return 'Escritorio';
  }

  getStoredData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.summary) {
          parsed.historyByDay = parsed.historyByDay || {};
          parsed.historyByMonth = parsed.historyByMonth || {};
          parsed.historyByYear = parsed.historyByYear || {};
          parsed.topPanels = Array.isArray(parsed.topPanels) ? parsed.topPanels : [];
          parsed.topSections = Array.isArray(parsed.topSections) ? parsed.topSections : [];
          parsed.events = Array.isArray(parsed.events) ? parsed.events : [];
          return parsed;
        }
      }
    } catch (e) {}

    return {
      summary: {
        totalVisits: 0,
        uniqueVisitors: 0,
        qrScans: 0,
        tourBookings: 0,
        audioListens: 0,
        downloads: 0
      },
      languages: { es: 0, en: 0, fr: 0 },
      historyByDay: {},
      historyByMonth: {},
      historyByYear: {},
      topSections: [],
      topPanels: [],
      events: []
    };
  }

  saveStoredData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('pajarillo_analytics_updated', { detail: data }));
    } catch (e) {}
  }

  resetAll() {
    localStorage.setItem('pajarillo_analytics_cleared', '1');
    localStorage.removeItem('pajarillo_visited_ever');
    localStorage.removeItem('pajarillo_visited_day');
    localStorage.removeItem('pajarillo_visited_month');
    localStorage.removeItem('pajarillo_visited_year');
    localStorage.removeItem('pajarillo_has_visited');
    sessionStorage.removeItem('pajarillo_session_active');
    sessionStorage.removeItem('pajarillo_session_counted');
    const fresh = {
      summary: {
        totalVisits: 0,
        uniqueVisitors: 0,
        qrScans: 0,
        tourBookings: 0,
        audioListens: 0,
        downloads: 0
      },
      languages: { es: 0, en: 0, fr: 0 },
      historyByDay: {},
      historyByMonth: {},
      historyByYear: {},
      topSections: [],
      topPanels: [],
      events: []
    };
    this.saveStoredData(fresh);
    return fresh;
  }

  checkSessionStatus() {
    const now = Date.now();
    let isNewSession = false;
    try {
      const activeSession = sessionStorage.getItem('pajarillo_session_active');
      const lastActive = parseInt(localStorage.getItem('pajarillo_last_active_ts') || '0', 10);

      // Una sesión nueva ocurre si no hay sesión activa en esta pestaña o si han pasado más de 30 minutos de inactividad
      if (!activeSession || (now - lastActive > 30 * 60 * 1000)) {
        isNewSession = true;
        sessionStorage.setItem('pajarillo_session_active', '1');
      }
      localStorage.setItem('pajarillo_last_active_ts', now.toString());
    } catch (e) {
      isNewSession = true;
    }
    return isNewSession;
  }

  checkUniqueStatus(todayStr, monthStr, yearStr) {
    let isUniqueToday = false;
    let isUniqueMonth = false;
    let isUniqueYear = false;
    let isUniqueEver = false;

    try {
      // 1. Visitante único global (por dispositivo)
      if (!localStorage.getItem('pajarillo_visited_ever')) {
        isUniqueEver = true;
        localStorage.setItem('pajarillo_visited_ever', '1');
      }

      // 2. Visitante único hoy
      const lastDay = localStorage.getItem('pajarillo_visited_day');
      if (lastDay !== todayStr) {
        isUniqueToday = true;
        localStorage.setItem('pajarillo_visited_day', todayStr);
      }

      // 3. Visitante único este mes
      const lastMonth = localStorage.getItem('pajarillo_visited_month');
      if (lastMonth !== monthStr) {
        isUniqueMonth = true;
        localStorage.setItem('pajarillo_visited_month', monthStr);
      }

      // 4. Visitante único este año
      const lastYear = localStorage.getItem('pajarillo_visited_year');
      if (lastYear !== yearStr) {
        isUniqueYear = true;
        localStorage.setItem('pajarillo_visited_year', yearStr);
      }
    } catch (e) {}

    return { isUniqueToday, isUniqueMonth, isUniqueYear, isUniqueEver };
  }

  async init() {
    // 1. Respetar rechazo expreso de cookies de analítica si existe
    if (localStorage.getItem('pajarillo_cookie_consent') === 'rejected') {
      return;
    }

    if (this.isAdminContext()) {
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);
    const yearStr = todayStr.slice(0, 4);

    const isNewSession = this.checkSessionStatus();
    const uniqueStatus = this.checkUniqueStatus(todayStr, monthStr, yearStr);

    const currentLang = localStorage.getItem('pajarillo_lang') || 'es';
    const pageTitle = document.title || 'Centro de Interpretación El Pajarillo';

    // REGISTRO RIGUROSO DE VISITA:
    // Solo si es una NUEVA SESIÓN se contabiliza visita (+1 sesión).
    // Si el usuario simplemente recarga la página, NO se vuelve a incrementar.
    if (isNewSession || uniqueStatus.isUniqueToday) {
      this.track('page_view', {
        is_new_session: isNewSession,
        is_unique_today: uniqueStatus.isUniqueToday,
        is_unique_month: uniqueStatus.isUniqueMonth,
        is_unique_year: uniqueStatus.isUniqueYear,
        is_unique_ever: uniqueStatus.isUniqueEver,
        device: this.detectDevice(),
        lang: currentLang,
        detail: pageTitle
      });
    }

    // Detectar si el usuario llega mediante escaneo directo de QR (?id=X o ?panel=X o ?qr=X)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qrId = urlParams.get('id') || urlParams.get('panel') || urlParams.get('qr');
      if (qrId) {
        this.track('qr_scan', {
          panel_id: qrId,
          detail: `Escaneo directo de QR Punto ${qrId}`
        });
      }
    } catch (err) {}

    // Configurar rastreo de secciones en portada
    this.setupSectionTracking();
  }

  track(type, payload = {}) {
    if (this.isAdminContext()) {
      return;
    }

    if (localStorage.getItem('pajarillo_cookie_consent') === 'rejected') {
      return;
    }

    const lang = payload.lang || localStorage.getItem('pajarillo_lang') || 'es';
    const device = payload.device || this.detectDevice();
    const eventTime = new Date().toISOString();
    const todayStr = eventTime.slice(0, 10);
    const monthStr = eventTime.slice(0, 7);
    const yearStr = eventTime.slice(0, 4);

    const data = this.getStoredData();

    data.summary = data.summary || {
      totalVisits: 0, uniqueVisitors: 0, qrScans: 0, tourBookings: 0, audioListens: 0, downloads: 0
    };
    data.languages = data.languages || { es: 0, en: 0, fr: 0 };
    data.historyByDay = data.historyByDay || {};
    data.historyByMonth = data.historyByMonth || {};
    data.historyByYear = data.historyByYear || {};
    data.topPanels = Array.isArray(data.topPanels) ? data.topPanels : [];
    data.topSections = Array.isArray(data.topSections) ? data.topSections : [];
    data.events = Array.isArray(data.events) ? data.events : [];

    // Inicializar buckets para hoy, mes y año
    if (!data.historyByDay[todayStr]) {
      data.historyByDay[todayStr] = {
        visits: 0, unique: 0, qr: 0, audio: 0, downloads: 0, bookings: 0, es: 0, en: 0, fr: 0
      };
    }
    if (!data.historyByMonth[monthStr]) {
      data.historyByMonth[monthStr] = {
        visits: 0, unique: 0, qr: 0, audio: 0, downloads: 0, bookings: 0, es: 0, en: 0, fr: 0
      };
    }
    if (!data.historyByYear[yearStr]) {
      data.historyByYear[yearStr] = {
        visits: 0, unique: 0, qr: 0, audio: 0, downloads: 0, bookings: 0, es: 0, en: 0, fr: 0
      };
    }

    const dayBucket = data.historyByDay[todayStr];
    const monthBucket = data.historyByMonth[monthStr];
    const yearBucket = data.historyByYear[yearStr];

    // Procesamiento según tipo de evento
    if (type === 'page_view') {
      if (payload.is_new_session) {
        data.summary.totalVisits = (Number(data.summary.totalVisits) || 0) + 1;
        dayBucket.visits = (Number(dayBucket.visits) || 0) + 1;
        monthBucket.visits = (Number(monthBucket.visits) || 0) + 1;
        yearBucket.visits = (Number(yearBucket.visits) || 0) + 1;
      }

      // Visitantes Únicos: solo incrementa si es un visitante único comprobado
      if (payload.is_unique_ever) {
        data.summary.uniqueVisitors = (Number(data.summary.uniqueVisitors) || 0) + 1;
      }
      if (payload.is_unique_today) {
        dayBucket.unique = (Number(dayBucket.unique) || 0) + 1;
      }
      if (payload.is_unique_month) {
        monthBucket.unique = (Number(monthBucket.unique) || 0) + 1;
      }
      if (payload.is_unique_year) {
        yearBucket.unique = (Number(yearBucket.unique) || 0) + 1;
      }

      data.languages[lang] = (Number(data.languages[lang]) || 0) + 1;
      if (dayBucket[lang] !== undefined) dayBucket[lang]++;
      if (monthBucket[lang] !== undefined) monthBucket[lang]++;
      if (yearBucket[lang] !== undefined) yearBucket[lang]++;

    } else if (type === 'qr_scan') {
      data.summary.qrScans = (Number(data.summary.qrScans) || 0) + 1;
      dayBucket.qr = (Number(dayBucket.qr) || 0) + 1;
      monthBucket.qr = (Number(monthBucket.qr) || 0) + 1;
      yearBucket.qr = (Number(yearBucket.qr) || 0) + 1;

      // Actualizar ranking de paneles QR
      const panelId = payload.panel_id || payload.id;
      if (panelId) {
        const found = data.topPanels.find(p => String(p.id) === String(panelId));
        if (found) {
          found.scans = (Number(found.scans) || 0) + 1;
        } else {
          data.topPanels.push({
            id: String(panelId),
            title: payload.title || `Panel Nº 0${panelId}`,
            scans: 1
          });
        }
      }

    } else if (type === 'audio_play') {
      data.summary.audioListens = (Number(data.summary.audioListens) || 0) + 1;
      dayBucket.audio = (Number(dayBucket.audio) || 0) + 1;
      monthBucket.audio = (Number(monthBucket.audio) || 0) + 1;
      yearBucket.audio = (Number(yearBucket.audio) || 0) + 1;

    } else if (type === 'download') {
      data.summary.downloads = (Number(data.summary.downloads) || 0) + 1;
      dayBucket.downloads = (Number(dayBucket.downloads) || 0) + 1;
      monthBucket.downloads = (Number(monthBucket.downloads) || 0) + 1;
      yearBucket.downloads = (Number(yearBucket.downloads) || 0) + 1;

    } else if (type === 'booking') {
      data.summary.tourBookings = (Number(data.summary.tourBookings) || 0) + 1;
      dayBucket.bookings = (Number(dayBucket.bookings) || 0) + 1;
      monthBucket.bookings = (Number(monthBucket.bookings) || 0) + 1;
      yearBucket.bookings = (Number(yearBucket.bookings) || 0) + 1;

    } else if (type === 'lang_change') {
      data.languages[lang] = (Number(data.languages[lang]) || 0) + 1;
      if (dayBucket[lang] !== undefined) dayBucket[lang]++;
      if (monthBucket[lang] !== undefined) monthBucket[lang]++;
      if (yearBucket[lang] !== undefined) yearBucket[lang]++;

    } else if (type === 'section_view' && payload.section) {
      const foundSec = data.topSections.find(s => s.section === payload.section);
      if (foundSec) {
        foundSec.views = (Number(foundSec.views) || 0) + 1;
      } else {
        data.topSections.push({
          section: payload.section,
          name: payload.detail || payload.section,
          views: 1
        });
      }
    }

    // Registrar en cola de eventos recientes (mantiene los últimos 150)
    const eventRecord = {
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      time: eventTime,
      type,
      lang,
      device,
      detail: payload.detail || payload.section || payload.panel || ''
    };

    data.events.unshift(eventRecord);
    if (data.events.length > 150) {
      data.events = data.events.slice(0, 150);
    }

    this.saveStoredData(data);

    // Intentar sincronizar con backend PHP si está disponible
    try {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, type, lang, device, time: eventTime })
      }).catch(() => {});
    } catch (err) {}
  }

  trackQr(panelId, detail = '', title = '') {
    this.track('qr_scan', { panel_id: panelId, detail: detail || `Escaneo QR Panel ${panelId}`, title });
  }

  trackAudio(audioName) {
    this.track('audio_play', { detail: `Audioguía: ${audioName}` });
  }

  trackDownload(docName) {
    this.track('download', { detail: `Descarga: ${docName}` });
  }

  trackBooking(payload) {
    this.track('booking', payload);
  }

  setupSectionTracking() {
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const seen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !seen.has(entry.target.id)) {
          seen.add(entry.target.id);
          this.track('section_view', {
            section: entry.target.id,
            detail: entry.target.getAttribute('aria-label') || entry.target.id
          });
        }
      });
    }, { threshold: 0.35 });

    sections.forEach(s => observer.observe(s));
  }
}

// Instancia global accesible
window.PajarilloAnalytics = new AnalyticsTracker();
export default window.PajarilloAnalytics;
