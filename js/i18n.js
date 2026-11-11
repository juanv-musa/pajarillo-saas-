/**
 * Sistema de Internacionalización Profesional (ES / EN / FR)
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 * Incluye respaldo en memoria inmediato (offline y file://) y sincronización dinámica.
 */

import { DEFAULT_LOCALES } from './locales-data.js';

export class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('pajarillo_lang') || 'es';
    if (!['es', 'en', 'fr'].includes(this.currentLang)) this.currentLang = 'es';

    // Precargar diccionarios completos en memoria para funcionamiento 100% inmediato y offline
    this.translations = JSON.parse(JSON.stringify(DEFAULT_LOCALES));
    this.callbacks = [];

    window.pajarilloI18n = this;
    window.pajarilloSetLang = (lang) => this.setLanguage(lang);
  }

  async init() {
    // 1. Vincular botones inmediatamente
    this.bindButtons();

    // 2. Aplicar traducciones con el diccionario en memoria de inmediato
    this.applyTranslations();

    // 3. Intentar enriquecer con actualizaciones remotas en segundo plano si hay red
    this.loadLanguage(this.currentLang).catch(() => {});
  }

  async loadLanguage(lang) {
    if (!this.translations[lang] && DEFAULT_LOCALES[lang]) {
      this.translations[lang] = JSON.parse(JSON.stringify(DEFAULT_LOCALES[lang]));
    }

    try {
      const res = await fetch(`./locales/${lang}.json?t=${Date.now()}`).catch(() => null);
      if (res && res.ok) {
        const remote = await res.json();
        if (remote && typeof remote === 'object') {
          this.translations[lang] = { ...this.translations[lang], ...remote };
        }
      }
    } catch (err) {}

    // Sobrescribir con cambios guardados en el panel de administración (localStorage o servidor)
    try {
      let savedLocales = localStorage.getItem('pajarillo_locales');
      let parsed = null;
      if (savedLocales) {
        try { parsed = JSON.parse(savedLocales); } catch(e) {}
      }
      if (!parsed) {
        try {
          const resLoc = await fetch(`./data/locales.json?t=${Date.now()}`).catch(() => null);
          if (resLoc && resLoc.ok) parsed = await resLoc.json();
        } catch(e) {}
      }
      if (parsed && parsed[lang]) {
        const l = parsed[lang];
        if (!this.translations[lang].hero) this.translations[lang].hero = {};
        if (!this.translations[lang].historia) this.translations[lang].historia = {};

        if (l.patrimonio_title) this.translations[lang].historia.title = l.patrimonio_title;
        if (l.patrimonio_subtitle) this.translations[lang].historia.subtitle = l.patrimonio_subtitle;

        if (l.hero_eyebrow !== undefined) this.translations[lang].hero.eyebrow = l.hero_eyebrow;
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

        if (!this.translations[lang].galeria) this.translations[lang].galeria = {};
        if (l.galeria_title) this.translations[lang].galeria.title = l.galeria_title;
        if (l.galeria_subtitle) this.translations[lang].galeria.subtitle = l.galeria_subtitle;
        if (l.galeria_tab_fotos) {
          let fVal = l.galeria_tab_fotos;
          if (fVal === 'Fotografías HD') fVal = 'Fotografías';
          if (fVal === 'HD Photos') fVal = 'Photographs';
          if (fVal === 'Photos HD') fVal = 'Photographies';
          this.translations[lang].galeria.tab_fotos = fVal;
        }
        if (l.galeria_tab_modelo3d) this.translations[lang].galeria.tab_modelo3d = l.galeria_tab_modelo3d;
        if (l.galeria_tab_recursos) {
          let rVal = l.galeria_tab_recursos;
          if (rVal === 'Recursos Digitales e Interactivos') rVal = 'Recursos Digitales';
          if (rVal === 'Digital & Interactive Assets') rVal = 'Digital Resources';
          if (rVal === 'Ressources Numériques et 3D') rVal = 'Ressources Numériques';
          this.translations[lang].galeria.tab_recursos = rVal;
        }
        if (l.galeria_tab_videos) {
          let vVal = l.galeria_tab_videos;
          if (vVal === 'Documentaries & Videos') vVal = 'Audiovisuals';
          if (vVal === 'Vidéos et Documentaires') vVal = 'Audiovisuels';
          this.translations[lang].galeria.tab_videos = vVal;
        }

        if (!this.translations[lang].agenda) this.translations[lang].agenda = {};
        if (l.agenda_title) this.translations[lang].agenda.title = l.agenda_title;
        if (l.agenda_subtitle) this.translations[lang].agenda.subtitle = l.agenda_subtitle;

        if (!this.translations[lang].reservas) this.translations[lang].reservas = {};
        if (l.reservas_title) this.translations[lang].reservas.title = l.reservas_title;
        if (l.reservas_subtitle) this.translations[lang].reservas.subtitle = l.reservas_subtitle;
      }
    } catch (e) {}

    this.currentLang = lang;
    localStorage.setItem('pajarillo_lang', lang);
    document.documentElement.lang = lang;
  }

  bindButtons() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      btn.onclick = (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        const lang = btn.dataset.lang;
        if (lang) {
          this.setLanguage(lang);
        }
      };
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
    if (!['es', 'en', 'fr'].includes(lang)) return;

    this.currentLang = lang;
    localStorage.setItem('pajarillo_lang', lang);
    document.documentElement.lang = lang;
    this.updateActiveButton();

    // 1. Aplicación inmediata con diccionario en memoria (cero parpadeo, cero retardo)
    this.applyTranslations();

    // 2. Notificar suscriptores (Agenda, Paneles, Galería, CMS)
    this.callbacks.forEach(cb => {
      try { cb(this.currentLang); } catch (e) {}
    });

    // 3. Enriquecer con cambios remotos o de administración
    try {
      await this.loadLanguage(lang);
      this.applyTranslations();
    } catch (e) {}

    // Evento analítico anónimo
    if (window.PajarilloAnalytics && typeof window.PajarilloAnalytics.track === 'function') {
      try { window.PajarilloAnalytics.track('lang_change', { lang }); } catch (e) {}
    }
  }

  onLanguageChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }

  t(path) {
    if (!path || typeof path !== 'string') return '';
    const keys = path.split('.');
    let current = this.translations[this.currentLang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback a español si no está en el idioma activo
        let fallback = this.translations['es'];
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }
    return current;
  }

  applyTranslations() {
    // 1. Textos data-i18n
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

    // 2. Atributos data-i18n-attr (ej: placeholder, title, aria-label)
    const attrElements = document.querySelectorAll('[data-i18n-attr]');
    attrElements.forEach(el => {
      const parts = el.getAttribute('data-i18n-attr').split(':');
      if (parts.length === 2) {
        const [attr, key] = parts;
        el.setAttribute(attr, this.t(key));
      }
    });

    // 3. Diapositivas del Carrusel Hero
    const currentLang = this.currentLang || document.documentElement.lang || 'es';
    document.querySelectorAll('.hero-carousel-slide').forEach(el => {
      let title = '';
      let sub = '';

      if (currentLang === 'en') {
        title = el.dataset.titleEn || '';
        sub = el.dataset.subEn || '';
      } else if (currentLang === 'fr') {
        title = el.dataset.titleFr || '';
        sub = el.dataset.subFr || '';
      } else {
        title = el.dataset.titleEs || '';
        sub = el.dataset.subEs || '';
      }

      const keyTitle = el.getAttribute('data-i18n-title');
      if (keyTitle) {
        const val = this.t(keyTitle);
        if (val && typeof val === 'string' && val !== keyTitle && (!title || title === '')) {
          title = val;
        }
      }

      const keySub = el.getAttribute('data-i18n-sub');
      if (keySub) {
        const val = this.t(keySub);
        if (val && typeof val === 'string' && val !== keySub && (!sub || sub === '')) {
          sub = val;
        }
      }

      if (title) el.dataset.title = title;
      if (sub) el.dataset.sub = sub;
    });

    // Sincronizar título y subtítulo visibles de la diapositiva activa del hero
    if (typeof document.querySelector === 'function') {
      const activeSlide = document.querySelector('.hero-carousel-slide.active');
      if (activeSlide) {
        const titleEl = document.getElementById('hero-carousel-title');
        const subEl = document.getElementById('hero-carousel-sub');
        if (titleEl && activeSlide.dataset.title) titleEl.textContent = activeSlide.dataset.title;
        if (subEl && activeSlide.dataset.sub) subEl.textContent = activeSlide.dataset.sub;
      }
    }
  }
}
