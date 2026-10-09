/**
 * Gestor de la Agenda Cultural Dinámica
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

const AGENDA_STORAGE_KEY = 'pajarillo_agenda_data';

export class AgendaManager {
  constructor(i18n) {
    this.i18n = i18n;
    this.activities = [];
    this.currentFilter = 'todos';
    this.container = document.getElementById('agenda-container');
    this.filterButtons = document.querySelectorAll('.agenda-filters .filter-btn');
    window.pajarilloAgenda = this;
  }

  async init() {
    await this.loadData();
    this.bindFilters();
    this.render();

    this.i18n.onLanguageChange(() => {
      this.render();
    });

    // Escuchar actualizaciones en tiempo real desde el panel Admin u otras pestañas
    window.addEventListener('storage', async (e) => {
      if (e.key === AGENDA_STORAGE_KEY) {
        await this.loadData();
        this.render();
      }
    });
  }

  async loadData() {
    let loaded = false;

    // 1. Intentar API PHP en vivo (o servidor) con timestamp para evitar caché
    try {
      const res = await fetch('./api/data.php?entity=agenda&t=' + Date.now()).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.activities) && data.activities.length > 0) {
          this.activities = data.activities;
          localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(this.activities));
          loaded = true;
        }
      }
    } catch (err) {}

    // 2. Si no hay backend PHP (ej. GitHub Pages), comprobar localStorage
    if (!loaded) {
      const saved = localStorage.getItem(AGENDA_STORAGE_KEY);
      if (saved !== null) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.activities = parsed;
            loaded = true;
          }
        } catch (e) {}
      }
    }

    // 3. Fallback a data/agenda.json estático
    if (!loaded) {
      try {
        const res = await fetch('./data/agenda.json?t=' + Date.now());
        const data = await res.json();
        this.activities = data.activities || [];
        if (this.activities.length > 0) {
          localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(this.activities));
        }
      } catch (err) {
        this.activities = [];
      }
    }
  }

  bindFilters() {
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });
  }

  formatDate(dateStr, lang) {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const locales = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR' };
      return d.toLocaleDateString(locales[lang] || 'es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  render() {
    if (!this.container) return;
    const lang = this.i18n.currentLang || 'es';

    // Solo mostrar actividades activas/publicadas en el portal público
    const activeActivities = this.activities.filter(act => act.active !== false);

    const filtered = this.currentFilter === 'todos'
      ? activeActivities
      : activeActivities.filter(a => a.category === this.currentFilter);

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--c-white); border-radius: var(--radius-md); border: 1px solid var(--c-border);">
          <p style="color: var(--c-text-muted); font-size: 1rem;">${this.i18n.t('agenda.no_events')}</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = filtered.map(act => {
      const title = typeof act.title === 'object' && act.title !== null
        ? (act.title[lang] || act.title.es || Object.values(act.title)[0] || '')
        : (act.title || '');
      const desc = typeof act.description === 'object' && act.description !== null
        ? (act.description[lang] || act.description.es || Object.values(act.description)[0] || '')
        : (act.description || '');
      const dateFormatted = this.formatDate(act.date, lang);
      const spotsCount = act.spotsLeft !== undefined ? act.spotsLeft : (act.spotsTotal || 25);
      const spotsLabel = this.i18n.t('agenda.plazas_disponibles');
      const reserveLabel = this.i18n.t('agenda.reservar_btn');
      const actImage = act.image || './assets/images/gallery/exterior.jpg';

      return `
        <article class="event-card">
          <img src="${actImage}" alt="${title.replace(/"/g, '&quot;')}" class="event-img" loading="lazy" onerror="this.src='./assets/images/gallery/exterior.jpg'">
          <div class="event-body">
            <div class="event-meta">
              <span>📅 ${dateFormatted}</span>
              <span>⏰ ${act.time || '11:30'} h</span>
            </div>
            <h3 class="event-title">${title}</h3>
            <p class="event-desc">${desc}</p>
            <div class="event-footer">
              <span class="spots-badge">${spotsCount} ${spotsLabel}</span>
              <a href="#reservas" class="btn-point-action btn-point-qr" style="background: var(--c-primary); color: white;" onclick="prefillActivity('${title.replace(/'/g, "\\'")}')">
                ${reserveLabel}
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }
}
