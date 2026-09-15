/**
 * Controlador de Sala Audiovisual (Modo Kiosco / TV 65")
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 */

class AudiovisualKiosk {
  constructor() {
    this.videos = [];
    this.activeVideoIndex = null;
    this.idleTimer = null;
    this.controlsTimer = null;

    // Elementos DOM
    this.dom = {
      grid: document.getElementById('tv-video-grid'),
      playerModal: document.getElementById('tv-player-modal'),
      videoElement: document.getElementById('tv-video'),
      playingTitle: document.getElementById('tv-playing-title'),
      btnBack: document.getElementById('btn-back-menu'),
      btnPlayPause: document.getElementById('tv-btn-play'),
      btnReplay: document.getElementById('tv-btn-replay'),
      btnMute: document.getElementById('tv-btn-mute'),
      progressBar: document.getElementById('tv-progress-bar'),
      progressFill: document.getElementById('tv-progress-fill'),
      timeCurrent: document.getElementById('tv-time-current'),
      timeTotal: document.getElementById('tv-time-total'),
      topbar: document.querySelector('.tv-player-topbar'),
      controlsBar: document.querySelector('.tv-player-controls')
    };
  }

  async init() {
    this.bindEvents();
    this.setupAutoFullscreen();
    await this.loadVideos();
    this.renderCards();
    this.setupKioskInactivity();
  }

  setupAutoFullscreen() {
    // Intentar iniciar a pantalla completa de inmediato
    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    // Intento inmediato al cargar
    tryFullscreen();

    // Como los navegadores exigen interacción del usuario, activar automáticamente al primer toque o clic
    const onFirstUserAction = () => {
      tryFullscreen();
      window.removeEventListener('click', onFirstUserAction);
      window.removeEventListener('touchstart', onFirstUserAction);
      window.removeEventListener('pointerdown', onFirstUserAction);
      window.removeEventListener('keydown', onFirstUserAction);
    };

    window.addEventListener('click', onFirstUserAction, { passive: true });
    window.addEventListener('touchstart', onFirstUserAction, { passive: true });
    window.addEventListener('pointerdown', onFirstUserAction, { passive: true });
    window.addEventListener('keydown', onFirstUserAction, { passive: true });
  }

  async loadVideos() {
    try {
      const res = await fetch('./data/gallery.json?t=' + Date.now());
      const data = await res.json();
      this.videos = data.videos || [];
    } catch (e) {
      console.warn('Error cargando vídeos:', e);
      this.videos = [];
    }
  }

  renderCards() {
    if (!this.dom.grid) return;
    this.dom.grid.innerHTML = this.videos.map((vid, idx) => {
      const title = vid.title.es || vid.title;
      const desc = vid.description.es || vid.description;
      return `
        <article class="tv-card" tabindex="0" role="button" aria-label="Reproducir ${title}" onclick="window.tvKiosk.playVideo(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.tvKiosk.playVideo(${idx});}">
          <div class="tv-card-media">
            <img src="${vid.thumb}" alt="${title}" class="tv-card-thumb" loading="lazy">
            <div class="tv-card-overlay"></div>
            <span class="tv-card-category">${vid.category || 'Documental'}</span>
            <span class="tv-card-duration">⏱ ${vid.duration}</span>
            <div class="tv-card-play-icon">▶</div>
          </div>
          <div class="tv-card-body">
            <div>
              <h3 class="tv-card-title">${title}</h3>
              <p class="tv-card-desc">${desc}</p>
            </div>
            <div class="tv-card-btn">
              <span>▶ Reproducir en Pantalla</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  bindEvents() {
    // Botón Volver al menú
    if (this.dom.btnBack) {
      this.dom.btnBack.addEventListener('click', () => this.closePlayer());
    }

    // Controles de vídeo
    if (this.dom.btnPlayPause) {
      this.dom.btnPlayPause.addEventListener('click', () => this.togglePlayPause());
    }

    if (this.dom.btnReplay) {
      this.dom.btnReplay.addEventListener('click', () => {
        if (this.dom.videoElement) {
          this.dom.videoElement.currentTime = 0;
          this.dom.videoElement.play();
        }
      });
    }

    if (this.dom.btnMute) {
      this.dom.btnMute.addEventListener('click', () => {
        if (this.dom.videoElement) {
          this.dom.videoElement.muted = !this.dom.videoElement.muted;
          this.dom.btnMute.textContent = this.dom.videoElement.muted ? '🔇' : '🔊';
        }
      });
    }

    // Barra de progreso
    if (this.dom.videoElement) {
      this.dom.videoElement.addEventListener('timeupdate', () => this.onTimeUpdate());
      this.dom.videoElement.addEventListener('ended', () => {
        setTimeout(() => this.closePlayer(), 2000);
      });
      this.dom.videoElement.addEventListener('play', () => {
        if (this.dom.btnPlayPause) this.dom.btnPlayPause.textContent = '⏸';
      });
      this.dom.videoElement.addEventListener('pause', () => {
        if (this.dom.btnPlayPause) this.dom.btnPlayPause.textContent = '▶';
      });
    }

    if (this.dom.progressBar) {
      this.dom.progressBar.addEventListener('click', (e) => {
        if (!this.dom.videoElement || !this.dom.videoElement.duration) return;
        const rect = this.dom.progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.dom.videoElement.currentTime = pos * this.dom.videoElement.duration;
      });
    }

    // Ocultar controles automáticamente tras 4 segundos en modo reproducción
    const resetControlsVisibility = () => {
      if (this.dom.topbar) this.dom.topbar.classList.remove('hidden-controls');
      if (this.dom.controlsBar) this.dom.controlsBar.classList.remove('hidden-controls');
      clearTimeout(this.controlsTimer);
      this.controlsTimer = setTimeout(() => {
        if (this.dom.videoElement && !this.dom.videoElement.paused) {
          if (this.dom.topbar) this.dom.topbar.classList.add('hidden-controls');
          if (this.dom.controlsBar) this.dom.controlsBar.classList.add('hidden-controls');
        }
      }, 4000);
    };

    if (this.dom.playerModal) {
      this.dom.playerModal.addEventListener('mousemove', resetControlsVisibility);
      this.dom.playerModal.addEventListener('touchstart', resetControlsVisibility);
      this.dom.playerModal.addEventListener('click', resetControlsVisibility);
    }

    // Control por teclado (mando TV o atajos)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (this.dom.playerModal && this.dom.playerModal.classList.contains('active')) {
          this.closePlayer();
        }
      } else if (e.key === ' ' && this.dom.playerModal && this.dom.playerModal.classList.contains('active')) {
        e.preventDefault();
        this.togglePlayPause();
      }
    });
  }

  playVideo(index) {
    const vid = this.videos[index];
    if (!vid || !this.dom.videoElement) return;

    // Asegurar pantalla completa activa al seleccionar cualquier vídeo
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    this.activeVideoIndex = index;
    const title = vid.title.es || vid.title;

    if (this.dom.playingTitle) {
      this.dom.playingTitle.textContent = title;
    }

    this.dom.videoElement.src = vid.videoUrl;
    this.dom.videoElement.load();
    this.dom.playerModal.classList.add('active');

    if (window.PajarilloAnalytics) {
      window.PajarilloAnalytics.track('video_view', {
        video_id: vid.id,
        detail: `Kiosco TV 65": ${title}`
      });
    }

    const playPromise = this.dom.videoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        this.dom.videoElement.muted = true;
        this.dom.videoElement.play();
        if (this.dom.btnMute) this.dom.btnMute.textContent = '🔇';
      });
    }
  }

  togglePlayPause() {
    if (!this.dom.videoElement) return;
    if (this.dom.videoElement.paused) {
      this.dom.videoElement.play();
    } else {
      this.dom.videoElement.pause();
    }
  }

  closePlayer() {
    if (this.dom.videoElement) {
      this.dom.videoElement.pause();
      this.dom.videoElement.currentTime = 0;
      this.dom.videoElement.src = '';
    }
    if (this.dom.playerModal) {
      this.dom.playerModal.classList.remove('active');
    }
    this.activeVideoIndex = null;
  }

  onTimeUpdate() {
    if (!this.dom.videoElement) return;
    const cur = this.dom.videoElement.currentTime || 0;
    const dur = this.dom.videoElement.duration || 1;
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));

    if (this.dom.progressFill) {
      this.dom.progressFill.style.width = pct + '%';
    }

    if (this.dom.timeCurrent) {
      this.dom.timeCurrent.textContent = this.formatSeconds(cur);
    }

    if (this.dom.timeTotal && !isNaN(dur)) {
      this.dom.timeTotal.textContent = this.formatSeconds(dur);
    }
  }

  formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  setupKioskInactivity() {
    // Si nadie toca la pantalla durante 180s en modo reproductor, vuelve a la parrilla
    const resetIdle = () => {
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        if (this.dom.playerModal && this.dom.playerModal.classList.contains('active')) {
          this.closePlayer();
        }
      }, 180000);
    };

    window.addEventListener('click', resetIdle);
    window.addEventListener('touchstart', resetIdle);
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tvKiosk = new AudiovisualKiosk();
  window.tvKiosk.init();
});
