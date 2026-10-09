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
    this.init();
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

  async ensureInitialBaseline() {
    // Si ya se restableció a cero explícitamente, nunca volver a cargar datos de plantilla
    if (localStorage.getItem('pajarillo_analytics_cleared')) {
      return;
    }

    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        const parsed = JSON.parse(existing);
        // Si contiene datos de prueba antiguos con 1141 visitantes o 1513/1518 visitas, limpiar a 0
        if (parsed && parsed.summary && (parsed.summary.uniqueVisitors === 1141 || parsed.summary.totalVisits === 1518 || parsed.summary.totalVisits === 1513)) {
          this.resetAll();
          return;
        }
      } else {
        const res = await fetch('./data/analytics.json?t=' + Date.now()).catch(() => null);
        if (res && res.ok) {
          const baseData = await res.json();
          if (baseData && baseData.summary) {
            this.saveStoredData(baseData);
          }
        }
      }
    } catch (err) {}
  }

  resetAll() {
    localStorage.setItem('pajarillo_analytics_cleared', '1');
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

  async init() {
    // 1. Respetar rechazo expreso de cookies de analítica si existe
    if (localStorage.getItem('pajarillo_cookie_consent') === 'rejected') {
      return;
    }

    // 2. Garantizar baseline inicial si no existiera
    await this.ensureInitialBaseline();

    // 3. Registrar visita de página
    const isFirstVisitEver = !localStorage.getItem('pajarillo_has_visited');
    if (isFirstVisitEver) {
      localStorage.setItem('pajarillo_has_visited', '1');
    }

    const currentLang = localStorage.getItem('pajarillo_lang') || 'es';
    const pageTitle = document.title || 'Centro de Interpretación El Pajarillo';

    this.track('page_view', {
      is_unique: isFirstVisitEver,
      device: this.detectDevice(),
      lang: currentLang,
      detail: pageTitle
    });

    // 4. Detectar si el usuario llega mediante escaneo directo de QR (?id=X o ?panel=X o ?qr=X)
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

    // 5. Configurar rastreo de secciones en portada
    this.setupSectionTracking();
  }

  track(type, payload = {}) {
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

    // Buckets para hoy, mes y año
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
      data.summary.totalVisits = (Number(data.summary.totalVisits) || 0) + 1;
      dayBucket.visits = (Number(dayBucket.visits) || 0) + 1;
      monthBucket.visits = (Number(monthBucket.visits) || 0) + 1;
      yearBucket.visits = (Number(yearBucket.visits) || 0) + 1;

      if (payload.is_unique) {
        data.summary.uniqueVisitors = (Number(data.summary.uniqueVisitors) || 0) + 1;
        dayBucket.unique = (Number(dayBucket.unique) || 0) + 1;
        monthBucket.unique = (Number(monthBucket.unique) || 0) + 1;
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
