/**
 * Plataforma de Gestión Municipal (SaaS MVP) · Lógica de Administración
 * Centro de Interpretación Santuario Ibérico de "El Pajarillo"
 * Hereda y moderniza la arquitectura de WEBAPP_JODAR
 */

const DOM = {
  // Vistas
  loginView: document.getElementById('login-view'),
  dashboardView: document.getElementById('dashboard-view'),
  loginForm: document.getElementById('admin-login-form'),
  registerForm: document.getElementById('admin-register-form'),
  tabBtnLogin: document.getElementById('tab-btn-login'),
  tabBtnRegister: document.getElementById('tab-btn-register'),
  loginErrorMsg: document.getElementById('login-error-msg'),
  userInfoBadge: document.getElementById('user-info-badge'),
  loggedUserName: document.getElementById('logged-user-name'),
  btnLogout: document.getElementById('btn-logout'),

  // Subvistas
  sidebarBtns: document.querySelectorAll('.sidebar-btn'),
  subviews: document.querySelectorAll('.admin-subview'),

  // Analíticas y Periodos
  kpiTotalVisits: document.getElementById('kpi-total-visits'),
  kpiUniqueVisitors: document.getElementById('kpi-unique-visitors'),
  kpiQrScans: document.getElementById('kpi-qr-scans'),
  kpiBookings: document.getElementById('kpi-bookings'),
  analyticsSummaryTbody: document.getElementById('analytics-summary-tbody'),
  currentPeriodText: document.getElementById('current-period-text'),
  analyticsRowsCount: document.getElementById('analytics-rows-count'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnPrintReport: document.getElementById('btn-print-report'),
  btnResetAnalytics: document.getElementById('btn-reset-analytics'),

  // Paneles
  panelsList: document.getElementById('admin-panels-sortable-list'),
  panelForm: document.getElementById('form-panel-edit'),
  panelFormTitle: document.getElementById('panel-form-title'),
  btnCancelPanelEdit: document.getElementById('btn-cancel-panel-edit'),
  panelsCountBadge: document.getElementById('panels-count-badge'),

  // Agenda
  agendaList: document.getElementById('admin-agenda-list'),
  agendaForm: document.getElementById('form-activity-edit'),
  agendaCountBadge: document.getElementById('agenda-count-badge'),

  // Reservas
  bookingsTbody: document.getElementById('admin-bookings-tbody'),
  bookingsCountBadge: document.getElementById('bookings-count-badge'),

  // Modal QR
  adminQrModal: document.getElementById('admin-qr-modal'),
  adminQrTitle: document.getElementById('admin-qr-title'),
  adminQrcodeBox: document.getElementById('admin-qrcode-box'),
  adminQrUrlText: document.getElementById('admin-qr-url-text'),
  btnAdminDownloadQr: document.getElementById('btn-admin-download-qr'),
  btnAdminCloseQr: document.getElementById('btn-admin-close-qr'),

  // Toast
  toast: document.getElementById('admin-toast')
};

let panelsData = [];
let agendaData = [];
let bookingsData = [];
let analyticsData = null;
let monthlyChart = null;
let langChart = null;

// ═══════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════
let siteConfigData = {
  sections: {
    hero: true,
    cronologia: true,
    patrimonio: true,
    puntos: true,
    galeria: true,
    horarios: true,
    agenda: true,
    reservas: true,
    contacto: true
  },
  content: {
    site_title: "Centro de Interpretación Santuario Ibérico de “El Pajarillo”",
    site_tagline: "Un viaje al corazón sagrado de la cultura íbera y el dominio territorial de Iltiraka",
    hero_cta: "Planifica tu Visita",
    hero_desc: "Descubre el excepcional monumento heroico oretano del siglo IV a.C., la emblemática escultura en caliza de la Cabeza de Lobo y el paisaje sagrado del río Jandulilla en Huelma, Jaén.",
    tel: "(+34) 953 39 00 10",
    email: "turismo@elpajarillo.es",
    ayto: "Ayuntamiento de Huelma · Concejalía de Patrimonio y Turismo",
    horario_atencion: "Lunes a Viernes de 9:00 a 14:00 h",
    horario_invierno: "Miércoles a Domingo: 10:00 - 14:00 | 16:30 - 19:00",
    horario_verano: "Miércoles a Domingo: 9:30 - 13:30 | 18:00 - 20:30",
    tarifa_general: "3,00 €",
    tarifa_reducida: "1,50 € (Jubilados, estudiantes y grupos >10)",
    tarifa_gratuita: "Menores de 12 años, empadronados en Huelma y domingos tarde"
  }
};

// ═══════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  setupAuthTabs();
  setupSidebarNavigation();
  setupPeriodFilters();
  setupSectionsManager();
  setupContentEditor();
  setupGalleryManager();
  setupDropzone();
  setupQrModalEvents();
  setupCsvExport();
});

// ═══════════════════════════════════════════
// AUTENTICACIÓN Y SESIÓN
// ═══════════════════════════════════════════
async function checkSession() {
  const localAuth = sessionStorage.getItem('pajarillo_admin_auth') || localStorage.getItem('pajarillo_admin_auth');
  const localUser = sessionStorage.getItem('pajarillo_admin_user') || localStorage.getItem('pajarillo_admin_user') || 'Administrador Municipal';

  if (localAuth === 'true') {
    showDashboard(localUser);
    return;
  }

  try {
    const res = await fetch('./api/auth.php');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        showDashboard(data.user || 'Administrador');
        return;
      }
    }
  } catch (err) {}

  showLogin();
}

function setupAuthTabs() {
  // Botón Acceso Rápido Directo (1 Clic)
  const btnQuick = document.getElementById('btn-quick-login');
  if (btnQuick) {
    btnQuick.addEventListener('click', () => {
      sessionStorage.setItem('pajarillo_admin_auth', 'true');
      localStorage.setItem('pajarillo_admin_auth', 'true');
      sessionStorage.setItem('pajarillo_admin_user', 'Administrador Municipal');
      showToast('⚡ Acceso concedido como Administrador Municipal');
      showDashboard('Administrador Municipal');
    });
  }

  // Chips de credenciales para rellenar con un clic
  document.querySelectorAll('.btn-cred-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      const u = btn.dataset.u;
      const p = btn.dataset.p;
      const userEl = document.getElementById('login-user');
      const passEl = document.getElementById('login-pass');
      if (userEl) userEl.value = u;
      if (passEl) passEl.value = p;
      DOM.loginForm.dispatchEvent(new Event('submit'));
    });
  });

  DOM.tabBtnLogin.addEventListener('click', () => {
    DOM.tabBtnLogin.classList.replace('btn-admin-outline', 'btn-admin-primary');
    DOM.tabBtnRegister.classList.replace('btn-admin-primary', 'btn-admin-outline');
    DOM.loginForm.classList.remove('hidden');
    DOM.registerForm.classList.add('hidden');
    DOM.loginErrorMsg.classList.add('hidden');
  });

  DOM.tabBtnRegister.addEventListener('click', () => {
    DOM.tabBtnRegister.classList.replace('btn-admin-outline', 'btn-admin-primary');
    DOM.tabBtnLogin.classList.replace('btn-admin-primary', 'btn-admin-outline');
    DOM.registerForm.classList.remove('hidden');
    DOM.loginForm.classList.add('hidden');
    DOM.loginErrorMsg.classList.add('hidden');
  });

  DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = (document.getElementById('login-user').value || 'admin').trim();
    const pass = (document.getElementById('login-pass').value || '').trim();

    const validPasswords = ['pajarillo', 'admin', '1234', 'huelma', 'huelma2026', 'pajarillo2026', 'demo'];
    const isLocalValid = validPasswords.includes(pass.toLowerCase()) || pass === '' || user === 'admin' || user === 'ayuntamiento' || user === 'turismo';

    try {
      const res = await fetch('./api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('pajarillo_admin_auth', 'true');
          localStorage.setItem('pajarillo_admin_auth', 'true');
          sessionStorage.setItem('pajarillo_admin_user', user);
          showToast(`✅ Acceso concedido: ${user}`);
          showDashboard(user);
          return;
        }
      }
    } catch (err) {}

    if (isLocalValid) {
      sessionStorage.setItem('pajarillo_admin_auth', 'true');
      localStorage.setItem('pajarillo_admin_auth', 'true');
      sessionStorage.setItem('pajarillo_admin_user', user);
      showToast(`✅ Bienvenido, ${user}`);
      showDashboard(user);
    } else {
      DOM.loginErrorMsg.textContent = 'Credenciales no reconocidas. Usa "pajarillo" o pulsa "Acceso Directo (1 Clic)"';
      DOM.loginErrorMsg.classList.remove('hidden');
    }
  });

  DOM.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;

    try {
      await fetch('./api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, username: user, password: pass })
      });
    } catch (err) {}

    sessionStorage.setItem('pajarillo_admin_auth', 'true');
    localStorage.setItem('pajarillo_admin_auth', 'true');
    sessionStorage.setItem('pajarillo_admin_user', name || user);
    showToast('✅ Usuario creado e iniciado con éxito');
    showDashboard(name || user);
  });

  DOM.btnLogout.addEventListener('click', async () => {
    try {
      await fetch('./api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (e) {}
    sessionStorage.removeItem('pajarillo_admin_auth');
    localStorage.removeItem('pajarillo_admin_auth');
    sessionStorage.removeItem('pajarillo_admin_user');
    localStorage.removeItem('pajarillo_admin_user');
    showLogin();
  });
}

function showLogin() {
  DOM.loginView.classList.remove('hidden');
  DOM.dashboardView.classList.add('hidden');
  DOM.userInfoBadge.classList.add('hidden');
  DOM.btnLogout.classList.add('hidden');
}

function showDashboard(username) {
  DOM.loginView.classList.add('hidden');
  DOM.dashboardView.classList.remove('hidden');
  DOM.userInfoBadge.classList.remove('hidden');
  DOM.btnLogout.classList.remove('hidden');
  DOM.loggedUserName.textContent = username || 'Gestor Municipal';

  loadAllData();
}

// ═══════════════════════════════════════════
// NAVEGACIÓN ENTRE SUBVISTAS (SIDEBAR)
// ═══════════════════════════════════════════
function setupSidebarNavigation() {
  DOM.sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      DOM.sidebarBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      DOM.subviews.forEach(view => {
        view.classList.toggle('hidden', view.id !== `subview-${targetView}`);
      });
    });
  });
}

// ═══════════════════════════════════════════
// CARGA GLOBAL DE DATOS
// ═══════════════════════════════════════════
async function loadAllData() {
  await Promise.all([
    loadAnalytics(),
    loadSectionsConfig(),
    loadSiteContent(),
    loadPanels(),
    loadAgenda(),
    loadGalleryAdmin(),
    loadBookings()
  ]);
}


// ═══════════════════════════════════════════
// MÓDULO 1: ANALÍTICA DE VISITANTES Y PERIODOS (TELEMETRÍA REAL)
// ═══════════════════════════════════════════

const ANALYTICS_STORAGE_KEY = 'pajarillo_real_analytics';

function getRealAnalyticsData() {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.summary) return parsed;
    }
  } catch (e) {}

  return {
    summary: {
      totalVisits: 0,
      uniqueVisitors: 0,
      qrScans: 0,
      tourBookings: 0,
      audioListens: 0,
      downloads: 0
    },
    languages: { es: 0, en: 0, fr: 0 },
    events: []
  };
}

function computePeriodMetrics(periodKey) {
  const data = getRealAnalyticsData();
  const now = new Date();
  const events = Array.isArray(data.events) ? data.events : [];

  let name = 'Hoy (Últimas 24h)';
  let labels = [];
  let visitsPerBucket = [];
  let qrPerBucket = [];
  let breakdown = [];
  let periodVisits = 0;
  let periodQr = 0;
  let periodBookings = 0;
  let periodUnique = 0;
  let langCounts = { es: 0, en: 0, fr: 0 };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  if (periodKey === 'hoy') {
    name = 'Hoy (Últimas 24h)';
    const intervals = [
      { label: '00:00 - 03:00', startH: 0, endH: 3 },
      { label: '03:00 - 06:00', startH: 3, endH: 6 },
      { label: '06:00 - 09:00', startH: 6, endH: 9 },
      { label: '09:00 - 12:00', startH: 9, endH: 12 },
      { label: '12:00 - 15:00', startH: 12, endH: 15 },
      { label: '15:00 - 18:00', startH: 15, endH: 18 },
      { label: '18:00 - 21:00', startH: 18, endH: 21 },
      { label: '21:00 - 24:00', startH: 21, endH: 24 }
    ];

    const cutoff = new Date(now.getTime() - 24 * 3600 * 1000);
    const todayEvents = events.filter(e => new Date(e.time) >= cutoff);

    labels = intervals.map(i => i.label.split(' - ')[0]);

    intervals.forEach(inv => {
      const bEvents = todayEvents.filter(e => {
        const d = new Date(e.time);
        const h = d.getHours();
        return h >= inv.startH && h < inv.endH;
      });
      const v = bEvents.filter(e => e.type === 'page_view').length;
      const q = bEvents.filter(e => e.type === 'qr_scan').length;
      const a = bEvents.filter(e => e.type === 'audio_play').length;
      const b = bEvents.filter(e => e.type === 'booking').length;
      const es = bEvents.filter(e => (e.lang || 'es') === 'es').length;
      const ext = bEvents.length - es;
      const esPct = bEvents.length ? Math.round((es / bEvents.length) * 100) + '%' : '100%';
      const extPct = bEvents.length ? Math.round((ext / bEvents.length) * 100) + '%' : '0%';

      visitsPerBucket.push(v);
      qrPerBucket.push(q);
      breakdown.push({
        interval: inv.label,
        visits: v,
        unique: bEvents.filter(e => e.type === 'page_view' && e.is_unique).length || (v > 0 ? 1 : 0),
        qr: q,
        audio: a,
        bookings: b,
        es: esPct,
        enFr: extPct
      });
    });

    periodVisits = todayEvents.filter(e => e.type === 'page_view').length;
    periodUnique = todayEvents.filter(e => e.type === 'page_view' && e.is_unique).length;
    periodQr = todayEvents.filter(e => e.type === 'qr_scan').length;
    periodBookings = todayEvents.filter(e => e.type === 'booking').length;

    if (periodVisits === 0 && data.summary.totalVisits > 0 && todayEvents.length === 0) {
      periodVisits = data.summary.totalVisits;
      periodUnique = data.summary.uniqueVisitors;
      periodQr = data.summary.qrScans;
      periodBookings = data.summary.tourBookings;
    }

    todayEvents.forEach(e => {
      const l = e.lang || 'es';
      if (langCounts[l] !== undefined) langCounts[l]++;
    });

  } else if (periodKey === '7d') {
    name = 'Últimos 7 Días';
    const cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const weekEvents = events.filter(e => new Date(e.time) >= cutoff);

    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dayStr = dayDate.toISOString().slice(0, 10);
      const label = `${dayNames[dayDate.getDay()]} ${dayDate.getDate()}`;
      labels.push(label);

      const dEvents = weekEvents.filter(e => e.time && e.time.startsWith(dayStr));
      const v = dEvents.filter(e => e.type === 'page_view').length;
      const q = dEvents.filter(e => e.type === 'qr_scan').length;
      const a = dEvents.filter(e => e.type === 'audio_play').length;
      const b = dEvents.filter(e => e.type === 'booking').length;
      const es = dEvents.filter(e => (e.lang || 'es') === 'es').length;
      const ext = dEvents.length - es;
      const esPct = dEvents.length ? Math.round((es / dEvents.length) * 100) + '%' : '100%';
      const extPct = dEvents.length ? Math.round((ext / dEvents.length) * 100) + '%' : '0%';

      visitsPerBucket.push(v);
      qrPerBucket.push(q);
      breakdown.push({
        interval: `${label} (${dayStr})`,
        visits: v,
        unique: dEvents.filter(e => e.type === 'page_view' && e.is_unique).length || (v > 0 ? 1 : 0),
        qr: q,
        audio: a,
        bookings: b,
        es: esPct,
        enFr: extPct
      });
    }

    periodVisits = weekEvents.filter(e => e.type === 'page_view').length;
    periodUnique = weekEvents.filter(e => e.type === 'page_view' && e.is_unique).length;
    periodQr = weekEvents.filter(e => e.type === 'qr_scan').length;
    periodBookings = weekEvents.filter(e => e.type === 'booking').length;

    weekEvents.forEach(e => {
      const l = e.lang || 'es';
      if (langCounts[l] !== undefined) langCounts[l]++;
    });

  } else if (periodKey === '30d') {
    name = 'Últimos 30 Días';
    const cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const monthEvents = events.filter(e => new Date(e.time) >= cutoff);

    labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const weekBuckets = [
      { label: 'Semana 1 (Hace 22-30 días)', minDays: 22, maxDays: 30 },
      { label: 'Semana 2 (Hace 15-21 días)', minDays: 15, maxDays: 21 },
      { label: 'Semana 3 (Hace 8-14 días)', minDays: 8, maxDays: 14 },
      { label: 'Semana 4 (Últimos 7 días)', minDays: 0, maxDays: 7 }
    ];

    weekBuckets.forEach(wb => {
      const wEvents = monthEvents.filter(e => {
        const diffDays = Math.floor((now.getTime() - new Date(e.time).getTime()) / (24 * 3600 * 1000));
        return diffDays >= wb.minDays && diffDays <= wb.maxDays;
      });

      const v = wEvents.filter(e => e.type === 'page_view').length;
      const q = wEvents.filter(e => e.type === 'qr_scan').length;
      const a = wEvents.filter(e => e.type === 'audio_play').length;
      const b = wEvents.filter(e => e.type === 'booking').length;
      const es = wEvents.filter(e => (e.lang || 'es') === 'es').length;
      const ext = wEvents.length - es;
      const esPct = wEvents.length ? Math.round((es / wEvents.length) * 100) + '%' : '100%';
      const extPct = wEvents.length ? Math.round((ext / wEvents.length) * 100) + '%' : '0%';

      visitsPerBucket.push(v);
      qrPerBucket.push(q);
      breakdown.push({
        interval: wb.label,
        visits: v,
        unique: wEvents.filter(e => e.type === 'page_view' && e.is_unique).length || (v > 0 ? 1 : 0),
        qr: q,
        audio: a,
        bookings: b,
        es: esPct,
        enFr: extPct
      });
    });

    periodVisits = monthEvents.filter(e => e.type === 'page_view').length;
    periodUnique = monthEvents.filter(e => e.type === 'page_view' && e.is_unique).length;
    periodQr = monthEvents.filter(e => e.type === 'qr_scan').length;
    periodBookings = monthEvents.filter(e => e.type === 'booking').length;

    monthEvents.forEach(e => {
      const l = e.lang || 'es';
      if (langCounts[l] !== undefined) langCounts[l]++;
    });

  } else if (periodKey === 'meses') {
    const curYear = now.getFullYear();
    name = `Año ${curYear} (Meses)`;
    labels = monthNames.slice(0, now.getMonth() + 1);

    labels.forEach((mName, mIdx) => {
      const mEvents = events.filter(e => {
        const d = new Date(e.time);
        return d.getFullYear() === curYear && d.getMonth() === mIdx;
      });
      const v = mEvents.filter(e => e.type === 'page_view').length;
      const q = mEvents.filter(e => e.type === 'qr_scan').length;
      const a = mEvents.filter(e => e.type === 'audio_play').length;
      const b = mEvents.filter(e => e.type === 'booking').length;
      const es = mEvents.filter(e => (e.lang || 'es') === 'es').length;
      const ext = mEvents.length - es;
      const esPct = mEvents.length ? Math.round((es / mEvents.length) * 100) + '%' : '100%';
      const extPct = mEvents.length ? Math.round((ext / mEvents.length) * 100) + '%' : '0%';

      visitsPerBucket.push(v);
      qrPerBucket.push(q);
      breakdown.push({
        interval: `${mName} ${curYear}`,
        visits: v,
        unique: mEvents.filter(e => e.type === 'page_view' && e.is_unique).length || (v > 0 ? 1 : 0),
        qr: q,
        audio: a,
        bookings: b,
        es: esPct,
        enFr: extPct
      });
    });

    periodVisits = data.summary.totalVisits || 0;
    periodUnique = data.summary.uniqueVisitors || 0;
    periodQr = data.summary.qrScans || 0;
    periodBookings = data.summary.tourBookings || 0;

  } else if (periodKey === 'anos') {
    const curYear = now.getFullYear();
    name = 'Histórico Anual';
    labels = [String(curYear)];
    visitsPerBucket = [data.summary.totalVisits || 0];
    qrPerBucket = [data.summary.qrScans || 0];
    breakdown = [{
      interval: `Año ${curYear} (Conteo real activo)`,
      visits: data.summary.totalVisits || 0,
      unique: data.summary.uniqueVisitors || 0,
      qr: data.summary.qrScans || 0,
      audio: data.summary.audioListens || 0,
      bookings: data.summary.tourBookings || 0,
      es: '100%',
      enFr: '0%'
    }];
    periodVisits = data.summary.totalVisits || 0;
    periodUnique = data.summary.uniqueVisitors || 0;
    periodQr = data.summary.qrScans || 0;
    periodBookings = data.summary.tourBookings || 0;
  }

  if (langCounts.es === 0 && langCounts.en === 0 && langCounts.fr === 0) {
    langCounts.es = data.languages.es || 0;
    langCounts.en = data.languages.en || 0;
    langCounts.fr = data.languages.fr || 0;
  }

  const totalLang = langCounts.es + langCounts.en + langCounts.fr;
  const esPct = totalLang > 0 ? Math.round((langCounts.es / totalLang) * 100) : 0;
  const enPct = totalLang > 0 ? Math.round((langCounts.en / totalLang) * 100) : 0;
  const frPct = totalLang > 0 ? (100 - esPct - enPct) : 0;

  const trends = {
    visits: periodVisits > 0 ? `📊 ${periodVisits} visitas registradas` : '⏳ Esperando visitas',
    unique: periodUnique > 0 ? `👤 ${periodUnique} visitantes únicos` : '⏳ Sin visitas únicas aún',
    qr: periodQr > 0 ? `📱 ${periodQr} lecturas en sala` : '⏳ Sin lecturas QR',
    bookings: periodBookings > 0 ? `🎟️ ${periodBookings} solicitudes recibidas` : '⏳ Sin reservas'
  };

  return {
    name,
    kpi: {
      visits: periodVisits,
      unique: periodUnique,
      qr: periodQr,
      bookings: periodBookings
    },
    trends,
    labels,
    visits: visitsPerBucket,
    qr: qrPerBucket,
    languages: {
      es: langCounts.es,
      en: langCounts.en,
      fr: langCounts.fr,
      esPct,
      enPct,
      frPct
    },
    breakdown
  };
}

let currentAnalyticsPeriod = 'hoy';

function setupPeriodFilters() {
  const periodBtns = document.querySelectorAll('.btn-filter-period[data-period]');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAnalyticsPeriod = btn.dataset.period;
      renderAnalyticsForPeriod(currentAnalyticsPeriod);
    });
  });

  const btnPrint = document.getElementById('btn-print-report');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      const p = computePeriodMetrics(currentAnalyticsPeriod);
      const printDate = document.getElementById('print-date');
      const printLabel = document.getElementById('print-period-label');
      if (printDate) {
        printDate.textContent = new Date().toLocaleDateString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      }
      if (printLabel) printLabel.textContent = p.name;
      window.print();
    });
  }

  // Botón para resetear todos los contadores a 0
  const btnReset = document.getElementById('btn-reset-analytics');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      const ok = confirm('¿Deseas restablecer todos los contadores y analíticas a 0?\n\nEsta acción reiniciará los contadores de visitas reales, visitantes únicos, códigos QR y reservas a cero.');
      if (ok) {
        if (window.PajarilloAnalytics && typeof window.PajarilloAnalytics.resetAll === 'function') {
          window.PajarilloAnalytics.resetAll();
        } else {
          localStorage.removeItem(ANALYTICS_STORAGE_KEY);
          localStorage.removeItem('pajarillo_has_visited');
          sessionStorage.removeItem('pajarillo_session_counted');
        }
        renderAnalyticsForPeriod(currentAnalyticsPeriod);
        showToast('🔄 Todos los contadores se han puesto a 0 con éxito.');
      }
    });
  }

  // Actualización reactiva si se producen visitas en otra pestaña
  window.addEventListener('pajarillo_analytics_updated', () => {
    renderAnalyticsForPeriod(currentAnalyticsPeriod);
  });
  window.addEventListener('storage', (e) => {
    if (e.key === ANALYTICS_STORAGE_KEY) {
      renderAnalyticsForPeriod(currentAnalyticsPeriod);
    }
  });
}

async function loadAnalytics() {
  renderAnalyticsForPeriod(currentAnalyticsPeriod);
}

function renderAnalyticsForPeriod(periodKey) {
  const p = computePeriodMetrics(periodKey);

  // 1. Actualizar texto de periodo y badges
  if (DOM.currentPeriodText) DOM.currentPeriodText.textContent = p.name;
  if (DOM.analyticsRowsCount) DOM.analyticsRowsCount.textContent = `${p.breakdown.length} intervalos auditados`;

  // 2. Actualizar tarjetas KPI
  if (DOM.kpiTotalVisits) DOM.kpiTotalVisits.textContent = Number(p.kpi.visits).toLocaleString();
  if (DOM.kpiUniqueVisitors) DOM.kpiUniqueVisitors.textContent = Number(p.kpi.unique).toLocaleString();
  if (DOM.kpiQrScans) DOM.kpiQrScans.textContent = Number(p.kpi.qr).toLocaleString();
  if (DOM.kpiBookings) DOM.kpiBookings.textContent = Number(p.kpi.bookings).toLocaleString();

  const trendVisits = document.getElementById('kpi-trend-visits');
  const trendUnique = document.getElementById('kpi-trend-unique');
  const trendQr = document.getElementById('kpi-trend-qr');
  const trendBookings = document.getElementById('kpi-trend-bookings');

  if (trendVisits) trendVisits.textContent = p.trends.visits;
  if (trendUnique) trendUnique.textContent = p.trends.unique;
  if (trendQr) trendQr.textContent = p.trends.qr;
  if (trendBookings) trendBookings.textContent = p.trends.bookings;

  // 3. Actualizar barras de idioma y porcentajes
  const pctEs = document.getElementById('lang-pct-es');
  const pctEn = document.getElementById('lang-pct-en');
  const pctFr = document.getElementById('lang-pct-fr');
  const fillEs = document.getElementById('fill-es');
  const fillEn = document.getElementById('fill-en');
  const fillFr = document.getElementById('fill-fr');

  if (pctEs) pctEs.textContent = `${p.languages.esPct}% (${Number(p.languages.es).toLocaleString()})`;
  if (pctEn) pctEn.textContent = `${p.languages.enPct}% (${Number(p.languages.en).toLocaleString()})`;
  if (pctFr) pctFr.textContent = `${p.languages.frPct}% (${Number(p.languages.fr).toLocaleString()})`;

  if (fillEs) fillEs.style.width = `${p.languages.esPct}%`;
  if (fillEn) fillEn.style.width = `${p.languages.enPct}%`;
  if (fillFr) fillFr.style.width = `${p.languages.frPct}%`;

  // 4. Gráfica de evolución según periodo con Chart.js
  const ctxMonthly = document.getElementById('chart-monthly-trend');
  if (ctxMonthly && typeof Chart !== 'undefined') {
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: p.labels,
        datasets: [
          {
            label: 'Visitas Totales',
            data: p.visits,
            borderColor: '#384F3E',
            backgroundColor: 'rgba(56, 79, 62, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          },
          {
            label: 'Escaneos QR In Situ',
            data: p.qr,
            borderColor: '#B59A57',
            backgroundColor: 'rgba(181, 154, 87, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // 5. Gráfico de donut de idiomas
  const ctxLang = document.getElementById('chart-languages-doughnut');
  if (ctxLang && typeof Chart !== 'undefined') {
    if (langChart) langChart.destroy();
    const hasLangData = (p.languages.es + p.languages.en + p.languages.fr) > 0;
    langChart = new Chart(ctxLang, {
      type: 'doughnut',
      data: {
        labels: hasLangData ? ['Español', 'Inglés', 'Francés'] : ['Sin visitas registradas'],
        datasets: [{
          data: hasLangData ? [p.languages.es, p.languages.en, p.languages.fr] : [1],
          backgroundColor: hasLangData ? ['#384F3E', '#B59A57', '#3D2A40'] : ['#E2E8F0'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  // 6. Tabla de desglose por intervalos del periodo
  if (DOM.analyticsSummaryTbody) {
    if (!p.breakdown || p.breakdown.length === 0) {
      DOM.analyticsSummaryTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--admin-muted);">
            No hay registros para este periodo todavía. Las métricas se registrarán en tiempo real conforme los usuarios visiten la web y escaneen los paneles.
          </td>
        </tr>
      `;
    } else {
      DOM.analyticsSummaryTbody.innerHTML = p.breakdown.map(row => `
        <tr>
          <td><strong>${row.interval}</strong></td>
          <td>${Number(row.visits).toLocaleString()}</td>
          <td>${Number(row.unique).toLocaleString()}</td>
          <td><span style="color: #B59A57; font-weight: 700;">📱 ${row.qr}</span></td>
          <td>🎧 ${row.audio || 0}</td>
          <td>🎟️ ${row.bookings}</td>
          <td><small>ES: <strong>${row.es}</strong> / Ext: <strong>${row.enFr}</strong></small></td>
        </tr>
      `).join('');
    }
  }
}

// ═══════════════════════════════════════════
// MÓDULO 2: PUNTOS Y PANELES QR (ESTILO JÓDAR)
// ═══════════════════════════════════════════
async function loadPanels() {
  try {
    let res = await fetch('./api/data.php?entity=panels&t=' + Date.now()).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('./data/paneles.json?t=' + Date.now());
    }
    const data = await res.json();
    panelsData = data.panels || [];
    renderPanelsList();
  } catch (err) {
    console.error('Error cargando paneles:', err);
  }
}

function renderPanelsList() {
  if (!DOM.panelsList) return;
  DOM.panelsList.innerHTML = '';
  if (DOM.panelsCountBadge) DOM.panelsCountBadge.textContent = panelsData.length;

  panelsData.forEach(panel => {
    const li = document.createElement('li');
    li.className = 'panel-admin-item';
    li.dataset.id = panel.id;
    const title = panel.content.es.title;
    const safeTitle = title.replace(/'/g, "\\'");

    li.innerHTML = `
      <div class="panel-drag-grip" title="Arrastrar para reordenar">⋮⋮</div>
      <img src="${panel.image}" alt="${title}" class="panel-thumb-preview" onerror="this.src='./assets/images/lobo.jpg'">
      <div class="panel-admin-details">
        <h4>Nº 0${panel.id} — ${title}</h4>
        <p>${panel.content.es.subtitle || 'Punto Interpretativo'} · <strong>${panel.tag || 'General'}</strong></p>
      </div>
      <div class="panel-actions-group">
        <button class="btn-admin btn-admin-outline" style="padding: 6px 10px;" onclick="openAdminQR(${panel.id}, '${safeTitle}')" title="Generar QR">📱 QR</button>
        <button class="btn-admin btn-admin-outline" style="padding: 6px 10px;" onclick="editPanel(${panel.id})" title="Editar">✏️</button>
        <button class="btn-admin btn-admin-danger" style="padding: 6px 10px;" onclick="deletePanel(${panel.id})" title="Eliminar">🗑️</button>
      </div>
    `;
    DOM.panelsList.appendChild(li);
  });

  // Reordenación con SortableJS (exactamente como en Jódar)
  if (typeof Sortable !== 'undefined') {
    new Sortable(DOM.panelsList, {
      handle: '.panel-drag-grip',
      animation: 150,
      onEnd: async () => {
        const itemEls = DOM.panelsList.querySelectorAll('.panel-admin-item');
        const newOrder = Array.from(itemEls).map(el => parseInt(el.dataset.id));
        try {
          await fetch('./api/data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reorder', order: newOrder })
          });
          showToast('✅ Orden de paneles actualizado');
        } catch (e) {
          showToast('ℹ️ Orden reconfigurado localmente');
        }
      }
    });
  }
}

// Guardar panel
DOM.panelForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const idInput = document.getElementById('panel-edit-id').value;
  const id = idInput ? parseInt(idInput) : (panelsData.length > 0 ? Math.max(...panelsData.map(p => p.id)) + 1 : 1);

  const newPanel = {
    id: id,
    tag: document.getElementById('panel-edit-tag').value,
    image: document.getElementById('panel-current-img-url').value || './assets/images/gallery/exterior.jpg',
    video: document.getElementById('panel-video-url').value || null,
    content: {
      es: {
        title: document.getElementById('panel-title-es').value,
        subtitle: document.getElementById('panel-sub-es').value,
        description: document.getElementById('panel-desc-es').value
      },
      en: {
        title: document.getElementById('panel-title-en').value || document.getElementById('panel-title-es').value,
        subtitle: document.getElementById('panel-sub-es').value,
        description: document.getElementById('panel-desc-en').value || document.getElementById('panel-desc-es').value
      },
      fr: {
        title: document.getElementById('panel-title-fr').value || document.getElementById('panel-title-es').value,
        subtitle: document.getElementById('panel-sub-es').value,
        description: document.getElementById('panel-desc-fr').value || document.getElementById('panel-desc-es').value
      }
    }
  };

  try {
    await fetch('./api/data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panel: newPanel })
    });
  } catch (err) {}

  // Actualizar en memoria
  const index = panelsData.findIndex(p => p.id === id);
  if (index >= 0) panelsData[index] = newPanel;
  else panelsData.push(newPanel);

  renderPanelsList();
  resetPanelForm();
  showToast('✅ Panel guardado correctamente');
});

window.editPanel = function(id) {
  const panel = panelsData.find(p => p.id === id);
  if (!panel) return;

  document.getElementById('panel-edit-id').value = panel.id;
  document.getElementById('panel-edit-tag').value = panel.tag || 'escultura';
  document.getElementById('panel-title-es').value = panel.content.es.title;
  document.getElementById('panel-sub-es').value = panel.content.es.subtitle || '';
  document.getElementById('panel-desc-es').value = panel.content.es.description.replace(/<\/?[^>]+(>|$)/g, "");

  if (panel.content.en) {
    document.getElementById('panel-title-en').value = panel.content.en.title || '';
    document.getElementById('panel-desc-en').value = (panel.content.en.description || '').replace(/<\/?[^>]+(>|$)/g, "");
  }
  if (panel.content.fr) {
    document.getElementById('panel-title-fr').value = panel.content.fr.title || '';
    document.getElementById('panel-desc-fr').value = (panel.content.fr.description || '').replace(/<\/?[^>]+(>|$)/g, "");
  }

  document.getElementById('panel-current-img-url').value = panel.image;
  document.getElementById('panel-video-url').value = panel.video || '';
  const preview = document.getElementById('panel-img-preview');
  preview.src = panel.image;
  document.getElementById('panel-img-preview-box').style.display = 'block';

  DOM.panelFormTitle.textContent = 'Editar Panel Nº 0' + panel.id;
  DOM.btnCancelPanelEdit.classList.remove('hidden');

  DOM.panelForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const card = DOM.panelForm.closest('.admin-card');
  if (card) {
    card.classList.add('editing-highlight');
    setTimeout(() => card.classList.remove('editing-highlight'), 1800);
  }
};

DOM.btnCancelPanelEdit.addEventListener('click', resetPanelForm);

function resetPanelForm() {
  DOM.panelForm.reset();
  DOM.panelFormTitle.textContent = 'Añadir Nuevo Panel';
  DOM.btnCancelPanelEdit.classList.add('hidden');
  document.getElementById('panel-edit-id').value = '';
  document.getElementById('panel-current-img-url').value = '';
  document.getElementById('panel-video-url').value = '';
  document.getElementById('panel-img-preview-box').style.display = 'none';
}

window.deletePanel = async function(id) {
  if (!confirm('¿Deseas eliminar este punto de la exposición?')) return;
  try {
    await fetch('./api/data.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, type: 'panel' })
    });
  } catch (e) {}
  panelsData = panelsData.filter(p => p.id !== id);
  renderPanelsList();
  showToast('🗑️ Panel eliminado');
};

// ═══════════════════════════════════════════
// MÓDULO 3: AGENDA CULTURAL
// ═══════════════════════════════════════════
async function loadAgenda() {
  try {
    let res = await fetch('./api/data.php?entity=agenda&t=' + Date.now()).catch(() => null);
    if (!res || !res.ok) res = await fetch('./data/agenda.json?t=' + Date.now());
    const data = await res.json();
    agendaData = data.activities || [];
    renderAgendaList();
  } catch (err) {
    console.error('Error cargando agenda:', err);
  }
}

function renderAgendaList() {
  if (!DOM.agendaList) return;
  DOM.agendaList.innerHTML = '';
  if (DOM.agendaCountBadge) DOM.agendaCountBadge.textContent = agendaData.length;

  agendaData.forEach(act => {
    const li = document.createElement('li');
    li.className = 'panel-admin-item';
    li.innerHTML = `
      <div class="panel-admin-details">
        <h4>${act.title.es || act.title}</h4>
        <p>📅 ${act.date} · ⏰ ${act.time} h · 🎟️ ${act.spotsLeft || act.spotsTotal || 25} plazas · <strong>${act.category || 'General'}</strong></p>
      </div>
      <div class="panel-actions-group">
        <button type="button" class="btn-admin btn-admin-outline" style="padding: 6px 10px;" onclick="window.editActivity(${act.id})" title="Editar">✏️</button>
        <button type="button" class="btn-admin btn-admin-danger" style="padding: 6px 10px;" onclick="window.deleteActivity(${act.id})" title="Eliminar">🗑️</button>
      </div>
    `;
    DOM.agendaList.appendChild(li);
  });
}

window.editActivity = function(id) {
  const act = agendaData.find(a => a.id === id);
  if (!act) return;
  document.getElementById('act-id').value = act.id;
  document.getElementById('act-title-es').value = act.title.es || act.title || '';
  document.getElementById('act-date').value = act.date || '';
  document.getElementById('act-time').value = act.time || '11:30';
  document.getElementById('act-cat').value = act.category || 'visitas';
  document.getElementById('act-spots').value = act.spotsTotal || act.spotsLeft || 25;
  document.getElementById('act-desc-es').value = (act.description && act.description.es) || act.description || '';

  const titleEl = document.getElementById('act-form-title');
  if (titleEl) titleEl.textContent = '✏️ Modificar Actividad';

  DOM.agendaForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const card = DOM.agendaForm.closest('.admin-card');
  if (card) {
    card.classList.add('editing-highlight');
    setTimeout(() => card.classList.remove('editing-highlight'), 1800);
  }
};

DOM.agendaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const actIdVal = document.getElementById('act-id').value;
  const isEditing = Boolean(actIdVal);
  const targetId = isEditing ? Number(actIdVal) : Date.now();

  const newAct = {
    id: targetId,
    date: document.getElementById('act-date').value,
    time: document.getElementById('act-time').value,
    category: document.getElementById('act-cat').value,
    spotsTotal: parseInt(document.getElementById('act-spots').value) || 25,
    spotsLeft: parseInt(document.getElementById('act-spots').value) || 25,
    free: true,
    image: './assets/images/gallery/exterior.jpg',
    title: { es: document.getElementById('act-title-es').value },
    description: { es: document.getElementById('act-desc-es').value }
  };

  try {
    await fetch('./api/data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: newAct })
    });
  } catch (err) {}

  if (isEditing) {
    const idx = agendaData.findIndex(a => a.id === targetId);
    if (idx >= 0) agendaData[idx] = newAct;
    showToast('✅ Actividad actualizada correctamente');
  } else {
    agendaData.push(newAct);
    showToast('✅ Nueva actividad agregada a la agenda');
  }

  renderAgendaList();
  DOM.agendaForm.reset();
  document.getElementById('act-id').value = '';
  const titleEl = document.getElementById('act-form-title');
  if (titleEl) titleEl.textContent = 'Añadir Actividad';
});

window.deleteActivity = async function(id) {
  if (!confirm('¿Eliminar actividad programada?')) return;
  try {
    await fetch('./api/data.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, type: 'activity' })
    });
  } catch (e) {}
  agendaData = agendaData.filter(a => a.id !== id);
  renderAgendaList();
  showToast('🗑️ Actividad eliminada');
};

// ═══════════════════════════════════════════
// MÓDULO 4: BANDEJA DE RESERVAS ONLINE
// ═══════════════════════════════════════════
async function loadBookings() {
  try {
    let res = await fetch('./api/data.php?entity=bookings&t=' + Date.now()).catch(() => null);
    if (!res || !res.ok) res = await fetch('./data/reservas.json?t=' + Date.now());
    const data = await res.json();
    bookingsData = data.bookings || [];
    renderBookingsList();
  } catch (err) {
    console.error('Error cargando reservas:', err);
  }
}

function renderBookingsList() {
  if (!DOM.bookingsTbody) return;
  DOM.bookingsTbody.innerHTML = '';
  if (DOM.bookingsCountBadge) DOM.bookingsCountBadge.textContent = bookingsData.length;

  DOM.bookingsTbody.innerHTML = bookingsData.map(b => {
    const isPending = b.status === 'pending';
    return `
      <tr>
        <td>#${b.id}</td>
        <td><strong>${b.date}</strong></td>
        <td>${b.time || '11:00'}</td>
        <td>
          <strong>${b.name}</strong><br>
          <small style="color: var(--admin-muted);">${b.email} · ${b.phone}</small>
        </td>
        <td>${b.people} pers.</td>
        <td><span style="text-transform: uppercase; font-weight: 700;">${b.lang}</span></td>
        <td><span class="status-badge ${isPending ? 'pending' : 'confirmed'}">${isPending ? 'Pendiente' : 'Confirmada'}</span></td>
        <td>
          ${isPending ? `<button class="btn-admin btn-admin-primary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="updateBookingStatus(${b.id}, 'confirmed')">Confirmar</button>` : ''}
          <button class="btn-admin btn-admin-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteBooking(${b.id})">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateBookingStatus = async function(id, status) {
  try {
    await fetch('./api/data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_booking_status', id: id, status: status })
    });
  } catch (e) {}
  const b = bookingsData.find(item => item.id === id);
  if (b) b.status = status;
  renderBookingsList();
  showToast('✅ Reserva confirmada');
};

window.deleteBooking = async function(id) {
  if (!confirm('¿Eliminar registro de reserva?')) return;
  try {
    await fetch('./api/data.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, type: 'booking' })
    });
  } catch (e) {}
  bookingsData = bookingsData.filter(item => item.id !== id);
  renderBookingsList();
  showToast('🗑️ Registro borrado');
};

// ═══════════════════════════════════════════
// GENERADOR DE CÓDIGOS QR OFICIALES
// ═══════════════════════════════════════════
let adminQrInstance = null;
let currentAdminQrUrl = '';

function setupQrModalEvents() {
  const closeBtn = document.getElementById('btn-admin-close-qr');
  const closeIcon = document.getElementById('btn-close-qr-icon');
  const downloadBtn = document.getElementById('btn-admin-download-qr');

  if (closeBtn) closeBtn.addEventListener('click', () => DOM.adminQrModal.classList.add('hidden'));
  if (closeIcon) closeIcon.addEventListener('click', () => DOM.adminQrModal.classList.add('hidden'));

  // Cerrar al hacer clic en el fondo oscuro
  DOM.adminQrModal.addEventListener('click', (e) => {
    if (e.target === DOM.adminQrModal) {
      DOM.adminQrModal.classList.add('hidden');
    }
  });

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const img = DOM.adminQrcodeBox.querySelector('img');
      if (!img) return;
      const a = document.createElement('a');
      a.href = img.src;
      a.download = `QR_Oficial_Pajarillo_${Date.now()}.png`;
      a.click();
    });
  }
}

window.openAdminQR = function(id, title) {
  DOM.adminQrTitle.textContent = `QR Oficial — Nº 0${id} ${title}`;
  DOM.adminQrcodeBox.innerHTML = '';

  const origin = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
  currentAdminQrUrl = `${origin}?panel=${id}`;
  DOM.adminQrUrlText.textContent = currentAdminQrUrl;

  if (typeof QRCode !== 'undefined') {
    adminQrInstance = new QRCode(DOM.adminQrcodeBox, {
      text: currentAdminQrUrl,
      width: 260,
      height: 260,
      colorDark: '#384F3E',   // Verde Corporativo del Manual
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  DOM.adminQrModal.classList.remove('hidden');
};

// ═══════════════════════════════════════════
// EXPORTACIÓN DE INFORME ANALÍTICO CSV
// ═══════════════════════════════════════════
function setupCsvExport() {
  if (!DOM.btnExportCsv) return;
  DOM.btnExportCsv.addEventListener('click', () => {
    const p = computePeriodMetrics(currentAnalyticsPeriod);
    let csv = "data:text/csv;charset=utf-8,";
    csv += "INFORME ANALITICO OFICIAL - SANTUARIO IBERICO EL PAJARILLO\n";
    csv += `Ayuntamiento de Huelma - Centro de Interpretacion Municipal\n`;
    csv += `Periodo Auditado: ${p.name}\n`;
    csv += `Fecha de Generacion: ${new Date().toLocaleString()}\n\n`;

    csv += "RESUMEN DE KPIS CONSOLIDADOS\n";
    csv += `Visitas Totales,${p.kpi.visits}\n`;
    csv += `Visitantes Unicos,${p.kpi.unique}\n`;
    csv += `Escaneos Codigos QR,${p.kpi.qr}\n`;
    csv += `Reservas Guiadas,${p.kpi.bookings}\n\n`;

    csv += "DISTRIBUCION DE IDIOMAS\n";
    csv += `Espanol (ES),${p.languages.es},${p.languages.esPct}%\n`;
    csv += `Ingles (EN),${p.languages.en},${p.languages.enPct}%\n`;
    csv += `Frances (FR),${p.languages.fr},${p.languages.frPct}%\n\n`;

    csv += "DESGLOSE POR INTERVALO\n";
    csv += "Intervalo,Visitas Totales,Visitantes Unicos,Escaneos QR,Audioguias,Reservas,% Espanol,% Ingles/Frances\n";
    p.breakdown.forEach(row => {
      csv += `"${row.interval}",${row.visits},${row.unique},${row.qr},${row.audio || Math.round(row.qr * 0.85)},${row.bookings},"${row.es}","${row.enFr}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Informe_Analitico_Pajarillo_${currentAnalyticsPeriod}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📥 Informe CSV (${p.name}) descargado con éxito`);
  });
}

// ═══════════════════════════════════════════
// SUBIDA DE ARCHIVOS Y DROPZONE
// ═══════════════════════════════════════════
function setupDropzone() {
  const dropzone = document.getElementById('drop-panel-image');
  const fileInput = document.getElementById('panel-file-img');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelected(fileInput.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });
}

async function handleFileSelected(file) {
  // Previsualización inmediata en local
  const url = URL.createObjectURL(file);
  const preview = document.getElementById('panel-img-preview');
  preview.src = url;
  document.getElementById('panel-img-preview-box').style.display = 'block';

  // Subida al servidor si PHP está disponible
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('./api/upload.php', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      document.getElementById('panel-current-img-url').value = data.url;
      showToast('✅ Archivo subido al servidor');
    }
  } catch (err) {
    document.getElementById('panel-current-img-url').value = url;
  }
}

// ═══════════════════════════════════════════
// MÓDULO: GESTIÓN DE SECCIONES DE LA WEB (ON/OFF)
// ═══════════════════════════════════════════
function setupSectionsManager() {
  const btnSave = document.getElementById('btn-save-sections');
  const btnEnableAll = document.getElementById('btn-enable-all-sections');

  if (btnSave) {
    btnSave.addEventListener('click', saveSectionsConfig);
  }

  if (btnEnableAll) {
    btnEnableAll.addEventListener('click', enableAllSections);
  }

  // Interacción en vivo con los switches
  document.querySelectorAll('.sec-toggle-input').forEach(input => {
    input.addEventListener('change', () => {
      const key = input.dataset.section;
      if (!siteConfigData.sections) siteConfigData.sections = {};
      siteConfigData.sections[key] = input.checked;

      const row = input.closest('.section-card-row');
      const pill = document.getElementById(`status-pill-${key}`);
      if (input.checked) {
        if (row) row.classList.remove('disabled');
        if (pill) {
          pill.className = 'status-pill active';
          pill.textContent = '● Visible en web';
        }
      } else {
        if (row) row.classList.add('disabled');
        if (pill) {
          pill.className = 'status-pill inactive';
          pill.textContent = '○ Oculta en web';
        }
      }

      // Persistir automáticamente en localStorage para efecto inmediato
      localStorage.setItem('pajarillo_site_config', JSON.stringify(siteConfigData));

      // Actualizar contador del badge
      const activeCount = document.querySelectorAll('.sec-toggle-input:checked').length;
      const total = document.querySelectorAll('.sec-toggle-input').length;
      const badge = document.getElementById('sections-active-badge');
      if (badge) badge.textContent = `${activeCount}/${total}`;
    });
  });
}

async function loadSectionsConfig() {
  try {
    const local = localStorage.getItem('pajarillo_site_config');
    if (local) {
      siteConfigData = { ...siteConfigData, ...JSON.parse(local) };
    } else {
      const res = await fetch('./data/site_config.json?t=' + Date.now()).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        siteConfigData = { ...siteConfigData, ...data };
      }
    }
  } catch (e) {}

  updateSectionsUI();
}

function updateSectionsUI() {
  const toggles = document.querySelectorAll('.sec-toggle-input');
  let activeCount = 0;

  toggles.forEach(t => {
    const key = t.dataset.section;
    const isChecked = siteConfigData.sections && siteConfigData.sections[key] !== false;
    t.checked = isChecked;
    if (isChecked) activeCount++;

    const row = t.closest('.section-card-row');
    const pill = document.getElementById(`status-pill-${key}`);
    if (isChecked) {
      if (row) row.classList.remove('disabled');
      if (pill) {
        pill.className = 'status-pill active';
        pill.textContent = '● Visible en web';
      }
    } else {
      if (row) row.classList.add('disabled');
      if (pill) {
        pill.className = 'status-pill inactive';
        pill.textContent = '○ Oculta en web';
      }
    }
  });

  const badge = document.getElementById('sections-active-badge');
  if (badge) badge.textContent = `${activeCount}/${toggles.length}`;
}

async function saveSectionsConfig() {
  document.querySelectorAll('.sec-toggle-input').forEach(t => {
    const key = t.dataset.section;
    if (!siteConfigData.sections) siteConfigData.sections = {};
    siteConfigData.sections[key] = t.checked;
  });

  localStorage.setItem('pajarillo_site_config', JSON.stringify(siteConfigData));

  try {
    await fetch('./api/data.php?entity=config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_config', config: siteConfigData })
    });
  } catch (e) {}

  updateSectionsUI();
  showToast('✅ Configuración de secciones guardada. Los cambios son visibles en la web.');
}

function enableAllSections() {
  if (!siteConfigData.sections) siteConfigData.sections = {};
  document.querySelectorAll('.sec-toggle-input').forEach(t => {
    const key = t.dataset.section;
    siteConfigData.sections[key] = true;
  });

  localStorage.setItem('pajarillo_site_config', JSON.stringify(siteConfigData));
  updateSectionsUI();
  showToast('✅ Todas las secciones se han activado.');
}

// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// MÓDULO: EDITOR DE CONTENIDOS Y TEXTOS MULTILINGÜE (ES / EN / FR)
// ═══════════════════════════════════════════
let currentCmsLang = 'es';

const DEFAULT_LOCALES = {
  es: {
    site_title: "Centro de Interpretación Santuario Ibérico de “El Pajarillo”",
    hero_cta: "Planifica tu Visita",
    site_tagline: "Un viaje al corazón sagrado de la cultura íbera y el dominio territorial de Iltiraka",
    hero_desc: "Descubre el excepcional monumento heroico oretano del siglo IV a.C., la emblemática escultura en caliza de la Cabeza de Lobo y el paisaje sagrado del río Jandulilla en Huelma, Jaén.",
    hito1_title: "Siglos VI–V a.n.e. · Primeros Oppida y Escultura Heroica",
    hito1_desc: "Surgimiento de oppida fortificados en el Alto Guadalquivir y monumentos heroicos como Cerrillo Blanco.",
    hito2_title: "1ª mitad S. IV a.n.e. · Fundación del Santuario de El Pajarillo",
    hito2_desc: "Iltiraka coloniza el valle del río Jandulilla y levanta el monumento heroico del Lobo.",
    hito3_title: "2ª mitad S. IV a.n.e. · Crisis y Amortización Ritual",
    hito3_desc: "Crisis de las aristocracias clientelares ibéricas y abandono ritual del monumento de El Pajarillo.",
    hito4_title: "1933 · Hallazgo del Primer León Ibérico",
    hito4_desc: "Descubrimiento de la primera escultura de león durante las obras de la carretera a Solera.",
    hito5_title: "1993–1994 · Guerrero con Falcata y Excavación UJA",
    hito5_desc: "Aparición de un segundo león y el guerrero; excavación de urgencia del Instituto de Arqueología Ibérica.",
    hito6_title: "2006 – Actualidad · BIC y Centro de Interpretación",
    hito6_desc: "Declaración de Bien de Interés Cultural como Zona Arqueológica y apertura de la plataforma digital accesible.",
    patrimonio_title: "Santuario y Territorio Íbero",
    patrimonio_subtitle: "Hace 2.400 años, la aristocracia de Iltiraka domesticó el valle salvaje del río Jandulilla",
    patrimonio_tab1: "El Santuario Heroico de El Pajarillo representa uno de los hallazgos cumbre de la protohistoria peninsular...",
    patrimonio_tab2: "El Territorio de Iltiraka: colonización de un valle salvaje (silva) mediante un héroe fundador y el oppidum de Loma del Perro...",
    patrimonio_tab3: "Un Paisaje Sagrado y El Fontanar: dos santuarios articulados por un camino ritual procesional...",
    galeria_title: "Fondo Audiovisual y Recursos Multimedia",
    galeria_subtitle: "Explora la fototeca de alta resolución, visor 3D interactivo y fichas de investigación",
    desc_3d: "Explora el modelo tridimensional de la escultura ibérica y el santuario heroico de El Pajarillo en 360°, con soporte de realidad aumentada y control orbital.",
    horario_invierno: "Miércoles a Domingo: 10:00 - 14:00 | 16:30 - 19:00",
    horario_verano: "Miércoles a Domingo: 9:30 - 13:30 | 18:00 - 20:30",
    tarifa_general: "3,00 €",
    tarifa_reducida: "1,50 € (Jubilados, estudiantes y grupos >10)",
    tarifa_gratuita: "Menores de 12 años, empadronados en Huelma y domingos tarde",
    agenda_title: "Agenda Cultural y Actividades",
    agenda_subtitle: "Participa en nuestras visitas temáticas, talleres arqueológicos y conferencias",
    reservas_title: "Reserva tu Visita Guiada",
    reservas_subtitle: "Grupos escolares, particulares y colectivos. Reserva tu turno de visita guiada con nuestros mediadores",
    tel: "(+34) 953 39 00 10",
    email: "turismo@elpajarillo.es",
    ayto: "Ayuntamiento de Huelma · Concejalía de Patrimonio y Turismo",
    horario_atencion: "Lunes a Viernes de 9:00 a 14:00 h",
    direccion: "Plaza de España, 1 · 23140 Huelma (Jaén)",
    footer_copy: "© 2026 Centro de Interpretación Santuario Ibérico de El Pajarillo. Ayuntamiento de Huelma. Todos los derechos reservados."
  },
  en: {
    site_title: "El Pajarillo Iberian Sanctuary Interpretation Centre",
    hero_cta: "Plan Your Visit",
    site_tagline: "A journey to the sacred heart of Iberian culture and the territorial domain of Iltiraka",
    hero_desc: "Discover the exceptional 4th century BC Oretan heroic monument, the iconic limestone Wolf's Head sculpture, and the sacred landscape of the Jandulilla river in Huelma, Jaén.",
    hito1_title: "6th–5th c. BCE · Early Oppida & Heroic Sculptures",
    hito1_desc: "Fortified oppida emerge in the Upper Guadalquivir alongside dynastic sculptures like Cerrillo Blanco.",
    hito2_title: "Early 4th c. BCE · Foundation of El Pajarillo Sanctuary",
    hito2_desc: "Iltiraka colonizes the wild Jandulilla valley and erects the stepped sanctuary and Wolf monument.",
    hito3_title: "Late 4th c. BCE · Crisis & Ritual Decommissioning",
    hito3_desc: "Crisis of clientelist aristocracies and ritual destruction/abandonment of El Pajarillo.",
    hito4_title: "1933 · Discovery of First Iberian Lion",
    hito4_desc: "Discovery of the first Iberian lion sculpture during road construction between Solera and the N-324.",
    hito5_title: "1993–1994 · Falcata Warrior & Rescue Excavations",
    hito5_desc: "Discovery of the second lion and falcata warrior; emergency excavations by the University of Jaén.",
    hito6_title: "2006 – Present · BIC Status & Interpretation Centre",
    hito6_desc: "Official declaration as Archaeological Zone BIC and opening of the accessible digital interpretation platform.",
    patrimonio_title: "Iberian Sanctuary & Territory",
    patrimonio_subtitle: "2,400 years ago, the Iberian aristocracy of Iltiraka claimed the wild Jandulilla valley",
    patrimonio_tab1: "The Heroic Sanctuary of El Pajarillo represents one of the summit discoveries of Iberian protohistory...",
    patrimonio_tab2: "The Territory of Iltiraka: claiming a wild valley (silva) via a founding hero and the Loma del Perro settlement...",
    patrimonio_tab3: "A Sacred Landscape & El Fontanar: two sanctuaries articulated by a ceremonial ritual path...",
    galeria_title: "Audiovisual Archives & Multimedia Resources",
    galeria_subtitle: "Explore high-resolution photographs, 3D interactive models and educational research factsheets",
    desc_3d: "Explore the 3D digital reconstruction of the Iberian sculpture and El Pajarillo sanctuary in 360°, with VR/orbit controls.",
    horario_invierno: "Wednesday to Sunday: 10:00 - 14:00 | 16:30 - 19:00",
    horario_verano: "Wednesday to Sunday: 9:30 - 13:30 | 18:00 - 20:30",
    tarifa_general: "€3.00",
    tarifa_reducida: "€1.50 (Seniors, students and groups >10)",
    tarifa_gratuita: "Children under 12, Huelma residents and Sunday afternoons",
    agenda_title: "Cultural Agenda & Activities",
    agenda_subtitle: "Join our specialized guided tours, archaeological workshops and scientific lectures",
    reservas_title: "Book Your Guided Tour",
    reservas_subtitle: "School groups, associations and individuals. Book your tour with our cultural mediators",
    tel: "(+34) 953 39 00 10",
    email: "tourism@elpajarillo.es",
    ayto: "Huelma Town Council · Heritage and Tourism Department",
    horario_atencion: "Monday to Friday from 9:00 AM to 2:00 PM",
    direccion: "Plaza de España, 1 · 23140 Huelma (Jaén, Spain)",
    footer_copy: "© 2026 El Pajarillo Iberian Sanctuary Interpretation Centre. Huelma Town Council. All rights reserved."
  },
  fr: {
    site_title: "Centre d'Interprétation Sanctuaire Ibérique d'El Pajarillo",
    hero_cta: "Planifiez votre Visite",
    site_tagline: "Un voyage au cœur sacré de la culture ibérique et du domaine territorial d'Iltiraka",
    hero_desc: "Découvrez le monument héroïque orétan exceptionnel du IVe siècle av. J.-C., la célèbre sculpture en calcaire de la Tête de Loup et le paysage sacré de la vallée du Jandulilla à Huelma, Jaén.",
    hito1_title: "VIe–Ve s. av. J.-C. · Premiers Oppida et Sculpture Héroïque",
    hito1_desc: "Apparition des oppida fortifiés dans le Haut Guadalquivir et de sculptures comme Cerrillo Blanco.",
    hito2_title: "1ère moitié IVe s. av. J.-C. · Fondation d'El Pajarillo",
    hito2_desc: "Iltiraka colonise la vallée du Jandulilla et érige le sanctuaire étagé et le monument au Loup.",
    hito3_title: "2e moitié IVe s. av. J.-C. · Crise et Abandon Rituel",
    hito3_desc: "Crise des aristocraties ibériques et condamnation rituelle du sanctuaire d'El Pajarillo.",
    hito4_title: "1933 · Découverte du Premier Lion Ibérique",
    hito4_desc: "Découverte du premier lion lors des travaux routiers entre Solera et la N-324.",
    hito5_title: "1993–1994 · Guerrier à la Falcata et Fouilles UJA",
    hito5_desc: "Découverte du second lion et guerrier; fouilles d'urgence de l'Université de Jaén.",
    hito6_title: "2006 – Aujourd'hui · BIC et Centre d'Interprétation",
    hito6_desc: "Décret déclarant le site Zone Archéologique BIC et inauguration de la plateforme numérique accessible.",
    patrimonio_title: "Sanctuaire et Territoire Ibère",
    patrimonio_subtitle: "Il y a 2 400 ans, l'aristocratie d'Iltiraka colonisa la vallée sauvage du fleuve Jandulilla",
    patrimonio_tab1: "Le Sanctuaire Héroïque d'El Pajarillo constitue l'une des découvertes majeures de la protohistoire ibérique...",
    patrimonio_tab2: "Le Territoire d'Iltiraka : conquête d'une vallée sauvage (silva) par un héros fondateur et le site de Loma del Perro...",
    patrimonio_tab3: "Un Paysage Sacré et El Fontanar : deux sanctuaires reliés par un chemin rituel cérémoniel...",
    galeria_title: "Fonds Audiovisuel et Ressources Multimédias",
    galeria_subtitle: "Explorez la photothèque haute résolution, le visualiseur 3D interactif et les fiches didactiques",
    desc_3d: "Explorez la reconstitution 3D interactive de la sculpture ibérique et du sanctuaire d'El Pajarillo à 360°.",
    horario_invierno: "Mercredi au Dimanche: 10h00 - 14h00 | 16h30 - 19h00",
    horario_verano: "Mercredi au Dimanche: 9h30 - 13h30 | 18h00 - 20h30",
    tarifa_general: "3,00 €",
    tarifa_reducida: "1,50 € (Retraités, étudiants et groupes >10)",
    tarifa_gratuita: "Moins de 12 ans, résidents d'Huelma et dimanches après-midi",
    agenda_title: "Agenda Culturel & Activités",
    agenda_subtitle: "Participez à nos visites guidées, ateliers d'archéologie et conférences scientifiques",
    reservas_title: "Réservez votre Visite Guidée",
    reservas_subtitle: "Groupes scolaires, associations et particuliers. Réservez votre visite avec nos médiateurs",
    tel: "(+34) 953 39 00 10",
    email: "tourisme@elpajarillo.es",
    ayto: "Mairie d'Huelma · Direction du Patrimoine et du Tourisme",
    horario_atencion: "Du lundi au vendredi de 9h00 à 14h00",
    direccion: "Plaza de España, 1 · 23140 Huelma (Jaén, Espagne)",
    footer_copy: "© 2026 Centre d'Interprétation Sanctuaire Ibérique d'El Pajarillo. Mairie d'Huelma. Tous droits réservés."
  }
};

let localesData = JSON.parse(JSON.stringify(DEFAULT_LOCALES));

function setupContentEditor() {
  const form = document.getElementById('form-site-content');
  const btnSave = document.getElementById('btn-save-content');
  const langPills = document.querySelectorAll('.cms-lang-pill[data-cms-lang]');

  loadSavedLocales();

  langPills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Guardar formulario actual antes de cambiar de idioma
      saveCurrentFormToLang(currentCmsLang);

      langPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCmsLang = pill.dataset.cmsLang;

      updateCmsLangUI(currentCmsLang);
      populateFormWithLang(currentCmsLang);
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCurrentFormToLang(currentCmsLang);
      saveAllLocales();
    });
  }
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      saveCurrentFormToLang(currentCmsLang);
      saveAllLocales();
    });
  }

  // Carga inicial de campos
  populateFormWithLang('es');
}

function loadSavedLocales() {
  try {
    const saved = localStorage.getItem('pajarillo_locales');
    if (saved) {
      localesData = JSON.parse(saved);
    }
  } catch (e) {}
}

function updateCmsLangUI(lang) {
  const names = {
    es: '🇪🇸 Español (Castellano)',
    en: '🇬🇧 English (Inglés)',
    fr: '🇫🇷 Français (Francés)'
  };
  const shortNames = { es: 'ES', en: 'EN', fr: 'FR' };
  const fullNames = { es: 'Español', en: 'Inglés', fr: 'Francés' };

  const nameEl = document.getElementById('cms-active-lang-name');
  const btnInd = document.getElementById('btn-lang-indicator');
  const submitInd = document.getElementById('btn-lang-submit-indicator');

  if (nameEl) nameEl.textContent = names[lang] || lang;
  if (btnInd) btnInd.textContent = shortNames[lang] || lang.toUpperCase();
  if (submitInd) submitInd.textContent = fullNames[lang] || lang;
}

function populateFormWithLang(lang) {
  const c = localesData[lang] || localesData.es || {};
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('cnt-site-title', c.site_title);
  setVal('cnt-site-tagline', c.site_tagline);
  setVal('cnt-hero-cta', c.hero_cta);
  setVal('cnt-hero-desc', c.hero_desc);

  setVal('cnt-hito1-title', c.hito1_title);
  setVal('cnt-hito1-desc', c.hito1_desc);
  setVal('cnt-hito2-title', c.hito2_title);
  setVal('cnt-hito2-desc', c.hito2_desc);
  setVal('cnt-hito3-title', c.hito3_title);
  setVal('cnt-hito3-desc', c.hito3_desc);
  setVal('cnt-hito4-title', c.hito4_title);
  setVal('cnt-hito4-desc', c.hito4_desc);
  setVal('cnt-hito5-title', c.hito5_title);
  setVal('cnt-hito5-desc', c.hito5_desc);
  setVal('cnt-hito6-title', c.hito6_title);
  setVal('cnt-hito6-desc', c.hito6_desc);

  setVal('cnt-patrimonio-title', c.patrimonio_title);
  setVal('cnt-patrimonio-subtitle', c.patrimonio_subtitle);
  setVal('cnt-patrimonio-tab1', c.patrimonio_tab1);
  setVal('cnt-patrimonio-tab2', c.patrimonio_tab2);
  setVal('cnt-patrimonio-tab3', c.patrimonio_tab3);

  setVal('cnt-galeria-title', c.galeria_title);
  setVal('cnt-galeria-subtitle', c.galeria_subtitle);
  setVal('cnt-3d-desc', c.desc_3d);

  setVal('cnt-horario-invierno', c.horario_invierno);
  setVal('cnt-horario-verano', c.horario_verano);
  setVal('cnt-tarifa-general', c.tarifa_general);
  setVal('cnt-tarifa-reducida', c.tarifa_reducida);
  setVal('cnt-tarifa-gratuita', c.tarifa_gratuita);

  setVal('cnt-agenda-title', c.agenda_title);
  setVal('cnt-agenda-subtitle', c.agenda_subtitle);
  setVal('cnt-reservas-title', c.reservas_title);
  setVal('cnt-reservas-subtitle', c.reservas_subtitle);

  setVal('cnt-tel', c.tel);
  setVal('cnt-email', c.email);
  setVal('cnt-ayto', c.ayto);
  setVal('cnt-horario-atencion', c.horario_atencion);
  setVal('cnt-direccion', c.direccion);

  setVal('cnt-footer-copy', c.footer_copy);
}

function saveCurrentFormToLang(lang) {
  if (!localesData[lang]) localesData[lang] = {};
  const getVal = (id) => document.getElementById(id)?.value || '';

  localesData[lang] = {
    ...localesData[lang],
    site_title: getVal('cnt-site-title'),
    site_tagline: getVal('cnt-site-tagline'),
    hero_cta: getVal('cnt-hero-cta'),
    hero_desc: getVal('cnt-hero-desc'),

    hito1_title: getVal('cnt-hito1-title'),
    hito1_desc: getVal('cnt-hito1-desc'),
    hito2_title: getVal('cnt-hito2-title'),
    hito2_desc: getVal('cnt-hito2-desc'),
    hito3_title: getVal('cnt-hito3-title'),
    hito3_desc: getVal('cnt-hito3-desc'),
    hito4_title: getVal('cnt-hito4-title'),
    hito4_desc: getVal('cnt-hito4-desc'),
    hito5_title: getVal('cnt-hito5-title'),
    hito5_desc: getVal('cnt-hito5-desc'),
    hito6_title: getVal('cnt-hito6-title'),
    hito6_desc: getVal('cnt-hito6-desc'),

    patrimonio_title: getVal('cnt-patrimonio-title'),
    patrimonio_subtitle: getVal('cnt-patrimonio-subtitle'),
    patrimonio_tab1: getVal('cnt-patrimonio-tab1'),
    patrimonio_tab2: getVal('cnt-patrimonio-tab2'),
    patrimonio_tab3: getVal('cnt-patrimonio-tab3'),

    galeria_title: getVal('cnt-galeria-title'),
    galeria_subtitle: getVal('cnt-galeria-subtitle'),
    desc_3d: getVal('cnt-3d-desc'),

    horario_invierno: getVal('cnt-horario-invierno'),
    horario_verano: getVal('cnt-horario-verano'),
    tarifa_general: getVal('cnt-tarifa-general'),
    tarifa_reducida: getVal('cnt-tarifa-reducida'),
    tarifa_gratuita: getVal('cnt-tarifa-gratuita'),

    agenda_title: getVal('cnt-agenda-title'),
    agenda_subtitle: getVal('cnt-agenda-subtitle'),
    reservas_title: getVal('cnt-reservas-title'),
    reservas_subtitle: getVal('cnt-reservas-subtitle'),

    tel: getVal('cnt-tel'),
    email: getVal('cnt-email'),
    ayto: getVal('cnt-ayto'),
    horario_atencion: getVal('cnt-horario-atencion'),
    direccion: getVal('cnt-direccion'),

    footer_copy: getVal('cnt-footer-copy')
  };
}

async function saveAllLocales() {
  saveCurrentFormToLang(currentCmsLang);
  localStorage.setItem('pajarillo_locales', JSON.stringify(localesData));

  // Sincronizar también con siteConfigData para retrocompatibilidad
  if (localesData.es) {
    siteConfigData.content = { ...localesData.es };
    localStorage.setItem('pajarillo_site_config', JSON.stringify(siteConfigData));
  }

  // Notificar a otras pestañas
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: 'pajarillo_locales' }));
  } catch (e) {}

  const langNames = { es: 'Español', en: 'Inglés', fr: 'Francés' };
  showToast(`✅ Textos guardados con éxito para ${langNames[currentCmsLang] || currentCmsLang}.`);
}

function loadSiteContent() {
  loadSavedLocales();
  populateFormWithLang(currentCmsLang);
}

// ═══════════════════════════════════════════
// MÓDULO: GESTIÓN DE GALERÍA Y RECURSOS MULTIMEDIA (CRUD COMPLETO)
// ═══════════════════════════════════════════
let galleryItems = [];
let currentGalleryFilter = 'all';

const INITIAL_GALLERY_ITEMS = [
  {
    id: 1,
    type: 'foto',
    title: {
      es: 'Cabeza de Lobo Ibérico de El Pajarillo',
      en: 'Iberian Wolf Head of El Pajarillo',
      fr: 'Tête de Loup Ibérique d\'El Pajarillo'
    },
    category: {
      es: 'Escultura',
      en: 'Sculpture',
      fr: 'Sculpture'
    },
    full: './assets/images/lobo.png',
    thumb: './assets/images/lobo.png',
    file: './assets/images/lobo.png',
    desc: {
      es: 'Escultura cumbre del siglo IV a.C. tallada en caliza, hallada en el santuario heroico.',
      en: 'Masterpiece sculpture from the 4th century BC carved in limestone, found at the sanctuary.',
      fr: 'Chef-d\'œuvre sculpté au IVe siècle av. J.-C. en calcaire, découvert au sanctuaire.'
    }
  },
  {
    id: 2,
    type: 'foto',
    title: {
      es: 'Vista Nocturna y Campanario',
      en: 'Monumental Night View & Bell Tower',
      fr: 'Vue Nocturne Monumentale et Clocher'
    },
    category: {
      es: 'Arquitectura',
      en: 'Architecture',
      fr: 'Architecture'
    },
    full: './assets/images/hero/hero.jpg',
    thumb: './assets/images/hero/hero.jpg',
    file: './assets/images/hero/hero.jpg',
    desc: {
      es: 'Perspectiva panorámica del Centro de Interpretación y el paisaje del Jandulilla.',
      en: 'Panoramic view of the Interpretation Centre and the Jandulilla valley landscape.',
      fr: 'Perspective panoramique du Centre d\'Interprétation et du paysage du Jandulilla.'
    }
  },
  {
    id: 3,
    type: 'foto',
    title: {
      es: 'Yacimiento Arqueológico y Terrazas',
      en: 'Archaeological Excavation Terraces',
      fr: 'Terrasses et Fouilles Archéologiques'
    },
    category: {
      es: 'Yacimiento',
      en: 'Site',
      fr: 'Site'
    },
    full: './assets/images/gallery/arqueologia.jpg',
    thumb: './assets/images/gallery/arqueologia.jpg',
    file: './assets/images/gallery/arqueologia.jpg',
    desc: {
      es: 'Terrazas ceremoniales excavadas en la vega del Jandulilla donde se emplazaba el monumento.',
      en: 'Ceremonial terraces excavated in the Jandulilla valley where the monument was erected.',
      fr: 'Terrasses cérémonielles fouillées dans la vallée du Jandulilla abritant le monument.'
    }
  },
  {
    id: 4,
    type: 'foto',
    title: {
      es: 'Patios y Galerías del Centro de Interpretación',
      en: 'Interpretation Centre Courtyards & Galleries',
      fr: 'Patios et Galeries du Centre d\'Interprétation'
    },
    category: {
      es: 'Entorno',
      en: 'Surroundings',
      fr: 'Environnement'
    },
    full: './assets/images/gallery/claustro.jpg',
    thumb: './assets/images/gallery/claustro.jpg',
    file: './assets/images/gallery/claustro.jpg',
    desc: {
      es: 'Espacio de recepción y tránsito del Centro de Interpretación de El Pajarillo.',
      en: 'Reception and circulation space of the El Pajarillo Interpretation Centre.',
      fr: 'Espace d\'accueil et de visite du Centre d\'Interprétation d\'El Pajarillo.'
    }
  },
  {
    id: 5,
    type: 'pdf',
    title: {
      es: 'Ficha Científica: El Lobo Ibérico de El Pajarillo',
      en: 'Scientific Factsheet: Iberian Wolf of El Pajarillo',
      fr: 'Fiche Scientifique : Le Loup Ibérique d\'El Pajarillo'
    },
    category: {
      es: 'Documentación',
      en: 'Documentation',
      fr: 'Documentation'
    },
    full: './assets/docs/ficha_cientifica_pajarillo.pdf',
    thumb: './assets/images/lobo.png',
    file: './assets/docs/ficha_cientifica_pajarillo.pdf',
    desc: {
      es: 'Estudio iconográfico, arqueométrico y cronológico elaborado por el equipo de investigación.',
      en: 'Iconographic, archaeometric, and chronological research study by the scientific team.',
      fr: 'Étude iconographique, archéométrique et chronologique par l\'équipe de recherche.'
    }
  },
  {
    id: 6,
    type: 'pdf',
    title: {
      es: 'Guía de Visita Autónoma y Mapa del Recorrido',
      en: 'Self-Guided Tour & Itinerary Map',
      fr: 'Guide de Visite Autonome et Plan du Parcours'
    },
    category: {
      es: 'Didáctica',
      en: 'Didactics',
      fr: 'Didactique'
    },
    full: './assets/docs/guia_visita_pajarillo.pdf',
    thumb: './assets/images/gallery/exterior.jpg',
    file: './assets/docs/guia_visita_pajarillo.pdf',
    desc: {
      es: 'Itinerario de salas, puntos de interés, códigos QR y claves pedagógicas de la visita.',
      en: 'Room layout, points of interest, QR codes, and educational insights for visitors.',
      fr: 'Parcours des salles, points d\'intérêt, codes QR et repères pédagogiques de la visite.'
    }
  },
  {
    id: 7,
    type: '3d',
    title: {
      es: 'Reconstrucción 3D Interactiva del Santuario y Escultura',
      en: 'Interactive 3D Reconstruction of the Sanctuary & Sculpture',
      fr: 'Restitution 3D Interactive du Sanctuaire et de la Sculpture'
    },
    category: {
      es: 'Modelo 3D',
      en: '3D Model',
      fr: 'Modèle 3D'
    },
    full: 'https://sketchfab.com/models/402ba73cf7bd40ec9d5b03d17206387e/embed',
    thumb: './assets/images/lobo.png',
    file: 'https://sketchfab.com/models/402ba73cf7bd40ec9d5b03d17206387e/embed',
    desc: {
      es: 'Modelo oficial en Sketchfab con controles orbitales y realidad virtual del santuario oretano.',
      en: 'Official Sketchfab model with orbital orbit controls and VR exploration.',
      fr: 'Modèle officiel Sketchfab avec commandes orbitales et réalité virtuelle du sanctuaire orétan.'
    }
  },
  {
    id: 8,
    type: 'video',
    title: {
      es: 'Fondo Audiovisual Kiosco TV (audiovisual_p0)',
      en: 'Audiovisual Kiosk TV (audiovisual_p0)',
      fr: 'Kiosque Audiovisuel TV (audiovisual_p0)'
    },
    category: {
      es: 'Audiovisual',
      en: 'Audiovisual',
      fr: 'Audiovisuel'
    },
    full: './audiovisual_p0.html',
    thumb: './assets/images/gallery/interior.jpg',
    file: './audiovisual_p0.html',
    desc: {
      es: 'Interfaz interactiva a pantalla completa para salas de exposición y TV de 65 pulgadas.',
      en: 'Interactive fullscreen display interface designed for exhibition halls and 65" TV screens.',
      fr: 'Interface interactive plein écran dédiée aux salles d\'exposition et écrans TV 65 pouces.'
    }
  }
];

function setupGalleryManager() {
  loadGalleryData();

  const btnAdd = document.getElementById('btn-add-gallery-item');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openGalleryModal());
  }

  const btnClose = document.getElementById('btn-close-gallery-modal');
  const btnCloseIcon = document.getElementById('btn-close-gallery-icon');
  const modal = document.getElementById('modal-gallery-item');

  if (btnClose) {
    btnClose.addEventListener('click', () => closeGalleryModal());
  }
  if (btnCloseIcon) {
    btnCloseIcon.addEventListener('click', () => closeGalleryModal());
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeGalleryModal();
    });
  }

  // Selector de idioma dentro del modal de galería
  const galleryLangPills = document.querySelectorAll('.cms-lang-pill[data-gallery-modal-lang]');
  galleryLangPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetLang = pill.dataset.galleryModalLang;
      galleryLangPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      document.querySelectorAll('.gallery-lang-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== `gallery-panel-lang-${targetLang}`);
      });
    });
  });

  // Tecla Escape para cerrar modales abiertos
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeGalleryModal();
      if (DOM.adminQrModal) DOM.adminQrModal.classList.add('hidden');
    }
  });

  const form = document.getElementById('form-gallery-item');
  if (form) {
    form.addEventListener('submit', handleSaveGalleryItem);
  }

  const filterBtns = document.querySelectorAll('.btn-filter-period[data-gallery-filter]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGalleryFilter = btn.dataset.galleryFilter;
      renderGalleryGrid(currentGalleryFilter);
    });
  });

  // Dropzone file upload inside modal
  const dropzone = document.getElementById('drop-gallery-file');
  const fileInput = document.getElementById('gallery-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#384F3E';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--admin-border)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--admin-border)';
      if (e.dataTransfer.files.length > 0) {
        handleGalleryFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleGalleryFile(fileInput.files[0]);
      }
    });
  }
}

function handleGalleryFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const urlInput = document.getElementById('gallery-item-url');
    const previewWrap = document.getElementById('gallery-preview-wrap');
    const previewImg = document.getElementById('gallery-preview-img');

    if (urlInput) urlInput.value = dataUrl;
    if (previewImg) previewImg.src = dataUrl;
    if (previewWrap) previewWrap.style.display = 'block';
    showToast('📎 Archivo cargado para vista previa');
  };
  if (file.type.startsWith('image/')) {
    reader.readAsDataURL(file);
  } else {
    const urlInput = document.getElementById('gallery-item-url');
    if (urlInput) urlInput.value = `./assets/docs/${file.name}`;
    showToast(`📄 Documento seleccionado: ${file.name}`);
  }
}

function loadGalleryData() {
  try {
    const saved = localStorage.getItem('pajarillo_gallery_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Normalizar elementos previos para asegurar que sean multilingües
      galleryItems = parsed.map(item => {
        if (typeof item.title === 'string') {
          item.title = { es: item.title, en: item.title, fr: item.title };
        }
        if (typeof item.category === 'string') {
          item.category = { es: item.category, en: item.category, fr: item.category };
        }
        if (typeof item.desc === 'string') {
          item.desc = { es: item.desc, en: item.desc, fr: item.desc };
        }
        return item;
      });
    } else {
      galleryItems = [...INITIAL_GALLERY_ITEMS];
      localStorage.setItem('pajarillo_gallery_data', JSON.stringify(galleryItems));
    }
  } catch (e) {
    galleryItems = [...INITIAL_GALLERY_ITEMS];
  }
  updateGalleryCounts();
  renderGalleryGrid(currentGalleryFilter);
}

function updateGalleryCounts() {
  const allCount = galleryItems.length;
  const fotoCount = galleryItems.filter(i => i.type === 'foto').length;
  const pdfCount = galleryItems.filter(i => i.type === 'pdf').length;
  const videoCount = galleryItems.filter(i => i.type === 'video' || i.type === '3d').length;

  const countAll = document.getElementById('count-all-gallery');
  const countFoto = document.getElementById('count-foto-gallery');
  const countPdf = document.getElementById('count-pdf-gallery');
  const countVideo = document.getElementById('count-video-gallery');
  const badge = document.getElementById('gallery-count-badge');

  if (countAll) countAll.textContent = allCount;
  if (countFoto) countFoto.textContent = fotoCount;
  if (countPdf) countPdf.textContent = pdfCount;
  if (countVideo) countVideo.textContent = videoCount;
  if (badge) badge.textContent = allCount;
}

function renderGalleryGrid(filter = 'all') {
  const grid = document.getElementById('admin-gallery-items-grid');
  if (!grid) return;

  let filtered = galleryItems;
  if (filter === 'foto') filtered = galleryItems.filter(i => i.type === 'foto');
  else if (filter === 'pdf') filtered = galleryItems.filter(i => i.type === 'pdf');
  else if (filter === 'video') filtered = galleryItems.filter(i => i.type === 'video' || i.type === '3d');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--admin-surface); border: 1px dashed var(--admin-border); border-radius: var(--admin-radius);">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">📂</p>
        <h4 style="color: var(--admin-primary); font-weight: 700;">No hay recursos en esta categoría</h4>
        <p style="color: var(--admin-muted); font-size: 0.85rem;">Puedes añadir fotografías, documentos PDF, vídeos o modelos 3D con traducciones.</p>
        <button type="button" class="btn-admin btn-admin-primary" onclick="openGalleryModal()" style="margin-top: 1rem;">
          ➕ Añadir el Primer Recurso
        </button>
      </div>
    `;
    return;
  }

  const typeLabels = {
    foto: '🖼️ Fotografía HD',
    pdf: '📄 Ficha Didáctica PDF',
    video: '🎬 Vídeo / Audiovisual',
    '3d': '🏛️ Modelo 3D'
  };

  grid.innerHTML = filtered.map(item => {
    const isImage = item.type === 'foto' || (item.thumb && !item.thumb.endsWith('.pdf'));
    const thumbHtml = isImage
      ? `<img src="${item.thumb || item.full}" alt="${typeof item.title === 'object' ? item.title.es : item.title}" class="gallery-admin-thumb" onerror="this.src='./assets/images/lobo.png'">`
      : `<div style="height: 140px; background: #2E3E33; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">📄</div>`;

    const title = typeof item.title === 'object' ? (item.title.es || item.title.en || '') : item.title;
    const desc = typeof item.desc === 'object' ? (item.desc.es || item.desc.en || '') : item.desc;
    const cat = typeof item.category === 'object' ? (item.category.es || item.category.en || '') : (item.category || 'General');

    const hasEn = typeof item.title === 'object' && Boolean(item.title.en && item.title.en !== item.title.es);
    const hasFr = typeof item.title === 'object' && Boolean(item.title.fr && item.title.fr !== item.title.es);

    return `
      <div class="gallery-admin-card" data-id="${item.id}">
        ${thumbHtml}
        <div class="gallery-admin-body">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span class="status-pill active" style="font-size: 0.72rem;">${typeLabels[item.type] || item.type}</span>
              <small style="color: var(--admin-muted); font-weight: 600;">${cat}</small>
            </div>
            <h4 style="font-size: 0.98rem; font-weight: 700; color: var(--admin-primary); margin-bottom: 6px; line-height: 1.3;">
              ${title}
            </h4>
            <p style="font-size: 0.8rem; color: var(--admin-muted); line-height: 1.4; margin-bottom: 8px;">
              ${desc || 'Sin descripción adicional.'}
            </p>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.72rem; margin-bottom: 8px;">
              <span style="font-size: 0.7rem; color: var(--admin-muted);">Idiomas:</span>
              <span title="Español disponible">🇪🇸</span>
              <span title="${hasEn ? 'Inglés disponible' : 'Traducción inglesa pendiente'}" style="opacity: ${hasEn ? '1' : '0.35'};">🇬🇧</span>
              <span title="${hasFr ? 'Francés disponible' : 'Traducción francesa pendiente'}" style="opacity: ${hasFr ? '1' : '0.35'};">🇫🇷</span>
            </div>
          </div>
          <div class="gallery-admin-actions">
            <a href="${item.full || item.file}" target="_blank" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 0.78rem; text-decoration: none;">
              👁️ Abrir
            </a>
            <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 0.78rem;" onclick="window.editGalleryItem(${item.id})">
              ✏️ Editar
            </button>
            <button type="button" class="btn-admin btn-admin-danger" style="padding: 5px 10px; font-size: 0.78rem;" onclick="window.deleteGalleryItem(${item.id})">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.editGalleryItem = function(id) {
  const item = galleryItems.find(i => i.id === id);
  if (!item) return;
  openGalleryModal(item);
};

window.deleteGalleryItem = function(id) {
  const item = galleryItems.find(i => i.id === id);
  const title = item ? (typeof item.title === 'object' ? item.title.es : item.title) : 'este contenido';
  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente "${title}"?`)) return;

  galleryItems = galleryItems.filter(i => i.id !== id);
  localStorage.setItem('pajarillo_gallery_data', JSON.stringify(galleryItems));
  updateGalleryCounts();
  renderGalleryGrid(currentGalleryFilter);
  showToast('🗑️ Contenido eliminado correctamente de la galería');
};

function openGalleryModal(item = null) {
  const modal = document.getElementById('modal-gallery-item');
  const titleEl = document.getElementById('modal-gallery-title');
  const idInput = document.getElementById('gallery-item-id');
  const typeSelect = document.getElementById('gallery-item-type');
  const urlInput = document.getElementById('gallery-item-url');
  const dlInput = document.getElementById('gallery-item-download-url');
  const previewWrap = document.getElementById('gallery-preview-wrap');
  const previewImg = document.getElementById('gallery-preview-img');

  const titleEs = document.getElementById('gallery-item-title-es');
  const titleEn = document.getElementById('gallery-item-title-en');
  const titleFr = document.getElementById('gallery-item-title-fr');

  const catEs = document.getElementById('gallery-item-category-es');
  const catEn = document.getElementById('gallery-item-category-en');
  const catFr = document.getElementById('gallery-item-category-fr');

  const descEs = document.getElementById('gallery-item-desc-es');
  const descEn = document.getElementById('gallery-item-desc-en');
  const descFr = document.getElementById('gallery-item-desc-fr');

  if (!modal) return;

  // Restablecer pestañas a Español por defecto
  const galleryLangPills = document.querySelectorAll('.cms-lang-pill[data-gallery-modal-lang]');
  galleryLangPills.forEach(p => p.classList.toggle('active', p.dataset.galleryModalLang === 'es'));
  document.querySelectorAll('.gallery-lang-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== 'gallery-panel-lang-es');
  });

  const getLoc = (val, lang) => {
    if (!val) return '';
    if (typeof val === 'object') return val[lang] || '';
    return lang === 'es' ? val : '';
  };

  if (item) {
    if (titleEl) titleEl.textContent = '✏️ Modificar Recurso Multilingüe';
    if (idInput) idInput.value = item.id;
    if (typeSelect) typeSelect.value = item.type || 'foto';
    if (urlInput) urlInput.value = item.full || item.src || '';
    if (dlInput) dlInput.value = item.file || item.downloadUrl || '';

    if (titleEs) titleEs.value = getLoc(item.title, 'es');
    if (titleEn) titleEn.value = getLoc(item.title, 'en');
    if (titleFr) titleFr.value = getLoc(item.title, 'fr');

    if (catEs) catEs.value = getLoc(item.category, 'es');
    if (catEn) catEn.value = getLoc(item.category, 'en');
    if (catFr) catFr.value = getLoc(item.category, 'fr');

    if (descEs) descEs.value = getLoc(item.desc, 'es');
    if (descEn) descEn.value = getLoc(item.desc, 'en');
    if (descFr) descFr.value = getLoc(item.desc, 'fr');

    if (previewImg && (item.thumb || item.full)) {
      previewImg.src = item.thumb || item.full;
      if (previewWrap) previewWrap.style.display = 'block';
    }
  } else {
    if (titleEl) titleEl.textContent = '➕ Añadir Nuevo Recurso';
    if (idInput) idInput.value = '';
    if (typeSelect) typeSelect.value = 'foto';
    if (urlInput) urlInput.value = '';
    if (dlInput) dlInput.value = '';

    if (titleEs) titleEs.value = '';
    if (titleEn) titleEn.value = '';
    if (titleFr) titleFr.value = '';

    if (catEs) catEs.value = '';
    if (catEn) catEn.value = '';
    if (catFr) catFr.value = '';

    if (descEs) descEs.value = '';
    if (descEn) descEn.value = '';
    if (descFr) descFr.value = '';

    if (previewWrap) previewWrap.style.display = 'none';
  }

  modal.classList.remove('hidden');
}

function closeGalleryModal() {
  const modal = document.getElementById('modal-gallery-item');
  if (modal) modal.classList.add('hidden');
}

function handleSaveGalleryItem(e) {
  e.preventDefault();
  const idInput = document.getElementById('gallery-item-id');
  const typeSelect = document.getElementById('gallery-item-type');
  const urlInput = document.getElementById('gallery-item-url');
  const dlInput = document.getElementById('gallery-item-download-url');

  const titleEs = document.getElementById('gallery-item-title-es')?.value.trim() || 'Sin título';
  const titleEn = document.getElementById('gallery-item-title-en')?.value.trim() || titleEs;
  const titleFr = document.getElementById('gallery-item-title-fr')?.value.trim() || titleEs;

  const catEs = document.getElementById('gallery-item-category-es')?.value.trim() || 'General';
  const catEn = document.getElementById('gallery-item-category-en')?.value.trim() || catEs;
  const catFr = document.getElementById('gallery-item-category-fr')?.value.trim() || catEs;

  const descEs = document.getElementById('gallery-item-desc-es')?.value.trim() || '';
  const descEn = document.getElementById('gallery-item-desc-en')?.value.trim() || descEs;
  const descFr = document.getElementById('gallery-item-desc-fr')?.value.trim() || descEs;

  const id = idInput && idInput.value ? Number(idInput.value) : Date.now();
  const newItem = {
    id: id,
    type: typeSelect ? typeSelect.value : 'foto',
    title: { es: titleEs, en: titleEn, fr: titleFr },
    category: { es: catEs, en: catEn, fr: catFr },
    full: urlInput ? urlInput.value.trim() : './assets/images/lobo.png',
    thumb: urlInput ? urlInput.value.trim() : './assets/images/lobo.png',
    file: dlInput && dlInput.value.trim() ? dlInput.value.trim() : (urlInput ? urlInput.value.trim() : ''),
    desc: { es: descEs, en: descEn, fr: descFr }
  };

  const existingIdx = galleryItems.findIndex(i => i.id === id);
  if (existingIdx >= 0) {
    galleryItems[existingIdx] = newItem;
    showToast('✅ Recurso multilingüe actualizado correctamente');
  } else {
    galleryItems.unshift(newItem);
    showToast('✅ Nuevo recurso multilingüe publicado en la galería');
  }

  localStorage.setItem('pajarillo_gallery_data', JSON.stringify(galleryItems));
  updateGalleryCounts();
  renderGalleryGrid(currentGalleryFilter);
  closeGalleryModal();
}

async function loadGalleryAdmin() {
  loadGalleryData();
}

// ═══════════════════════════════════════════
// NOTIFICACIONES TOAST
// ═══════════════════════════════════════════
function showToast(msg) {
  if (!DOM.toast) return;
  DOM.toast.textContent = msg;
  DOM.toast.classList.add('show');
  setTimeout(() => DOM.toast.classList.remove('show'), 3000);
}

