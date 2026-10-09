/**
 * Controlador de Sala Audiovisual 2 (Planta 1 / Planta Alta · TV 65")
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 * Reproducción continua de vídeo único en bucle ininterrumpido.
 */

class AudiovisualP1 {
  constructor() {
    this.videoEl = document.getElementById('p1-video');
    this.overlayEl = document.getElementById('p1-overlay');
    this.soundAlertEl = document.getElementById('p1-sound-alert');
    this.titleEl = document.getElementById('p1-title');
    this.categoryEl = document.getElementById('p1-category');
    this.descEl = document.getElementById('p1-desc');
    this.progressFillEl = document.getElementById('p1-progress-fill');

    this.btnPlayPause = document.getElementById('btn-p1-playpause');
    this.btnReplay = document.getElementById('btn-p1-replay');
    this.btnMute = document.getElementById('btn-p1-mute');
    this.btnFullscreen = document.getElementById('btn-p1-fullscreen');

    this.inactivityTimer = null;
    this.hasUserInteracted = false;
  }

  async init() {
    this.setupEvents();
    this.setupAutoFullscreen();
    await this.resolveAndLoadVideo();
    this.startInactivityTracker();

    // Sincronización en tiempo real desde el panel de Administración
    window.addEventListener('storage', async (e) => {
      if (e.key === 'pajarillo_kiosk_videos' || e.key === 'pajarillo_kiosk_p1_video') {
        await this.resolveAndLoadVideo();
      }
    });
  }

  async resolveAndLoadVideo() {
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('video');
    const idParam = params.get('id');

    let videos = [];
    const savedKioskVideos = localStorage.getItem('pajarillo_kiosk_videos');
    if (savedKioskVideos) {
      try {
        videos = JSON.parse(savedKioskVideos) || [];
      } catch (e) {}
    }

    if (!videos || videos.length === 0) {
      try {
        const res = await fetch('./data/gallery.json?t=' + Date.now());
        const data = await res.json();
        videos = data.videos || [];
      } catch (e) {
        console.warn('Error cargando data/gallery.json:', e);
      }
    }

    let selectedVideo = null;

    if (idParam) {
      selectedVideo = videos.find(v => v.id === idParam);
    }

    if (!selectedVideo && videoParam) {
      // Si se pasa una URL directa por parámetro
      selectedVideo = {
        title: { es: params.get('title') || 'Proyección Especial · Planta Alta' },
        category: 'Fondo Audiovisual 2',
        description: { es: 'Proyección continua en pantalla de 65 pulgadas de la Planta Alta.' },
        videoUrl: videoParam
      };
    }

    if (!selectedVideo) {
      // Revisar si en localStorage hay un vídeo guardado por la administración
      const savedConfig = localStorage.getItem('pajarillo_kiosk_p1_video');
      if (savedConfig) {
        selectedVideo = videos.find(v => v.id === savedConfig || v.videoUrl === savedConfig);
        if (!selectedVideo) {
          selectedVideo = {
            title: { es: 'Proyección Oficial · Planta Alta' },
            category: 'Fondo Audiovisual 2',
            description: { es: 'Proyección continua en pantalla de 65 pulgadas.' },
            videoUrl: savedConfig
          };
        }
      }
    }

    // Si aún no hay vídeo, usar el primero de la galería o fallback
    if (!selectedVideo && videos.length > 0) {
      selectedVideo = videos[0];
    }

    if (!selectedVideo) {
      selectedVideo = {
        title: { es: 'Reconstrucción Virtual 3D: El Combate del Héroe y el Lobo' },
        category: 'Recreación 3D',
        description: { es: 'Recreación fotorrealista de la terraza monumental y el santuario heroico.' },
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      };
    }

    this.applyVideo(selectedVideo);
  }

  applyVideo(video) {
    const title = typeof video.title === 'object' ? (video.title.es || Object.values(video.title)[0]) : video.title;
    const desc = typeof video.description === 'object' ? (video.description.es || Object.values(video.description)[0]) : (video.description || '');
    const cat = video.category || 'Fondo Audiovisual 2';

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.categoryEl) this.categoryEl.textContent = cat;
    if (this.descEl) this.descEl.textContent = desc;
    document.title = `${title} · Fondo Audiovisual 2 (TV 65")`;

    if (this.videoEl) {
      this.videoEl.src = video.videoUrl;
      this.videoEl.load();

      // Iniciar intento de reproducción
      const playPromise = this.videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Reproduciendo correctamente
            if (this.videoEl.muted) {
              if (this.soundAlertEl) this.soundAlertEl.classList.remove('hidden');
              if (this.btnMute) this.btnMute.textContent = '🔇';
            } else {
              if (this.soundAlertEl) this.soundAlertEl.classList.add('hidden');
              if (this.btnMute) this.btnMute.textContent = '🔊';
            }
          })
          .catch((err) => {
            console.log('Autoplay con sonido prevenido por el navegador, iniciando con mute:', err);
            this.videoEl.muted = true;
            if (this.btnMute) this.btnMute.textContent = '🔇';
            if (this.soundAlertEl) this.soundAlertEl.classList.remove('hidden');
            this.videoEl.play().catch(e => console.error('Error forzando reproducción:', e));
          });
      }
    }
  }

  setupEvents() {
    // Interacción general para activar sonido y quitar aviso
    const unlockSound = () => {
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;
        if (this.videoEl && this.videoEl.muted) {
          this.videoEl.muted = false;
          if (this.btnMute) this.btnMute.textContent = '🔊';
        }
        if (this.soundAlertEl) {
          this.soundAlertEl.classList.add('hidden');
        }
      }
      this.resetInactivity();
    };

    window.addEventListener('click', unlockSound);
    window.addEventListener('touchstart', unlockSound, { passive: true });
    window.addEventListener('keydown', unlockSound);

    // Barra de progreso y bucle continuo
    if (this.videoEl) {
      this.videoEl.addEventListener('timeupdate', () => {
        if (this.videoEl.duration && this.progressFillEl) {
          const percent = (this.videoEl.currentTime / this.videoEl.duration) * 100;
          this.progressFillEl.style.width = `${percent}%`;
        }
      });

      // Garantizar bucle sin pausas
      this.videoEl.addEventListener('ended', () => {
        this.videoEl.currentTime = 0;
        this.videoEl.play().catch(() => {});
      });

      this.videoEl.addEventListener('play', () => {
        if (this.btnPlayPause) this.btnPlayPause.textContent = '⏸';
      });

      this.videoEl.addEventListener('pause', () => {
        if (this.btnPlayPause) this.btnPlayPause.textContent = '▶';
      });
    }

    // Botones de control
    if (this.btnPlayPause) {
      this.btnPlayPause.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.videoEl.paused) {
          this.videoEl.play();
        } else {
          this.videoEl.pause();
        }
        this.resetInactivity();
      });
    }

    if (this.btnReplay) {
      this.btnReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.videoEl) {
          this.videoEl.currentTime = 0;
          this.videoEl.play();
        }
        this.resetInactivity();
      });
    }

    if (this.btnMute) {
      this.btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.videoEl) {
          this.videoEl.muted = !this.videoEl.muted;
          this.btnMute.textContent = this.videoEl.muted ? '🔇' : '🔊';
          if (!this.videoEl.muted && this.soundAlertEl) {
            this.soundAlertEl.classList.add('hidden');
          }
        }
        this.resetInactivity();
      });
    }

    if (this.btnFullscreen) {
      this.btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        this.resetInactivity();
      });
    }

    // Registro de eventos en analíticas
    try {
      if (window.PajarilloAnalytics) {
        window.PajarilloAnalytics.logEvent('kiosk_p1_view', { screen: 'Planta 1 - TV 65"' });
      }
    } catch (_) {}
  }

  setupAutoFullscreen() {
    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    tryFullscreen();

    const onAction = () => {
      tryFullscreen();
      window.removeEventListener('click', onAction);
      window.removeEventListener('touchstart', onAction);
    };
    window.addEventListener('click', onAction, { passive: true });
    window.addEventListener('touchstart', onAction, { passive: true });
  }

  startInactivityTracker() {
    ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'keydown'].forEach(ev => {
      window.addEventListener(ev, () => this.resetInactivity(), { passive: true });
    });
    this.resetInactivity();
  }

  resetInactivity() {
    if (this.overlayEl) {
      this.overlayEl.classList.remove('hidden-overlay');
      document.body.style.cursor = 'default';
    }

    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      // Si la alerta de sonido aún está visible, no ocultar la interfaz
      if (this.soundAlertEl && !this.soundAlertEl.classList.contains('hidden')) {
        return;
      }
      if (this.overlayEl) {
        this.overlayEl.classList.add('hidden-overlay');
        document.body.style.cursor = 'none';
      }
    }, 3800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tvKioskP1 = new AudiovisualP1();
  window.tvKioskP1.init();
});
