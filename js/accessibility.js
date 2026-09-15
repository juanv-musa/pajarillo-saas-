/**
 * Widget de Accesibilidad Universal (WCAG 2.1 Nivel AA)
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo" · Ayuntamiento de Huelma
 * Proporciona escalado de texto, contrastes, modo dislexia, guía de lectura, cursor grande y lector TTS en ES/EN/FR.
 */

const ACC_STORAGE_KEY = 'pajarillo_accessibility';

export class AccessibilityWidget {
  constructor(i18n = null) {
    this.i18n = i18n || window.pajarilloI18n;
    this.isOpen = false;
    this.isSpeaking = false;

    // Estado por defecto
    this.state = {
      textLvl: 0, // 0: 100%, 1: 112%, 2: 125%, 3: 138%
      dyslexic: false,
      highContrast: false,
      invert: false,
      grayscale: false,
      links: false,
      guide: false,
      bigCursor: false,
      noAnim: false,
      tts: false,
      tabHidden: false
    };

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(ACC_STORAGE_KEY);
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem(ACC_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {}
  }

  init() {
    this.injectDOM();
    this.bindEvents();
    this.applyState();

    if (this.i18n && typeof this.i18n.onLanguageChange === 'function') {
      this.i18n.onLanguageChange(() => {
        this.updateTexts();
      });
    }
  }

  t(key, fallback = '') {
    if (this.i18n && typeof this.i18n.t === 'function') {
      const val = this.i18n.t(`accessibility.${key}`);
      if (val && val !== `accessibility.${key}`) return val;
    }
    return fallback;
  }

  injectDOM() {
    if (document.getElementById('acc-widget-root')) return;

    const root = document.createElement('div');
    root.id = 'acc-widget-root';
    root.className = 'acc-widget-root';
    root.innerHTML = `
      <!-- Contenedor Pestaña Lateral (Medio a la derecha) -->
      <div id="acc-tab-wrapper" class="acc-tab-wrapper${this.state.tabHidden ? ' is-hidden' : ''}">
        <button type="button" id="acc-trigger-btn" class="acc-floating-btn" aria-label="${this.t('btn_label', 'Opciones de Accesibilidad')}" title="${this.t('btn_label', 'Opciones de Accesibilidad')}" aria-expanded="false" aria-controls="acc-panel">
          <span class="acc-tab-icon">♿</span>
          <span class="acc-tab-label" data-acc-i18n="tab_text">${this.t('tab_text', 'Accesibilidad')}</span>
          <span id="acc-active-badge" class="acc-floating-btn-badge">0</span>
        </button>
        <button type="button" id="acc-toggle-hide-btn" class="acc-hide-handle-btn" aria-label="${this.state.tabHidden ? this.t('show_tab', 'Mostrar pestaña') : this.t('hide_tab', 'Ocultar pestaña')}" title="${this.state.tabHidden ? this.t('show_tab', 'Mostrar pestaña') : this.t('hide_tab', 'Ocultar pestaña')}">
          <span id="acc-hide-arrow">▶</span>
        </button>
      </div>

      <!-- Fondo desenfocado -->
      <div id="acc-overlay" class="acc-overlay" aria-hidden="true"></div>

      <!-- Panel Desplegable de Ajustes -->
      <aside id="acc-panel" class="acc-panel" role="dialog" aria-modal="true" aria-labelledby="acc-panel-title">
        <!-- Cabecera -->
        <div class="acc-header">
          <div class="acc-header-title">
            <span>♿</span>
            <div>
              <h3 id="acc-panel-title" data-acc-i18n="title">${this.t('title', 'Herramientas de Accesibilidad')}</h3>
              <span class="acc-compliance-tag" data-acc-i18n="compliance">${this.t('compliance', 'Conforme a WCAG 2.1 Nivel AA')}</span>
            </div>
          </div>
          <button type="button" id="acc-close-btn" class="acc-close-btn" aria-label="${this.t('close', 'Cerrar panel de accesibilidad')}">✕</button>
        </div>

        <!-- Contenido -->
        <div class="acc-body">
          <p class="acc-subtitle" data-acc-i18n="subtitle">${this.t('subtitle', 'Adapta la visualización y lectura del sitio a tus necesidades personales.')}</p>

          <!-- 1. Tamaño del Texto -->
          <div class="acc-text-size-box">
            <div class="acc-text-size-header">
              <span class="acc-text-size-label" data-acc-i18n="text_size">🔤 ${this.t('text_size', 'Tamaño del Texto')}</span>
              <span id="acc-text-size-val" class="acc-text-size-val">100%</span>
            </div>
            <div class="acc-text-size-btns">
              <button type="button" id="acc-btn-dec-text" class="acc-size-btn" aria-label="${this.t('decrease_text', 'Disminuir texto')}">A -</button>
              <button type="button" id="acc-btn-reset-text" class="acc-size-btn" aria-label="${this.t('reset_text', 'Restablecer tamaño')}">Normal</button>
              <button type="button" id="acc-btn-inc-text" class="acc-size-btn" aria-label="${this.t('increase_text', 'Aumentar texto')}">A +</button>
            </div>
          </div>

          <!-- 2. Lista de Herramientas -->
          <div class="acc-tools-grid">
            <!-- Fuente para Dislexia -->
            <div class="acc-tool-card" data-acc-toggle="dyslexic" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">📖</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="dyslexic_font">${this.t('dyslexic_font', 'Fuente para Dislexia')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="dyslexic_desc">${this.t('dyslexic_desc', 'Tipografía de alta legibilidad y espaciado optimizado')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Alto Contraste -->
            <div class="acc-tool-card" data-acc-toggle="highContrast" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">🌓</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="high_contrast">${this.t('high_contrast', 'Alto Contraste')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="high_contrast_desc">${this.t('high_contrast_desc', 'Fondo negro con textos de máxima luminosidad')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Invertir Colores -->
            <div class="acc-tool-card" data-acc-toggle="invert" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">🔄</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="invert_colors">${this.t('invert_colors', 'Invertir Colores')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="invert_desc">${this.t('invert_desc', 'Inversión cromática respetando imágenes')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Escala de Grises -->
            <div class="acc-tool-card" data-acc-toggle="grayscale" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">🌑</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="grayscale">${this.t('grayscale', 'Escala de Grises')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="grayscale_desc">${this.t('grayscale_desc', 'Elimina todos los tonos de color')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Resaltar Enlaces y Botones -->
            <div class="acc-tool-card" data-acc-toggle="links" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">🔗</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="highlight_links">${this.t('highlight_links', 'Resaltar Enlaces')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="highlight_links_desc">${this.t('highlight_links_desc', 'Subrayado y contorno visible en botones y enlaces')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Guía de Lectura -->
            <div class="acc-tool-card" data-acc-toggle="guide" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">📏</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="reading_guide">${this.t('reading_guide', 'Guía de Lectura')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="reading_guide_desc">${this.t('reading_guide_desc', 'Regla horizontal que acompaña al ratón')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Cursor Grande -->
            <div class="acc-tool-card" data-acc-toggle="bigCursor" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">🖱️</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="big_cursor">${this.t('big_cursor', 'Cursor Grande')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="big_cursor_desc">${this.t('big_cursor_desc', 'Puntero aumentado para fácil localización')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Detener Animaciones -->
            <div class="acc-tool-card" data-acc-toggle="noAnim" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">🛑</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="stop_animations">${this.t('stop_animations', 'Pausar Animaciones')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="stop_animations_desc">${this.t('stop_animations_desc', 'Desactiva efectos visuales y movimientos continuos')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>

            <!-- Lector en Voz Alta (TTS) -->
            <div class="acc-tool-card" data-acc-toggle="tts" role="switch" aria-checked="false" tabindex="0">
              <div class="acc-tool-info">
                <span class="acc-tool-icon">🔊</span>
                <div class="acc-tool-texts">
                  <span class="acc-tool-title" data-acc-i18n="screen_reader">${this.t('screen_reader', 'Lector en Voz Alta (TTS)')}</span>
                  <span class="acc-tool-desc" data-acc-i18n="screen_reader_desc">${this.t('screen_reader_desc', 'Haz clic en cualquier texto o selecciónalo para escucharlo')}</span>
                </div>
              </div>
              <div class="acc-switch"></div>
            </div>
          </div>
        </div>

        <!-- Pie: Botón de Restablecer -->
        <div class="acc-footer">
          <button type="button" id="acc-btn-reset-all" class="acc-reset-btn">
            <span>↺</span>
            <span data-acc-i18n="reset_all">${this.t('reset_all', 'Restablecer Ajustes')}</span>
          </button>
        </div>
      </aside>

      <!-- Barra flotante Guía de Lectura -->
      <div id="acc-reading-guide-bar" class="acc-reading-guide-bar" aria-hidden="true"></div>

      <!-- Indicador Flotante de Lectura en Voz Alta -->
      <div id="acc-tts-indicator" class="acc-tts-indicator" role="status" aria-live="polite">
        <span>🗣️</span>
        <span id="acc-tts-text" data-acc-i18n="reading_active">${this.t('reading_active', 'Leyendo en voz alta...')}</span>
        <button type="button" id="acc-tts-stop-btn" class="acc-tts-stop-btn" data-acc-i18n="stop_reading">${this.t('stop_reading', 'Detener')}</button>
      </div>
    `;

    document.body.appendChild(root);
  }

  bindEvents() {
    const triggerBtn = document.getElementById('acc-trigger-btn');
    const toggleHideBtn = document.getElementById('acc-toggle-hide-btn');
    const tabWrapper = document.getElementById('acc-tab-wrapper');
    const overlay = document.getElementById('acc-overlay');
    const closeBtn = document.getElementById('acc-close-btn');
    const resetAllBtn = document.getElementById('acc-btn-reset-all');

    if (toggleHideBtn) {
      toggleHideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTabVisibility();
      });
    }

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        if (tabWrapper && tabWrapper.classList.contains('is-hidden')) {
          tabWrapper.classList.remove('is-hidden');
          this.state.tabHidden = false;
          this.saveState();
        }
        this.togglePanel();
      });
    }
    if (overlay) {
      overlay.addEventListener('click', () => this.closePanel());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePanel());
    }
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => this.resetAll());
    }

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePanel();
      }
    });

    // Botones de tamaño de texto
    const btnInc = document.getElementById('acc-btn-inc-text');
    const btnDec = document.getElementById('acc-btn-dec-text');
    const btnReset = document.getElementById('acc-btn-reset-text');

    if (btnInc) btnInc.addEventListener('click', () => this.changeTextSize(1));
    if (btnDec) btnDec.addEventListener('click', () => this.changeTextSize(-1));
    if (btnReset) btnReset.addEventListener('click', () => this.setTextSize(0));

    // Interruptores de herramientas
    const toggleCards = document.querySelectorAll('[data-acc-toggle]');
    toggleCards.forEach(card => {
      const toggleAction = () => {
        const key = card.dataset.accToggle;
        this.toggle(key);
      };
      card.addEventListener('click', toggleAction);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAction();
        }
      });
    });

    // Guía de lectura (seguimiento del ratón)
    const guideBar = document.getElementById('acc-reading-guide-bar');
    window.addEventListener('mousemove', (e) => {
      if (this.state.guide && guideBar) {
        guideBar.style.top = `${e.clientY}px`;
      }
    }, { passive: true });

    // Setup Text-to-Speech (lector al hacer clic o seleccionar texto)
    this.setupTTS();
  }

  toggleTabVisibility() {
    const tabWrapper = document.getElementById('acc-tab-wrapper');
    const toggleHideBtn = document.getElementById('acc-toggle-hide-btn');
    if (!tabWrapper) return;

    this.state.tabHidden = !this.state.tabHidden;
    tabWrapper.classList.toggle('is-hidden', this.state.tabHidden);
    if (toggleHideBtn) {
      const label = this.state.tabHidden
        ? this.t('show_tab', 'Mostrar pestaña')
        : this.t('hide_tab', 'Ocultar pestaña');
      toggleHideBtn.setAttribute('aria-label', label);
      toggleHideBtn.setAttribute('title', label);
    }
    this.saveState();
  }

  togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  }

  openPanel() {
    this.isOpen = true;
    const panel = document.getElementById('acc-panel');
    const overlay = document.getElementById('acc-overlay');
    const triggerBtn = document.getElementById('acc-trigger-btn');

    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('open');
    if (triggerBtn) {
      triggerBtn.classList.add('active');
      triggerBtn.setAttribute('aria-expanded', 'true');
    }
  }

  closePanel() {
    this.isOpen = false;
    const panel = document.getElementById('acc-panel');
    const overlay = document.getElementById('acc-overlay');
    const triggerBtn = document.getElementById('acc-trigger-btn');

    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (triggerBtn) {
      triggerBtn.classList.remove('active');
      triggerBtn.setAttribute('aria-expanded', 'false');
    }
  }

  changeTextSize(delta) {
    const newLvl = Math.max(0, Math.min(3, this.state.textLvl + delta));
    this.setTextSize(newLvl);
  }

  setTextSize(lvl) {
    this.state.textLvl = lvl;
    this.applyState();
  }

  toggle(feature) {
    if (this.state[feature] !== undefined) {
      this.state[feature] = !this.state[feature];
      // Si se activa alto contraste, desactivar inversión y escala de grises para evitar conflictos
      if (feature === 'highContrast' && this.state.highContrast) {
        this.state.invert = false;
        this.state.grayscale = false;
      } else if (feature === 'invert' && this.state.invert) {
        this.state.highContrast = false;
      }
      this.applyState();
    }
  }

  resetAll() {
    this.state = {
      textLvl: 0,
      dyslexic: false,
      highContrast: false,
      invert: false,
      grayscale: false,
      links: false,
      guide: false,
      bigCursor: false,
      noAnim: false,
      tts: false,
      tabHidden: Boolean(this.state.tabHidden)
    };
    this.stopSpeech();
    this.applyState();
  }

  applyState() {
    const html = document.documentElement;
    const body = document.body;

    // 1. Tamaño de texto
    html.classList.remove('acc-text-lvl-1', 'acc-text-lvl-2', 'acc-text-lvl-3');
    if (this.state.textLvl > 0) {
      html.classList.add(`acc-text-lvl-${this.state.textLvl}`);
    }
    const sizeValEl = document.getElementById('acc-text-size-val');
    if (sizeValEl) {
      const labels = ['100%', '112%', '125%', '138%'];
      sizeValEl.textContent = labels[this.state.textLvl] || '100%';
    }

    // 2. Modos visuales y de lectura en el DOM
    body.classList.toggle('acc-dyslexic-on', Boolean(this.state.dyslexic));
    body.classList.toggle('acc-high-contrast-on', Boolean(this.state.highContrast));
    body.classList.toggle('acc-invert-on', Boolean(this.state.invert));
    body.classList.toggle('acc-grayscale-on', Boolean(this.state.grayscale));
    body.classList.toggle('acc-links-on', Boolean(this.state.links));
    body.classList.toggle('acc-guide-on', Boolean(this.state.guide));
    body.classList.toggle('acc-big-cursor-on', Boolean(this.state.bigCursor));
    body.classList.toggle('acc-no-anim-on', Boolean(this.state.noAnim));
    body.classList.toggle('acc-tts-on', Boolean(this.state.tts));

    // 3. Sincronizar interruptores visuales (Switches)
    document.querySelectorAll('[data-acc-toggle]').forEach(card => {
      const key = card.dataset.accToggle;
      const isActive = Boolean(this.state[key]);
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-checked', String(isActive));
    });

    // 4. Contador de ajustes activos en el botón flotante
    let activeCount = this.state.textLvl > 0 ? 1 : 0;
    const booleanKeys = ['dyslexic', 'highContrast', 'invert', 'grayscale', 'links', 'guide', 'bigCursor', 'noAnim', 'tts'];
    booleanKeys.forEach(k => { if (this.state[k]) activeCount++; });

    const badge = document.getElementById('acc-active-badge');
    if (badge) {
      badge.textContent = String(activeCount);
      badge.classList.toggle('visible', activeCount > 0);
    }

    this.saveState();
  }

  setupTTS() {
    const stopBtn = document.getElementById('acc-tts-stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopSpeech();
      });
    }

    // Al hacer clic en un elemento de texto si el modo TTS está activo
    document.addEventListener('click', (e) => {
      if (!this.state.tts) return;
      if (e.target.closest('.acc-widget-root') || e.target.closest('#nav-menu')) return;

      let target = e.target;
      if (target.matches('p, h1, h2, h3, h4, h5, h6, li, span, a, button, blockquote')) {
        const text = target.innerText || target.textContent;
        if (text && text.trim().length > 1) {
          this.speak(text.trim());
        }
      }
    }, true);
  }

  speak(text) {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz Web Speech API.');
      return;
    }

    this.stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = (this.i18n ? this.i18n.currentLang : 'es') || 'es';
    
    // Mapeo de códigos de idioma para el sintetizador
    const langMap = {
      es: 'es-ES',
      en: 'en-GB',
      fr: 'fr-FR'
    };
    utterance.lang = langMap[lang] || 'es-ES';
    utterance.rate = 0.95; // Velocidad ligeramente pausada para máxima claridad

    const indicator = document.getElementById('acc-tts-indicator');
    const indText = document.getElementById('acc-tts-text');

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (indicator) indicator.classList.add('active');
      if (indText) indText.textContent = text.length > 35 ? text.substring(0, 32) + '...' : text;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (indicator) indicator.classList.remove('active');
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (indicator) indicator.classList.remove('active');
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    const indicator = document.getElementById('acc-tts-indicator');
    if (indicator) indicator.classList.remove('active');
  }

  updateTexts() {
    document.querySelectorAll('[data-acc-i18n]').forEach(el => {
      const key = el.dataset.accI18n;
      const translated = this.t(key);
      if (translated) {
        if (key === 'text_size') {
          el.textContent = `🔤 ${translated}`;
        } else {
          el.textContent = translated;
        }
      }
    });

    const triggerBtn = document.getElementById('acc-trigger-btn');
    if (triggerBtn) {
      const label = this.t('btn_label', 'Opciones de Accesibilidad');
      triggerBtn.setAttribute('aria-label', label);
      triggerBtn.setAttribute('title', label);
    }

    const toggleHideBtn = document.getElementById('acc-toggle-hide-btn');
    if (toggleHideBtn) {
      const hideTitle = this.state.tabHidden
        ? this.t('show_tab', 'Mostrar pestaña')
        : this.t('hide_tab', 'Ocultar pestaña');
      toggleHideBtn.setAttribute('aria-label', hideTitle);
      toggleHideBtn.setAttribute('title', hideTitle);
    }
  }
}

// Inicialización automática o exportable
export default AccessibilityWidget;
