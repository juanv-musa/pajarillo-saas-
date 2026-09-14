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
      this.currentLang = lang;
      localStorage.setItem('pajarillo_lang', lang);
      document.documentElement.lang = lang;
    } catch (err) {
      console.warn(`No se pudo cargar ./locales/${lang}.json, manteniendo fallback`, err);
    }
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
