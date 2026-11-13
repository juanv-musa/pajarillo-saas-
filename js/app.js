/**
 * Main Application Orchestrator
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

import { I18nManager } from './i18n.js?v=5.0';
import { AgendaManager } from './agenda.js?v=5.0';
import { GalleryManager } from './gallery.js?v=4.5';
import { AccessibilityWidget } from './accessibility.js';
import './analytics.js?v=4.9';

const initApp = async () => {
  // 1. Inicializar Internacionalización (inmediata con diccionarios base en memoria)
  let i18n = null;
  try {
    i18n = new I18nManager();
    await i18n.init();
    window.pajarilloI18n = i18n;
    window.currentI18n = i18n;
  } catch (err) {
    console.error('Error inicializando i18n:', err);
  }

  // 2. Inicializar Widget de Accesibilidad Universal (INMEDIATO e INDEPENDIENTE)
  try {
    const accessibility = new AccessibilityWidget(i18n);
    accessibility.init();
    window.accessibilityInstance = accessibility;
  } catch (err) {
    console.error('Error inicializando Accesibilidad:', err);
  }

  // 3. Inicializar Módulos Dinámicos de forma desacoplada
  let agenda = null;
  try {
    agenda = new AgendaManager(i18n);
    await agenda.init();
  } catch (err) {
    console.warn('Error inicializando Agenda:', err);
  }

  let gallery = null;
  try {
    gallery = new GalleryManager(i18n);
    await gallery.init();
    window.galleryInstance = gallery;
  } catch (err) {
    console.warn('Error inicializando Galería:', err);
  }

  // 4. Cargar Puntos de Visita y Paneles
  try {
    await loadExhibitionPoints(i18n);
    if (i18n) {
      i18n.onLanguageChange(() => {
        loadExhibitionPoints(i18n);
      });
    }
  } catch (err) {
    console.warn('Error cargando puntos:', err);
  }

  // 5. Setup Interacciones de UI
  try { setupHeaderScroll(); } catch(e) {}
  try { setupMobileNav(); } catch(e) {}
  try { setupHistoryTabs(); } catch(e) {}
  try { setupHeroCarousel(i18n); } catch(e) {}
  try { setupBookingForm(i18n); } catch(e) {}
  try { setupQrModal(); } catch(e) {}
  try { setupCookieConsentBanner(); } catch(e) {}

  // 6. Cargar y Aplicar Configuración de Secciones y Textos del CMS
  try {
    await initSiteConfig();
    if (i18n) {
      i18n.onLanguageChange(() => {
        initSiteConfig();
      });
    }
    syncLegalFooter();
  } catch (err) {
    console.warn('Error configurando CMS:', err);
  }

  // Escuchar cambios de configuración desde otras pestañas (Panel de Control)
  window.addEventListener('storage', async (e) => {
    if (e.key === 'pajarillo_site_config' || e.key === 'pajarillo_locales') {
      try {
        if (i18n) {
          await i18n.loadLanguage(i18n.currentLang);
          i18n.applyTranslations();
        }
        await initSiteConfig();
      } catch(err) {}
    } else if (e.key === 'pajarillo_legal_data') {
      try {
        await syncLegalFooter();
      } catch(err) {}
    } else if (e.key === 'pajarillo_agenda_data') {
      try {
        if (agenda) {
          await agenda.loadData();
          agenda.render();
        }
      } catch(err) {}
    } else if (e.key === 'pajarillo_panels') {
      try {
        await loadExhibitionPoints(i18n);
      } catch(err) {}
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* ═══════════════════════════════════════════
   Sincronización de Enlaces Legales en Pie de Página
   ═══════════════════════════════════════════ */
async function syncLegalFooter() {
  let legal = null;
  try {
    const local = localStorage.getItem('pajarillo_legal_data');
    if (local) legal = JSON.parse(local);
  } catch(e) {}
  if (!legal) {
    try {
      const res = await fetch('./data/legal.json?t=' + Date.now()).catch(() => null);
      if (res && res.ok) legal = await res.json().catch(() => null);
    } catch(e) {}
  }
  const enabled = (legal && legal.sections_enabled) ? legal.sections_enabled : {
    aviso: true,
    privacidad: true,
    cookies: true,
    accesibilidad: true,
    calidad: false
  };
  ['aviso', 'privacidad', 'cookies', 'accesibilidad', 'calidad'].forEach(key => {
    const el = document.querySelector(`[data-legal-sec="${key}"]`);
    if (el) {
      el.style.display = (enabled[key] !== false) ? '' : 'none';
    }
  });
}

/* ═══════════════════════════════════════════
   Configuración de Secciones y Textos (CMS)
   ═══════════════════════════════════════════ */
async function initSiteConfig() {
  const CACHE_VERSION = 'v5.0';
  if (localStorage.getItem('pajarillo_app_v') !== CACHE_VERSION) {
    localStorage.removeItem('pajarillo_site_config');
    localStorage.removeItem('pajarillo_locales');
    localStorage.setItem('pajarillo_app_v', CACHE_VERSION);
  }

  // Purga defensiva: eliminar caché antigua si contiene rutas a archivos eliminados, códigos erróneos o braille
  const rawLocales = localStorage.getItem('pajarillo_locales') || '';
  if (rawLocales.includes('lobo-hero') || rawLocales.includes('lobo.jpg') || rawLocales.includes('23140') || /braille/i.test(rawLocales)) {
    localStorage.removeItem('pajarillo_locales');
  }
  const rawConfig = localStorage.getItem('pajarillo_site_config') || '';
  if (rawConfig.includes('lobo-hero') || rawConfig.includes('lobo.jpg') || rawConfig.includes('23140') || /braille/i.test(rawConfig)) {
    localStorage.removeItem('pajarillo_site_config');
  }

  const currentLang = (window.pajarilloI18n && window.pajarilloI18n.currentLang) || localStorage.getItem('pajarillo_lang') || 'es';
  let config = null;
  const local = localStorage.getItem('pajarillo_site_config');
  if (local) {
    try { config = JSON.parse(local); } catch(e) {}
  }
  if (!config) {
    try {
      const res = await fetch('./data/site_config.json?t=' + Date.now()).catch(() => null);
      if (res && res.ok) {
        config = await res.json();
      }
    } catch(e) {}
  }

  // Integrar traducciones personalizadas guardadas en el CMS multilingüe
  let locales = null;
  const savedLocales = localStorage.getItem('pajarillo_locales');
  if (savedLocales) {
    try { locales = JSON.parse(savedLocales); } catch(e) {}
  }
  if (!locales) {
    try {
      const resLoc = await fetch('./data/locales.json?t=' + Date.now()).catch(() => null);
      if (resLoc && resLoc.ok) locales = await resLoc.json();
    } catch(e) {}
  }

  if (config) {
    applySiteConfig(config, currentLang, locales);
  }
}

function applySiteConfig(config, currentLang = 'es', locales = null) {
  if (!config) return;

  // 1. Visibilidad Dinámica de Secciones
  const s = config.sections || {};
  const sectionMap = {
    hero: document.getElementById('hero'),
    cronologia: document.getElementById('sec-cronologia'),
    patrimonio: document.getElementById('sec-patrimonio'),
    puntos: document.getElementById('puntos'),
    galeria: document.getElementById('galeria'),
    horarios: document.getElementById('horarios'),
    agenda: document.getElementById('agenda'),
    reservas: document.getElementById('reservas'),
    contacto: document.getElementById('contacto')
  };

  for (const [key, el] of Object.entries(sectionMap)) {
    if (!el) continue;
    const isVisible = s[key] !== false;
    el.style.display = isVisible ? '' : 'none';

    // Enlaces de navegación correspondientes
    const navLinks = document.querySelectorAll(`a[href="#${key}"]`);
    navLinks.forEach(a => {
      if (a.classList.contains('btn-book-nav')) return;
      a.style.display = isVisible ? '' : 'none';
      if (a.parentElement && a.parentElement.tagName === 'LI') {
        a.parentElement.style.display = isVisible ? '' : 'none';
      }
    });
  }

  // Caso especial del bloque compuesto #historia
  const historiaSec = document.getElementById('historia');
  if (historiaSec) {
    const showHistoria = (s.cronologia !== false) || (s.patrimonio !== false);
    historiaSec.style.display = showHistoria ? '' : 'none';
    document.querySelectorAll('a[href="#historia"]').forEach(a => {
      a.style.display = showHistoria ? '' : 'none';
      if (a.parentElement && a.parentElement.tagName === 'LI') {
        a.parentElement.style.display = showHistoria ? '' : 'none';
      }
    });
  }

  // Control específico del botón opcional "Reservar Visita" en la cabecera
  const btnBookNav = document.querySelector('.btn-book-nav');
  if (btnBookNav) {
    const showHeaderReservas = (s.header_btn_reservas !== false) && (s.reservas !== false);
    btnBookNav.style.display = showHeaderReservas ? '' : 'none';
  }

  const c = config.content || {};

  // Propiedades técnicas y multimedia (independientes del idioma)
  if (c.hero_card_img) {
    let safeImg = c.hero_card_img;
    if (safeImg.includes('lobo-hero') || safeImg.includes('lobo.jpg')) {
      safeImg = './assets/images/lobo.png';
    }
    document.querySelectorAll('.hero-carousel-slide[data-index="0"] img, .hero-wolf-img').forEach(el => {
      el.src = safeImg;
    });
  }
  if (c.tel) {
    document.querySelectorAll('[data-i18n="contacto.tel_val"]').forEach(el => {
      el.textContent = c.tel;
      if (el.tagName === 'A') el.href = 'tel:' + c.tel.replace(/\s+/g, '');
    });
  }
  if (c.email) {
    document.querySelectorAll('[data-i18n="contacto.email_val"]').forEach(el => {
      el.textContent = c.email;
      if (el.tagName === 'A') el.href = 'mailto:' + c.email;
    });
  }
  if (c.como_llegar_mapa_url) {
    document.querySelectorAll('#btn-google-maps, a[href*="maps.google.com"]').forEach(el => el.href = c.como_llegar_mapa_url);
  }
  if (c.como_llegar_mapa_embed) {
    const mapIframe = document.getElementById('osm-map-iframe');
    if (mapIframe) mapIframe.src = c.como_llegar_mapa_embed;
  }
  if (c.patrimonio_img_iltiraka) {
    const el = document.getElementById('img-tab-iltiraka');
    if (el) el.src = c.patrimonio_img_iltiraka;
  }
  if (c.patrimonio_img_iberico) {
    const el = document.getElementById('img-tab-iberico');
    if (el) el.src = c.patrimonio_img_iberico;
  }
  if (c.patrimonio_img_fontanar) {
    const el = document.getElementById('img-tab-fontanar');
    if (el) el.src = c.patrimonio_img_fontanar;
  }

  // Visibilidad de pestañas en Santuario y Territorio (Patrimonio)
  const tabIltirakaBtn = document.querySelector('.history-tabs button[data-tab="iltiraka"]');
  const tabIbericoBtn = document.querySelector('.history-tabs button[data-tab="iberico"]');
  const tabFontanarBtn = document.querySelector('.history-tabs button[data-tab="fontanar"]');
  const tabIltirakaPane = document.getElementById('tab-iltiraka');
  const tabIbericoPane = document.getElementById('tab-iberico');
  const tabFontanarPane = document.getElementById('tab-fontanar');

  const showIltiraka = c.patrimonio_enable_iltiraka !== false;
  const showIberico = c.patrimonio_enable_iberico !== false;
  const showFontanar = c.patrimonio_enable_fontanar === true; // Deshabilitado/oculto por defecto según requerimiento

  if (tabIltirakaBtn) tabIltirakaBtn.style.display = showIltiraka ? '' : 'none';
  if (tabIltirakaPane) tabIltirakaPane.style.display = showIltiraka ? '' : 'none';

  if (tabIbericoBtn) tabIbericoBtn.style.display = showIberico ? '' : 'none';
  if (tabIbericoPane) tabIbericoPane.style.display = showIberico ? '' : 'none';

  if (tabFontanarBtn) tabFontanarBtn.style.display = showFontanar ? '' : 'none';
  if (tabFontanarPane) tabFontanarPane.style.display = showFontanar ? '' : 'none';

  // Si la pestaña activa actual fue deshabilitada u ocultada, conmutar a la primera visible
  const activeTabBtn = document.querySelector('.history-tabs button.active');
  if (activeTabBtn && activeTabBtn.style.display === 'none') {
    activeTabBtn.classList.remove('active');
    const firstVisible = [tabIltirakaBtn, tabIbericoBtn, tabFontanarBtn].find(b => b && b.style.display !== 'none');
    if (firstVisible) {
      firstVisible.classList.add('active');
      const target = firstVisible.dataset.tab;
      [tabIltirakaPane, tabIbericoPane, tabFontanarPane].forEach(p => {
        if (p) p.classList.toggle('active', p.id === `tab-${target}`);
      });
    }
  }

  // Visibilidad de Pestañas de la Galería
  const tabsVis = (s && s.gallery_tabs) || JSON.parse(localStorage.getItem('pajarillo_gallery_tabs_visibility') || '{}');
  const galleryTabMap = {
    fotos: { btn: document.getElementById('gallery-tab-btn-fotos'), pane: document.getElementById('tab-fotos') },
    modelo3d: { btn: document.getElementById('gallery-tab-btn-modelo3d'), pane: document.getElementById('tab-modelo3d') },
    recursos: { btn: document.getElementById('gallery-tab-btn-recursos'), pane: document.getElementById('tab-recursos') },
    videos: { btn: document.getElementById('gallery-tab-btn-videos'), pane: document.getElementById('tab-videos') }
  };

  let activeTabStillVisible = false;
  for (const [tKey, tEls] of Object.entries(galleryTabMap)) {
    if (!tEls.btn) continue;
    const isTabVis = tabsVis[tKey] !== false;
    tEls.btn.style.display = isTabVis ? '' : 'none';
    if (!isTabVis && tEls.pane) {
      tEls.pane.classList.remove('active');
    }
    if (isTabVis && tEls.btn.classList.contains('active')) {
      activeTabStillVisible = true;
    }
  }

  // Si la pestaña que estaba activa se ocultó, activar la primera pestaña que sí esté visible
  if (!activeTabStillVisible) {
    for (const [tKey, tEls] of Object.entries(galleryTabMap)) {
      if (tEls.btn && tEls.btn.style.display !== 'none') {
        document.querySelectorAll('.gallery-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.gallery-pane').forEach(p => p.classList.remove('active'));
        tEls.btn.classList.add('active');
        if (tEls.pane) tEls.pane.classList.add('active');
        break;
      }
    }
  }

  // 2. Personalización de Textos y Contenidos Multilingües
  // REGLA FUNDAMENTAL: Los textos del CMS solo sobreescriben la traducción por defecto
  // si estamos en español (idioma original de la BD) o si existe una traducción personalizada
  // explícita para el idioma actual en localesData.
  const isSpanish = (currentLang === 'es');
  const langOverrides = (locales && locales[currentLang]) ? locales[currentLang] : null;

  const getCustomText = (field) => {
    let val = null;
    if (langOverrides && langOverrides[field] !== undefined && langOverrides[field] !== '') {
      val = langOverrides[field];
    } else if (isSpanish && c[field] !== undefined && c[field] !== '') {
      val = c[field];
    }
    if (val !== null) {
      if (field === 'galeria_tab_fotos') {
        if (val === 'Fotografías HD') return 'Fotografías';
        if (val === 'HD Photos') return 'Photographs';
        if (val === 'Photos HD') return 'Photographies';
      }
      if (field === 'galeria_tab_recursos') {
        if (val === 'Recursos Digitales e Interactivos') return 'Recursos Digitales';
        if (val === 'Digital & Interactive Assets') return 'Digital Resources';
        if (val === 'Ressources Numériques et 3D') return 'Ressources Numériques';
      }
      if (field === 'galeria_tab_videos') {
        if (val === 'Documentaries & Videos') return 'Audiovisuals';
        if (val === 'Vidéos et Documentaires') return 'Audiovisuels';
      }
    }
    return val;
  };

  const formatRichText = (str) => {
    if (!str || typeof str !== 'string') return '';
    let res = str;
    res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    return res;
  };

  const setContent = (selector, val) => {
    if (val === null || val === undefined) return;
    const formatted = formatRichText(val);
    document.querySelectorAll(selector).forEach(el => {
      if (/<[a-z][\s\S]*>/i.test(formatted)) {
        el.innerHTML = formatted;
      } else {
        el.textContent = val;
      }
    });
  };

  const heroEyebrow = getCustomText('hero_eyebrow');
  if (heroEyebrow !== null) setContent('[data-i18n="hero.eyebrow"]', heroEyebrow);

  const siteTitle = getCustomText('site_title');
  if (siteTitle !== null) setContent('.brand-text strong, [data-i18n="hero.title"]', siteTitle);

  const siteTagline = getCustomText('site_tagline');
  if (siteTagline !== null) setContent('.brand-text span, [data-i18n="hero.subtitle"]', siteTagline);

  const heroCta = getCustomText('hero_cta');
  if (heroCta !== null) setContent('[data-i18n="hero.cta_primary"], [data-i18n="hero.btn_plan"]', heroCta);

  const heroDesc = getCustomText('hero_desc');
  if (heroDesc !== null) setContent('[data-i18n="hero.card_desc"]', heroDesc);

  const heroCardTitle = getCustomText('hero_card_title');
  if (heroCardTitle !== null) {
    setContent('[data-i18n="hero.card_title"]', heroCardTitle);
    const slide0 = document.querySelector('.hero-carousel-slide[data-index="0"]');
    if (slide0) slide0.dataset.title = heroCardTitle;
  }
  const heroCardSub = getCustomText('hero_card_sub');
  if (heroCardSub !== null) {
    setContent('[data-i18n="hero.card_sub"]', heroCardSub);
    const slide0 = document.querySelector('.hero-carousel-slide[data-index="0"]');
    if (slide0) slide0.dataset.sub = heroCardSub;
  }

  const ayto = getCustomText('ayto');
  if (ayto !== null) setContent('[data-i18n="contacto.ayto_val"]', ayto);

  const horarioAtencion = getCustomText('horario_atencion');
  if (horarioAtencion !== null) setContent('[data-i18n="contacto.horario_atencion"]', horarioAtencion);

  // 5. Horarios de Apertura y Tarifas
  const horariosTitle = getCustomText('horarios_title');
  if (horariosTitle !== null) setContent('[data-i18n="horarios.horarios_title"]', horariosTitle);

  const horarioVeranoTitulo = getCustomText('horario_verano_titulo');
  if (horarioVeranoTitulo !== null) setContent('[data-i18n="horarios.temporada_alta"]', horarioVeranoTitulo);

  const horarioVerano = getCustomText('horario_verano');
  if (horarioVerano !== null) setContent('[data-i18n="horarios.alta_dias"]', horarioVerano);

  const horarioVeranoDom = getCustomText('horario_verano_dom');
  if (horarioVeranoDom !== null) setContent('[data-i18n="horarios.alta_dom"]', horarioVeranoDom);

  const horarioInviernoTitulo = getCustomText('horario_invierno_titulo');
  if (horarioInviernoTitulo !== null) setContent('[data-i18n="horarios.temporada_baja"]', horarioInviernoTitulo);

  const horarioInvierno = getCustomText('horario_invierno');
  if (horarioInvierno !== null) setContent('[data-i18n="horarios.baja_dias"]', horarioInvierno);

  const horarioInviernoDom = getCustomText('horario_invierno_dom');
  if (horarioInviernoDom !== null) setContent('[data-i18n="horarios.baja_dom"]', horarioInviernoDom);

  const horarioAviso = getCustomText('horario_aviso');
  if (horarioAviso !== null) setContent('[data-i18n="horarios.aviso_lunes"]', horarioAviso);

  // Tarifas
  const tarifasTitle = getCustomText('tarifas_title');
  if (tarifasTitle !== null) setContent('[data-i18n="horarios.tarifas_title"]', tarifasTitle);

  const tarifaGeneralTitulo = getCustomText('tarifa_general_titulo');
  if (tarifaGeneralTitulo !== null) setContent('[data-i18n="horarios.tarifa_general"]', tarifaGeneralTitulo);

  const tarifaGeneralDesc = getCustomText('tarifa_general_desc');
  if (tarifaGeneralDesc !== null) setContent('[data-i18n="horarios.tarifa_general_desc"]', tarifaGeneralDesc);

  const tarifaGeneral = getCustomText('tarifa_general');
  if (tarifaGeneral !== null) setContent('[data-i18n="horarios.tarifa_general_price"]', tarifaGeneral);

  const tarifaReducidaTitulo = getCustomText('tarifa_reducida_titulo');
  if (tarifaReducidaTitulo !== null) setContent('[data-i18n="horarios.tarifa_reducida"]', tarifaReducidaTitulo);

  const tarifaReducidaDesc = getCustomText('tarifa_reducida_desc');
  if (tarifaReducidaDesc !== null) setContent('[data-i18n="horarios.tarifa_reducida_desc"]', tarifaReducidaDesc);

  const tarifaReducida = getCustomText('tarifa_reducida');
  if (tarifaReducida !== null) {
    const cleanReducida = tarifaReducida.includes('(') ? (currentLang === 'en' ? '€1.50' : '1,50 €') : tarifaReducida;
    setContent('[data-i18n="horarios.tarifa_reducida_price"]', cleanReducida);
  }
  const tarifaGratuitaTitulo = getCustomText('tarifa_gratuita_titulo');
  if (tarifaGratuitaTitulo !== null) setContent('[data-i18n="horarios.tarifa_gratuita"]', tarifaGratuitaTitulo);

  const tarifaGratuitaDesc = getCustomText('tarifa_gratuita_desc') || getCustomText('tarifa_gratuita');
  if (tarifaGratuitaDesc !== null) setContent('[data-i18n="horarios.tarifa_gratuita_desc"]', tarifaGratuitaDesc);

  const tarifaGratuitaPrecio = getCustomText('tarifa_gratuita_precio');
  if (tarifaGratuitaPrecio !== null) setContent('[data-i18n="horarios.tarifa_gratuita_price"]', tarifaGratuitaPrecio);

  // Cómo llegar y Localización
  const comoLlegarTitulo = getCustomText('como_llegar_titulo');
  if (comoLlegarTitulo !== null) setContent('[data-i18n="horarios.localizacion_title"]', comoLlegarTitulo);

  const comoLlegarDireccion = getCustomText('como_llegar_direccion');
  if (comoLlegarDireccion !== null) setContent('[data-i18n="horarios.direccion_val"]', comoLlegarDireccion);

  const comoLlegarParking = getCustomText('como_llegar_parking');
  if (comoLlegarParking !== null) setContent('[data-i18n="horarios.parking_val"]', comoLlegarParking);

  const comoLlegarAccesibilidad = getCustomText('como_llegar_accesibilidad');
  if (comoLlegarAccesibilidad !== null) setContent('[data-i18n="horarios.accesibilidad_val"]', comoLlegarAccesibilidad);

  const footerCopy = getCustomText('footer_copy');
  if (footerCopy !== null) setContent('[data-i18n="footer.copy"]', footerCopy);

  // Galería Multimedia y Recursos Digitales (Títulos y Textos Editables)
  const galeriaTitle = getCustomText('galeria_title');
  if (galeriaTitle !== null) setContent('[data-i18n="galeria.title"]', galeriaTitle);

  const galeriaSubtitle = getCustomText('galeria_subtitle');
  if (galeriaSubtitle !== null) setContent('[data-i18n="galeria.subtitle"]', galeriaSubtitle);

  const galeriaTabFotos = getCustomText('galeria_tab_fotos');
  if (galeriaTabFotos !== null) {
    setContent('[data-i18n="galeria.tab_fotos"]', galeriaTabFotos);
    const btnFotos = document.getElementById('gallery-tab-btn-fotos');
    if (btnFotos) {
      const sp = btnFotos.querySelector('[data-i18n="galeria.tab_fotos"]') || btnFotos.querySelector('span');
      if (sp) sp.textContent = galeriaTabFotos;
    }
  }
  const galeriaTabModelo3d = getCustomText('galeria_tab_modelo3d');
  if (galeriaTabModelo3d !== null) {
    setContent('[data-i18n="galeria.tab_modelo3d"]', galeriaTabModelo3d);
    const btn3d = document.getElementById('gallery-tab-btn-modelo3d');
    if (btn3d) {
      const sp = btn3d.querySelector('[data-i18n="galeria.tab_modelo3d"]') || btn3d.querySelector('span');
      if (sp) sp.textContent = galeriaTabModelo3d;
    }
  }
  const galeriaTabRecursos = getCustomText('galeria_tab_recursos');
  if (galeriaTabRecursos !== null) {
    setContent('[data-i18n="galeria.tab_recursos"]', galeriaTabRecursos);
    const btnRec = document.getElementById('gallery-tab-btn-recursos');
    if (btnRec) {
      const sp = btnRec.querySelector('[data-i18n="galeria.tab_recursos"]') || btnRec.querySelector('span');
      if (sp) sp.textContent = galeriaTabRecursos;
    }
  }
  const galeriaTabVideos = getCustomText('galeria_tab_videos');
  if (galeriaTabVideos !== null) {
    setContent('[data-i18n="galeria.tab_videos"]', galeriaTabVideos);
    const btnVid = document.getElementById('gallery-tab-btn-videos');
    if (btnVid) {
      const sp = btnVid.querySelector('[data-i18n="galeria.tab_videos"]') || btnVid.querySelector('span');
      if (sp) sp.textContent = galeriaTabVideos;
    }
  }

  const desc3d = getCustomText('desc_3d');
  if (desc3d !== null) {
    const desc3dEl = document.querySelector('#tab-modelo3d p');
    if (desc3dEl) setContent('#tab-modelo3d p', desc3d);
  }

  // Actualizar modelo 3D de Sketchfab dinámicamente si se ha configurado
  let url3d = getCustomText('url_3d') || localStorage.getItem('pajarillo_3d_model_url');
  if (!url3d) {
    try {
      const gData = localStorage.getItem('pajarillo_gallery_data');
      if (gData) {
        const parsed = JSON.parse(gData);
        const item3d = Array.isArray(parsed) && parsed.find(i => i.type === '3d');
        if (item3d && (item3d.full || item3d.file)) url3d = item3d.full || item3d.file;
      }
    } catch(e) {}
  }

  if (url3d) {
    const sfMatch = url3d.match(/sketchfab\.com.*?(?:models\/|3d-models\/(?:[^\/]+-)?)([a-f0-9]{32})/i) || (url3d.includes('sketchfab.com') && url3d.match(/([a-f0-9]{32})/i));
    const embedSrc = sfMatch
      ? `https://sketchfab.com/models/${sfMatch[1]}/embed?autostart=0&camera=0&preload=1&ui_theme=dark`
      : url3d;
    const iframe = document.getElementById('sketchfab-viewer-iframe');
    if (iframe && iframe.src !== embedSrc) {
      iframe.src = embedSrc;
    }
    const directLink = document.getElementById('sketchfab-direct-link');
    if (directLink && sfMatch) {
      directLink.href = `https://sketchfab.com/3d-models/${sfMatch[1]}`;
    }
  }
  const agendaTitle = getCustomText('agenda_title');
  if (agendaTitle !== null) setContent('[data-i18n="agenda.title"]', agendaTitle);

  const agendaSubtitle = getCustomText('agenda_subtitle');
  if (agendaSubtitle !== null) setContent('[data-i18n="agenda.subtitle"]', agendaSubtitle);

  const reservasTitle = getCustomText('reservas_title');
  if (reservasTitle !== null) setContent('[data-i18n="reservas.title"]', reservasTitle);

  const reservasSubtitle = getCustomText('reservas_subtitle');
  if (reservasSubtitle !== null) setContent('[data-i18n="reservas.subtitle"]', reservasSubtitle);

  // 3. Cronología / Línea de Tiempo (Hitos 1 a 6)
  for (let i = 1; i <= 6; i++) {
    const idx = i - 1;
    const hitoTitle = getCustomText(`hito${i}_title`);
    if (hitoTitle !== null) {
      setContent(`[data-i18n="historia.timeline.events.${idx}.year"]`, hitoTitle);
    }
    const hitoDesc = getCustomText(`hito${i}_desc`);
    if (hitoDesc !== null) {
      setContent(`[data-i18n="historia.timeline.events.${idx}.text"]`, hitoDesc);
    }
  }

  // 4. Patrimonio Milenario / Santuario y Territorio
  const patrimonioTitle = getCustomText('patrimonio_title');
  if (patrimonioTitle !== null) setContent('[data-i18n="historia.title"]', patrimonioTitle);

  const patrimonioSubtitle = getCustomText('patrimonio_subtitle');
  if (patrimonioSubtitle !== null) setContent('[data-i18n="historia.subtitle"]', patrimonioSubtitle);

  const formatStoryParagraphs = (txt) => {
    if (!txt) return '';
    return txt.split(/\n\s*\n/).map(p => `<p>${formatRichText(p.trim())}</p>`).join('');
  };

  const patrimonioTab1 = getCustomText('patrimonio_tab1');
  if (patrimonioTab1 !== null) {
    document.querySelectorAll('[data-i18n="historia.iberico_content.body"]').forEach(el => {
      el.innerHTML = formatStoryParagraphs(patrimonioTab1);
    });
  }
  const patrimonioTab2 = getCustomText('patrimonio_tab2');
  if (patrimonioTab2 !== null) {
    document.querySelectorAll('[data-i18n="historia.iltiraka_content.body"]').forEach(el => {
      el.innerHTML = formatStoryParagraphs(patrimonioTab2);
    });
  }
  const patrimonioTab3 = getCustomText('patrimonio_tab3');
  if (patrimonioTab3 !== null) {
    document.querySelectorAll('[data-i18n="historia.fontanar_content.body"]').forEach(el => {
      el.innerHTML = formatStoryParagraphs(patrimonioTab3);
    });
  }

  const btnIltiraka = getCustomText('patrimonio_btn_iltiraka');
  if (btnIltiraka !== null && tabIltirakaBtn) tabIltirakaBtn.textContent = btnIltiraka;
  const btnIberico = getCustomText('patrimonio_btn_iberico');
  if (btnIberico !== null && tabIbericoBtn) tabIbericoBtn.textContent = btnIberico;
  const btnFontanar = getCustomText('patrimonio_btn_fontanar');
  if (btnFontanar !== null && tabFontanarBtn) tabFontanarBtn.textContent = btnFontanar;

  const titleIltiraka = getCustomText('patrimonio_title_iltiraka');
  if (titleIltiraka !== null && tabIltirakaPane) {
    const h3 = tabIltirakaPane.querySelector('h3');
    if (h3) h3.textContent = titleIltiraka;
  }
  const titleIberico = getCustomText('patrimonio_title_iberico');
  if (titleIberico !== null && tabIbericoPane) {
    const h3 = tabIbericoPane.querySelector('h3');
    if (h3) h3.textContent = titleIberico;
  }
  const titleFontanar = getCustomText('patrimonio_title_fontanar');
  if (titleFontanar !== null && tabFontanarPane) {
    const h3 = tabFontanarPane.querySelector('h3');
    if (h3) h3.textContent = titleFontanar;
  }

  // Aplicar Carrusel Hero si existen diapositivas o ajustes en la configuración
  const currentHeroSlides = (langOverrides && Array.isArray(langOverrides.hero_carousel) && langOverrides.hero_carousel.length > 0)
    ? langOverrides.hero_carousel
    : ((c && Array.isArray(c.hero_carousel) && c.hero_carousel.length > 0) ? c.hero_carousel : null);

  if (currentHeroSlides || c.hero_carousel_interval || c.hero_carousel_autoplay !== undefined) {
    setupHeroCarousel(window.currentI18n, {
      ...c,
      hero_carousel: currentHeroSlides || c.hero_carousel
    });
  }
}


/* ═══════════════════════════════════════════
   Carga de Puntos de Exposición / Paneles
   ═══════════════════════════════════════════ */
async function loadExhibitionPoints(i18n) {
  const container = document.getElementById('panels-container');
  if (!container) return;

  // Si la URL contiene ?panel=X o ?qr=X (escaneo de código QR), redirigir directamente a la ficha específica
  const urlParams = new URLSearchParams(window.location.search);
  const targetPanelId = urlParams.get('panel') || urlParams.get('qr');
  if (targetPanelId) {
    window.location.replace(`punto.html?id=${targetPanelId}`);
    return;
  }

  try {
    let panels = [];

    // 1. Prioridad: localStorage en este navegador si el gestor ha modificado paneles
    const saved = localStorage.getItem('pajarillo_panels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) panels = parsed;
      } catch (e) {}
    }

    // 2. Intentar API en vivo
    if (!panels || panels.length === 0) {
      try {
        const res = await fetch('./api/data.php?entity=panels&t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data.panels && data.panels.length > 0) panels = data.panels;
        }
      } catch (e) {}
    }

    // 3. Fallback a archivo JSON estático
    if (!panels || panels.length === 0) {
      const resStatic = await fetch('./data/paneles.json?t=' + Date.now());
      const dataStatic = await resStatic.json();
      panels = dataStatic.panels || [];
    }

    const lang = i18n.currentLang || 'es';

    // Renderizado limpio solicitado: Solo recuadro con la imagen y el título, con enlace a ficha específica
    container.innerHTML = panels.map(panel => {
      const content = (panel.content && (panel.content[lang] || panel.content.es)) || { title: 'Punto Interpretativo' };
      const img = panel.image || './assets/images/lobo.png';

      return `
        <a href="punto.html?id=${panel.id}" class="point-card-compact" data-id="${panel.id}" title="Acceder a la ficha de ${content.title}">
          <div class="point-compact-img-wrap">
            <img src="${img}" alt="${content.title}" class="point-compact-img" loading="lazy" onerror="this.src='./assets/images/lobo.png'">
            <span class="point-compact-badge">Nº 0${panel.id}</span>
          </div>
          <div class="point-compact-body">
            <h3 class="point-compact-title">${content.title}</h3>
          </div>
        </a>
      `;
    }).join('');
  } catch (err) {
    console.error('Error cargando paneles:', err);
  }
}

/* ═══════════════════════════════════════════
   Header Scroll y Menú Móvil
   ═══════════════════════════════════════════ */
function setupHeaderScroll() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function setupMobileNav() {
  const toggleBtn = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });
  });
}

/* ═══════════════════════════════════════════
   Tabs de Historia, Arquitectura y Arte
   ═══════════════════════════════════════════ */
function setupHistoryTabs() {
  const tabBtns = document.querySelectorAll('.history-tabs .tab-btn');
  const tabPanes = document.querySelectorAll('.history-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `tab-${target}`);
      });
    });
  });
}

/* ═══════════════════════════════════════════
   Carrusel Interactivo de la Sección Hero
   ═══════════════════════════════════════════ */
function setupHeroCarousel(i18n, customConfig) {
  const container = document.getElementById('hero-card-carousel');
  if (!container) return;

  // Limpiar temporizador y listeners previos si se reconfigura dinámicamente
  if (typeof window._heroCarouselCleanup === 'function') {
    window._heroCarouselCleanup();
  }

  // 1. Renderizar diapositivas dinámicas desde configuración del CMS si existen
  if (customConfig && Array.isArray(customConfig.hero_carousel) && customConfig.hero_carousel.length > 0) {
    const viewport = container.querySelector('.hero-carousel-viewport');
    const dotsWrap = container.querySelector('#hero-carousel-dots');
    
    if (viewport) {
      const defaultKeys = [
        { title: 'hero.slide_lobo_title', sub: 'hero.slide_lobo_sub' },
        { title: 'hero.slide_leon_title', sub: 'hero.slide_leon_sub' },
        { title: 'hero.slide_santuario_title', sub: 'hero.slide_santuario_sub' },
        { title: 'hero.slide_yacimiento_title', sub: 'hero.slide_yacimiento_sub' },
        { title: 'hero.slide_iltiraka_title', sub: 'hero.slide_iltiraka_sub' }
      ];

      viewport.innerHTML = customConfig.hero_carousel.map((slide, i) => {
        let safeImg = slide.img || './assets/images/lobo.png';
        if (safeImg.includes('lobo-hero') || safeImg.includes('lobo.jpg')) {
          safeImg = './assets/images/lobo.png';
        }
        const titleEs = (slide.title_es || slide.title || '').replace(/"/g, '&quot;');
        const subEs = (slide.sub_es || slide.sub || '').replace(/"/g, '&quot;');
        const titleEn = (slide.title_en || '').replace(/"/g, '&quot;');
        const subEn = (slide.sub_en || '').replace(/"/g, '&quot;');
        const titleFr = (slide.title_fr || '').replace(/"/g, '&quot;');
        const subFr = (slide.sub_fr || '').replace(/"/g, '&quot;');

        const curLang = (i18n && i18n.currentLang) || document.documentElement.lang || 'es';
        let curTitle = (curLang === 'en' ? (titleEn || titleEs) : (curLang === 'fr' ? (titleFr || titleEs) : titleEs));
        let curSub = (curLang === 'en' ? (subEn || subEs) : (curLang === 'fr' ? (subFr || subEs) : subEs));

        const i18nTitleAttr = defaultKeys[i] ? `data-i18n-title="${defaultKeys[i].title}"` : '';
        const i18nSubAttr = defaultKeys[i] ? `data-i18n-sub="${defaultKeys[i].sub}"` : '';

        return `
          <div class="hero-carousel-slide ${i === 0 ? 'active' : ''}" data-index="${i}" 
               data-title-es="${titleEs}" data-sub-es="${subEs}"
               data-title-en="${titleEn}" data-sub-en="${subEn}"
               data-title-fr="${titleFr}" data-sub-fr="${subFr}"
               data-title="${curTitle}" data-sub="${curSub}"
               ${i18nTitleAttr} ${i18nSubAttr}>
            <img src="${safeImg}" alt="${curTitle || 'Diapositiva ' + (i+1)}" class="hero-carousel-img" onerror="this.onerror=null; this.src='./assets/images/lobo.png';">
          </div>
        `;
      }).join('');
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = customConfig.hero_carousel.map((slide, i) => {
        const title = (slide.title || 'Diapositiva ' + (i+1)).replace(/"/g, '&quot;');
        return `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="${i + 1}. ${title}"></button>`;
      }).join('');
    }
  }

  const slides = container.querySelectorAll('.hero-carousel-slide');
  const dots = container.querySelectorAll('.hero-dot');
  const titleEl = document.getElementById('hero-carousel-title');
  const subEl = document.getElementById('hero-carousel-sub');
  const prevBtn = document.getElementById('hero-prev-btn');
  const nextBtn = document.getElementById('hero-next-btn');

  if (!slides.length) return;

  let currentIndex = 0;
  let timer = null;

  // Configuración de autoplay e intervalo
  const isAutoplay = customConfig ? (customConfig.hero_carousel_autoplay !== false) : true;
  const rawInterval = customConfig && customConfig.hero_carousel_interval ? parseInt(customConfig.hero_carousel_interval, 10) : 3500;
  const INTERVAL_MS = (!isNaN(rawInterval) && rawInterval >= 1000) ? rawInterval : 3500;

  function updateTexts(slide) {
    if (!slide) return;
    const lang = (i18n && i18n.currentLang) || document.documentElement.lang || 'es';

    let title = '';
    let sub = '';

    if (lang === 'en') {
      title = slide.dataset.titleEn;
      sub = slide.dataset.subEn;
    } else if (lang === 'fr') {
      title = slide.dataset.titleFr;
      sub = slide.dataset.subFr;
    } else {
      title = slide.dataset.titleEs;
      sub = slide.dataset.subEs;
    }

    const i18nTitleKey = slide.dataset.i18nTitle;
    const i18nSubKey = slide.dataset.i18nSub;

    if (i18n && typeof i18n.t === 'function') {
      if ((!title || title === '') && i18nTitleKey) {
        const val = i18n.t(i18nTitleKey);
        if (val && val !== i18nTitleKey) title = val;
      }
      if ((!sub || sub === '') && i18nSubKey) {
        const val = i18n.t(i18nSubKey);
        if (val && val !== i18nSubKey) sub = val;
      }
    }

    if (!title) title = slide.dataset.titleEs || slide.dataset.title || '';
    if (!sub) sub = slide.dataset.subEs || slide.dataset.sub || '';

    if (titleEl && title) titleEl.textContent = title;
    if (subEl && sub) subEl.textContent = sub;
  }

  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentIndex = index;

    slides.forEach((slide, i) => {
      const isActive = i === currentIndex;
      slide.classList.toggle('active', isActive);
      slide.setAttribute('aria-hidden', !isActive);
      if (isActive) {
        updateTexts(slide);
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    if (!isAutoplay || slides.length <= 1) return;
    timer = setInterval(nextSlide, INTERVAL_MS);
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  const handleNextClick = (e) => {
    e.preventDefault();
    nextSlide();
    startAutoplay();
  };

  const handlePrevClick = (e) => {
    e.preventDefault();
    prevSlide();
    startAutoplay();
  };

  if (nextBtn) nextBtn.addEventListener('click', handleNextClick);
  if (prevBtn) prevBtn.addEventListener('click', handlePrevClick);

  const dotClickHandlers = [];
  dots.forEach(dot => {
    const handler = (e) => {
      e.preventDefault();
      const idx = parseInt(dot.dataset.index, 10);
      if (!isNaN(idx)) {
        goToSlide(idx);
        startAutoplay();
      }
    };
    dot.addEventListener('click', handler);
    dotClickHandlers.push({ dot, handler });
  });

  // Pausar rotación en hover / focus
  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', startAutoplay);
  container.addEventListener('focusin', stopAutoplay);
  container.addEventListener('focusout', startAutoplay);

  // Soporte de gestos táctiles (swipe) en dispositivos móviles
  let touchStartX = 0;
  let touchEndX = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  };
  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 40) {
      nextSlide();
    } else if (touchEndX > touchStartX + 40) {
      prevSlide();
    }
    startAutoplay();
  };

  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Guardar limpiador para reconfiguración sin fugas ni listeners duplicados
  window._heroCarouselCleanup = () => {
    stopAutoplay();
    if (nextBtn) nextBtn.removeEventListener('click', handleNextClick);
    if (prevBtn) prevBtn.removeEventListener('click', handlePrevClick);
    dotClickHandlers.forEach(({ dot, handler }) => dot.removeEventListener('click', handler));
    container.removeEventListener('mouseenter', stopAutoplay);
    container.removeEventListener('mouseleave', startAutoplay);
    container.removeEventListener('focusin', stopAutoplay);
    container.removeEventListener('focusout', startAutoplay);
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchend', handleTouchEnd);
  };

  // Inicializar diapositiva inicial y temporizador
  goToSlide(0);
  startAutoplay();

  // Actualizar textos del slide activo si cambia el idioma
  if (i18n && typeof i18n.onLanguageChange === 'function') {
    i18n.onLanguageChange(() => {
      updateTexts(slides[currentIndex]);
    });
  }
}

/* ═══════════════════════════════════════════
   Formulario de Reserva para Visitas Guiadas
   ═══════════════════════════════════════════ */
function setupBookingForm(i18n) {
  const form = document.getElementById('tour-booking-form');
  const successBox = document.getElementById('booking-success-msg');
  const errorBox = document.getElementById('booking-error-msg');
  const errorText = document.getElementById('booking-error-text');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Verificando y registrando solicitud...';
    btn.disabled = true;
    if (errorBox) errorBox.style.display = 'none';

    const bookingData = {
      name: document.getElementById('b-name').value.trim(),
      email: document.getElementById('b-email').value.trim(),
      phone: document.getElementById('b-phone').value.trim(),
      date: document.getElementById('b-date').value,
      time: document.getElementById('b-time').value,
      people: parseInt(document.getElementById('b-people').value) || 2,
      lang: document.getElementById('b-lang').value,
      notes: (document.getElementById('b-notes').value || '').trim()
    };

    let serverSuccess = false;
    let errorMessage = '';

    try {
      const res = await fetch('./api/data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new_booking', booking: bookingData })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        serverSuccess = true;
      } else {
        errorMessage = data.error || 'El servidor no pudo procesar la reserva.';
      }
    } catch (err) {
      errorMessage = 'Error de conexión con el servidor. Comprueba tu conexión a Internet.';
    }

    if (!serverSuccess) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      if (errorBox) {
        if (errorText) errorText.textContent = errorMessage;
        errorBox.style.display = 'block';
      } else {
        alert(errorMessage);
      }
      return;
    }

    // Persistir copia en navegador para el panel de administración offline
    try {
      const storageKey = 'pajarillo_bookings_data';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const newEntry = {
        ...bookingData,
        id: Date.now(),
        createdAt: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'pending',
        seen: false
      };
      existing.unshift(newEntry);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch (e) {}

    // Registrar evento analítico
    if (window.PajarilloAnalytics) {
      window.PajarilloAnalytics.track('booking', {
        people: bookingData.people,
        lang: bookingData.lang,
        detail: `Reserva para ${bookingData.date} (${bookingData.name})`
      });
    }

    form.reset();
    form.style.display = 'none';
    if (successBox) successBox.style.display = 'block';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 1000);
  });
}

/* ═══════════════════════════════════════════
   Generación de Códigos QR (Estilo Jódar con color corporativo)
   ═══════════════════════════════════════════ */
let qrCodeInstance = null;

function setupQrModal() {
  const modal = document.getElementById('qr-modal');
  const closeBtn = document.getElementById('btn-close-qr');
  const downloadBtn = document.getElementById('btn-download-qr');
  const copyBtn = document.getElementById('btn-copy-qr-link');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const img = document.querySelector('#qrcode-container img');
      if (!img) return;
      const a = document.createElement('a');
      a.href = img.src;
      a.download = `QR_Santuario_El_Pajarillo_${Date.now()}.png`;
      a.click();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const url = document.getElementById('qr-link-text').textContent;
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = '¡Copiado!';
        setTimeout(() => copyBtn.textContent = 'Copiar enlace', 2000);
      } catch (err) {}
    });
  }
}

window.openPanelQR = function(panelId, panelTitle) {
  const modal = document.getElementById('qr-modal');
  const container = document.getElementById('qrcode-container');
  const titleEl = document.getElementById('qr-modal-title');
  const linkText = document.getElementById('qr-link-text');

  if (!modal || !container) return;

  titleEl.textContent = panelTitle;
  container.innerHTML = '';

  // URL Oficial Única y Definitiva de Producción (Ayto Huelma)
  // Para que el QR coincida exactamente con los archivos de imprenta sin duplicidades
  const OFFICIAL_BASE_URL = 'https://www.aytohuelma.es/cipajarillo/';
  const targetUrl = `${OFFICIAL_BASE_URL}punto.html?id=${panelId}`;
  linkText.textContent = targetUrl;

  // Archivos oficiales de imprenta (100% idénticos a los paneles impresos)
  const OFFICIAL_PRINT_MAP = {
    0: 'QR_PUNTO_PORTAL_portal_general_del_santuario',
    1: 'QR_PUNTO_01_la_cabeza_de_lobo',
    2: 'QR_PUNTO_02_el_monumento_heroico_escalonado',
    3: 'QR_PUNTO_03_el_territorio_de_iltiraka',
    4: 'QR_PUNTO_04_un_paisaje_sagrado',
    5: 'QR_PUNTO_05_el_guerrero_de_la_falcata_y_los_leones',
    6: 'QR_PUNTO_06_los_grifos_y_seres_alados',
    7: 'QR_PUNTO_07_la_falcata_iberica_y_el_armamento_sagrado',
    8: 'QR_PUNTO_08_la_loma_del_perro',
    9: 'QR_PUNTO_09_las_campanas_arqueologicas_de_1994_y_bic',
    10: 'QR_PUNTO_10_centro_de_interpretacion_y_reconstruccion_3d',
    11: 'QR_PUNTO_11_punto_11',
    12: 'QR_PUNTO_12_punto_12',
    13: 'QR_PUNTO_13_punto_13',
    14: 'QR_PUNTO_14_punto_14',
    15: 'QR_PUNTO_15_punto_15'
  };

  const baseFileName = OFFICIAL_PRINT_MAP[Number(panelId)];
  if (baseFileName) {
    container.innerHTML = `<img src="./QRS_DEFINITIVOS_IMPRENTA/${baseFileName}.png" alt="QR ${panelTitle}" style="width: 240px; height: 240px; object-fit: contain; display: block; border-radius: 4px;">`;
  } else if (typeof QRCode !== 'undefined') {
    qrCodeInstance = new QRCode(container, {
      text: targetUrl,
      width: 240,
      height: 240,
      colorDark: '#384F3E',   // Verde Oficial del Manual
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    container.innerHTML = `<p style="padding: 2rem;">QR: ${targetUrl}</p>`;
  }

  modal.classList.remove('hidden');

  if (window.PajarilloAnalytics) {
    window.PajarilloAnalytics.track('qr_scan', {
      panel_id: panelId,
      panel: panelTitle,
      detail: `Consulta de QR del panel ${panelId}`
    });
  }
};

window.prefillActivity = function(title) {
  const notes = document.getElementById('b-notes');
  if (notes) {
    notes.value = `Interés en la actividad programada: ${title}`;
    const el = document.getElementById('reservas');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
};

window.downloadResource = function(title, fileUrl) {
  const target = fileUrl || './assets/docs/dossier_pajarillo.pdf';
  const a = document.createElement('a');
  a.href = target;
  a.download = target.split('/').pop();
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (window.PajarilloAnalytics) {
    window.PajarilloAnalytics.track('download', {
      detail: title || 'Dossier Oficial'
    });
  }
};

window.playSimulatedVideo = function(videoUrl) {
  if (videoUrl && videoUrl !== '#') {
    window.open(videoUrl, '_blank');
  }
};

window.playAudio = function(audioFile) {
  if (audioFile) {
    const audio = new Audio(`./assets/audio/${audioFile}`);
    audio.play().catch(() => {});
  }
};

function setupCookieConsentBanner() {
  const banner = document.getElementById('analytics-banner');
  const btnAccept = document.getElementById('btn-accept-cookies');
  const btnReject = document.getElementById('btn-reject-cookies');
  if (!banner) return;

  const consent = localStorage.getItem('pajarillo_cookie_consent');
  if (!consent) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }

  if (btnAccept) {
    btnAccept.addEventListener('click', () => {
      localStorage.setItem('pajarillo_cookie_consent', 'accepted');
      banner.style.display = 'none';
    });
  }

  if (btnReject) {
    btnReject.addEventListener('click', () => {
      localStorage.setItem('pajarillo_cookie_consent', 'rejected');
      banner.style.display = 'none';
    });
  }
}


