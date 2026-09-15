/**
 * Galería Multimedia y Visor de Recursos Digitales
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

export class GalleryManager {
  constructor(i18n) {
    this.i18n = i18n;
    this.data = { media: [], resources: [], videos: [] };
    this.currentPhotoIndex = 0;

    this.photosContainer = document.getElementById('gallery-photos');
    this.resourcesContainer = document.getElementById('gallery-resources');
    this.videosContainer = document.getElementById('gallery-videos');

    this.tabButtons = document.querySelectorAll('.gallery-tabs .tab-btn');
    this.tabPanes = document.querySelectorAll('.gallery-pane');

    this.lightbox = document.getElementById('gallery-lightbox');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxCaption = document.getElementById('lightbox-caption');
  }

  async init() {
    await this.loadData();
    this.bindTabs();
    this.bindLightbox();
    this.render();

    this.i18n.onLanguageChange(() => {
      this.render();
    });
  }

  async loadData() {
    try {
      const res = await fetch('./data/gallery.json?t=' + Date.now());
      this.data = await res.json();
    } catch (err) {
      console.warn('Error cargando datos de galería:', err);
    }
  }

  bindTabs() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        this.tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.tabPanes.forEach(pane => {
          pane.classList.toggle('active', pane.id === `tab-${target}`);
        });
      });
    });
  }

  bindLightbox() {
    if (!this.lightbox) return;

    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeLightbox());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevPhoto());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPhoto());

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) this.closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (this.lightbox.classList.contains('active')) {
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowLeft') this.prevPhoto();
        if (e.key === 'ArrowRight') this.nextPhoto();
      }
    });
  }

  openLightbox(index) {
    this.currentPhotoIndex = index;
    const item = this.data.media[index];
    if (!item) return;

    const lang = this.i18n.currentLang;
    const caption = item.caption[lang] || item.caption.es;

    this.lightboxImg.src = item.src;
    this.lightboxCaption.textContent = caption;
    this.lightbox.classList.remove('hidden');
    this.lightbox.classList.add('active');
  }

  closeLightbox() {
    this.lightbox.classList.add('hidden');
    this.lightbox.classList.remove('active');
  }

  prevPhoto() {
    if (this.currentPhotoIndex > 0) {
      this.openLightbox(this.currentPhotoIndex - 1);
    } else {
      this.openLightbox(this.data.media.length - 1);
    }
  }

  nextPhoto() {
    if (this.currentPhotoIndex < this.data.media.length - 1) {
      this.openLightbox(this.currentPhotoIndex + 1);
    } else {
      this.openLightbox(0);
    }
  }

  render() {
    const lang = this.i18n.currentLang;

    // 1. Fotos
    if (this.photosContainer && this.data.media) {
      this.photosContainer.innerHTML = this.data.media.map((item, idx) => {
        const caption = item.caption[lang] || item.caption.es;
        const catLabel = this.i18n.t(`galeria.categories.${item.category}`) || item.category;
        return `
          <button type="button" class="gallery-card" aria-label="${caption}" onclick="window.galleryInstance.openLightbox(${idx})">
            <img src="${item.thumb}" alt="${caption}" loading="lazy">
            <div class="gallery-card-overlay">
              <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--c-accent-gold-text); font-weight: 700;">${catLabel}</span>
              <p class="gallery-caption">${caption}</p>
            </div>
          </button>
        `;
      }).join('');
    }

    // 2. Recursos descargables (Fichas, Didáctica, Cartografía)
    if (this.resourcesContainer && this.data.resources) {
      const downloadLabel = this.i18n.t('galeria.download_btn') || '⬇ Descargar';
      this.resourcesContainer.innerHTML = this.data.resources.map(res => {
        const title = res.title[lang] || res.title.es;
        const desc = res.description[lang] || res.description.es;
        const badgeLabel = this.i18n.t(`galeria.badges.${res.badge}`) || res.badge;
        return `
          <div class="resource-card">
            <div class="resource-icon">${res.icon}</div>
            <div class="resource-content">
              <span style="background: var(--c-stone-warm); color: var(--c-primary); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">${badgeLabel}</span>
              <h3 style="margin-top: 6px;">${title}</h3>
              <p>${desc}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: var(--c-text-muted); font-weight: 600;">${res.format}</span>
                <button class="btn-point-action btn-point-qr" onclick="downloadResource('${title.replace(/'/g, "\\'")}')">
                  ${downloadLabel}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Vídeos y 3D
    if (this.videosContainer && this.data.videos) {
      this.videosContainer.innerHTML = this.data.videos.map(vid => {
        const title = vid.title[lang] || vid.title.es;
        const desc = vid.description[lang] || vid.description.es;
        return `
          <div class="event-card" style="border: 1.5px solid var(--c-border); cursor: pointer;" onclick="window.open('./audiovisual_p0.html', '_blank')">
            <div style="position: relative; height: 220px; overflow: hidden; background: #000;">
              <img src="${vid.thumb}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.75;">
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
                <button type="button" aria-label="Reproducir ${title} en sala audiovisual" class="btn-cta-gold" style="padding: 12px 20px; border-radius: 50%; font-size: 1.5rem; width: 56px; height: 56px; justify-content: center;">
                  ▶
                </button>
              </div>
              <span style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${vid.duration}</span>
            </div>
            <div class="event-body">
              <h3 class="event-title" style="font-size: 1.3rem;">${title}</h3>
              <p class="event-desc">${desc}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}
