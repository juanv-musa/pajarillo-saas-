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
  setupHeaderScroll();
  setupMobileNav();
  setupHistoryTabs();
  setupBookingForm(i18n);
  setupQrModal();

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
    }
  });
});

/* ═══════════════════════════════════════════
   Configuración de Secciones y Textos (CMS)
   ═══════════════════════════════════════════ */
async function initSiteConfig() {
  const CACHE_VERSION = 'v3.2';
  if (localStorage.getItem('pajarillo_app_v') !== CACHE_VERSION) {
    localStorage.removeItem('pajarillo_site_config');
    localStorage.removeItem('pajarillo_locales');
    localStorage.setItem('pajarillo_app_v', CACHE_VERSION);
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
  }
  if (c.hero_card_sub) {
    document.querySelectorAll('[data-i18n="hero.card_sub"]').forEach(el => {
      el.textContent = c.hero_card_sub;
    });
  }
  if (c.hero_card_img) {
    document.querySelectorAll('.hero-wolf-img').forEach(el => {
      el.src = c.hero_card_img;
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
  if (c.horario_verano) {
    document.querySelectorAll('[data-i18n="horarios.alta_dias"]').forEach(el => {
      el.textContent = c.horario_verano;
    });
  }
  if (c.horario_invierno) {
    document.querySelectorAll('[data-i18n="horarios.baja_dias"]').forEach(el => {
      el.textContent = c.horario_invierno;
    });
  }
  if (c.tarifa_general) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_general_price"]').forEach(el => {
      el.textContent = c.tarifa_general;
    });
  }
  if (c.tarifa_reducida) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_reducida_price"]').forEach(el => {
      el.textContent = c.tarifa_reducida;
    });
  }
  if (c.tarifa_gratuita) {
    document.querySelectorAll('[data-i18n="horarios.tarifa_gratuita_desc"]').forEach(el => {
      el.textContent = c.tarifa_gratuita;
    });
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
      const img = panel.image || './assets/images/gallery/exterior.jpg';

      return `
        <a href="punto.html?id=${panel.id}" class="point-card-compact" data-id="${panel.id}" title="Acceder a la ficha de ${content.title}">
          <div class="point-compact-img-wrap">
            <img src="${img}" alt="${content.title}" class="point-compact-img" loading="lazy" onerror="this.src='./assets/images/lobo.png'">
            <span class="point-compact-badge">Nº 0${panel.id}</span>
          </div>
          <div class="point-compact-body">
            <h3 class="point-compact-title">${content.title}</h3>
            <span class="point-compact-action">
              <span>Entrar y escuchar</span>
              <span aria-hidden="true">→</span>
            </span>
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

