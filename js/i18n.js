/**
 * Sistema de Internacionalización Profesional (ES / EN / FR)
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

export class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('pajarillo_lang') || 'es';
    this.translations = {};
    this.callbacks = [];
  }

  async init() {
    await this.loadLanguage(this.currentLang);
    this.bindButtons();
    this.applyTranslations();
  }

  async loadLanguage(lang) {
    try {
      const res = await fetch(`./locales/${lang}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.translations[lang] = await res.json();
    } catch (err) {
      console.warn(`No se pudo cargar ./locales/${lang}.json, manteniendo fallback`, err);
      if (!this.translations[lang]) this.translations[lang] = {};
    }

    // Sobrescribir con cambios guardados en el panel de administración
    try {
      const savedLocales = localStorage.getItem('pajarillo_locales');
      if (savedLocales) {
        const parsed = JSON.parse(savedLocales);
        if (parsed[lang]) {
          const l = parsed[lang];
          if (!this.translations[lang].hero) this.translations[lang].hero = {};
          if (!this.translations[lang].historia) this.translations[lang].historia = {};

          if (l.hero_eyebrow) this.translations[lang].hero.eyebrow = l.hero_eyebrow;
          if (l.site_title) this.translations[lang].hero.title = l.site_title;
          if (l.site_tagline) this.translations[lang].hero.subtitle = l.site_tagline;
          if (l.hero_cta) this.translations[lang].hero.cta_primary = l.hero_cta;
          if (l.hero_desc) this.translations[lang].hero.card_desc = l.hero_desc;

          if (!this.translations[lang].horarios) this.translations[lang].horarios = {};
          if (l.horarios_title) this.translations[lang].horarios.horarios_title = l.horarios_title;
          if (l.horario_verano_titulo) this.translations[lang].horarios.temporada_alta = l.horario_verano_titulo;
          if (l.horario_verano) this.translations[lang].horarios.alta_dias = l.horario_verano;
          if (l.horario_verano_dom) this.translations[lang].horarios.alta_dom = l.horario_verano_dom;
          if (l.horario_invierno_titulo) this.translations[lang].horarios.temporada_baja = l.horario_invierno_titulo;
          if (l.horario_invierno) this.translations[lang].horarios.baja_dias = l.horario_invierno;
          if (l.horario_invierno_dom) this.translations[lang].horarios.baja_dom = l.horario_invierno_dom;
          if (l.horario_aviso) this.translations[lang].horarios.aviso_lunes = l.horario_aviso;

          if (l.tarifas_title) this.translations[lang].horarios.tarifas_title = l.tarifas_title;
          if (l.tarifa_general_titulo) this.translations[lang].horarios.tarifa_general = l.tarifa_general_titulo;
          if (l.tarifa_general_desc) this.translations[lang].horarios.tarifa_general_desc = l.tarifa_general_desc;
          if (l.tarifa_general) this.translations[lang].horarios.tarifa_general_price = l.tarifa_general;
          if (l.tarifa_reducida_titulo) this.translations[lang].horarios.tarifa_reducida = l.tarifa_reducida_titulo;
          if (l.tarifa_reducida_desc) this.translations[lang].horarios.tarifa_reducida_desc = l.tarifa_reducida_desc;
          if (l.tarifa_reducida) {
            this.translations[lang].horarios.tarifa_reducida_price = l.tarifa_reducida.includes('(') ? (lang === 'en' ? '€1.50' : '1,50 €') : l.tarifa_reducida;
          }
          if (l.tarifa_gratuita_titulo) this.translations[lang].horarios.tarifa_gratuita = l.tarifa_gratuita_titulo;
          if (l.tarifa_gratuita || l.tarifa_gratuita_desc) this.translations[lang].horarios.tarifa_gratuita_desc = l.tarifa_gratuita_desc || l.tarifa_gratuita;
          if (l.tarifa_gratuita_precio) this.translations[lang].horarios.tarifa_gratuita_price = l.tarifa_gratuita_precio;

          if (l.como_llegar_titulo) this.translations[lang].horarios.localizacion_title = l.como_llegar_titulo;
          if (l.como_llegar_direccion) this.translations[lang].horarios.direccion_val = l.como_llegar_direccion;
          if (l.como_llegar_parking) this.translations[lang].horarios.parking_val = l.como_llegar_parking;
          if (l.como_llegar_accesibilidad) this.translations[lang].horarios.accesibilidad_val = l.como_llegar_accesibilidad;
        }
      }
    } catch (e) {}

    this.currentLang = lang;
    localStorage.setItem('pajarillo_lang', lang);
    document.documentElement.lang = lang;
  }

  bindButtons() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const lang = btn.dataset.lang;
        if (lang && lang !== this.currentLang) {
          await this.setLanguage(lang);
        }
      });
    });
    this.updateActiveButton();
  }

  updateActiveButton() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
  }

  async setLanguage(lang) {
    if (!this.translations[lang]) {
      await this.loadLanguage(lang);
    } else {
      this.currentLang = lang;
      localStorage.setItem('pajarillo_lang', lang);
      document.documentElement.lang = lang;
    }
    this.updateActiveButton();
    this.applyTranslations();

    // Notificar suscriptores (como la agenda y los paneles dinámicos)
    this.callbacks.forEach(cb => cb(this.currentLang));

    // Evento analítico anónimo
    if (window.PajarilloAnalytics) {
      window.PajarilloAnalytics.track('lang_change', { lang });
    }
  }

  onLanguageChange(callback) {
    this.callbacks.push(callback);
  }

  t(path) {
    const keys = path.split('.');
    let current = this.translations[this.currentLang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return path;
      }
    }
    return current;
  }

  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (typeof val === 'string') {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    const attrElements = document.querySelectorAll('[data-i18n-attr]');
    attrElements.forEach(el => {
      const [attr, key] = el.getAttribute('data-i18n-attr').split(':');
      el.setAttribute(attr, this.t(key));
    });
  }
}
