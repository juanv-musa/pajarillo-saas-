/**
 * Recopilador Anónimo de Datos de Uso y Analítica de Visitantes (SaaS MVP)
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

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

  isUniqueVisit() {
    const visited = localStorage.getItem('pajarillo_has_visited');
    if (!visited) {
      localStorage.setItem('pajarillo_has_visited', '1');
      return true;
    }
    return false;
  }

  detectDevice() {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'Móvil (iOS)';
    if (/Android/.test(ua)) return 'Móvil (Android)';
    if (/Mobi|Mobile/.test(ua)) return 'Móvil';
    return 'Escritorio';
  }

  init() {
    // Registrar vista de página inicial
    this.track('page_view', {
      is_unique: this.isUniqueVisit(),
      device: this.detectDevice(),
      lang: localStorage.getItem('pajarillo_lang') || 'es'
    });

    // Tracking de secciones vistas mediante IntersectionObserver
    this.setupSectionTracking();
  }

  async track(type, payload = {}) {
    const data = {
      type,
      sessionId: this.sessionId,
      device: payload.device || this.detectDevice(),
      lang: payload.lang || localStorage.getItem('pajarillo_lang') || 'es',
      ...payload
    };

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      // Fallback local silencioso si no hay PHP en este entorno
      this.localFallback(type, data);
    }
  }

  localFallback(type, data) {
    try {
      const storageKey = 'pajarillo_local_analytics';
      const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
      current.unshift({ ...data, time: new Date().toISOString() });
      if (current.length > 50) current.pop();
      localStorage.setItem(storageKey, JSON.stringify(current));
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
