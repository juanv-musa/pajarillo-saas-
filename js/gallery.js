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

    this.activeVideoIndex = null;
    this.activeVideoTrack = 'normal';
    window.galleryInstance = this;
  }

  async init() {
    await this.loadData();
    this.bindTabs();
    this.bindLightbox();
    this.bindVideoLightbox();
    this.render();

    this.i18n.onLanguageChange(() => {
      this.render();
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'pajarillo_gallery_data' || e.key === 'pajarillo_kiosk_videos') {
        this.loadData().then(() => this.render());
      }
    });
  }

  async loadData() {
    try {
      const res = await fetch('./data/gallery.json?t=' + Date.now()).catch(() => null);
      if (res && res.ok) {
        this.data = await res.json();
      }
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

        const migratePath = (p) => {
          if (!p || typeof p !== 'string') return p;
          return p
            .replace(/lobo-hero\.jpg/g, 'lobo.png')
            .replace(/gallery\/exterior\.jpg/g, 'iltiraka.png')
            .replace(/gallery\/arqueologia\.jpg/g, 'arqueologia.png')
            .replace(/gallery\/claustro\.jpg/g, 'santuario_ilustracion.png')
            .replace(/gallery\/interior\.jpg/g, 'santuario_ilustracion.png')
            .replace(/gallery\/retablo\.jpg/g, 'gallery/leon.png')
            .replace(/lobo\.jpg/g, 'lobo.png');
        };

        const photos = items.filter(i => i.type === 'foto').map(i => ({
          id: 'custom_' + i.id,
          type: 'photo',
          src: migratePath(i.full),
          thumb: migratePath(i.thumb || i.full),
          caption: toLocObj(i.title),
          author: typeof i.category === 'object' ? (i.category.es || 'Centro de Interpretación') : (i.category || 'Centro de Interpretación'),
          category: typeof i.category === 'object' ? (i.category.es || 'Fototeca') : (i.category || 'Fototeca')
        }));

        const resources = items.filter(i => i.type === 'pdf').map(i => ({
          id: 'res_' + i.id,
          title: toLocObj(i.title),
          description: toLocObj(i.desc),
          badge: typeof i.category === 'object' ? (i.category.es || 'PDF Oficial') : (i.category || 'PDF Oficial'),
          file: migratePath(i.file || i.full),
          format: 'PDF / Digital',
          icon: '📄'
        }));

        const videos = items.filter(i => i.type === 'video' || i.type === '3d').map(i => ({
          id: 'vid_' + i.id,
          category: typeof i.category === 'object' ? (i.category.es || (i.type === '3d' ? 'Modelo 3D' : 'Audiovisual')) : (i.category || 'Audiovisual'),
          title: toLocObj(i.title),
          description: toLocObj(i.desc),
          duration: i.duration || (i.type === '3d' ? '3D' : '05:00'),
          thumb: migratePath(i.thumb || i.full),
          videoUrl: i.file || i.full
        }));

        if (photos.length > 0) this.data.media = photos;
        if (resources.length > 0) this.data.resources = resources;
        if (videos.length > 0) this.data.videos = videos;
      }
    } catch (e) {}

    // Si hay vídeos personalizados del Kiosco / Fondos Audiovisuales, usarlos directamente (incluso si está vacío [])
    try {
      const customKiosk = localStorage.getItem('pajarillo_kiosk_videos');
      if (customKiosk !== null) {
        const parsedKiosk = JSON.parse(customKiosk);
        if (Array.isArray(parsedKiosk)) {
          this.data.videos = parsedKiosk;
        }
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

  bindVideoLightbox() {
    this.videoLightbox = document.getElementById('video-lightbox');
    this.videoLightboxElement = document.getElementById('video-lightbox-element');
    this.videoLightboxTitle = document.getElementById('video-lightbox-title');
    this.videoLightboxDesc = document.getElementById('video-lightbox-desc');
    this.videoTrackSelector = document.getElementById('video-lightbox-track-selector');
    this.btnTrackNormal = document.getElementById('btn-web-track-normal');
    this.btnTrackAudiodesc = document.getElementById('btn-web-track-audiodesc');
    this.videoBadgeMode = document.getElementById('video-lightbox-badge-mode');
    this.videoCloseBtn = document.getElementById('video-lightbox-close');

    if (this.videoCloseBtn) {
      this.videoCloseBtn.addEventListener('click', () => this.closeVideoModal());
    }

    if (this.videoLightbox) {
      this.videoLightbox.addEventListener('click', (e) => {
        if (e.target === this.videoLightbox) this.closeVideoModal();
      });
    }

    if (this.btnTrackNormal) {
      this.btnTrackNormal.addEventListener('click', () => this.switchVideoTrack('normal'));
    }
    if (this.btnTrackAudiodesc) {
      this.btnTrackAudiodesc.addEventListener('click', () => this.switchVideoTrack('audiodesc'));
    }

    document.addEventListener('keydown', (e) => {
      if (this.videoLightbox && !this.videoLightbox.classList.contains('hidden')) {
        if (e.key === 'Escape') this.closeVideoModal();
      }
    });
  }

  openVideoModal(index, track = 'normal') {
    const vid = this.data.videos[index];
    if (!vid || !this.videoLightbox || !this.videoLightboxElement) return;

    this.activeVideoIndex = index;
    this.activeVideoTrack = track;

    const lang = this.i18n.currentLang || 'es';
    const getLang = (obj, fallback = '') => {
      if (!obj) return fallback;
      if (typeof obj === 'string') return obj;
      return obj[lang] || obj.es || obj.en || obj.fr || fallback;
    };

    const title = getLang(vid.title, 'Audiovisual');
    const desc = getLang(vid.description || vid.desc, '');

    if (this.videoLightboxTitle) this.videoLightboxTitle.textContent = title;
    if (this.videoLightboxDesc) this.videoLightboxDesc.textContent = desc;

    // Si tiene vídeo con audiodescripción, mostrar el selector
    const hasAudioDesc = Boolean(vid.videoUrlAudioDesc || vid.videoAudiodescripcionUrl);
    if (this.videoTrackSelector) {
      this.videoTrackSelector.style.display = hasAudioDesc ? 'flex' : 'none';
    }

    const targetUrl = (track === 'audiodesc' && hasAudioDesc)
      ? (vid.videoUrlAudioDesc || vid.videoAudiodescripcionUrl)
      : vid.videoUrl;

    this.updateTrackButtonsUI(track);

    this.videoLightboxElement.src = targetUrl;
    this.videoLightboxElement.load();
    this.videoLightbox.classList.remove('hidden');

    const playPromise = this.videoLightboxElement.play();
    if (playPromise) playPromise.catch(() => {});

    if (window.PajarilloAnalytics && typeof window.PajarilloAnalytics.track === 'function') {
      window.PajarilloAnalytics.track('video_play', {
        title: title,
        track_mode: track,
        has_audiodesc: hasAudioDesc
      });
    }
  }

  switchVideoTrack(track) {
    if (this.activeVideoIndex === null) return;
    const vid = this.data.videos[this.activeVideoIndex];
    if (!vid || !this.videoLightboxElement) return;

    const hasAudioDesc = Boolean(vid.videoUrlAudioDesc || vid.videoAudiodescripcionUrl);
    if (track === 'audiodesc' && !hasAudioDesc) return;

    this.activeVideoTrack = track;
    const curTime = this.videoLightboxElement.currentTime || 0;
    const wasPaused = this.videoLightboxElement.paused;

    const targetUrl = track === 'audiodesc'
      ? (vid.videoUrlAudioDesc || vid.videoAudiodescripcionUrl)
      : vid.videoUrl;

    this.updateTrackButtonsUI(track);

    this.videoLightboxElement.src = targetUrl;
    this.videoLightboxElement.currentTime = curTime;
    if (!wasPaused) {
      this.videoLightboxElement.play().catch(() => {});
    }
  }

  updateTrackButtonsUI(track) {
    if (this.btnTrackNormal && this.btnTrackAudiodesc) {
      if (track === 'audiodesc') {
        this.btnTrackAudiodesc.style.background = 'var(--c-accent-gold)';
        this.btnTrackAudiodesc.style.color = '#111';
        this.btnTrackNormal.style.background = 'transparent';
        this.btnTrackNormal.style.color = '#c4d6cb';
        if (this.videoBadgeMode) {
          this.videoBadgeMode.textContent = 'Modo: 👁️ Con Audiodescripción Accesible';
          this.videoBadgeMode.style.color = '#fff';
          this.videoBadgeMode.style.background = 'rgba(46, 125, 50, 0.7)';
          this.videoBadgeMode.style.borderColor = '#81c784';
        }
      } else {
        this.btnTrackNormal.style.background = 'var(--c-primary)';
        this.btnTrackNormal.style.color = '#fff';
        this.btnTrackAudiodesc.style.background = 'transparent';
        this.btnTrackAudiodesc.style.color = '#c4d6cb';
        if (this.videoBadgeMode) {
          this.videoBadgeMode.textContent = 'Modo: 🎬 Locutado / Subtitulado estándar';
          this.videoBadgeMode.style.color = 'var(--c-accent-gold-text)';
          this.videoBadgeMode.style.background = 'rgba(181, 154, 87, 0.2)';
          this.videoBadgeMode.style.borderColor = 'rgba(181, 154, 87, 0.4)';
        }
      }
    }
  }

  closeVideoModal() {
    if (this.videoLightboxElement) {
      this.videoLightboxElement.pause();
      this.videoLightboxElement.src = '';
    }
    if (this.videoLightbox) {
      this.videoLightbox.classList.add('hidden');
    }
    this.activeVideoIndex = null;
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
            <div class="resource-icon"><img src="./assets/icons/icon-document.png" alt="" class="custom-icon-img" style="width: 44px; height: 44px; object-fit: contain;"></div>
            <div class="resource-content">
              <span style="background: var(--c-stone-warm); color: var(--c-primary); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">${badgeLabel}</span>
              <h3 style="margin-top: 6px;">${title}</h3>
              <p>${desc}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: var(--c-text-muted); font-weight: 600;">${res.format || 'PDF / Digital'}</span>
                <a href="${res.url || res.file || './assets/docs/dossier_pajarillo.pdf'}" download class="btn-point-action btn-point-qr" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                  ${downloadLabel}
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Vídeos y 3D
    if (this.videosContainer) {
      if (!this.data.videos || this.data.videos.length === 0) {
        this.videosContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; color: var(--c-text-muted); background: var(--c-stone-light); border-radius: var(--radius-lg); border: 1.5px dashed var(--c-border); margin: 1rem 0;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎬</div>
            <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--c-primary); margin-bottom: 0.5rem;" data-i18n="galeria.empty_videos">No hay audiovisuales configurados</h4>
            <p style="font-size: 0.92rem; max-width: 480px; margin: 0 auto; color: var(--c-text-muted);" data-i18n="galeria.empty_videos_desc">Actualmente no hay vídeos activos en esta sección. Puedes añadir o gestionar documentales desde el Panel de Administración.</p>
          </div>
        `;
      } else {
        this.videosContainer.innerHTML = this.data.videos.map((vid, idx) => {
          const title = getLang(vid.title, 'Audiovisual');
          const desc = getLang(vid.description || vid.desc, '');
          const hasAudioDesc = Boolean(vid.videoUrlAudioDesc || vid.videoAudiodescripcionUrl);
          const cat = vid.category || 'Audiovisual';

          return `
            <div class="event-card" style="border: 1.5px solid var(--c-border); display: flex; flex-direction: column; overflow: hidden; border-radius: var(--radius-lg); background: #fff; box-shadow: var(--shadow-sm); cursor: pointer;" onclick="window.galleryInstance.openVideoModal(${idx}, 'normal')">
              <div>
                <div style="position: relative; height: 210px; overflow: hidden; background: #000;">
                  <img src="${vid.thumb || './assets/images/lobo.png'}" alt="${title.replace(/"/g, '&quot;')}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85; transition: transform 0.4s ease;" onerror="this.src='./assets/images/lobo.png'">
                  <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.25);">
                    <div class="btn-cta-gold" style="padding: 12px 18px; border-radius: 50%; font-size: 1.4rem; width: 54px; height: 54px; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                      ▶
                    </div>
                  </div>
                  <span style="position: absolute; top: 10px; left: 10px; background: rgba(26,36,30,0.85); color: #fff; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">
                    ${cat}
                  </span>
                  <span style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: #D4AF37; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
                    ⏱ ${vid.duration || '05:00'}
                  </span>
                </div>
                
                <div class="event-body" style="padding: 1.25rem;">
                  <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
                    <span style="background: var(--c-stone-warm); color: var(--c-primary); font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 4px;">
                      🔊 Locutado / Subtítulos
                    </span>
                  </div>
                  <h3 class="event-title" style="font-size: 1.2rem; line-height: 1.35; margin-bottom: 0.5rem; color: var(--c-primary);">${title}</h3>
                  <p class="event-desc" style="font-size: 0.88rem; line-height: 1.5; color: var(--c-text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0;">${desc}</p>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }
}
