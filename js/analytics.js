/**
 * Recopilador Real de Métricas de Uso y Analítica de Visitantes (SaaS MVP)
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo" · Ayuntamiento de Huelma
 * Registra datos reales (no ficticios) y persiste en LocalStorage y backend PHP (si está disponible).
 */

const STORAGE_KEY = 'pajarillo_real_analytics';

class AnalyticsTracker {
  constructor() {
    this.endpoint = './api/analytics.php';
    this.sessionId = this.getOrCreateSession();
    this.init();
  }

  getOrCreateSession() {
    let s = sessionStorage.getItem('pajarillo_sid');
    if (!s) {
      s = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('pajarillo_sid', s);
    }
    return s;
  }

  detectDevice() {
    const ua = navigator.userAgent;
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
      languages: {
        es: 0,
        en: 0,
        fr: 0
      },
      historyByDay: {},
      historyByMonth: {},
      historyByYear: {},
      events: []
    };
  }

  saveStoredData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Notificar a otras pestañas o componentes si estuvieran abiertos
      window.dispatchEvent(new Event('pajarillo_analytics_updated'));
    } catch (e) {}
  }

  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pajarillo_has_visited');
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
      languages: {
        es: 0,
        en: 0,
        fr: 0
      },
      historyByDay: {},
      historyByMonth: {},
      historyByYear: {},
      events: []
    };
    this.saveStoredData(fresh);
    return fresh;
  }

  init() {
    // Verificar si esta sesión ya contó como visita en la pestaña actual
    const sessionCounted = sessionStorage.getItem('pajarillo_session_counted');
    const isFirstVisitEver = !localStorage.getItem('pajarillo_has_visited');

    if (!sessionCounted) {
      sessionStorage.setItem('pajarillo_session_counted', '1');
      if (isFirstVisitEver) {
        localStorage.setItem('pajarillo_has_visited', '1');
      }

      this.track('page_view', {
        is_unique: isFirstVisitEver,
        device: this.detectDevice(),
        lang: localStorage.getItem('pajarillo_lang') || 'es',
        detail: document.title || 'Vista general'
      });
    }

    // Detectar si se accede mediante un escaneo QR en la URL (?panel=X o ?qr=X)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qrPanel = urlParams.get('panel') || urlParams.get('qr');
      if (qrPanel) {
        this.track('qr_scan', {
          panel_id: qrPanel,
          detail: `Escaneo directo de QR Panel ${qrPanel}`
        });
      }
    } catch (err) {}

    // Tracking de secciones vistas
    this.setupSectionTracking();
  }

  track(type, payload = {}) {
    const lang = payload.lang || localStorage.getItem('pajarillo_lang') || 'es';
    const device = payload.device || this.detectDevice();
    const eventTime = new Date().toISOString();
    const todayStr = eventTime.slice(0, 10);
    const monthStr = eventTime.slice(0, 7);
    const yearStr = eventTime.slice(0, 4);

    const data = this.getStoredData();

    // Estructuras de histórico permanente
    data.historyByDay = data.historyByDay || {};
    data.historyByMonth = data.historyByMonth || {};
    data.historyByYear = data.historyByYear || {};

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

    // Actualizar contadores globales y buckets históricos permanentes
    if (type === 'page_view') {
      data.summary.totalVisits = (data.summary.totalVisits || 0) + 1;
      dayBucket.visits = (dayBucket.visits || 0) + 1;
      monthBucket.visits = (monthBucket.visits || 0) + 1;
      yearBucket.visits = (yearBucket.visits || 0) + 1;

      if (payload.is_unique) {
        data.summary.uniqueVisitors = (data.summary.uniqueVisitors || 0) + 1;
        dayBucket.unique = (dayBucket.unique || 0) + 1;
        monthBucket.unique = (monthBucket.unique || 0) + 1;
        yearBucket.unique = (yearBucket.unique || 0) + 1;
      }

      data.languages[lang] = (data.languages[lang] || 0) + 1;
      if (dayBucket[lang] !== undefined) dayBucket[lang]++;
      if (monthBucket[lang] !== undefined) monthBucket[lang]++;
      if (yearBucket[lang] !== undefined) yearBucket[lang]++;

    } else if (type === 'qr_scan') {
      data.summary.qrScans = (data.summary.qrScans || 0) + 1;
      dayBucket.qr = (dayBucket.qr || 0) + 1;
      monthBucket.qr = (monthBucket.qr || 0) + 1;
      yearBucket.qr = (yearBucket.qr || 0) + 1;

    } else if (type === 'audio_play') {
      data.summary.audioListens = (data.summary.audioListens || 0) + 1;
      dayBucket.audio = (dayBucket.audio || 0) + 1;
      monthBucket.audio = (monthBucket.audio || 0) + 1;
      yearBucket.audio = (yearBucket.audio || 0) + 1;

    } else if (type === 'download') {
      data.summary.downloads = (data.summary.downloads || 0) + 1;
      dayBucket.downloads = (dayBucket.downloads || 0) + 1;
      monthBucket.downloads = (monthBucket.downloads || 0) + 1;
      yearBucket.downloads = (yearBucket.downloads || 0) + 1;

    } else if (type === 'booking') {
      data.summary.tourBookings = (data.summary.tourBookings || 0) + 1;
      dayBucket.bookings = (dayBucket.bookings || 0) + 1;
      monthBucket.bookings = (monthBucket.bookings || 0) + 1;
      yearBucket.bookings = (yearBucket.bookings || 0) + 1;

    } else if (type === 'lang_change') {
      data.languages[lang] = (data.languages[lang] || 0) + 1;
      if (dayBucket[lang] !== undefined) dayBucket[lang]++;
      if (monthBucket[lang] !== undefined) monthBucket[lang]++;
      if (yearBucket[lang] !== undefined) yearBucket[lang]++;
    }

    // Registrar evento reciente (mantiene últimos 300)
    const eventRecord = {
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      time: eventTime,
      type,
      lang,
      device,
      detail: payload.detail || payload.section || payload.panel || ''
    };

    data.events.unshift(eventRecord);
    if (data.events.length > 300) {
      data.events = data.events.slice(0, 300);
    }

    this.saveStoredData(data);

    // Intentar sincronizar con backend PHP silenciosamente
    try {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, type, lang, device, time: eventTime })
      }).catch(() => {});
    } catch (err) {}
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
