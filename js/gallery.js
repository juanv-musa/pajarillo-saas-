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

    window.addEventListener('storage', (e) => {
      if (e.key === 'pajarillo_gallery_data') {
        this.loadData().then(() => this.render());
      }
    });
  }

  async loadData() {
    try {
      const res = await fetch('./data/gallery.json?t=' + Date.now());
      this.data = await res.json();
    } catch (err) {
      console.warn('Error cargando datos de galería:', err);
    }

    try {
      const custom = localStorage.getItem('pajarillo_gallery_data');
      if (custom) {
        const items = JSON.parse(custom);
        const toLocObj = (val) => {
          if (!val) return { es: '', en: '', fr: '' };
          if (typeof val === 'object') {
            const es = val.es || '';
            const en = val.en || es;
            const fr = val.fr || es;
            return { es, en, fr };
          }
          return { es: String(val), en: String(val), fr: String(val) };
        };

        const photos = items.filter(i => i.type === 'foto').map(i => ({
          id: 'custom_' + i.id,
          type: 'photo',
          src: i.full,
          thumb: i.thumb || i.full,
          caption: toLocObj(i.title),
          author: typeof i.category === 'object' ? (i.category.es || 'Centro de Interpretación') : (i.category || 'Centro de Interpretación'),
          category: typeof i.category === 'object' ? (i.category.es || 'Fototeca') : (i.category || 'Fototeca')
        }));

        const resources = items.filter(i => i.type === 'pdf').map(i => ({
          id: 'res_' + i.id,
          title: toLocObj(i.title),
          description: toLocObj(i.desc),
          badge: typeof i.category === 'object' ? (i.category.es || 'PDF Oficial') : (i.category || 'PDF Oficial'),
          file: i.file || i.full,
          format: 'PDF / Digital',
          icon: '📄'
        }));

        const videos = items.filter(i => i.type === 'video' || i.type === '3d').map(i => ({
          id: 'vid_' + i.id,
          category: typeof i.category === 'object' ? (i.category.es || (i.type === '3d' ? 'Modelo 3D' : 'Audiovisual')) : (i.category || 'Audiovisual'),
          title: toLocObj(i.title),
          description: toLocObj(i.desc),
          duration: i.duration || (i.type === '3d' ? '3D' : '05:00'),
          thumb: i.thumb || i.full,
          videoUrl: i.file || i.full
        }));

        if (photos.length > 0) this.data.media = photos;
        if (resources.length > 0) this.data.resources = resources;
        if (videos.length > 0) this.data.videos = videos;
      }
    } catch (e) {}
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

    const lang = this.i18n.currentLang || 'es';
    const getLang = (obj, fallback = '') => {
      if (!obj) return fallback;
      if (typeof obj === 'string') return obj;
      return obj[lang] || obj.es || obj.en || obj.fr || fallback;
    };

    const caption = getLang(item.caption, 'Fotografía');

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
    const lang = this.i18n.currentLang || 'es';
    const getLang = (obj, fallback = '') => {
      if (!obj) return fallback;
      if (typeof obj === 'string') return obj;
      return obj[lang] || obj.es || obj.en || obj.fr || fallback;
    };

    // 1. Fotos
    if (this.photosContainer && this.data.media) {
      this.photosContainer.innerHTML = this.data.media.map((item, idx) => {
        const caption = getLang(item.caption, 'Fotografía');
        const cat = getLang(item.category, 'Patrimonio');
        const catLabel = this.i18n.t(`galeria.categories.${cat}`) !== `galeria.categories.${cat}`
          ? this.i18n.t(`galeria.categories.${cat}`)
          : cat;
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
        const title = getLang(res.title, 'Documento');
        const desc = getLang(res.description || res.desc, '');
        const badge = getLang(res.badge || res.category, 'Publicación Oficial');
        const badgeLabel = this.i18n.t(`galeria.badges.${badge}`) !== `galeria.badges.${badge}`
          ? this.i18n.t(`galeria.badges.${badge}`)
          : badge;
        return `
          <div class="resource-card">
            <div class="resource-icon">${res.icon || '📄'}</div>
            <div class="resource-content">
              <span style="background: var(--c-stone-warm); color: var(--c-primary); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">${badgeLabel}</span>
              <h3 style="margin-top: 6px;">${title}</h3>
              <p>${desc}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: var(--c-text-muted); font-weight: 600;">${res.format || 'PDF / Digital'}</span>
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
        const title = getLang(vid.title, 'Audiovisual');
        const desc = getLang(vid.description || vid.desc, '');
        return `
          <div class="event-card" style="border: 1.5px solid var(--c-border); cursor: pointer;" onclick="window.open('./audiovisual_p0.html', '_blank')">
            <div style="position: relative; height: 220px; overflow: hidden; background: #000;">
              <img src="${vid.thumb}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.75;">
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
                <button type="button" aria-label="Reproducir ${title} en sala audiovisual" class="btn-cta-gold" style="padding: 12px 20px; border-radius: 50%; font-size: 1.5rem; width: 56px; height: 56px; justify-content: center;">
                  ▶
                </button>
              </div>
              <span style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${vid.duration || '05:00'}</span>
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
