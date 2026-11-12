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
    this.models3dContainer = document.getElementById('gallery-3d');

    this.tabButtons = document.querySelectorAll('.gallery-tabs .tab-btn');
    this.tabPanes = document.querySelectorAll('.gallery-pane');

    this.lightbox = document.getElementById('gallery-lightbox');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxCaption = document.getElementById('lightbox-caption');

    this.activeVideoIndex = null;
    this.activeVideoTrack = 'normal';
    this.activeModel3dIndex = 0;
    this.data = {
      media: [],
      resources: [],
      videos: [],
      models3d: []
    };
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
            .replace(/heroe_de_lltiraka\.pdf/gi, 'heroe_de_Iltiraka.pdf')
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

        const resources = items.filter(i => i.type === 'pdf' || i.type === 'web' || i.type === 'enlace').map(i => {
          const isWeb = i.type === 'web' || i.type === 'enlace' || (i.full && (i.full.startsWith('http://') || i.full.startsWith('https://')) && !i.full.endsWith('.pdf'));
          const targetUrl = isWeb ? (i.full || i.url || i.file) : (i.file || i.full || i.url);
          return {
            id: 'res_' + i.id,
            type: isWeb ? 'web' : 'pdf',
            title: toLocObj(i.title),
            description: toLocObj(i.desc),
            badge: typeof i.category === 'object' ? (i.category.es || (isWeb ? 'Enlace Web' : 'PDF Oficial')) : (i.category || (isWeb ? 'Enlace Web' : 'PDF Oficial')),
            file: migratePath(targetUrl),
            url: migratePath(targetUrl),
            format: isWeb ? 'Sitio Web / Enlace' : 'PDF / Digital',
            icon: isWeb ? '🌐' : '📄'
          };
        });

        const custom3d = items.filter(i => i.type === '3d').map(i => {
          const rawUrl = i.full || i.file || i.url || '';
          const sfMatch = rawUrl.match(/sketchfab\.com.*?(?:models\/|3d-models\/(?:[^\/]+-)?)([a-f0-9]{32})/i) || (rawUrl.includes('sketchfab.com') && rawUrl.match(/([a-f0-9]{32})/i));
          const embedUrl = sfMatch 
            ? `https://sketchfab.com/models/${sfMatch[1]}/embed?autostart=0&camera=0&preload=1&ui_theme=dark`
            : rawUrl;
          return {
            id: 'model_' + i.id,
            type: '3d',
            title: toLocObj(i.title),
            category: toLocObj(i.category || 'Modelo 3D'),
            description: toLocObj(i.desc),
            thumb: migratePath(i.thumb || './assets/images/santuario_ilustracion.png'),
            url: embedUrl,
            sketchfabId: sfMatch ? sfMatch[1] : ''
          };
        });

        const videos = items.filter(i => i.type === 'video').map(i => ({
          id: 'vid_' + i.id,
          category: typeof i.category === 'object' ? (i.category.es || 'Audiovisual') : (i.category || 'Audiovisual'),
          title: toLocObj(i.title),
          description: toLocObj(i.desc),
          duration: i.duration || '05:00',
          thumb: migratePath(i.thumb || i.full),
          videoUrl: i.file || i.full
        }));

        if (photos.length > 0) this.data.media = photos;
        if (resources.length > 0) this.data.resources = resources;
        if (videos.length > 0) this.data.videos = videos;

        if (!Array.isArray(this.data.models3d)) this.data.models3d = [];
        if (custom3d.length > 0) {
          const map = new Map();
          this.data.models3d.forEach(m => map.set(m.sketchfabId || m.id, m));
          custom3d.forEach(m => map.set(m.sketchfabId || m.id, m));
          this.data.models3d = Array.from(map.values());
        }
      }
    } catch (e) {}

    // Garantizar modelo 3D por defecto si la lista estuviera vacía
    if (!Array.isArray(this.data.models3d) || this.data.models3d.length === 0) {
      this.data.models3d = [
        {
          id: "model_santuario",
          type: "3d",
          title: {
            es: "Santuario Heroico de El Pajarillo (Huelma, Jaén)",
            en: "Heroic Sanctuary of El Pajarillo (Huelma, Jaén)",
            fr: "Sanctuaire Héroïque d'El Pajarillo (Huelma, Jaén)"
          },
          category: {
            es: "Monumento y Enclave",
            en: "Monument & Site",
            fr: "Monument et Site"
          },
          description: {
            es: "Explora en 3D la reconstrucción volumétrica completa: gira en 360°, haz zoom y examina cada detalle del monumento escultórico.",
            en: "Explore the complete volumetric 3D reconstruction: rotate 360°, zoom in, and examine every detail of the sculptural monument.",
            fr: "Explorez la restitution volumétrique 3D complète : tournez à 360°, zoomez et examinez chaque détail du monument."
          },
          thumb: "./assets/images/santuario_ilustracion.png",
          url: "https://sketchfab.com/models/402ba73cf7bd40ec9d5b03d17206387e/embed?autostart=0&camera=0&preload=1&ui_theme=dark",
          sketchfabId: "402ba73cf7bd40ec9d5b03d17206387e"
        }
      ];
    }

    // Comprobar si hay una URL 3D asignada directamente desde los ajustes CMS de la web
    try {
      const saved3dUrl = localStorage.getItem('pajarillo_3d_model_url');
      if (saved3dUrl) {
        const sfMatch = saved3dUrl.match(/sketchfab\.com.*?(?:models\/|3d-models\/(?:[^\/]+-)?)([a-f0-9]{32})/i) || (saved3dUrl.includes('sketchfab.com') && saved3dUrl.match(/([a-f0-9]{32})/i));
        const embedUrl = sfMatch ? `https://sketchfab.com/models/${sfMatch[1]}/embed?autostart=0&camera=0&preload=1&ui_theme=dark` : saved3dUrl;
        const existing = this.data.models3d.find(m => m.url === embedUrl || (sfMatch && m.sketchfabId === sfMatch[1]));
        if (existing) {
          existing.url = embedUrl;
        } else {
          this.data.models3d.unshift({
            id: 'cfg_3d_' + Date.now(),
            type: '3d',
            title: {
              es: 'Modelo 3D Oficial Personalizado',
              en: 'Official Custom 3D Model',
              fr: 'Modèle 3D Officiel Personnalisé'
            },
            category: { es: 'Digitalización 3D', en: '3D Digitization', fr: 'Numérisation 3D' },
            description: {
              es: 'Modelo tridimensional interactivo disponible en el Centro de Interpretación.',
              en: 'Interactive 3D model available at the Interpretation Centre.',
              fr: 'Modèle 3D interactif disponible au Centre d\'Interprétation.'
            },
            thumb: './assets/images/santuario_ilustracion.png',
            url: embedUrl,
            sketchfabId: sfMatch ? sfMatch[1] : ''
          });
        }
      }
    } catch(e) {}

    // Los vídeos de pantallas de sala (Pantalla 0 y Pantalla 1) son exclusivos del centro.
    // Solo se publican en la web pública aquellos que tengan explícitamente activado showInWeb === true.
    try {
      const customKiosk = localStorage.getItem('pajarillo_kiosk_videos');
      if (customKiosk !== null) {
        const parsedKiosk = JSON.parse(customKiosk);
        if (Array.isArray(parsedKiosk)) {
          this.data.videos = parsedKiosk.filter(v => v.showInWeb === true);
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

    const ytMatch = targetUrl ? targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i) : null;
    const vimeoMatch = targetUrl ? targetUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i) : null;
    const sfMatch = targetUrl ? (targetUrl.match(/sketchfab\.com.*?(?:models\/|3d-models\/(?:[^\/]+-)?)([a-f0-9]{32})/i) || (targetUrl.includes('sketchfab.com') && targetUrl.match(/([a-f0-9]{32})/i))) : null;

    if (sfMatch) {
      this.videoLightboxElement.style.display = 'none';
      let iframe = this.videoLightbox.querySelector('#video-lightbox-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'video-lightbox-iframe';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.allow = 'autoplay; fullscreen; xr-spatial-tracking';
        iframe.allowFullscreen = true;
        this.videoLightboxElement.parentNode.appendChild(iframe);
      }
      iframe.style.display = 'block';
      iframe.src = `https://sketchfab.com/models/${sfMatch[1]}/embed?autostart=0&camera=0&preload=1&ui_theme=dark`;
    } else if (ytMatch) {
      this.videoLightboxElement.style.display = 'none';
      let iframe = this.videoLightbox.querySelector('#video-lightbox-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'video-lightbox-iframe';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        this.videoLightboxElement.parentNode.appendChild(iframe);
      }
      iframe.style.display = 'block';
      iframe.src = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1`;
    } else if (vimeoMatch) {
      this.videoLightboxElement.style.display = 'none';
      let iframe = this.videoLightbox.querySelector('#video-lightbox-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'video-lightbox-iframe';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        this.videoLightboxElement.parentNode.appendChild(iframe);
      }
      iframe.style.display = 'block';
      iframe.src = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    } else {
      const iframe = this.videoLightbox.querySelector('#video-lightbox-iframe');
      if (iframe) {
        iframe.src = '';
        iframe.style.display = 'none';
      }
      this.videoLightboxElement.style.display = 'block';
      this.videoLightboxElement.src = targetUrl;
      this.videoLightboxElement.load();
      const playPromise = this.videoLightboxElement.play();
      if (playPromise) playPromise.catch(() => {});
    }

    this.videoLightbox.classList.remove('hidden');

    if (window.PajarilloAnalytics && typeof window.PajarilloAnalytics.track === 'function') {
      window.PajarilloAnalytics.track('video_play', {
        title: title,
        track_mode: track,
        has_audiodesc: hasAudioDesc
      });
    }
  }

  openModel3dModal(index) {
    if (!this.data.models3d || !this.data.models3d[index]) return;
    const model = this.data.models3d[index];
    const getLang = (obj, fallback) => {
      if (!obj) return fallback || '';
      if (typeof obj === 'object') return obj[this.currentLang] || obj.es || Object.values(obj)[0] || fallback || '';
      return String(obj);
    };

    const title = getLang(model.title, 'Modelo 3D Interactivo');
    const targetUrl = model.url;

    if (this.videoLightboxTitle) {
      this.videoLightboxTitle.textContent = '🏛️ ' + title;
    }

    const sfMatch = targetUrl ? (targetUrl.match(/sketchfab\.com.*?(?:models\/|3d-models\/(?:[^\/]+-)?)([a-f0-9]{32})/i) || (targetUrl.includes('sketchfab.com') && targetUrl.match(/([a-f0-9]{32})/i))) : null;

    this.videoLightboxElement.style.display = 'none';
    let iframe = this.videoLightbox.querySelector('#video-lightbox-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'video-lightbox-iframe';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.allow = 'autoplay; fullscreen; xr-spatial-tracking';
      iframe.allowFullscreen = true;
      this.videoLightboxElement.parentNode.appendChild(iframe);
    }
    iframe.style.display = 'block';
    iframe.src = sfMatch 
      ? `https://sketchfab.com/models/${sfMatch[1]}/embed?autostart=1&camera=0&preload=1&ui_theme=dark`
      : targetUrl;

    this.videoLightbox.classList.remove('hidden');

    if (window.PajarilloAnalytics && typeof window.PajarilloAnalytics.track === 'function') {
      window.PajarilloAnalytics.track('3d_view', {
        title: title,
        url: targetUrl
      });
    }
  }

  playTrailer() {
    if (!this.data.videos || this.data.videos.length === 0) return;
    const trailerIdx = this.data.videos.findIndex(v => v.id === 'vid_trailer' || (v.category && String(v.category).toLowerCase().includes('tráiler')));
    if (trailerIdx >= 0) {
      this.openVideoModal(trailerIdx, 'normal');
    } else {
      this.openVideoModal(0, 'normal');
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
          this.videoBadgeMode.style.color = 'var(--c-accent-gold-light, #F8E29B)';
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
      const iframe = this.videoLightbox.querySelector('#video-lightbox-iframe');
      if (iframe) {
        iframe.src = '';
        iframe.style.display = 'none';
      }
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
              <span class="gallery-card-category" style="font-size: 0.75rem; text-transform: uppercase; color: var(--c-accent-gold-light, #F8E29B); font-weight: 800; letter-spacing: 0.8px; text-shadow: 0 1px 4px rgba(0,0,0,0.95); margin-bottom: 0.25rem;">${catLabel}</span>
              <p class="gallery-caption">${caption}</p>
            </div>
          </button>
        `;
      }).join('');
    }

    // 2. Recursos descargables y Enlaces Web (Fichas, Didáctica, Cartografía, Portales)
    if (this.resourcesContainer && this.data.resources) {
      const downloadLabel = this.i18n.t('galeria.download_btn') || '⬇ Descargar';
      const visitWebLabel = this.i18n.t('galeria.visit_web_btn') || (lang === 'en' ? '🌐 Visit Web' : (lang === 'fr' ? '🌐 Visiter le site' : '🌐 Visitar Web'));
      this.resourcesContainer.innerHTML = this.data.resources.map(res => {
        const title = getLang(res.title, 'Documento');
        const desc = getLang(res.description || res.desc, '');
        const badge = getLang(res.badge || res.category, 'Publicación Oficial');
        const badgeLabel = this.i18n.t(`galeria.badges.${badge}`) !== `galeria.badges.${badge}`
          ? this.i18n.t(`galeria.badges.${badge}`)
          : badge;
        const targetUrl = res.url || res.file || './assets/docs/dossier_pajarillo.pdf';
        const isWeb = res.type === 'web' || (!targetUrl.toLowerCase().endsWith('.pdf') && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('www.')));
        const actionLabel = isWeb ? visitWebLabel : downloadLabel;
        const formatLabel = res.format || (isWeb ? 'Sitio Web / Portal' : 'PDF / Digital');
        const iconHtml = isWeb 
          ? `<div style="font-size: 2.2rem; line-height: 1; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">🌐</div>`
          : `<img src="./assets/icons/icon-document.png" alt="" class="custom-icon-img" style="width: 44px; height: 44px; object-fit: contain;">`;

        return `
          <div class="resource-card">
            <div class="resource-icon">${iconHtml}</div>
            <div class="resource-content">
              <span style="background: var(--c-stone-warm); color: var(--c-primary); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">${badgeLabel}</span>
              <h3 style="margin-top: 6px;">${title}</h3>
              <p>${desc}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: var(--c-text-muted); font-weight: 600;">${formatLabel}</span>
                <a href="${targetUrl}" ${isWeb ? 'rel="noopener noreferrer"' : 'download'} class="btn-point-action btn-point-qr" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                  ${actionLabel}
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
        this.videosContainer.className = '';
        this.videosContainer.innerHTML = `
          <div style="text-align: center; padding: 3.5rem 1.5rem; color: var(--c-text-muted); background: var(--c-stone-light); border-radius: var(--radius-lg); border: 1.5px dashed var(--c-border); margin: 1rem auto; max-width: 680px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎬</div>
            <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--c-primary); margin-bottom: 0.5rem;" data-i18n="galeria.empty_videos">No hay audiovisuales configurados</h4>
            <p style="font-size: 0.92rem; max-width: 480px; margin: 0 auto; color: var(--c-text-muted);" data-i18n="galeria.empty_videos_desc">Actualmente no hay vídeos activos en esta sección. Puedes añadir o gestionar documentales desde el Panel de Administración.</p>
          </div>
        `;
      } else {
        const isSingle = this.data.videos.length === 1;
        this.videosContainer.className = isSingle ? 'gallery-videos-single' : 'gallery-videos-grid';
        this.videosContainer.innerHTML = this.data.videos.map((vid, idx) => {
          const title = getLang(vid.title, 'Audiovisual');
          const desc = getLang(vid.description || vid.desc, '');
          const cat = vid.category || 'Audiovisual';

          return `
            <div class="video-card-item" onclick="window.galleryInstance.openVideoModal(${idx}, 'normal')">
              <div class="video-card-media">
                <img class="video-card-thumb" src="${vid.thumb || './assets/images/lobo.png'}" alt="${title.replace(/"/g, '&quot;')}" onerror="this.src='./assets/images/lobo.png'">
                <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.28);">
                  <div class="btn-cta-gold" style="padding: 0; border-radius: 50%; font-size: 1.3rem; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.45);">
                    ▶
                  </div>
                </div>
                <span style="position: absolute; top: 12px; left: 12px; background: rgba(26,36,30,0.85); color: #fff; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.3px;">
                  ${cat}
                </span>
                <span style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.82); color: #D4AF37; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
                  ⏱ ${vid.duration || '00:40'}
                </span>
              </div>
              
              <div class="video-card-body">
                <h3 class="video-card-title">${title}</h3>
                <p class="video-card-desc">${desc}</p>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 4. Modelos 3D Interactivos (Formato idéntico a vídeos y fotos con apertura en modal)
    if (this.models3dContainer) {
      if (!this.data.models3d || this.data.models3d.length === 0) {
        this.models3dContainer.className = '';
        this.models3dContainer.innerHTML = `
          <div style="text-align: center; padding: 3.5rem 1.5rem; color: var(--c-text-muted); background: var(--c-stone-light); border-radius: var(--radius-lg); border: 1.5px dashed var(--c-border); margin: 1rem auto; max-width: 680px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🏛️</div>
            <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--c-primary); margin-bottom: 0.5rem;" data-i18n="galeria.empty_3d">No hay modelos 3D configurados</h4>
            <p style="font-size: 0.92rem; max-width: 480px; margin: 0 auto; color: var(--c-text-muted);" data-i18n="galeria.empty_3d_desc">Actualmente no hay modelos 3D activos. Puedes añadir modelos de Sketchfab desde el Panel de Administración.</p>
          </div>
        `;
      } else {
        const isSingle = this.data.models3d.length === 1;
        this.models3dContainer.className = isSingle ? 'gallery-videos-single' : 'gallery-videos-grid';
        this.models3dContainer.innerHTML = this.data.models3d.map((m, idx) => {
          const title = getLang(m.title, 'Modelo 3D Interactivo');
          const desc = getLang(m.description || m.desc, '');
          const cat = getLang(m.category, 'Modelo 3D');
          const thumb = m.thumb || './assets/images/santuario_ilustracion.png';

          return `
            <div class="video-card-item" onclick="window.galleryInstance.openModel3dModal(${idx})">
              <div class="video-card-media">
                <img class="video-card-thumb" src="${thumb}" alt="${title.replace(/"/g, '&quot;')}" onerror="this.src='./assets/images/santuario_ilustracion.png'">
                <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.28);">
                  <div class="btn-cta-gold" style="padding: 0; border-radius: 50%; font-size: 1.3rem; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.45);">
                    🏛️
                  </div>
                </div>
                <span style="position: absolute; top: 12px; left: 12px; background: rgba(26,36,30,0.85); color: #fff; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.3px;">
                  ${cat}
                </span>
                <span style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.82); color: #D4AF37; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
                  🥽 3D Interactivo
                </span>
              </div>
              
              <div class="video-card-body">
                <h3 class="video-card-title">${title}</h3>
                <p class="video-card-desc">${desc}</p>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }
}
