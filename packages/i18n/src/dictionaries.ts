// Flat key → string dictionaries. Keys are dotted for grouping but stored flat
// so TypeScript can validate completeness with a single union type.
//
// Adding a string: declare the key once in TranslationKey, add it to BOTH
// `en` and `es` below. TypeScript will surface missing translations.

export type LanguageCode = 'en' | 'es';

export type TranslationKey =
  | 'app.tagline'
  | 'nav.expeditions'
  | 'nav.map'
  | 'nav.track'
  | 'nav.profile'
  | 'nav.settings'
  | 'nav.signIn'
  | 'nav.signOut'
  | 'tab.feed'
  | 'tab.explore'
  | 'tab.map'
  | 'tab.track'
  | 'tab.profile'
  | 'tab.settings'
  | 'home.eyebrow'
  | 'home.heroTitle'
  | 'home.heroBody'
  | 'home.ctaBrowse'
  | 'home.ctaCreate'
  | 'home.featured'
  | 'home.featuredSub'
  | 'home.pillarTrackingTitle'
  | 'home.pillarTrackingBody'
  | 'home.pillarTierTitle'
  | 'home.pillarTierBody'
  | 'home.pillarCommunityTitle'
  | 'home.pillarCommunityBody'
  | 'home.pillarMonetizeTitle'
  | 'home.pillarMonetizeBody'
  | 'feed.title'
  | 'feed.subtitle'
  | 'feed.empty'
  | 'feed.loading'
  | 'feed.failed'
  | 'feed.allCategory'
  | 'feed.connectToColombia'
  | 'feed.featuredExpeditions'
  | 'cat.hiking'
  | 'cat.cycling'
  | 'cat.running'
  | 'cat.trekking'
  | 'cat.cultural'
  | 'cat.wildlife'
  | 'cat.other'
  | 'detail.back'
  | 'detail.comments'
  | 'detail.rateTitle'
  | 'detail.commentPlaceholder'
  | 'detail.post'
  | 'detail.reply'
  | 'detail.cancel'
  | 'detail.notRated'
  | 'stats.distance'
  | 'stats.elevation'
  | 'stats.difficulty'
  | 'stats.price'
  | 'stats.duration'
  | 'stats.activities'
  | 'stats.totalKm'
  | 'stats.totalElevation'
  | 'track.title'
  | 'track.subtitle'
  | 'track.start'
  | 'track.pause'
  | 'track.resume'
  | 'track.finish'
  | 'track.save'
  | 'track.discard'
  | 'track.titlePlaceholder'
  | 'track.notesPlaceholder'
  | 'track.savedSuccess'
  | 'track.statusReady'
  | 'track.statusRecording'
  | 'track.statusPaused'
  | 'track.statusEnded'
  | 'track.actType.hike'
  | 'track.actType.ride'
  | 'track.actType.run'
  | 'track.actType.walk'
  | 'profile.signInTitle'
  | 'profile.signInBody'
  | 'profile.recentActivities'
  | 'profile.emptyActivities'
  | 'profile.emptyActivitiesCta'
  | 'profile.signOut'
  | 'profile.tierProgress'
  | 'profile.tierToGo'
  | 'auth.welcomeBack'
  | 'auth.joinTitle'
  | 'auth.oauthNote'
  | 'auth.email'
  | 'auth.password'
  | 'auth.displayName'
  | 'auth.username'
  | 'auth.signIn'
  | 'auth.createAccount'
  | 'auth.switchToSignup'
  | 'auth.switchToSignin'
  | 'settings.title'
  | 'settings.theme'
  | 'settings.language'
  | 'settings.about'
  | 'settings.aboutBody'
  | 'settings.languageEn'
  | 'settings.languageEs'
  | 'explore.title'
  | 'explore.subtitle'
  | 'explore.categories'
  | 'map.title'
  | 'map.subtitle'
  | 'map.legendOfficial'
  | 'map.legendUser'
  | 'map.legendMyTrack'
  | 'map.loading'
  | 'map.nativeNotice'
  | 'empty.notFound'
  | 'empty.noExpeditions'
  | 'empty.couldNotLoad'
  | 'common.official'
  | 'common.free'
  | 'common.more';

export const en: Record<TranslationKey, string> = {
  'app.tagline': 'Every trail in Colombia, in one happy app.',
  'nav.expeditions': 'Expeditions',
  'nav.map': 'Map',
  'nav.track': 'Track',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',
  'tab.feed': 'Feed',
  'tab.explore': 'Explore',
  'tab.map': 'Map',
  'tab.track': 'Track',
  'tab.profile': 'Profile',
  'tab.settings': 'Settings',
  'home.eyebrow': 'CONNECT · TRACK · CELEBRATE',
  'home.heroTitle': 'Every trail in Colombia,\nin one happy app.',
  'home.heroBody':
    'Minga Expeditions turns your hikes, rides, and cultural visits into a shared journey. Track kilometers and climbs, earn tier badges, and discover expeditions from locals and the Minga team across Colombia.',
  'home.ctaBrowse': 'Browse expeditions',
  'home.ctaCreate': 'Create account',
  'home.featured': 'Start your next story',
  'home.featuredSub': 'FEATURED EXPEDITIONS',
  'home.pillarTrackingTitle': 'Real-time tracking',
  'home.pillarTrackingBody':
    'GPS-recorded hikes and rides, with elevation, pace, and route history — just like Strava.',
  'home.pillarTierTitle': 'Earn your tier',
  'home.pillarTierBody': 'Rack up kilometers to progress from Bronze to Diamond. Every trail counts.',
  'home.pillarCommunityTitle': 'Travel community',
  'home.pillarCommunityBody':
    'Comment threads, likes, and ratings on every expedition — local tips straight from travelers.',
  'home.pillarMonetizeTitle': 'Monetize your own',
  'home.pillarMonetizeBody': 'List your expedition, charge a small fee, and let Minga travelers discover it.',
  'feed.title': 'Expeditions',
  'feed.subtitle': 'Find an adventure — or start tracking your own.',
  'feed.empty': 'No expeditions in this category yet.',
  'feed.loading': 'Loading…',
  'feed.failed': 'Failed to load feed',
  'feed.allCategory': 'All',
  'feed.connectToColombia': 'Connect to Colombia',
  'feed.featuredExpeditions': 'Featured expeditions',
  'cat.hiking': 'Hiking',
  'cat.cycling': 'Cycling',
  'cat.running': 'Running',
  'cat.trekking': 'Trekking',
  'cat.cultural': 'Cultural',
  'cat.wildlife': 'Wildlife',
  'cat.other': 'Other',
  'detail.back': '← Back',
  'detail.comments': 'Comments',
  'detail.rateTitle': 'Rate this expedition',
  'detail.commentPlaceholder': 'Share a tip, question, or trip report…',
  'detail.post': 'Post',
  'detail.reply': 'Reply',
  'detail.cancel': 'Cancel',
  'detail.notRated': 'Not yet rated',
  'stats.distance': 'Distance',
  'stats.elevation': 'Elevation',
  'stats.difficulty': 'Difficulty',
  'stats.price': 'Price',
  'stats.duration': 'Duration',
  'stats.activities': 'Activities',
  'stats.totalKm': 'Total km',
  'stats.totalElevation': 'Elevation gained',
  'track.title': 'Track activity',
  'track.subtitle': 'Record a GPS-tracked hike, ride, run, or walk — Strava-style.',
  'track.start': 'Start',
  'track.pause': 'Pause',
  'track.resume': 'Resume',
  'track.finish': 'Finish',
  'track.save': 'Save activity',
  'track.discard': 'Discard',
  'track.titlePlaceholder': 'Title (e.g., Cerro Tusa · 8km loop)',
  'track.notesPlaceholder': 'Notes',
  'track.savedSuccess': 'Saved! See it on your profile.',
  'track.statusReady': 'Ready',
  'track.statusRecording': 'Recording',
  'track.statusPaused': 'Paused',
  'track.statusEnded': 'Finished',
  'track.actType.hike': 'Hike',
  'track.actType.ride': 'Ride',
  'track.actType.run': 'Run',
  'track.actType.walk': 'Walk',
  'profile.signInTitle': 'Sign in to see your profile',
  'profile.signInBody': 'Track expeditions, earn tiers, and follow friends.',
  'profile.recentActivities': 'Recent activities',
  'profile.emptyActivities': 'No activities yet. Start tracking →',
  'profile.emptyActivitiesCta': 'Start tracking',
  'profile.signOut': 'Sign out',
  'profile.tierProgress': 'Tier progress',
  'profile.tierToGo': 'more to reach',
  'auth.welcomeBack': 'Welcome back',
  'auth.joinTitle': 'Join the expedition',
  'auth.oauthNote': 'Google & Meta sign-in coming soon — email + password for now.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.displayName': 'Display name',
  'auth.username': 'Username',
  'auth.signIn': 'Sign in',
  'auth.createAccount': 'Create account',
  'auth.switchToSignup': 'No account? Create one',
  'auth.switchToSignin': 'Already a member? Sign in',
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.about': 'About',
  'settings.aboutBody':
    'Minga Expeditions · PoC build. Cross-platform mobile + web client for the Colombia traveler community.',
  'settings.languageEn': 'English',
  'settings.languageEs': 'Español',
  'explore.title': 'Explore',
  'explore.subtitle': 'Find expeditions by category',
  'explore.categories': 'Categories',
  'map.title': 'Map',
  'map.subtitle': 'Expeditions and your tracked activities across Colombia.',
  'map.legendOfficial': 'Minga official',
  'map.legendUser': 'Community',
  'map.legendMyTrack': 'Your tracks',
  'map.loading': 'Loading map…',
  'map.nativeNotice': 'Open Minga on the web to see the interactive map — native maps coming soon.',
  'empty.notFound': 'Expedition not found',
  'empty.noExpeditions': 'No expeditions yet',
  'empty.couldNotLoad': "Couldn't load feed",
  'common.official': 'MINGA OFFICIAL',
  'common.free': 'Free',
  'common.more': 'See all →',
};

export const es: Record<TranslationKey, string> = {
  'app.tagline': 'Todos los senderos de Colombia, en una sola app feliz.',
  'nav.expeditions': 'Expediciones',
  'nav.map': 'Mapa',
  'nav.track': 'Seguir',
  'nav.profile': 'Perfil',
  'nav.settings': 'Ajustes',
  'nav.signIn': 'Iniciar sesión',
  'nav.signOut': 'Cerrar sesión',
  'tab.feed': 'Inicio',
  'tab.explore': 'Explorar',
  'tab.map': 'Mapa',
  'tab.track': 'Seguir',
  'tab.profile': 'Perfil',
  'tab.settings': 'Ajustes',
  'home.eyebrow': 'CONECTA · REGISTRA · CELEBRA',
  'home.heroTitle': 'Todos los senderos de Colombia,\nen una sola app feliz.',
  'home.heroBody':
    'Minga Expeditions convierte tus caminatas, pedaleos y visitas culturales en un viaje compartido. Registra kilómetros y ascensos, gana insignias de categoría y descubre expediciones de locales y del equipo Minga por toda Colombia.',
  'home.ctaBrowse': 'Explorar expediciones',
  'home.ctaCreate': 'Crear cuenta',
  'home.featured': 'Empieza tu próxima historia',
  'home.featuredSub': 'EXPEDICIONES DESTACADAS',
  'home.pillarTrackingTitle': 'Seguimiento en tiempo real',
  'home.pillarTrackingBody':
    'Caminatas y rodadas registradas por GPS, con altimetría, ritmo e historial — igual que Strava.',
  'home.pillarTierTitle': 'Gana tu categoría',
  'home.pillarTierBody': 'Acumula kilómetros para subir de Bronce a Diamante. Cada ruta cuenta.',
  'home.pillarCommunityTitle': 'Comunidad viajera',
  'home.pillarCommunityBody':
    'Comentarios, reacciones y calificaciones en cada expedición — tips locales directo de los viajeros.',
  'home.pillarMonetizeTitle': 'Monetiza la tuya',
  'home.pillarMonetizeBody':
    'Publica tu expedición, cobra una tarifa pequeña y deja que los viajeros Minga la descubran.',
  'feed.title': 'Expediciones',
  'feed.subtitle': 'Encuentra una aventura — o empieza a registrar la tuya.',
  'feed.empty': 'Aún no hay expediciones en esta categoría.',
  'feed.loading': 'Cargando…',
  'feed.failed': 'No se pudo cargar el feed',
  'feed.allCategory': 'Todas',
  'feed.connectToColombia': 'Conéctate con Colombia',
  'feed.featuredExpeditions': 'Expediciones destacadas',
  'cat.hiking': 'Caminata',
  'cat.cycling': 'Ciclismo',
  'cat.running': 'Trail running',
  'cat.trekking': 'Trekking',
  'cat.cultural': 'Cultural',
  'cat.wildlife': 'Fauna',
  'cat.other': 'Otra',
  'detail.back': '← Volver',
  'detail.comments': 'Comentarios',
  'detail.rateTitle': 'Califica esta expedición',
  'detail.commentPlaceholder': 'Comparte un consejo, pregunta o reporte…',
  'detail.post': 'Publicar',
  'detail.reply': 'Responder',
  'detail.cancel': 'Cancelar',
  'detail.notRated': 'Aún sin calificar',
  'stats.distance': 'Distancia',
  'stats.elevation': 'Desnivel',
  'stats.difficulty': 'Dificultad',
  'stats.price': 'Precio',
  'stats.duration': 'Duración',
  'stats.activities': 'Actividades',
  'stats.totalKm': 'Km totales',
  'stats.totalElevation': 'Desnivel acumulado',
  'track.title': 'Registrar actividad',
  'track.subtitle': 'Graba una caminata, rodada, trote o paseo con GPS — estilo Strava.',
  'track.start': 'Iniciar',
  'track.pause': 'Pausar',
  'track.resume': 'Reanudar',
  'track.finish': 'Terminar',
  'track.save': 'Guardar actividad',
  'track.discard': 'Descartar',
  'track.titlePlaceholder': 'Título (p. ej., Cerro Tusa · 8km)',
  'track.notesPlaceholder': 'Notas',
  'track.savedSuccess': '¡Guardado! Mira tu perfil.',
  'track.statusReady': 'Listo',
  'track.statusRecording': 'Grabando',
  'track.statusPaused': 'En pausa',
  'track.statusEnded': 'Terminado',
  'track.actType.hike': 'Caminata',
  'track.actType.ride': 'Rodada',
  'track.actType.run': 'Trote',
  'track.actType.walk': 'Paseo',
  'profile.signInTitle': 'Inicia sesión para ver tu perfil',
  'profile.signInBody': 'Registra expediciones, gana categorías y sigue a amigos.',
  'profile.recentActivities': 'Actividades recientes',
  'profile.emptyActivities': 'Aún no hay actividades. Empieza a registrar →',
  'profile.emptyActivitiesCta': 'Empezar a registrar',
  'profile.signOut': 'Cerrar sesión',
  'profile.tierProgress': 'Progreso de categoría',
  'profile.tierToGo': 'más para alcanzar',
  'auth.welcomeBack': 'Bienvenido de nuevo',
  'auth.joinTitle': 'Únete a la expedición',
  'auth.oauthNote': 'Inicio con Google y Meta en camino — por ahora correo + contraseña.',
  'auth.email': 'Correo',
  'auth.password': 'Contraseña',
  'auth.displayName': 'Nombre visible',
  'auth.username': 'Usuario',
  'auth.signIn': 'Iniciar sesión',
  'auth.createAccount': 'Crear cuenta',
  'auth.switchToSignup': '¿Sin cuenta? Crea una',
  'auth.switchToSignin': '¿Ya tienes cuenta? Inicia sesión',
  'settings.title': 'Ajustes',
  'settings.theme': 'Tema',
  'settings.language': 'Idioma',
  'settings.about': 'Acerca de',
  'settings.aboutBody':
    'Minga Expeditions · build PoC. Cliente multiplataforma móvil + web para la comunidad viajera en Colombia.',
  'settings.languageEn': 'English',
  'settings.languageEs': 'Español',
  'explore.title': 'Explorar',
  'explore.subtitle': 'Busca expediciones por categoría',
  'explore.categories': 'Categorías',
  'map.title': 'Mapa',
  'map.subtitle': 'Expediciones y tus actividades registradas en toda Colombia.',
  'map.legendOfficial': 'Oficial de Minga',
  'map.legendUser': 'Comunidad',
  'map.legendMyTrack': 'Tus rutas',
  'map.loading': 'Cargando el mapa…',
  'map.nativeNotice': 'Abre Minga en la web para ver el mapa interactivo — mapa nativo próximamente.',
  'empty.notFound': 'Expedición no encontrada',
  'empty.noExpeditions': 'Aún no hay expediciones',
  'empty.couldNotLoad': 'No se pudo cargar el feed',
  'common.official': 'OFICIAL DE MINGA',
  'common.free': 'Gratis',
  'common.more': 'Ver todo →',
};

export const dictionaries: Record<LanguageCode, Record<TranslationKey, string>> = { en, es };

export const defaultLanguage: LanguageCode = 'es'; // App is for Colombian travelers — default to Spanish.
