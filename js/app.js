/**
 * Main Application Orchestrator
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

import { I18nManager } from './i18n.js';
import { AgendaManager } from './agenda.js';
import { GalleryManager } from './gallery.js';
import { AccessibilityWidget } from './accessibility.js';
import './analytics.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inicializar Internacionalización
  const i18n = new I18nManager();
  await i18n.init();
  window.pajarilloI18n = i18n;

  // 2. Inicializar Módulos Dinámicos
  const agenda = new AgendaManager(i18n);
  await agenda.init();

  const gallery = new GalleryManager(i18n);
  await gallery.init();
  window.galleryInstance = gallery;

  // 3. Inicializar Widget de Accesibilidad Universal
  const accessibility = new AccessibilityWidget(i18n);
  accessibility.init();
  window.accessibilityInstance = accessibility;

  // 3. Cargar Puntos de Visita y Paneles
  await loadExhibitionPoints(i18n);
  i18n.onLanguageChange(() => {
    loadExhibitionPoints(i18n);
  });

  // 4. Setup Interacciones de UI
  window.currentI18n = i18n;
  setupHeaderScroll();
  setupMobileNav();
  setupHistoryTabs();
  setupHeroCarousel(i18n);
  setupBookingForm(i18n);
  setupQrModal();
  setupCookieConsentBanner();

  // 5. Cargar y Aplicar Configuración de Secciones y Textos del CMS
  await initSiteConfig();
  i18n.onLanguageChange(() => {
    initSiteConfig();
  });

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
});

/* ═══════════════════════════════════════════
   Configuración de Secciones y Textos (CMS)
   ═══════════════════════════════════════════ */
async function initSiteConfig() {
  const CACHE_VERSION = 'v3.5';
  if (localStorage.getItem('pajarillo_app_v') !== CACHE_VERSION) {
    localStorage.removeItem('pajarillo_site_config');
    localStorage.removeItem('pajarillo_locales');
    localStorage.setItem('pajarillo_app_v', CACHE_VERSION);
  }

  // Purga defensiva: eliminar caché antigua si contiene rutas a archivos eliminados (lobo-hero.jpg o lobo.jpg)
  const rawLocales = localStorage.getItem('pajarillo_locales') || '';
  if (rawLocales.includes('lobo-hero') || rawLocales.includes('lobo.jpg')) {
    localStorage.removeItem('pajarillo_locales');
  }
  const rawConfig = localStorage.getItem('pajarillo_site_config') || '';
  if (rawConfig.includes('lobo-hero') || rawConfig.includes('lobo.jpg')) {
    localStorage.removeItem('pajarillo_site_config');
  }

  const currentLang = (window.pajarilloI18n && window.pajarilloI18n.currentLang) || 'es';
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
  const savedLocales = localStorage.getItem('pajarillo_locales');
  if (savedLocales) {
    try {
      const locales = JSON.parse(savedLocales);
      if (locales[currentLang]) {
        if (!config) config = { sections: {}, content: {} };
        config.content = { ...config.content, ...locales[currentLang] };
      }
    } catch(e) {}
  }

  if (config) {
    applySiteConfig(config);
  }
}

function applySiteConfig(config) {
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

  // 2. Personalización de Textos y Contenidos
  const c = config.content || {};
  if (c.hero_eyebrow) {
    document.querySelectorAll('[data-i18n="hero.eyebrow"]').forEach(el => {
      el.textContent = c.hero_eyebrow;
    });
  }
  if (c.site_title) {
    document.querySelectorAll('.brand-text strong, [data-i18n="hero.title"]').forEach(el => {
      el.textContent = c.site_title;
    });
  }
  if (c.site_tagline) {
    document.querySelectorAll('.brand-text span, [data-i18n="hero.subtitle"]').forEach(el => {
      el.textContent = c.site_tagline;
    });
  }
  if (c.hero_cta) {
    document.querySelectorAll('[data-i18n="hero.cta_primary"], [data-i18n="hero.btn_plan"]').forEach(el => {
      el.textContent = c.hero_cta;
    });
  }
  if (c.hero_desc) {
    document.querySelectorAll('[data-i18n="hero.card_desc"]').forEach(el => {
      el.textContent = c.hero_desc;
    });
  }
  if (c.hero_card_title) {
    document.querySelectorAll('[data-i18n="hero.card_title"]').forEach(el => {
      el.textContent = c.hero_card_title;
    });
    const slide0 = document.querySelector('.hero-carousel-slide[data-index="0"]');
    if (slide0) slide0.dataset.title = c.hero_card_title;
  }
  if (c.hero_card_sub) {
    document.querySelectorAll('[data-i18n="hero.card_sub"]').forEach(el => {
      el.textContent = c.hero_card_sub;
    });
    const slide0 = document.querySelector('.hero-carousel-slide[data-index="0"]');
    if (slide0) slide0.dataset.sub = c.hero_card_sub;
  }
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
  if (c.ayto) {
    document.querySelectorAll('[data-i18n="contacto.ayto_val"]').forEach(el => {
      el.textContent = c.ayto;
    });
  }
  if (c.horario_atencion) {
    document.querySelectorAll('[data-i18n="contacto.horario_atencion"]').forEach(el => {
      el.textContent = c.horario_atencion;
    });
  }
  // 5. Horarios de Apertura y Tarifas
  if (c.horarios_title) {
    document.querySelectorAll('[data-i18n="horarios.horarios_title"]').forEach(el => el.textContent = c.horarios_title);
  }
  if (c.horario_verano_titulo) {
    document.querySelectorAll('[data-i18n="horarios.temporada_alta"]').forEach(el => el.textContent = c.horario_verano_titulo);
  }
  if (c.horario_verano) {
    document.querySelectorAll('[data-i18n="horarios.alta_dias"]').forEach(el => {
      el.textContent = c.horario_verano;
    });
  }
  if (c.horario_verano_dom) {
    document.querySelectorAll('[data-i18n="horarios.alta_dom"]').forEach(el => el.textContent = c.horario_verano_dom);
  }
  if (c.horario_invierno_titulo) {
    document.querySelectorAll('[data-i18n="horarios.temporada_baja"]').forEach(el => el.textContent = c.horario_invierno_titulo);
  }
  if (c.horario_invierno) {
    document.querySelectorAll('[data-i18n="horarios.baja_dias"]').forEach(el => {
      el.textContent = c.horario_invierno;
    });
  }
  if (c.horario_invierno_dom) {
    document.querySelectorAll('[data-i18n="horarios.baja_dom"]').forEach(el => el.textContent = c.horario_invierno_dom);
  }
  if (c.horario_aviso) {
    document.querySelectorAll('[data-i18n="horarios.aviso_lunes"]').forEach(el => el.textContent = c.horario_aviso);
  }

  // Tarifas
  if (c.tarifas_title) {
    document.querySelectorAll('[data-i18n="horarios.tarifas_title"]').forEach(el => el.textContent = c.tarifas_title);
  }
  if (c.tarifa_general_titulo) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_general"]').forEach(el => el.textContent = c.tarifa_general_titulo);
  }
  if (c.tarifa_general_desc) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_general_desc"]').forEach(el => el.textContent = c.tarifa_general_desc);
  }
  if (c.tarifa_general) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_general_price"]').forEach(el => {
      el.textContent = c.tarifa_general;
    });
  }
  if (c.tarifa_reducida_titulo) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_reducida"]').forEach(el => el.textContent = c.tarifa_reducida_titulo);
  }
  if (c.tarifa_reducida_desc) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_reducida_desc"]').forEach(el => el.textContent = c.tarifa_reducida_desc);
  }
  if (c.tarifa_reducida) {
    const cleanReducida = c.tarifa_reducida.includes('(') ? '1,50 €' : c.tarifa_reducida;
    document.querySelectorAll('[data-i18n="horarios.tarifa_reducida_price"]').forEach(el => {
      el.textContent = cleanReducida;
    });
  }
  if (c.tarifa_gratuita_titulo) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_gratuita"]').forEach(el => el.textContent = c.tarifa_gratuita_titulo);
  }
  if (c.tarifa_gratuita || c.tarifa_gratuita_desc) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_gratuita_desc"]').forEach(el => {
      el.textContent = c.tarifa_gratuita_desc || c.tarifa_gratuita;
    });
  }
  if (c.tarifa_gratuita_precio) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_gratuita_price"]').forEach(el => el.textContent = c.tarifa_gratuita_precio);
  }

  // Cómo llegar y Localización
  if (c.como_llegar_titulo) {
    document.querySelectorAll('[data-i18n="horarios.localizacion_title"]').forEach(el => el.textContent = c.como_llegar_titulo);
  }
  if (c.como_llegar_direccion) {
    document.querySelectorAll('[data-i18n="horarios.direccion_val"]').forEach(el => el.textContent = c.como_llegar_direccion);
  }
  if (c.como_llegar_parking) {
    document.querySelectorAll('[data-i18n="horarios.parking_val"]').forEach(el => el.textContent = c.como_llegar_parking);
  }
  if (c.como_llegar_accesibilidad) {
    document.querySelectorAll('[data-i18n="horarios.accesibilidad_val"]').forEach(el => el.textContent = c.como_llegar_accesibilidad);
  }
  if (c.como_llegar_mapa_url) {
    document.querySelectorAll('#btn-google-maps, a[href*="maps.google.com"]').forEach(el => el.href = c.como_llegar_mapa_url);
  }
  if (c.como_llegar_mapa_embed) {
    const mapIframe = document.getElementById('osm-map-iframe');
    if (mapIframe) mapIframe.src = c.como_llegar_mapa_embed;
  }
  if (c.footer_copy) {
    document.querySelectorAll('[data-i18n="footer.copy"]').forEach(el => {
      el.textContent = c.footer_copy;
    });
  }
  if (c.desc_3d) {
    const desc3dEl = document.querySelector('#tab-modelo3d p');
    if (desc3dEl) desc3dEl.textContent = c.desc_3d;
  }
  if (c.agenda_title) {
    document.querySelectorAll('[data-i18n="agenda.title"]').forEach(el => {
      el.textContent = c.agenda_title;
    });
  }
  if (c.agenda_subtitle) {
    document.querySelectorAll('[data-i18n="agenda.subtitle"]').forEach(el => {
      el.textContent = c.agenda_subtitle;
    });
  }
  if (c.reservas_title) {
    document.querySelectorAll('[data-i18n="reservas.title"]').forEach(el => {
      el.textContent = c.reservas_title;
    });
  }
  if (c.reservas_subtitle) {
    document.querySelectorAll('[data-i18n="reservas.subtitle"]').forEach(el => {
      el.textContent = c.reservas_subtitle;
    });
  }

  // 3. Cronología / Línea de Tiempo (Hitos 1 a 6)
  for (let i = 1; i <= 6; i++) {
    const idx = i - 1;
    if (c[`hito${i}_title`]) {
      document.querySelectorAll(`[data-i18n="historia.timeline.events.${idx}.year"]`).forEach(el => {
        el.textContent = c[`hito${i}_title`];
      });
    }
    if (c[`hito${i}_desc`]) {
      document.querySelectorAll(`[data-i18n="historia.timeline.events.${idx}.text"]`).forEach(el => {
        el.textContent = c[`hito${i}_desc`];
      });
    }
  }

  // 4. Patrimonio Milenario / Santuario y Territorio
  if (c.patrimonio_title) {
    document.querySelectorAll('[data-i18n="historia.title"]').forEach(el => {
      el.textContent = c.patrimonio_title;
    });
  }
  if (c.patrimonio_subtitle) {
    document.querySelectorAll('[data-i18n="historia.subtitle"]').forEach(el => {
      el.textContent = c.patrimonio_subtitle;
    });
  }
  const formatStoryParagraphs = (txt) => {
    if (!txt) return '';
    return txt.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join('');
  };

  if (c.patrimonio_tab1) {
    document.querySelectorAll('[data-i18n="historia.iberico_content.body"]').forEach(el => {
      el.innerHTML = formatStoryParagraphs(c.patrimonio_tab1);
    });
  }
  if (c.patrimonio_tab2) {
    document.querySelectorAll('[data-i18n="historia.iltiraka_content.body"]').forEach(el => {
      el.innerHTML = formatStoryParagraphs(c.patrimonio_tab2);
    });
  }
  if (c.patrimonio_tab3) {
    document.querySelectorAll('[data-i18n="historia.fontanar_content.body"]').forEach(el => {
      el.innerHTML = formatStoryParagraphs(c.patrimonio_tab3);
    });
  }

  // Imágenes personalizables de las 3 pestañas
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

  // Control dinámico de visibilidad de pestañas en Santuario y Territorio (Patrimonio)
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

  // Títulos personalizados de botones y artículos en Santuario y Territorio
  if (c.patrimonio_btn_iltiraka && tabIltirakaBtn) tabIltirakaBtn.textContent = c.patrimonio_btn_iltiraka;
  if (c.patrimonio_btn_iberico && tabIbericoBtn) tabIbericoBtn.textContent = c.patrimonio_btn_iberico;
  if (c.patrimonio_btn_fontanar && tabFontanarBtn) tabFontanarBtn.textContent = c.patrimonio_btn_fontanar;

  if (c.patrimonio_title_iltiraka && tabIltirakaPane) {
    const h3 = tabIltirakaPane.querySelector('h3');
    if (h3) h3.textContent = c.patrimonio_title_iltiraka;
  }
  if (c.patrimonio_title_iberico && tabIbericoPane) {
    const h3 = tabIbericoPane.querySelector('h3');
    if (h3) h3.textContent = c.patrimonio_title_iberico;
  }
  if (c.patrimonio_title_fontanar && tabFontanarPane) {
    const h3 = tabFontanarPane.querySelector('h3');
    if (h3) h3.textContent = c.patrimonio_title_fontanar;
  }

  // Aplicar Carrusel Hero si existen diapositivas o ajustes en la configuración
  if (c.hero_carousel || c.hero_carousel_interval || c.hero_carousel_autoplay !== undefined) {
    setupHeroCarousel(window.currentI18n, c);
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

    // 1. Intentar API en vivo
    try {
      const res = await fetch('./api/data.php?entity=panels&t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data.panels && data.panels.length > 0) panels = data.panels;
      }
    } catch (e) {}

    // 2. Fallback a localStorage
    if (!panels || panels.length === 0) {
      const saved = localStorage.getItem('pajarillo_panels');
      if (saved) {
        try { panels = JSON.parse(saved); } catch (e) {}
      }
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
      viewport.innerHTML = customConfig.hero_carousel.map((slide, i) => {
        let safeImg = slide.img || './assets/images/lobo.png';
        if (safeImg.includes('lobo-hero') || safeImg.includes('lobo.jpg')) {
          safeImg = './assets/images/lobo.png';
        }
        const titleSafe = (slide.title || '').replace(/"/g, '&quot;');
        const subSafe = (slide.sub || '').replace(/"/g, '&quot;');
        return `
          <div class="hero-carousel-slide ${i === 0 ? 'active' : ''}" data-index="${i}" data-title="${titleSafe}" data-sub="${subSafe}">
            <img src="${safeImg}" alt="${titleSafe || 'Diapositiva ' + (i+1)}" class="hero-carousel-img" onerror="this.onerror=null; this.src='./assets/images/lobo.png';">
          </div>
        `;
      }).join('');
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = customConfig.hero_carousel.map((slide, i) => `
        <button class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="${i + 1}. ${(slide.title || '').replace(/"/g, '&quot;')}"></button>
      `).join('');
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
    const i18nTitleKey = slide.dataset.i18nTitle;
    const i18nSubKey = slide.dataset.i18nSub;

    let title = '';
    let sub = '';

    if (i18n && typeof i18n.t === 'function') {
      if (i18nTitleKey) title = i18n.t(i18nTitleKey);
      if (i18nSubKey) sub = i18n.t(i18nSubKey);
    }

    if (!title || title === i18nTitleKey) title = slide.dataset.title;
    if (!sub || sub === i18nSubKey) sub = slide.dataset.sub;

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
}

/* ═══════════════════════════════════════════
   Formulario de Reserva para Visitas Guiadas
   ═══════════════════════════════════════════ */
function setupBookingForm(i18n) {
  const form = document.getElementById('tour-booking-form');
  const successBox = document.getElementById('booking-success-msg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Enviando solicitud...';
    btn.disabled = true;

    const bookingData = {
      name: document.getElementById('b-name').value,
      email: document.getElementById('b-email').value,
      phone: document.getElementById('b-phone').value,
      date: document.getElementById('b-date').value,
      time: document.getElementById('b-time').value,
      people: parseInt(document.getElementById('b-people').value) || 2,
      lang: document.getElementById('b-lang').value,
      notes: document.getElementById('b-notes').value
    };

    try {
      await fetch('./api/data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new_booking', booking: bookingData })
      });
    } catch (err) {
      console.warn('Almacenamiento offline de reserva');
    }

    // Persistir localmente para sincronización en tiempo real con el panel de administración
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

      // Si el gestor municipal ha configurado un email opcional para avisos:
      const notifyCfg = JSON.parse(localStorage.getItem('pajarillo_notify_config') || '{}');
      if (notifyCfg && notifyCfg.email) {
        // Enviar copia por webhook o mailto/formulario si hay endpoint configurado
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(notifyCfg.email), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `🎟️ Nueva Reserva: ${bookingData.name} (${bookingData.date})`,
            nombre: bookingData.name,
            fecha: bookingData.date,
            hora: bookingData.time,
            personas: bookingData.people,
            telefono: bookingData.phone,
            email: bookingData.email,
            observaciones: bookingData.notes || 'Ninguna'
          })
        }).catch(() => null);
      }
    } catch (e) {}

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

  // URL específica del punto interpretativo
  const origin = window.location.origin;
  let path = window.location.pathname;
  if (path.endsWith('index.html')) {
    path = path.replace(/index\.html$/, 'punto.html');
  } else {
    path = path.replace(/\/?$/, '/punto.html');
  }
  const targetUrl = `${origin}${path}?id=${panelId}`;
  linkText.textContent = targetUrl;

  if (typeof QRCode !== 'undefined') {
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

window.downloadResource = function(title) {
  alert(`Descargando recurso oficial: "${title}".\nEl archivo digital está disponible en el repositorio del Centro de Interpretación.`);
  if (window.PajarilloAnalytics) {
    window.PajarilloAnalytics.track('download', {
      detail: title
    });
  }
};

window.playSimulatedVideo = function(title) {
  alert(`Reproduciendo recurso audiovisual: "${title}".\nVisualización habilitada en pantalla completa.`);
  if (window.PajarilloAnalytics) {
    window.PajarilloAnalytics.track('video_view', {
      detail: title
    });
  }
};

window.playAudio = function(audioFile) {
  alert(`Reproduciendo audioguía oficial: "${audioFile}".\nEscucha disponible en sala y dispositivos móviles.`);
  if (window.PajarilloAnalytics) {
    window.PajarilloAnalytics.track('audio_play', {
      audio: audioFile,
      detail: `Audioguía: ${audioFile}`
    });
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


