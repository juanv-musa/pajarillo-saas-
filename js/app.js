/**
 * Main Application Orchestrator
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

import { I18nManager } from './i18n.js';
import { AgendaManager } from './agenda.js';
import { GalleryManager } from './gallery.js';
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
  window.addEventListener('storage', (e) => {
    if (e.key === 'pajarillo_site_config') {
      try {
        const newConfig = JSON.parse(e.newValue);
        applySiteConfig(newConfig);
      } catch(err) {}
    }
  });
});

/* ═══════════════════════════════════════════
   Configuración de Secciones y Textos (CMS)
   ═══════════════════════════════════════════ */
async function initSiteConfig() {
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

  // 2. Personalización de Textos y Contenidos
  const c = config.content || {};
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
    document.querySelectorAll('[data-i18n="hero.btn_plan"]').forEach(el => {
      el.textContent = c.hero_cta;
    });
  }
  if (c.hero_desc) {
    document.querySelectorAll('[data-i18n="hero.card_desc"]').forEach(el => {
      el.textContent = c.hero_desc;
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
}


/* ═══════════════════════════════════════════
   Carga de Puntos de Exposición / Paneles
   ═══════════════════════════════════════════ */
async function loadExhibitionPoints(i18n) {
  const container = document.getElementById('panels-container');
  if (!container) return;

  try {
    let res = await fetch('./api/data.php?entity=panels&t=' + Date.now()).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('./data/paneles.json?t=' + Date.now());
    }
    const data = await res.json();
    const panels = data.panels || [];
    const lang = i18n.currentLang;

    container.innerHTML = panels.map(panel => {
      const content = panel.content[lang] || panel.content.es;
      const safeTitle = content.title.replace(/'/g, "\\'");
      const viewQrLabel = i18n.t('puntos.view_qr') || 'Código QR';
      const tagLabel = i18n.t(`puntos.tag_${panel.tag}`) || panel.tag;

      return `
        <article class="point-card" data-id="${panel.id}">
          <div class="point-img-wrap">
            <img src="${panel.image}" alt="${content.title}" class="point-img" loading="lazy">
            <span class="point-tag-badge">${tagLabel}</span>
            <span class="point-id-badge">Nº 0${panel.id}</span>
          </div>
          <div class="point-body">
            <h3 class="point-title">${content.title}</h3>
            <div class="point-subtitle">${content.subtitle || ''}</div>
            <div class="point-description">${content.description}</div>
            <div class="point-footer">
              <button class="btn-point-action btn-point-qr" onclick="openPanelQR(${panel.id}, '${safeTitle}')">
                📱 ${viewQrLabel}
              </button>
              ${content.audio ? `
                <button class="btn-point-action btn-point-qr" style="background: var(--c-accent-purple); color: white;" onclick="playAudio('${content.audio}')">
                  🔊 Audio
                </button>
              ` : ''}
            </div>
          </div>
        </article>
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

  // URL del punto (puede abrir el punto concreto en la app)
  const targetUrl = `${window.location.origin}${window.location.pathname}?panel=${panelId}`;
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
