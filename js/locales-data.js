/**
 * Diccionarios base en memoria (ES / EN / FR)
 * Garantiza traducciones instantaneas, funcionamiento 100% offline y compatibilidad con protocolo file://
 */
export const DEFAULT_LOCALES = {
  es: {
  "lang": "es",
  "dir": "ltr",
  "brand": {
    "name": "Santuario Ibérico del Pajarillo",
    "subname": "Centro de Interpretación",
    "entity": "Centro de Interpretación Santuario Ibérico de “El Pajarillo”"
  },
  "nav": {
    "historia": "El Pajarillo",
    "puntos": "Recorrido",
    "galeria": "Galería",
    "horarios": "Horarios",
    "agenda": "Agenda",
    "contacto": "Contacto",
    "reservar": "Reservar Visita",
    "admin": "Acceso Gestión",
    "skip": "Saltar al contenido"
  },
  "hero": {
    "eyebrow": "",
    "title": "Centro de Interpretación Santuario Ibérico de “El Pajarillo”",
    "subtitle": "Descubre el legendario santuario monumental ibérico del Héroe y el Lobo, el dominio territorial de Iltiraka y el paisaje ritual del valle del río Jandulilla.",
    "cta_primary": "Planifica tu visita",
    "cta_secondary": "Explorar santuario y territorio",
    "scroll": "Descubrir más",
    "card_title": "Cabeza de Lobo",
    "card_sub": "Escultura ibérica en caliza · Siglo IV a.C.",
    "slide_lobo_title": "Cabeza de Lobo",
    "slide_lobo_sub": "Escultura ibérica en caliza · Siglo IV a.C.",
    "slide_leon_title": "León de El Pajarillo",
    "slide_leon_sub": "Fiera guardiana del santuario heroico",
    "slide_santuario_title": "Santuario Heroico",
    "slide_santuario_sub": "Reconstrucción volumétrica del monumento",
    "slide_yacimiento_title": "Yacimiento Arqueológico",
    "slide_yacimiento_sub": "Terrazas excavadas en el valle del Jandulilla",
    "slide_iltiraka_title": "Territorio de Iltiraka",
    "slide_iltiraka_sub": "Paisaje sagrado y oppidum protohistórico"
  },
  "historia": {
    "section_label": "",
    "title": "Santuario y Territorio Íbero",
    "subtitle": "Hace 2.400 años, la aristocracia de Iltiraka domesticó el valle salvaje del río Jandulilla",
    "tab_iberico": "Santuario Heroico",
    "tab_iltiraka": "Territorio de Iltiraka",
    "tab_fontanar": "Paisaje Sagrado y Ritual",
    "facil_badge": "Lectura Fácil",
    "iberico_content": {
      "title": "El Santuario Heroico de El Pajarillo (Siglo IV a.n.e.)",
      "body": "Ubicado estratégicamente sobre una loma dominante en el valle del río Jandulilla, el Santuario Ibérico de El Pajarillo constituye uno de los hallazgos arqueológicos más trascendentales de la protohistoria peninsular (c. 350 a.n.e.).\n\nEl monumento conmemorativo fue concebido como un gran escenario escalonado en tres terrazas de mampostería y sillares labrados para la apoteosis o heroización de un príncipe o aristócrata oretano. En su cima se alzaba el célebre conjunto escultórico que escenificaba el combate mítico entre un joven aristócrata y una fiera salvaje: la portentosa Cabeza de Lobo, escoltada por leones protectores y grifos alados, símbolo de poder, valor y trascendencia de la cultura ibérica.",
      "facil": "El Pajarillo es un yacimiento arqueológico en Huelma. Hace más de 2.300 años, los iberos construyeron aquí un lugar sagrado en memoria de un héroe. Las esculturas se descubrieron en el campo y hoy es un lugar protegido por la ley."
    },
    "iltiraka_content": {
      "title": "El Territorio de Iltiraka: Un valle que domesticar",
      "body": "Hace 2.400 años, a comienzos del siglo IV a.n.e., el oppidum de Iltiraka —Úbeda la Vieja— puso los ojos en este valle. Decidió apropiarse de un territorio salvaje: el valle del río Jandulilla.\n\nPara las gentes iberas, el valle del Jandulilla era territorio salvaje (silva): bosque profundo, dominio de lobos y seres fantásticos, un lugar donde el poder humano aún no llegaba. Eran territorios que querían incorporar y para ello hacía falta un héroe capaz de justificarlo.\n\nEl oppidum de Iltiraka desplegó un ambicioso proyecto de ocupación: estableció una población en la Loma del Perro (entre las actuales Úbeda y Jódar), controló las rutas que subían desde el sur y levantó, en la cabecera del río, un santuario en memoria de su héroe fundador: El Pajarillo. Así nació un territorio convertido en dominio de un linaje (pagus).",
      "facil": "Hace 2.400 años, la ciudad ibera de Iltiraka quiso dominar este valle salvaje. Para hacerlo suyo, honró a un héroe y le construyó un lugar sagrado: El Pajarillo."
    },
    "fontanar_content": {
      "title": "Un Paisaje Sagrado: El camino ritual y El Fontanar",
      "body": "Los estudios más recientes proponen que Iltiraka no solo tomó el valle: lo hizo sagrado. Junto al río Jandulilla levantó dos grandes lugares de culto: el santuario de El Pajarillo y el monumento de El Fontanar —con su escena de una unión divina, única en el mundo ibero—, enlazados por un camino ritual.\n\nRecorrerlo rememoraba el viaje del héroe fundador al mundo de los muertos, y todo el valle quedaba consagrado como territorio sagrado del linaje aristocrático.",
      "facil": "Los iberos unieron dos lugares sagrados junto al río con un camino especial. Al caminar por él, recordaban el viaje del héroe y bendecían toda la comarca."
    },
    "timeline": {
      "section_label": "",
      "title": "Hitos Cronológicos y Hallazgos Arqueológicos",
      "subtitle": "Desde la colonización ibérica de Iltiraka en el siglo IV a.n.e. hasta las excavaciones sistemáticas y la declaración como Bien de Interés Cultural.",
      "events": [
        {
          "year": "Siglos VI–V a.n.e.",
          "text": "Surgen los primeros oppida fortificados en el Alto Guadalquivir (Puente Tablas) y las esculturas de linajes heroicos (Cerrillo Blanco, Porcuna)."
        },
        {
          "year": "1ª mitad S. IV a.n.e.",
          "text": "El oppidum de Iltiraka coloniza el valle del Jandulilla y erige el Santuario Heroico de El Pajarillo y el conjunto escultórico del Lobo."
        },
        {
          "year": "2ª mitad S. IV a.n.e.",
          "text": "Crisis de las aristocracias clientelares ibéricas: el santuario de El Pajarillo es ritualmente amortizado, destruido y abandonado."
        },
        {
          "year": "1933",
          "text": "Aparece la primera escultura de un león ibérico durante las obras de la carretera que une Solera con la N-324."
        },
        {
          "year": "1993–1994",
          "text": "Hallazgo de un nuevo león y figura con falcata. Excavación de urgencia por Manuel Molinos, Arturo Ruiz, Teresa Chapa y Juan Pereira."
        },
        {
          "year": "2006 – Actualidad",
          "text": "Decreto 12/2006: Declaración de Bien de Interés Cultural (BIC) como Zona Arqueológica e inauguración del Centro de Interpretación."
        }
      ]
    }
  },
  "puntos": {
    "section_label": "",
    "title": "Recorrido y Puntos Clave",
    "subtitle": "Escanea los códigos QR situados en las salas y en el yacimiento para escuchar la audioguía y visualizar los modelos digitales.",
    "listen_audio": "Audioguía disponible",
    "view_qr": "Código QR",
    "tag_arquelogia": "Arqueología",
    "tag_escultura": "Escultura",
    "tag_arquitectura": "Arquitectura"
  },
  "horarios": {
    "section_label": "",
    "title": "Horarios, Acceso y Tarifas",
    "subtitle": "Todo lo necesario para organizar tu recorrido por el conjunto monumental y arqueológico.",
    "horarios_title": "Horarios de Apertura",
    "temporada_alta": "Horario de Verano (Jun–Sep)",
    "alta_dias": "Martes a Sábado: 10:00 – 14:00 h y 17:30 – 20:30 h",
    "alta_dom": "Domingos y festivos: 10:00 – 14:30 h",
    "temporada_baja": "Horario de Invierno (Oct–May)",
    "baja_dias": "Martes a Sábado: 10:00 – 14:00 h y 16:00 – 18:30 h",
    "baja_dom": "Domingos y festivos: 10:00 – 14:30 h",
    "lunes_cerrado": "Lunes cerrado por mantenimiento (excepto festivos)",
    "aviso_lunes": "⚠️ Lunes cerrado por mantenimiento (excepto festivos)",
    "tarifas_title": "Tarifas y Entradas",
    "tarifa_general": "Entrada General",
    "tarifa_general_desc": "Acceso al centro de interpretación y sala exposición temporal.",
    "tarifa_general_price": "3,00 €",
    "tarifa_reducida": "Tarifa Reducida",
    "tarifa_reducida_desc": "Jubilados, estudiantes, carné joven, familias numerosas y grupos > 15 pers.",
    "tarifa_reducida_price": "1,50 €",
    "tarifa_gratuita": "Entrada Gratuita",
    "tarifa_gratuita_desc": "Menores de 12 años, personas con discapacidad acreditada y empadronados.",
    "tarifa_gratuita_price": "0,00 €",
    "localizacion_title": "Cómo llegar",
    "direccion_label": "Dirección:",
    "direccion_val": "Calle Cárcel, 2 · 23560 Huelma (Jaén)",
    "parking_label": "Aparcamiento:",
    "parking_val": "Zona de aparcamiento gratuito para vehículos particulares y autobuses turísticos.",
    "accesibilidad_label": "Accesibilidad:",
    "accesibilidad_val": "Instalaciones accesibles para personas con movilidad reducida.",
    "abrir_mapa": "Abrir en Google Maps"
  },
  "agenda": {
    "section_label": "",
    "title": "Actividades y Eventos Programados",
    "subtitle": "Conoce los talleres didácticos, visitas teatralizadas y conferencias organizadas por el Ayuntamiento.",
    "filtro_todos": "Todas",
    "filtro_visitas": "Visitas Guiadas",
    "filtro_talleres": "Talleres Didácticos",
    "filtro_conferencias": "Conferencias / Cursos",
    "filtro_arqueologia": "Conferencias / Cursos",
    "plazas_disponibles": "Plazas disponibles",
    "precio_gratis": "Actividad Gratuita",
    "reservar_btn": "Solicitar plaza",
    "no_events": "No se encontraron actividades en esta categoría."
  },
  "galeria": {
    "section_label": "",
    "title": "Galería Multimedia y Recursos Digitales",
    "subtitle": "Fotografías de alta resolución, reconstrucciones volumétricas, audiovisuales y piezas digitalizadas.",
    "tab_fotos": "Fotografías",
    "tab_modelo3d": "Modelo 3D Interactivo",
    "tab_recursos": "Recursos Digitales",
    "tab_videos": "Audiovisuales",
    "empty_videos": "No hay audiovisuales configurados",
    "empty_videos_desc": "Actualmente no hay vídeos activos en esta sección. Puedes añadir o gestionar documentales desde el Panel de Administración.",
    "open_lightbox": "Ampliar imagen",
    "download_resource": "Descargar recurso informativo (PDF/Ficha)",
    "download_btn": "⬇ Descargar",
    "categories": {
      "Escultura": "Escultura",
      "Arquitectura": "Arquitectura",
      "Yacimiento": "Yacimiento",
      "Entorno": "Entorno",
      "Territorio": "Territorio",
      "Interior": "Interior",
      "Arte Sacro": "Arte Sacro"
    },
    "badges": {
      "Publicación Oficial": "Publicación Oficial",
      "Cartografía": "Cartografía",
      "Didáctica": "Didáctica"
    }
  },
  "reservas": {
    "section_label": "",
    "title": "Reserva Online para Visitas Guiadas",
    "subtitle": "Plataforma digital integrada para la gestión anticipada de visitas de particulares y grupos.",
    "badge_mvp": "SaaS MVP Integrado",
    "info_title": "Visitas Guiadas Oficiales",
    "info_desc": "Acompañado por mediadores culturales y arqueólogos, descubre los secretos del monumento íbero, el combate mítico de la Cabeza de Lobo y el territorio sagrado de Iltiraka.",
    "perk_1": "Acceso exclusivo a zonas restringidas del yacimiento",
    "perk_2": "Dispositivo o audioguía digital multilingüe incluido",
    "perk_3": "Grupos reducidos (máximo 25 personas por turno)",
    "perk_4": "Recorrido 100% adaptado a personas con movilidad reducida",
    "info_note": "Para visitas de centros educativos o grupos de más de 30 personas, contacta directamente con el área de turismo municipal.",
    "form_nombre": "Nombre completo",
    "form_email": "Correo electrónico",
    "form_telefono": "Teléfono de contacto",
    "form_fecha": "Fecha preferida",
    "form_hora": "Turno horario",
    "time_morning_1": "Mañana · 10:30 h",
    "time_morning_2": "Mañana · 12:00 h",
    "time_afternoon_1": "Tarde · 17:00 h",
    "time_afternoon_2": "Tarde · 18:30 h",
    "form_personas": "Número de visitantes",
    "form_idioma": "Idioma de la visita guiada",
    "form_notas": "Observaciones o necesidades de accesibilidad",
    "form_submit": "Solicitar Reserva de Visita",
    "success_title": "¡Solicitud registrada correctamente!",
    "success_desc": "El equipo del Centro de Interpretación confirmará tu reserva por correo electrónico en menos de 24 horas laborables."
  },
  "contacto": {
    "section_label": "",
    "title": "Contacto e Información Institucional",
    "subtitle": "¿Tienes alguna duda o deseas organizar una visita escolar o de investigación? Escríbenos.",
    "oficina_title": "Oficina de Turismo y Patrimonio",
    "form_asunto": "Asunto de la consulta",
    "form_mensaje": "Escribe tu mensaje...",
    "form_enviar": "Enviar Consulta",
    "alert_success": "Gracias por tu mensaje. El área de turismo te responderá a la brevedad.",
    "tel_label": "Teléfono de atención",
    "tel_val": "(+34) 953 39 00 10",
    "email_label": "Correo electrónico",
    "email_val": "turismo@aytohuelma.es",
    "ayto_label": "Gestión",
    "ayto_val": "Ayuntamiento de Huelma · Concejalía de Patrimonio y Turismo",
    "horario_atencion": "Horario de atención telefónica: Lunes a Viernes de 9:00 a 14:00 h"
  },
  "footer": {
    "about": "Centro de Interpretación Santuario Ibérico de “El Pajarillo”. Espacio patrimonial y arqueológico de referencia en Sierra Mágina, Jaén.",
    "links_title": "Navegación",
    "legal_title": "Legal y Calidad",
    "aviso": "Aviso Legal",
    "privacidad": "Política de Privacidad",
    "cookies": "Política de Cookies",
    "accesibilidad": "Declaración de Accesibilidad",
    "calidad": "Carta de Calidad y Servicios",
    "saas_title": "Plataforma SaaS",
    "saas_desc": "Panel de control municipal para la gestión de contenidos, eventos y analítica de visitantes.",
    "panel_enlace": "Acceso Plataforma de Gestión (Ayto)",
    "copy": "© 2026 Centro de Interpretación Santuario Ibérico de El Pajarillo. Ayuntamiento de Huelma. Todos los derechos reservados.",
    "cofinanciado": "Proyecto financiado para la digitalización y gestión del patrimonio cultural y turístico."
  },
  "qr_modal": {
    "title": "Código QR",
    "desc": "Escanea este código con tu dispositivo móvil o descárgalo para señalética.",
    "btn_download": "⬇ Descargar PNG",
    "btn_copy": "Copiar enlace",
    "btn_close": "Cerrar",
    "copied": "¡Enlace copiado al portapapeles!"
  },
  "analytics_banner": {
    "msg": "Utilizamos cookies analíticas estrictamente anónimas para mejorar la experiencia turística y medir el interés del conjunto monumental.",
    "accept": "Aceptar",
    "reject": "Rechazar",
    "info": "Más información"
  },
  "accessibility": {
    "btn_label": "Opciones de Accesibilidad",
    "tab_text": "Accesibilidad",
    "hide_tab": "Ocultar pestaña",
    "show_tab": "Mostrar pestaña",
    "title": "Herramientas de Accesibilidad",
    "subtitle": "Adapta la visualización y lectura del sitio a tus necesidades personales.",
    "compliance": "Conforme a WCAG 2.1 Nivel AA",
    "text_size": "Tamaño del Texto",
    "decrease_text": "Disminuir texto",
    "increase_text": "Aumentar texto",
    "reset_text": "Restablecer tamaño",
    "dyslexic_font": "Fuente para Dislexia",
    "dyslexic_desc": "Tipografía de alta legibilidad y espaciado optimizado",
    "high_contrast": "Alto Contraste",
    "high_contrast_desc": "Fondo negro con textos de máxima luminosidad",
    "invert_colors": "Invertir Colores",
    "invert_desc": "Inversión cromática respetando imágenes",
    "grayscale": "Escala de Grises",
    "grayscale_desc": "Elimina todos los tonos de color",
    "highlight_links": "Resaltar Enlaces",
    "highlight_links_desc": "Subrayado y contorno visible en botones y enlaces",
    "reading_guide": "Guía de Lectura",
    "reading_guide_desc": "Regla horizontal que acompaña al ratón",
    "big_cursor": "Cursor Grande",
    "big_cursor_desc": "Puntero aumentado para fácil localización",
    "stop_animations": "Pausar Animaciones",
    "stop_animations_desc": "Desactiva efectos visuales y movimientos continuos",
    "screen_reader": "Lector en Voz Alta (TTS)",
    "screen_reader_desc": "Haz clic en cualquier texto o selecciónalo para escucharlo",
    "reading_active": "Leyendo en voz alta...",
    "stop_reading": "Detener lectura",
    "reset_all": "Restablecer Ajustes",
    "reset_confirm": "Se han restablecido todos los ajustes de accesibilidad a los valores estándar.",
    "close": "Cerrar panel de accesibilidad"
  }
},
  en: {
  "lang": "en",
  "dir": "ltr",
  "brand": {
    "name": "Iberian Sanctuary of El Pajarillo",
    "subname": "Interpretation Centre",
    "entity": "Interpretation Centre of the Iberian Sanctuary of “El Pajarillo”"
  },
  "nav": {
    "historia": "El Pajarillo",
    "puntos": "Tour",
    "galeria": "Gallery",
    "horarios": "Hours",
    "agenda": "Agenda",
    "contacto": "Contact",
    "reservar": "Book Visit",
    "admin": "Admin Portal",
    "skip": "Skip to content"
  },
  "hero": {
    "eyebrow": "",
    "title": "Interpretation Centre of the Iberian Sanctuary of “El Pajarillo”",
    "subtitle": "Discover the legendary Iberian monumental sanctuary of the Hero and the Wolf, the territorial domain of Iltiraka, and the sacred landscape of the Jandulilla River Valley.",
    "cta_primary": "Plan Your Visit",
    "cta_secondary": "Explore Sanctuary & Territory",
    "scroll": "Explore more",
    "card_title": "The Wolf's Head",
    "card_sub": "Iberian limestone sculpture · 4th century BC",
    "slide_lobo_title": "The Wolf's Head",
    "slide_lobo_sub": "Iberian limestone sculpture · 4th century BC",
    "slide_leon_title": "Lion of El Pajarillo",
    "slide_leon_sub": "Guardian beast of the heroic sanctuary",
    "slide_santuario_title": "Heroic Sanctuary",
    "slide_santuario_sub": "Volumetric monument reconstruction",
    "slide_yacimiento_title": "Archaeological Site",
    "slide_yacimiento_sub": "Excavated terraces in Jandulilla valley",
    "slide_iltiraka_title": "Territory of Iltiraka",
    "slide_iltiraka_sub": "Sacred landscape and protohistoric oppidum"
  },
  "historia": {
    "section_label": "",
    "title": "Iberian Sanctuary & Territory",
    "subtitle": "2,400 years ago, the Iberian aristocracy of Iltiraka claimed the wild Jandulilla valley and raised a monumental heroic sanctuary in Huelma, Jaén.",
    "tab_iberico": "Heroic Sanctuary",
    "tab_iltiraka": "Territory of Iltiraka",
    "tab_fontanar": "Sacred Ritual Landscape",
    "facil_badge": "Easy Reading",
    "iberico_content": {
      "title": "The Heroic Sanctuary of El Pajarillo (4th Century BCE)",
      "body": "Strategically raised on a promontory overlooking the Jandulilla valley, the Sanctuary of El Pajarillo is one of the pinnacle monuments of Iberian protohistory (c. 350 BCE).\n\nConceived as a stepped ceremonial terrace across three platforms supported by ashlar stone walls, its summit hosted the heroic sculptural ensemble depicting the mythic struggle between a noble warrior and a wild beast: the monumental Wolf's Head, accompanied by protective lions and winged griffins, embodying power, valor, and aristocratic apotheosis.",
      "facil": "El Pajarillo is an archaeological site in Huelma. Over 2,300 years ago, the Iberians built a sacred place in memory of a hero. The stone sculptures were discovered in the fields and it is now protected by law."
    },
    "iltiraka_content": {
      "title": "The Territory of Iltiraka: A Valley to be Brought Under Control",
      "body": "2,400 years ago, at the beginning of the 4th century BCE, the oppidum of Iltiraka —Úbeda la Vieja— turned its attention to this valley. It decided to claim a wild territory: the valley of the Jandulilla River.\n\nFor the Iberian people, the Jandulilla Valley was a wild territory (silva): a deep forest, the domain of wolves and fantastic beings, a place where human power had not yet reached. These were territories they sought to incorporate, and for this, a hero was needed to legitimise the process.\n\nThe oppidum of Iltiraka had a project to establish new settlements. It established another settlement at Loma del Perro (between present-day Úbeda and Jódar), controlled the routes ascending from the south and, at the headwaters of the river, built a sanctuary in memory of its founding hero: El Pajarillo. Thus, a territory under the control of a lineage (pagus) was created.",
      "facil": "2,400 years ago, the Iberian city of Iltiraka wanted to master this wild valley. To make it their own, they honored a hero and built a sacred sanctuary: El Pajarillo."
    },
    "fontanar_content": {
      "title": "A Sacred Landscape: The Ritual Path & El Fontanar",
      "body": "Recent research suggests that Iltiraka did not just take the valley: it made it sacred. Beside the River Jandulilla it raised two places of worship: the sanctuary of El Pajarillo and the monument of El Fontanar —whose scene of a divine union is unique in the Iberian world—, linked by a ritual path.\n\nTo walk it was to relive the founding hero's journey to the land of the dead, and so the lineage's territory became sacred ground.",
      "facil": "The Iberians connected two sacred places along the river with a ceremonial path. Walking along it remembered the hero's journey and blessed the whole valley."
    },
    "timeline": {
      "section_label": "",
      "title": "Chronological Milestones & Archaeological Discoveries",
      "subtitle": "From Iberian colonization by Iltiraka (4th c. BCE) to the sculptural discoveries of 1933 and 1993, and excavations by the University of Jaén.",
      "events": [
        {
          "year": "6th–5th c. BCE",
          "text": "Emergence of fortified oppida in the Upper Guadalquivir (Puente Tablas) and stone lineage sculpture (Cerrillo Blanco, Porcuna)."
        },
        {
          "year": "Early 4th c. BCE",
          "text": "The oppidum of Iltiraka colonizes the Jandulilla valley and erects the Heroic Sanctuary of El Pajarillo and the Wolf monument."
        },
        {
          "year": "Late 4th c. BCE",
          "text": "Crisis of clientelist aristocracies: El Pajarillo is ritually decommissioned, demolished, and abandoned."
        },
        {
          "year": "1933",
          "text": "Discovery of the first Iberian lion sculpture during construction of the road between Solera and the N-324."
        },
        {
          "year": "1993–1994",
          "text": "Discovery of a second lion and a headless figure with falcata during farming work. Emergency excavations by the University of Jaén."
        },
        {
          "year": "2006 – Present",
          "text": "Official decree declaring the Cortijo del Pajarillo site an Asset of Cultural Interest (BIC) as an Archaeological Zone."
        }
      ]
    }
  },
  "puntos": {
    "section_label": "",
    "title": "Key Exhibition Points & Masterpieces",
    "subtitle": "Scan the on-site QR codes to access narrated audio guides and 3D digital artifacts.",
    "listen_audio": "Audio guide available",
    "view_qr": "QR Code",
    "tag_arquelogia": "Archaeology",
    "tag_escultura": "Sculpture",
    "tag_arquitectura": "Architecture"
  },
  "horarios": {
    "section_label": "",
    "title": "Opening Hours, Tickets and Location",
    "subtitle": "All essential information to prepare your visit comfortably.",
    "horarios_title": "Opening Hours",
    "temporada_alta": "Summer Season (Jun–Sep)",
    "temporada_baja": "Winter Season (Oct–May)",
    "cerrado": "Closed",
    "alta_dias": "Tuesday to Saturday: 10:00 AM – 2:00 PM & 5:30 PM – 8:30 PM",
    "alta_dom": "Sundays & Public Holidays: 10:00 AM – 2:30 PM",
    "baja_dias": "Tuesday to Saturday: 10:00 AM – 2:00 PM & 4:00 PM – 6:30 PM",
    "baja_dom": "Sundays & Public Holidays: 10:00 AM – 2:00 PM",
    "aviso_lunes": "⚠️ Closed on Mondays for preservation maintenance (except holidays)",
    "tarifas_title": "Admission Fees",
    "tarifa_general": "Standard Admission",
    "tarifa_general_price": "€3.00",
    "tarifa_general_desc": "Access to the interpretation centre and temporary exhibition hall.",
    "tarifa_reducida": "Reduced Admission",
    "tarifa_reducida_price": "€1.50",
    "tarifa_reducida_desc": "Seniors (65+), students under 25, groups of 10+ visitors.",
    "tarifa_gratuita": "Free Admission",
    "tarifa_gratuita_price": "€0.00",
    "tarifa_gratuita_desc": "Children under 12, visitors with certified disabilities, and local residents.",
    "localizacion_title": "How to Get Here",
    "direccion_label": "Address:",
    "direccion_val": "Calle Cárcel, 2 · 23560 Huelma (Jaén), Spain",
    "parking_label": "Parking:",
    "parking_val": "Free visitor parking available for passenger cars and tourist coaches.",
    "accesibilidad_label": "Accessibility:",
    "accesibilidad_val": "Fully accessible facilities and paths for visitors with reduced mobility.",
    "abrir_mapa": "Open in Google Maps"
  },
  "agenda": {
    "section_label": "",
    "title": "Scheduled Activities & Events",
    "subtitle": "Discover family workshops, specialized lectures, and guided dramatized tours.",
    "filtro_todos": "All Events",
    "filtro_visitas": "Guided Tours",
    "filtro_talleres": "Educational Workshops",
    "filtro_conferencias": "Conferences & Courses",
    "filtro_arqueologia": "Conferences & Courses",
    "plazas_disponibles": "places available",
    "precio_gratis": "Free Activity",
    "reservar_btn": "Request place",
    "no_events": "No activities scheduled for this category."
  },
  "galeria": {
    "section_label": "",
    "title": "Photo Archive & Digital Resources",
    "subtitle": "High-definition photography, 3D reconstructions, video guides, and downloadable research sheets.",
    "tab_fotos": "Photographs",
    "tab_modelo3d": "Interactive 3D Model",
    "tab_recursos": "Digital Resources",
    "tab_videos": "Audiovisuals",
    "empty_videos": "No audiovisual media configured",
    "empty_videos_desc": "There are currently no active videos in this section. You can add or manage documentaries from the Administration Panel.",
    "open_lightbox": "View full size",
    "download_resource": "Download resource (PDF / Fact Sheet)",
    "download_btn": "⬇ Download",
    "categories": {
      "Escultura": "Sculpture",
      "Arquitectura": "Architecture",
      "Yacimiento": "Archaeological Site",
      "Entorno": "Surroundings",
      "Territorio": "Territory",
      "Interior": "Interior",
      "Arte Sacro": "Sacred Art"
    },
    "badges": {
      "Publicación Oficial": "Official Publication",
      "Cartografía": "Cartography",
      "Didáctica": "Educational"
    }
  },
  "reservas": {
    "section_label": "",
    "title": "Online Guided Tour Reservations",
    "subtitle": "Digital management portal for individual visitors, academic groups, and travel agencies.",
    "badge_mvp": "Integrated SaaS MVP",
    "info_title": "Official Guided Tours",
    "info_desc": "Accompanied by cultural mediators and archaeologists, discover the secrets of the Iberian monument, the mythical struggle of the Wolf's Head, and the sacred territory of Iltiraka.",
    "perk_1": "Exclusive access to restricted areas of the archaeological site",
    "perk_2": "Multilingual digital audio guide or device included",
    "perk_3": "Small group sizes (maximum 25 visitors per session)",
    "perk_4": "100% accessible itinerary for visitors with reduced mobility",
    "info_note": "For educational institutions or groups of over 30 visitors, please contact the municipal tourism office directly.",
    "form_nombre": "Full name",
    "form_email": "Email address",
    "form_telefono": "Phone number",
    "form_fecha": "Preferred date",
    "form_hora": "Time slot",
    "time_morning_1": "Morning · 10:30 AM",
    "time_morning_2": "Morning · 12:00 PM",
    "time_afternoon_1": "Afternoon · 5:00 PM",
    "time_afternoon_2": "Afternoon · 6:30 PM",
    "form_personas": "Number of visitors",
    "form_idioma": "Tour language",
    "form_notas": "Special requests or accessibility needs",
    "form_submit": "Submit Tour Reservation",
    "success_title": "Reservation successfully received!",
    "success_desc": "Our team will confirm your booking via email within 24 working hours."
  },
  "contacto": {
    "section_label": "",
    "title": "Contact & Institutional Information",
    "subtitle": "Have questions or planning a specialized group visit? Get in touch with our curatorial team.",
    "oficina_title": "Tourism and Heritage Office",
    "form_asunto": "Inquiry subject",
    "form_mensaje": "Your message...",
    "form_enviar": "Send Message",
    "alert_success": "Thank you for your message. The tourism department will reply shortly.",
    "tel_label": "Phone inquiry",
    "tel_val": "(+34) 953 39 00 10",
    "email_label": "Email address",
    "email_val": "turismo@aytohuelma.es",
    "ayto_label": "Administration",
    "ayto_val": "Town Hall of Huelma · Department of Culture & Heritage",
    "horario_atencion": "Phone service: Monday to Friday, 9:00 AM – 2:00 PM CET"
  },
  "footer": {
    "about": "Interpretation Centre of the Iberian Sanctuary of El Pajarillo. Leading cultural and archaeological beacon in Sierra Mágina, Jaén.",
    "links_title": "Navigation",
    "legal_title": "Legal & Quality",
    "aviso": "Legal Notice",
    "privacidad": "Privacy Policy",
    "cookies": "Cookie Policy",
    "accesibilidad": "Accessibility Statement",
    "calidad": "Quality & Service Charter",
    "saas_title": "SaaS Platform",
    "saas_desc": "Municipal management dashboard for content, cultural events, and visitor analytics.",
    "panel_enlace": "Town Hall Management Portal",
    "copy": "© 2026 Interpretation Centre Santuario Ibérico de El Pajarillo. Ayuntamiento de Huelma. All rights reserved.",
    "cofinanciado": "Project funded for the digital modernization and sustainable management of regional cultural heritage."
  },
  "qr_modal": {
    "title": "QR Code",
    "desc": "Scan this code with your smartphone or download it for physical signage.",
    "btn_download": "⬇ Download PNG",
    "btn_copy": "Copy link",
    "btn_close": "Close",
    "copied": "Link copied to clipboard!"
  },
  "analytics_banner": {
    "msg": "We use anonymous analytical data to improve visitor experience and monitor exhibition popularity.",
    "accept": "Accept",
    "reject": "Reject",
    "info": "Learn more"
  },
  "accessibility": {
    "btn_label": "Accessibility Options",
    "tab_text": "Accessibility",
    "hide_tab": "Hide tab",
    "show_tab": "Show tab",
    "title": "Accessibility Tools",
    "subtitle": "Customize display and reading settings to suit your personal needs.",
    "compliance": "Compliant with WCAG 2.1 Level AA",
    "text_size": "Text Size",
    "decrease_text": "Decrease text",
    "increase_text": "Increase text",
    "reset_text": "Reset text size",
    "dyslexic_font": "Dyslexia-Friendly Font",
    "dyslexic_desc": "High legibility typeface with relaxed letter spacing",
    "high_contrast": "High Contrast",
    "high_contrast_desc": "Deep black background with sharp luminous text",
    "invert_colors": "Invert Colors",
    "invert_desc": "Chromatic inversion preserving image integrity",
    "grayscale": "Grayscale Mode",
    "grayscale_desc": "Removes all color saturation across the site",
    "highlight_links": "Highlight Links",
    "highlight_links_desc": "Continuous underlines and visible outlines on interactive elements",
    "reading_guide": "Reading Guide",
    "reading_guide_desc": "Horizontal guide bar following your cursor",
    "big_cursor": "Large Cursor",
    "big_cursor_desc": "Enlarged pointer for effortless on-screen location",
    "stop_animations": "Pause Animations",
    "stop_animations_desc": "Stops transitions, visual effects, and continuous motion",
    "screen_reader": "Read Aloud (Text-to-Speech)",
    "screen_reader_desc": "Click or highlight any text to listen aloud",
    "reading_active": "Reading aloud...",
    "stop_reading": "Stop reading",
    "reset_all": "Reset Settings",
    "reset_confirm": "All accessibility adjustments have been reset to default values.",
    "close": "Close accessibility panel"
  }
},
  fr: {
  "lang": "fr",
  "dir": "ltr",
  "brand": {
    "name": "Sanctuaire Ibérique d'El Pajarillo",
    "subname": "Centre d'Interprétation",
    "entity": "Centre d'Interprétation du Sanctuaire Ibérique d'« El Pajarillo »"
  },
  "nav": {
    "historia": "El Pajarillo",
    "puntos": "Parcours",
    "galeria": "Galerie",
    "horarios": "Horaires",
    "agenda": "Agenda",
    "contacto": "Contact",
    "reservar": "Réserver une Visite",
    "admin": "Espace Gestion",
    "skip": "Aller au contenu"
  },
  "hero": {
    "eyebrow": "",
    "title": "Centre d'Interprétation du Sanctuaire Ibérique d'« El Pajarillo »",
    "subtitle": "Découvrez le légendaire sanctuaire monumental ibérique du Héros et du Loup, le domaine territorial d'Iltiraka et le paysage rituel de la vallée du Jandulilla.",
    "cta_primary": "Planifiez votre visite",
    "cta_secondary": "Explorer le sanctuaire et le territoire",
    "scroll": "Découvrir plus",
    "card_title": "La Tête de Loup",
    "card_sub": "Sculpture ibérique en calcaire · IVe s. av. J.-C.",
    "slide_lobo_title": "La Tête de Loup",
    "slide_lobo_sub": "Sculpture ibérique en calcaire · IVe s. av. J.-C.",
    "slide_leon_title": "Lion d'El Pajarillo",
    "slide_leon_sub": "Fauve gardien du sanctuaire héroïque",
    "slide_santuario_title": "Sanctuaire Héroïque",
    "slide_santuario_sub": "Reconstitution volumétrique du monument",
    "slide_yacimiento_title": "Site Archéologique",
    "slide_yacimiento_sub": "Terrasses excavées dans la vallée du Jandulilla",
    "slide_iltiraka_title": "Territoire d'Iltiraka",
    "slide_iltiraka_sub": "Paysage sacré et oppidum protohistorique"
  },
  "historia": {
    "section_label": "",
    "title": "Sanctuaire et Territoire Ibère",
    "subtitle": "Il y a 2 400 ans, l'aristocratie ibère d'Iltiraka colonisa la vallée sauvage du fleuve Jandulilla et érigea un monumental sanctuaire héroïque à Huelma, Jaén.",
    "tab_iberico": "Sanctuaire Héroïque",
    "tab_iltiraka": "Territoire d'Iltiraka",
    "tab_fontanar": "Paysage Sacré et Rituel",
    "facil_badge": "Lecture Facile",
    "iberico_content": {
      "title": "Le Sanctuaire Héroïque d'El Pajarillo (IVe s. av. J.-C.)",
      "body": "Dominant la vallée du fleuve Jandulilla, le Sanctuaire Ibérique d'El Pajarillo compte parmi les découvertes archéologiques majeures de la protohistoire ibérique (vers 350 av. J.-C.).\n\nLe monument a été conçu comme une grande terrasse étagée sur trois niveaux de pierres de taille pour la commémoration ou l'apothéose d'un prince aristocrate ibère. À son sommet trônait le célèbre groupe sculptural illustrant le combat héroïque entre un jeune noble et un grand prédateur : la tête de loup en calcaire, flanquée de lions protecteurs et de griffons ailés, symbole de vaillance, d'honneur et d'héroïsation.",
      "facil": "El Pajarillo est un site archéologique situé à Huelma. Il y a plus de 2 300 ans, les Ibères y ont construit un lieu sacré en mémoire d'un héros. Les sculptures y ont été découvertes et le site est aujourd'hui protégé par la loi."
    },
    "iltiraka_content": {
      "title": "Le Territoire d'Iltiraka : Une vallée à conquérir",
      "body": "Il y a 2 400 ans, au début du IVe siècle avant notre ère, l'oppidum d'Iltiraka (Úbeda la Vieja) jeta son dévolu sur cette vallée. Il décida d'occuper un espace encore indompté : la vallée du Jandulilla.\n\nPour les Ibères, la vallée du Jandulilla était une terre sauvage (silva) : une forêt dense, domaine des loups et d'êtres mythiques, où l'autorité humaine ne s'exerçait pas encore. Pour s'approprier ces terres, il fallait invoquer la protection d'un héros légitime.\n\nL'oppidum d'Iltiraka organisa un plan de peuplement stratégique : création d'un établissement à Loma del Perro, contrôle des routes venant du sud, et édification à la source du fleuve d'un sanctuaire dédié au héros fondateur : El Pajarillo. C'est ainsi que naquit ce territoire placé sous le patronage d'un lignage noble (pagus).",
      "facil": "Il y a 2 400 ans, la cité ibère d'Iltiraka voulut maîtriser cette vallée sauvage. Pour en prendre possession, elle honora un héros et bâtit un lieu sacré : El Pajarillo."
    },
    "fontanar_content": {
      "title": "Un Paysage Sacré : Le chemin rituel et El Fontanar",
      "body": "Les recherches récentes révèlent qu'Iltiraka ne s'est pas contentée d'occuper la vallée : elle en a fait un espace sacré. Le long du Jandulilla, deux pôles cultuels ont été érigés : le sanctuaire d'El Pajarillo et le monument d'El Fontanar — remarquable par sa scène d'union divine, unique dans le monde ibère —, tous deux reliés par un chemin rituel.\n\nParcourir cette voie permettait de revivre le voyage initiatique du héros fondateur vers l'au-delà, sanctifiant ainsi l'ensemble du territoire sous l'autorité du lignage aristocratique.",
      "facil": "Les Ibères ont relié deux sanctuaires le long de la rivière par une route cérémonielle. En la parcourant, ils célébraient le héros et consacraient toute la région."
    },
    "timeline": {
      "section_label": "",
      "title": "Repères Chronologiques et Découvertes Archéologiques",
      "subtitle": "De la colonisation ibérique d'Iltiraka au IVe siècle av. J.-C. jusqu'aux fouilles systématiques et au classement au titre des Biens d'Intérêt Culturel.",
      "events": [
        {
          "year": "VIe–Ve s. av. J.-C.",
          "text": "Apparition des premiers oppida fortifiés dans le Haut Guadalquivir (Puente Tablas) et des sculptures héroïques (Cerrillo Blanco, Porcuna)."
        },
        {
          "year": "1ère moitié IVe s. av. J.-C.",
          "text": "L'oppidum d'Iltiraka colonise la vallée du Jandulilla et édifie le Sanctuaire Héroïque d'El Pajarillo et le monument au Loup."
        },
        {
          "year": "2e moitié IVe s. av. J.-C.",
          "text": "Crise des aristocraties ibériques : le sanctuaire d'El Pajarillo est rituellement condamné, détruit et abandonné."
        },
        {
          "year": "1933",
          "text": "Découverte de la première sculpture de lion ibérique lors des travaux de la route reliant Solera à la N-324."
        },
        {
          "year": "1993–1994",
          "text": "Découverte fortuite d'un second lion et d'un guerrier à la falcata. Fouilles d'urgence dirigées par l'Université de Jaén."
        },
        {
          "year": "2006 – Aujourd'hui",
          "text": "Décret officiel déclarant le site Bien d'Intérêt Culturel (BIC) en tant que Zone Archéologique et ouverture du Centre d'Interprétation."
        }
      ]
    }
  },
  "puntos": {
    "section_label": "",
    "title": "Points Clés et Œuvres Majeures",
    "subtitle": "Scannez les QR codes disséminés dans les salles et sur le site pour écouter l'audioguide et examiner les modèles 3D.",
    "listen_audio": "Audioguide disponible",
    "view_qr": "Code QR",
    "tag_arquelogia": "Archéologie",
    "tag_escultura": "Sculpture",
    "tag_arquitectura": "Architecture"
  },
  "horarios": {
    "section_label": "",
    "title": "Horaires, Tarifs et Accès",
    "subtitle": "Toutes les indications pratiques pour planifier votre découverte du monument.",
    "horarios_title": "Horaires d'Ouverture",
    "temporada_alta": "Saison d'Été (Juin–Sept)",
    "temporada_baja": "Saison d'Hiver (Oct–Mai)",
    "cerrado": "Fermé",
    "alta_dias": "Mardi au Samedi : 10h00 – 14h00 et 17h30 – 20h30",
    "alta_dom": "Dimanches et jours fériés : 10h00 – 14h30",
    "baja_dias": "Mardi au Samedi : 10h00 – 14h00 et 16h00 – 18h30",
    "baja_dom": "Dimanches et jours fériés : 10h00 – 14h00",
    "aviso_lunes": "⚠️ Fermé le lundi pour entretien et conservation (sauf fériés)",
    "tarifas_title": "Tarifs d'Entrée",
    "tarifa_general": "Tarif Général",
    "tarifa_general_price": "3,00 €",
    "tarifa_general_desc": "Accès au centre d'interprétation et à la salle d'exposition temporaire.",
    "tarifa_reducida": "Tarif Réduit",
    "tarifa_reducida_price": "1,50 €",
    "tarifa_reducida_desc": "Plus de 65 ans, étudiants de moins de 25 ans, groupes de plus de 10 personnes.",
    "tarifa_gratuita": "Entrée Gratuite",
    "tarifa_gratuita_price": "0,00 €",
    "tarifa_gratuita_desc": "Enfants de moins de 12 ans, personnes en situation de handicap et résidents locaux.",
    "localizacion_title": "Comment venir",
    "direccion_label": "Adresse :",
    "direccion_val": "Calle Cárcel, 2 · 23560 Huelma (Jaén), Espagne",
    "parking_label": "Stationnement :",
    "parking_val": "Parking gratuit aménagé pour véhicules légers et autocars de tourisme.",
    "accesibilidad_label": "Accessibilité :",
    "accesibilidad_val": "Installations et parcours accessibles aux personnes à mobilité réduite.",
    "abrir_mapa": "Ouvrir dans Google Maps"
  },
  "agenda": {
    "section_label": "",
    "title": "Activités et Événements Programmés",
    "subtitle": "Retrouvez les ateliers pédagogiques, visites guidées et cycles de conférences organisés par la municipalité.",
    "filtro_todos": "Toutes",
    "filtro_visitas": "Visites Guidées",
    "filtro_talleres": "Ateliers Pédagogiques",
    "filtro_conferencias": "Conférences & Cours",
    "filtro_arqueologia": "Conférences & Cours",
    "plazas_disponibles": "places disponibles",
    "precio_gratis": "Activité Gratuite",
    "reservar_btn": "Demander une place",
    "no_events": "Aucun événement prévu dans cette catégorie."
  },
  "galeria": {
    "section_label": "",
    "title": "Galerie Médias et Ressources Numériques",
    "subtitle": "Photographies haute résolution, restitutions en 3D, vidéos documentaires et fiches scientifiques.",
    "tab_fotos": "Photographies",
    "tab_modelo3d": "Modèle 3D Interactif",
    "tab_recursos": "Ressources Numériques",
    "tab_videos": "Audiovisuels",
    "empty_videos": "Aucun média audiovisuel configuré",
    "empty_videos_desc": "Il n'y a actuellement aucune vidéo active dans cette section. Vous pouvez ajouter ou gérer des documentaires depuis le Panneau d'Administration.",
    "open_lightbox": "Agrandir l'image",
    "download_resource": "Télécharger la ressource (PDF/Fiche)",
    "download_btn": "⬇ Télécharger",
    "categories": {
      "Escultura": "Sculpture",
      "Arquitectura": "Architecture",
      "Yacimiento": "Site Archéologique",
      "Entorno": "Environnement",
      "Territorio": "Territoire",
      "Interior": "Intérieur",
      "Arte Sacro": "Art Sacré"
    },
    "badges": {
      "Publicación Oficial": "Publication Officielle",
      "Cartografía": "Cartographie",
      "Didáctica": "Pédagogique"
    }
  },
  "reservas": {
    "section_label": "",
    "title": "Réservation en Ligne de Visites Guidées",
    "subtitle": "Outil numérique intégré pour la planification des visites individuelles, scolaires et de groupes.",
    "badge_mvp": "SaaS MVP Intégré",
    "info_title": "Visites Guidées Officielles",
    "info_desc": "Accompagné de médiateurs culturels et d'archéologues, percez les secrets du sanctuaire ibère, le combat héroïque du Héros et du Loup et le paysage sacré d'Iltiraka.",
    "perk_1": "Accès exclusif aux secteurs réservés du site archéologique",
    "perk_2": "Audioguide numérique multilingue inclus",
    "perk_3": "Petits groupes (maximum 25 participants par créneau)",
    "perk_4": "Parcours adapté à 100% aux personnes à mobilité réduite",
    "info_note": "Pour les groupes scolaires ou les délégations de plus de 30 personnes, veuillez contacter directement l'office de tourisme municipal.",
    "form_nombre": "Nom et prénom",
    "form_email": "Courriel",
    "form_telefono": "Numéro de téléphone",
    "form_fecha": "Date souhaitée",
    "form_hora": "Créneau horaire",
    "time_morning_1": "Matin · 10h30",
    "time_morning_2": "Matin · 12h00",
    "time_afternoon_1": "Après-midi · 17h00",
    "time_afternoon_2": "Après-midi · 18h30",
    "form_personas": "Nombre de personnes",
    "form_idioma": "Langue de la visite guidée",
    "form_notas": "Remarques ou besoins d'accessibilité",
    "form_submit": "Demander la Réservation",
    "success_title": "Demande enregistrée avec succès !",
    "success_desc": "Notre équipe municipale confirmera votre réservation par courriel sous 24 heures ouvrées."
  },
  "contacto": {
    "section_label": "",
    "title": "Contact et Renseignements",
    "subtitle": "Une question ou un projet de visite scolaire ? Contactez notre équipe de médiation culturelle.",
    "oficina_title": "Office du Tourisme et du Patrimoine",
    "form_asunto": "Objet du message",
    "form_mensaje": "Votre message...",
    "form_enviar": "Envoyer le Message",
    "alert_success": "Merci pour votre message. Le service tourisme vous répondra dans les meilleurs délais.",
    "tel_label": "Standard téléphonique",
    "tel_val": "(+34) 953 39 00 10",
    "email_label": "Courrier électronique",
    "email_val": "turismo@aytohuelma.es",
    "ayto_label": "Administration",
    "ayto_val": "Mairie de Huelma · Direction du Patrimoine et du Tourisme",
    "horario_atencion": "Accueil téléphonique : du lundi au vendredi de 9h00 à 14h00"
  },
  "footer": {
    "about": "Centre d'Interprétation du Sanctuaire Ibérique d'El Pajarillo. Référence patrimoniale et archéologique en Sierra Mágina, Jaén.",
    "links_title": "Navigation",
    "legal_title": "Légal et Qualité",
    "aviso": "Mentions Légales",
    "privacidad": "Politique de Confidentialité",
    "cookies": "Politique de Cookies",
    "accesibilidad": "Déclaration d'Accessibilité",
    "calidad": "Charte de Qualité et Services",
    "saas_title": "Plateforme SaaS",
    "saas_desc": "Tableau de bord municipal pour la gestion des contenus, des événements et de la fréquentation touristique.",
    "panel_enlace": "Accès Espace Gestion (Mairie)",
    "copy": "© 2026 Centre d'Interprétation Santuario Ibérico de El Pajarillo. Ayuntamiento de Huelma. Tous droits réservés.",
    "cofinanciado": "Projet financé pour la numérisation et la gestion durable du patrimoine culturel et touristique."
  },
  "qr_modal": {
    "title": "Code QR",
    "desc": "Scannez ce code avec votre smartphone ou téléchargez-le pour la signalétique.",
    "btn_download": "⬇ Télécharger en PNG",
    "btn_copy": "Copier le lien",
    "btn_close": "Fermer",
    "copied": "Lien copié dans le presse-papiers !"
  },
  "analytics_banner": {
    "msg": "Nous utilisons des cookies analytiques anonymes pour mesurer la fréquentation et enrichir votre visite.",
    "accept": "Accepter",
    "reject": "Refuser",
    "info": "En savoir plus"
  },
  "accessibility": {
    "btn_label": "Options d'Accessibilité",
    "tab_text": "Accessibilité",
    "hide_tab": "Masquer l'onglet",
    "show_tab": "Afficher l'onglet",
    "title": "Outils d'Accessibilité",
    "subtitle": "Personnalisez l'affichage et la lecture du site selon vos besoins personnels.",
    "compliance": "Conforme aux normes WCAG 2.1 Niveau AA",
    "text_size": "Taille du Texte",
    "decrease_text": "Diminuer le texte",
    "increase_text": "Augmenter le texte",
    "reset_text": "Réinitialiser la taille",
    "dyslexic_font": "Police pour Dyslexie",
    "dyslexic_desc": "Typographie haute lisibilité avec espacement élargi",
    "high_contrast": "Contraste Élevé",
    "high_contrast_desc": "Fond noir profond avec textes éclatants",
    "invert_colors": "Inverser les Couleurs",
    "invert_desc": "Inversion chromatique préservant les photos",
    "grayscale": "Nuances de Gris",
    "grayscale_desc": "Supprime toute saturation de couleur sur le site",
    "highlight_links": "Surligner les Liens",
    "highlight_links_desc": "Soulignement continu et contours visibles des éléments interactifs",
    "reading_guide": "Guide de Lecture",
    "reading_guide_desc": "Règle horizontale accompagnant votre curseur",
    "big_cursor": "Curseur Agrandit",
    "big_cursor_desc": "Pointeur élargi pour un repérage aisé à l'écran",
    "stop_animations": "Suspendre les Animations",
    "stop_animations_desc": "Désactive les effets visuels et mouvements continus",
    "screen_reader": "Lecture Vocale (TTS)",
    "screen_reader_desc": "Cliquez ou sélectionnez un texte pour l'écouter à voix haute",
    "reading_active": "Lecture en cours...",
    "stop_reading": "Arrêter la lecture",
    "reset_all": "Réinitialiser les Réglages",
    "reset_confirm": "Tous les paramètres d'accessibilité ont été rétablis par défaut.",
    "close": "Fermer le panneau d'accessibilité"
  }
}
};
