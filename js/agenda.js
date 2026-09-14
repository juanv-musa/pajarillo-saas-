/**
 * Gestor de la Agenda Cultural Dinámica
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

export class AgendaManager {
  constructor(i18n) {
    this.i18n = i18n;
    this.activities = [];
    this.currentFilter = 'todos';
    this.container = document.getElementById('agenda-container');
    this.filterButtons = document.querySelectorAll('.agenda-filters .filter-btn');
  }

  async init() {
    await this.loadData();
    this.bindFilters();
    this.render();

    this.i18n.onLanguageChange(() => {
      this.render();
    });
  }

  async loadData() {
    try {
      // Intentar primero API PHP, luego JSON estático
      let res = await fetch('./api/data.php?entity=agenda&t=' + Date.now()).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch('./data/agenda.json?t=' + Date.now());
      }
      const data = await res.json();
      this.activities = data.activities || [];
    } catch (err) {
      console.warn('Error cargando actividades de la agenda:', err);
      this.activities = [];
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
    const lang = this.i18n.currentLang;

    const filtered = this.currentFilter === 'todos'
      ? this.activities
      : this.activities.filter(a => a.category === this.currentFilter);

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--c-white); border-radius: var(--radius-md); border: 1px solid var(--c-border);">
          <p style="color: var(--c-text-muted); font-size: 1rem;">${this.i18n.t('agenda.no_events')}</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = filtered.map(act => {
      const title = act.title[lang] || act.title.es;
      const desc = act.description[lang] || act.description.es;
      const dateFormatted = this.formatDate(act.date, lang);
      const spotsLabel = this.i18n.t('agenda.plazas_disponibles');
      const reserveLabel = this.i18n.t('agenda.reservar_btn');
      const freeLabel = this.i18n.t('agenda.precio_gratis');

      return `
        <article class="event-card">
          <img src="${act.image}" alt="${title}" class="event-img" loading="lazy">
          <div class="event-body">
            <div class="event-meta">
              <span>📅 ${dateFormatted}</span>
              <span>⏰ ${act.time} h</span>
            </div>
            <h3 class="event-title">${title}</h3>
            <p class="event-desc">${desc}</p>
            <div class="event-footer">
              <span class="spots-badge">${act.spotsLeft} ${spotsLabel}</span>
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
