/**
 * Controlador de Sala Audiovisual 2 (Planta 1 / Planta Alta · TV 65")
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 * Selector de 2 opciones: Versión General y Versión con Audiodescripción.
 */

class AudiovisualP1 {
  constructor() {
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
      controlsBar: document.querySelector('.tv-player-controls'),
      screensaver: document.getElementById('tv-screensaver'),
      screensaverVideo: document.getElementById('tv-screensaver-video')
    };

    this.mainVideo = null;
    this.audioDescVideo = null;
    this.activeType = null;
    this.screensaverIdleTimer = null;
    this.controlsFadeTimer = null;
  }

  async init() {
    this.bindEvents();
    this.setupAutoFullscreen();
    await this.loadVideos();
    this.renderCards();
    this.setupScreensaver();
    this.setupKioskInactivity();

    // Sincronización en tiempo real desde el panel de Administración
    window.addEventListener('storage', async (e) => {
      if (
        e.key === 'pajarillo_kiosk_videos' ||
        e.key === 'pajarillo_kiosk_p1_video' ||
        e.key === 'pajarillo_kiosk_p1_audiodesc_video' ||
        e.key === 'pajarillo_kiosk_p1_screensaver_video'
      ) {
        await this.loadVideos();
        this.renderCards();
        this.updateScreensaverSource();
      }
    });
  }

  setupAutoFullscreen() {
    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    tryFullscreen();

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
    let videos = [];
    const saved = localStorage.getItem('pajarillo_kiosk_videos');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) videos = parsed;
      } catch (e) {}
    }

    if (videos.length === 0) {
      try {
        const res = await fetch('./data/gallery.json?t=' + Date.now());
        const data = await res.json();
        videos = data.videos || [];
      } catch (e) {
        videos = [];
      }
    }

    // 1. Vídeo Versión General (P1)
    const savedP1Id = localStorage.getItem('pajarillo_kiosk_p1_video');
    if (savedP1Id) {
      this.mainVideo = videos.find(v => v.id === savedP1Id || v.videoUrl === savedP1Id);
    }
    if (!this.mainVideo && videos.length > 0) {
      this.mainVideo = videos[0];
    }
    if (!this.mainVideo) {
      this.mainVideo = {
        id: 'vid_default',
        title: { es: 'Reconstrucción Virtual 3D: El Combate del Héroe y el Lobo' },
        category: 'Proyección Oficial',
        duration: '04:15',
        thumb: './assets/images/lobo.png',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      };
    }

    // 2. Vídeo Versión con Audiodescripción 🇪🇸 (P1)
    const savedAdId = localStorage.getItem('pajarillo_kiosk_p1_audiodesc_video');
    if (savedAdId) {
      this.audioDescVideo = videos.find(v => v.id === savedAdId || v.videoUrl === savedAdId);
    }
    if (!this.audioDescVideo && (this.mainVideo.videoUrlAudioDesc || this.mainVideo.videoAudiodescripcionUrl)) {
      this.audioDescVideo = {
        ...this.mainVideo,
        id: `${this.mainVideo.id}_ad`,
        title: typeof this.mainVideo.title === 'object'
          ? { es: `${this.mainVideo.title.es || ''} (Audiodescripción en Español)` }
          : `${this.mainVideo.title} (Audiodescripción en Español)`,
        category: 'Audiodescripción en Español',
        videoUrl: this.mainVideo.videoUrlAudioDesc || this.mainVideo.videoAudiodescripcionUrl
      };
    }
    if (!this.audioDescVideo && videos.length > 1) {
      this.audioDescVideo = videos[1];
    }
    if (!this.audioDescVideo) {
      this.audioDescVideo = this.mainVideo;
    }

    // 3. Vídeo de Salvapantallas / Reposo Independiente (P1)
    const savedSsId = localStorage.getItem('pajarillo_kiosk_p1_screensaver_video');
    if (savedSsId) {
      this.screensaverVideoData = videos.find(v => v.id === savedSsId || v.videoUrl === savedSsId);
    }
    if (!this.screensaverVideoData && videos.length > 2) {
      this.screensaverVideoData = videos[2];
    } else if (!this.screensaverVideoData) {
      this.screensaverVideoData = this.mainVideo;
    }
  }

  renderCards() {
    if (!this.dom.grid) return;

    const mainTitle = typeof this.mainVideo.title === 'object' && this.mainVideo.title !== null
      ? (this.mainVideo.title.es || Object.values(this.mainVideo.title)[0] || '')
      : (this.mainVideo.title || 'Documental Principal');

    const adTitle = typeof this.audioDescVideo.title === 'object' && this.audioDescVideo.title !== null
      ? (this.audioDescVideo.title.es || Object.values(this.audioDescVideo.title)[0] || '')
      : (this.audioDescVideo.title || `${mainTitle} (Con Audiodescripción)`);

    const mainThumb = this.mainVideo.thumb || './assets/images/lobo.png';
    const adThumb = this.audioDescVideo.thumb || mainThumb;
    const mainDur = this.mainVideo.duration || '04:15';
    const adDur = this.audioDescVideo.duration || mainDur;

    this.dom.grid.innerHTML = `
      <!-- Tarjeta 1: Vídeo Documental -->
      <article class="tv-card" tabindex="0" role="button" aria-label="Reproducir ${mainTitle}" onclick="window.tvKioskP1.playVideo('general')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.tvKioskP1.playVideo('general');}">
        <div class="tv-card-media">
          <img src="${mainThumb}" alt="${mainTitle}" class="tv-card-thumb" loading="lazy" onerror="this.src='./assets/images/lobo.png'">
          <div class="tv-card-overlay"></div>
          <span class="tv-card-duration">⏱ ${mainDur}</span>
          <div class="tv-card-play-icon" aria-hidden="true">▶</div>
        </div>
        <div class="tv-card-body" style="padding: 1.5rem 1.6rem 1.7rem;">
          <h3 class="tv-card-title" style="font-size: 1.65rem; margin-bottom: 0.4rem; color: #fff;">${mainTitle}</h3>
          <p style="margin: 0; font-size: 0.95rem; color: var(--tv-text-muted); line-height: 1.45;">Documental completo locutado y con subtítulos integrados.</p>
        </div>
      </article>

      <!-- Tarjeta 2: Audiodescripción 🇪🇸 -->
      <article class="tv-card" tabindex="0" role="button" aria-label="Reproducir ${adTitle} con Audiodescripción" onclick="window.tvKioskP1.playVideo('audiodesc')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.tvKioskP1.playVideo('audiodesc');}">
        <div class="tv-card-media">
          <img src="${adThumb}" alt="${adTitle}" class="tv-card-thumb" loading="lazy" onerror="this.src='./assets/images/lobo.png'">
          <div class="tv-card-overlay"></div>
          <span style="position: absolute; top: 14px; left: 14px; background: rgba(46, 125, 50, 0.95); color: #fff; font-size: 0.85rem; font-weight: 800; padding: 4px 12px; border-radius: 999px; z-index: 2; border: 1px solid rgba(255,255,255,0.35); letter-spacing: 0.5px; text-transform: uppercase;">
            Audiodescripción 🇪🇸
          </span>
          <span class="tv-card-duration">⏱ ${adDur}</span>
          <div class="tv-card-play-icon" aria-hidden="true" style="background: var(--tv-accent-gold); color: #111;">▶</div>
        </div>
        <div class="tv-card-body" style="padding: 1.5rem 1.6rem 1.7rem;">
          <h3 class="tv-card-title" style="font-size: 1.65rem; margin-bottom: 0.4rem; color: #fff;">${adTitle}</h3>
          <p style="margin: 0; font-size: 0.95rem; color: var(--tv-text-muted); line-height: 1.45;">Versión accesible con narración descriptiva de escenas y subtítulos.</p>
        </div>
      </article>
    `;
  }

  playVideo(type = 'general') {
    this.activeType = type;
    const targetVideo = (type === 'audiodesc' && this.audioDescVideo)
      ? this.audioDescVideo
      : this.mainVideo;

    if (!targetVideo || !this.dom.videoElement) return;

    clearTimeout(this.screensaverIdleTimer);
    if (this.dom.screensaver) {
      this.dom.screensaver.classList.remove('active');
      if (this.dom.screensaverVideo) this.dom.screensaverVideo.pause();
    }

    const title = typeof targetVideo.title === 'object' && targetVideo.title !== null
      ? (targetVideo.title.es || Object.values(targetVideo.title)[0] || '')
      : (targetVideo.title || '');

    if (this.dom.playingTitle) {
      if (type === 'audiodesc') {
        this.dom.playingTitle.innerHTML = `<span>${title}</span> <span style="font-size: 0.85rem; background: rgba(46, 125, 50, 0.4); border: 1px solid #4CAF50; color: #fff; padding: 2px 10px; border-radius: 999px; margin-left: 10px;">Audiodescripción 🇪🇸</span>`;
      } else {
        this.dom.playingTitle.innerHTML = `<span>${title}</span>`;
      }
    }

    const videoUrl = targetVideo.videoUrl || (targetVideo.videoUrlAudioDesc || '');
    this.dom.videoElement.src = videoUrl;
    this.dom.videoElement.muted = false;
    this.dom.videoElement.currentTime = 0;

    if (this.dom.playerModal) {
      this.dom.playerModal.classList.add('active');
    }

    this.dom.videoElement.play().catch(() => {
      this.dom.videoElement.muted = true;
      if (this.dom.btnMute) this.dom.btnMute.textContent = '🔇';
      this.dom.videoElement.play().catch(() => {});
    });

    if (this.dom.btnMute && !this.dom.videoElement.muted) {
      this.dom.btnMute.textContent = '🔊';
    }
  }

  closePlayer() {
    if (!this.dom.playerModal) return;
    this.dom.playerModal.classList.remove('active');
    if (this.dom.videoElement) {
      this.dom.videoElement.pause();
      this.dom.videoElement.src = '';
    }
    this.restartIdleTimer();
  }

  bindEvents() {
    if (this.dom.btnBack) {
      this.dom.btnBack.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePlayer();
      });
    }

    if (this.dom.btnPlayPause) {
      this.dom.btnPlayPause.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.dom.videoElement) {
          if (this.dom.videoElement.paused) {
            this.dom.videoElement.play();
            this.dom.btnPlayPause.textContent = '⏸';
          } else {
            this.dom.videoElement.pause();
            this.dom.btnPlayPause.textContent = '▶';
          }
        }
      });
    }

    if (this.dom.btnReplay) {
      this.dom.btnReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.dom.videoElement) {
          this.dom.videoElement.currentTime = 0;
          this.dom.videoElement.play().catch(() => {});
          if (this.dom.btnPlayPause) this.dom.btnPlayPause.textContent = '⏸';
        }
      });
    }

    if (this.dom.btnMute) {
      this.dom.btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.dom.videoElement) {
          this.dom.videoElement.muted = !this.dom.videoElement.muted;
          this.dom.btnMute.textContent = this.dom.videoElement.muted ? '🔇' : '🔊';
        }
      });
    }

    if (this.dom.videoElement) {
      this.dom.videoElement.addEventListener('timeupdate', () => {
        const cur = this.dom.videoElement.currentTime || 0;
        const dur = this.dom.videoElement.duration || 0;
        if (dur > 0 && this.dom.progressFill) {
          this.dom.progressFill.style.width = `${(cur / dur) * 100}%`;
        }
        if (this.dom.timeCurrent) this.dom.timeCurrent.textContent = this.formatSeconds(cur);
        if (this.dom.timeTotal && dur > 0) this.dom.timeTotal.textContent = this.formatSeconds(dur);
      });

      this.dom.videoElement.addEventListener('ended', () => {
        // Al terminar el vídeo, vuelve automáticamente al menú de selección
        this.closePlayer();
      });

      this.dom.videoElement.addEventListener('play', () => {
        if (this.dom.btnPlayPause) this.dom.btnPlayPause.textContent = '⏸';
      });

      this.dom.videoElement.addEventListener('pause', () => {
        if (this.dom.btnPlayPause) this.dom.btnPlayPause.textContent = '▶';
      });
    }

    // Control de barra interactiva en modal
    if (this.dom.progressBar) {
      const seek = (e) => {
        if (!this.dom.videoElement || !this.dom.videoElement.duration) return;
        const rect = this.dom.progressBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        this.dom.videoElement.currentTime = pos * this.dom.videoElement.duration;
      };
      this.dom.progressBar.addEventListener('click', seek);
      this.dom.progressBar.addEventListener('touchmove', seek, { passive: true });
    }

    // Tecla Escape para salir del reproductor
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (this.dom.playerModal && this.dom.playerModal.classList.contains('active')) {
          this.closePlayer();
        }
      }
    });
  }

  setupScreensaver() {
    if (!this.dom.screensaver) return;

    this.updateScreensaverSource();
    this.hideScreensaver();

    const onExitScreensaver = (e) => {
      e.stopPropagation();
      this.hideScreensaver();
    };

    this.dom.screensaver.addEventListener('click', onExitScreensaver);
    this.dom.screensaver.addEventListener('touchstart', onExitScreensaver, { passive: true });
    this.dom.screensaver.addEventListener('keydown', onExitScreensaver);
  }

  updateScreensaverSource() {
    if (!this.dom.screensaverVideo) return;
    const videoSrc = (this.screensaverVideoData && this.screensaverVideoData.videoUrl) || (this.mainVideo && this.mainVideo.videoUrl) || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    if (this.dom.screensaverVideo.src !== videoSrc) {
      this.dom.screensaverVideo.src = videoSrc;
      this.dom.screensaverVideo.load();
    }
  }

  showScreensaver() {
    if (!this.dom.screensaver) return;
    this.dom.screensaver.classList.add('active');
    if (this.dom.screensaverVideo) {
      this.dom.screensaverVideo.play().catch(() => {});
    }
  }

  hideScreensaver() {
    if (!this.dom.screensaver) return;
    this.dom.screensaver.classList.remove('active');
    if (this.dom.screensaverVideo) {
      this.dom.screensaverVideo.pause();
    }
    this.restartIdleTimer();
  }

  setupKioskInactivity() {
    const onUserActive = () => {
      if (this.dom.playerModal && this.dom.playerModal.classList.contains('active')) {
        return;
      }
      this.restartIdleTimer();
    };

    window.addEventListener('click', onUserActive, { passive: true });
    window.addEventListener('touchstart', onUserActive, { passive: true });
    window.addEventListener('mousemove', onUserActive, { passive: true });
    window.addEventListener('keydown', onUserActive, { passive: true });

    this.restartIdleTimer();
  }

  restartIdleTimer() {
    clearTimeout(this.screensaverIdleTimer);
    this.screensaverIdleTimer = setTimeout(() => {
      if (!this.dom.playerModal || !this.dom.playerModal.classList.contains('active')) {
        this.showScreensaver();
      }
    }, 45000);
  }

  formatSeconds(sec) {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tvKioskP1 = new AudiovisualP1();
  window.tvKioskP1.init();
});
