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
  | 'track.titleLabel'
  | 'track.titlePlaceholder'
  | 'track.notesLabel'
  | 'track.notesPlaceholder'
  | 'detail.signInToRate'
  | 'detail.signInToComment'
  | 'detail.signInToLike'
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
  | 'common.more'
  | 'common.back'
  | 'common.allExpeditions'
  | 'common.signInToLike'
  | 'common.signInToRate'
  | 'common.signInToComment'
  | 'common.loadError'
  | 'common.and'
  | 'common.expeditionCount'
  | 'common.expeditionCountOne'
  | 'tier.bronze'
  | 'tier.silver'
  | 'tier.gold'
  | 'tier.diamond'
  | 'tier.maxTier'
  | 'tier.thresholdSuffix'
  | 'detail.avgRating'
  | 'detail.avgSuffix'
  | 'detail.replyPlaceholder'
  | 'detail.postReply'
  | 'feed.pace'
  | 'footer.aboutHeading'
  | 'footer.aboutBody'
  | 'footer.exploreHeading'
  | 'footer.exploreBody'
  | 'footer.pocHeading'
  | 'footer.pocBody'
  | 'home.pillarsHeading'
  | 'auth.demoHeading'
  | 'auth.demoBody'
  | 'profile.avatarAlt'
  | 'map.official'
  | 'detail.photoBy'
  | 'settings.fontSize'
  | 'settings.fontSizeSm'
  | 'settings.fontSizeMd'
  | 'settings.fontSizeLg'
  | 'settings.fontSizeXl'
  | 'activity.detailBack'
  | 'activity.commentsHeading'
  | 'activity.commentPlaceholder'
  | 'activity.rateHeading'
  | 'activity.openExpedition'
  | 'activity.noLinkedExpedition'
  | 'activity.notFound'
  | 'activity.share'
  | 'activity.shareCaption'
  | 'activity.photosHeading'
  | 'activity.addPhoto'
  | 'activity.noPhotos'
  | 'profile.connectedAccounts'
  | 'profile.emailLabel'
  | 'profile.signInMethodLabel'
  | 'profile.signInMethodEmailPassword'
  | 'profile.signInMethodGuest'
  | 'profile.whatsappLabel'
  | 'profile.whatsappHelp'
  | 'profile.phoneSaving'
  | 'profile.phoneSaved'
  | 'profile.phoneRetry'
  | 'profile.phoneSave'
  | 'profile.instagramLabel'
  | 'profile.instagramHelp'
  | 'profile.instagramPlaceholder'
  | 'profile.instagramInvalid'
  | 'profile.instagramOpen'
  | 'profile.displayNameLabel'
  | 'profile.displayNameHelp'
  | 'profile.changePhoto'
  | 'profile.uploadingPhoto'
  | 'profile.uploadFailed'
  | 'settings.theme.livehappy.title'
  | 'settings.theme.livehappy.subtitle'
  | 'settings.theme.mingaGreen.title'
  | 'settings.theme.mingaGreen.subtitle'
  | 'settings.theme.midnight.title'
  | 'settings.theme.midnight.subtitle'
  | 'track.linkedTo'
  | 'track.independent'
  | 'track.terrain'
  | 'track.elevShort'
  | 'track.avgSpeedShort'
  | 'track.terrain.mountain'
  | 'track.terrain.flat'
  | 'track.terrain.desert'
  | 'track.terrain.river'
  | 'track.terrain.forest'
  | 'track.terrain.coast'
  | 'track.terrain.urban'
  | 'track.terrain.jungle'
  | 'track.terrain.snow'
  | 'salida.next'
  | 'salida.scheduleTba'
  | 'salida.upcomingHeading'
  | 'salida.book'
  | 'salida.soldOut'
  | 'salida.seatsRemaining'
  | 'salida.openCapacity'
  | 'salida.empty'
  | 'cal.title'
  | 'cal.subtitle'
  | 'cal.prev'
  | 'cal.next'
  | 'cal.today'
  | 'cal.empty'
  | 'cal.filters.category'
  | 'cal.filters.region'
  | 'cal.filters.difficulty'
  | 'cal.filters.price'
  | 'cal.filters.all'
  | 'cal.filters.free'
  | 'cal.filters.paid'
  | 'cal.filters.reset'
  | 'nav.calendar'
  | 'tab.calendar'
  | 'activity.shareStory'
  | 'activity.shareDownload'
  | 'activity.shareFallback'
  | 'activity.sharePreparing'
  | 'activity.shareTitle'
  | 'activity.shareUnavailable'
  | 'completion.title'
  | 'completion.subtitle'
  | 'completion.levelUpTitle'
  | 'completion.levelUpBody'
  | 'completion.statsHeading'
  | 'completion.distance'
  | 'completion.elevation'
  | 'completion.duration'
  | 'completion.activities'
  | 'completion.reviewExpedition'
  | 'completion.reviewPlaceholder'
  | 'completion.dismiss'
  | 'completion.submit'
  | 'completion.thanks';

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
  'track.titleLabel': 'Title',
  'track.titlePlaceholder': 'Title (e.g., Cerro Tusa · 8km loop)',
  'track.notesLabel': 'Notes',
  'track.notesPlaceholder': 'How did it go?',
  'detail.signInToRate': 'Sign in to rate this expedition.',
  'detail.signInToComment': 'Sign in to leave a comment.',
  'detail.signInToLike': 'Sign in to like expeditions.',
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
  'common.back': '← Back',
  'common.allExpeditions': 'All expeditions',
  'common.signInToLike': 'Sign in to like',
  'common.signInToRate': 'Sign in to rate',
  'common.signInToComment': 'Sign in to comment',
  'common.loadError': 'Something went wrong',
  'common.and': 'and',
  'common.expeditionCount': 'expeditions',
  'common.expeditionCountOne': 'expedition',
  'tier.bronze': 'BRONZE',
  'tier.silver': 'SILVER',
  'tier.gold': 'GOLD',
  'tier.diamond': 'DIAMOND',
  'tier.maxTier': 'MAX TIER',
  'tier.thresholdSuffix': 'threshold',
  'detail.avgRating': 'avg',
  'detail.avgSuffix': '',
  'detail.replyPlaceholder': 'Write a reply…',
  'detail.postReply': 'Post reply',
  'feed.pace': 'Pace',
  'footer.aboutHeading': 'Minga Expeditions',
  'footer.aboutBody': "Connecting travelers to Colombia's trails, rivers, and pueblos.",
  'footer.exploreHeading': 'Explore',
  'footer.exploreBody': 'Hiking · Cycling · Trekking · Wildlife · Cultural',
  'footer.pocHeading': 'About',
  'footer.pocBody': 'Proof-of-concept build · 2026',
  'home.pillarsHeading': 'Pillars',
  'auth.demoHeading': 'Demo accounts',
  'auth.demoBody':
    'Create any email to try the app. The seed includes demo authors (juliana, andres, carolina, lucas) whose expeditions appear in the feed without needing to log in.',
  'profile.avatarAlt': 'Avatar',
  'map.official': 'MINGA OFFICIAL',
  'detail.photoBy': 'Photo',
  'settings.fontSize': 'Text size',
  'settings.fontSizeSm': 'Small',
  'settings.fontSizeMd': 'Normal',
  'settings.fontSizeLg': 'Large',
  'settings.fontSizeXl': 'Extra large',
  'activity.detailBack': '← Back',
  'activity.commentsHeading': 'Your notes',
  'activity.commentPlaceholder': 'Log a thought about this outing…',
  'activity.rateHeading': 'How was it?',
  'activity.openExpedition': 'Open the expedition',
  'activity.noLinkedExpedition': 'No linked expedition.',
  'activity.notFound': 'Activity not found',
  'activity.share': 'Share',
  'activity.shareCaption': 'Just finished {title} on Minga Expeditions 🌄',
  'activity.photosHeading': 'Photos',
  'activity.addPhoto': 'Add photo',
  'activity.noPhotos': 'No photos yet — add some from your camera roll.',
  'profile.connectedAccounts': 'Connected accounts',
  'profile.emailLabel': 'Email',
  'profile.signInMethodLabel': 'Sign-in method',
  'profile.signInMethodEmailPassword': 'Email + password',
  'profile.signInMethodGuest': 'Guest session',
  'profile.whatsappLabel': 'WhatsApp',
  'profile.whatsappHelp': 'Used to send booking confirmations and trip reminders.',
  'profile.phoneSaving': 'Saving…',
  'profile.phoneSaved': 'Saved ✓',
  'profile.phoneRetry': 'Retry',
  'profile.phoneSave': 'Save',
  'profile.instagramLabel': 'Instagram',
  'profile.instagramHelp': 'We tag you in trip recap posts and share-cards.',
  'profile.instagramPlaceholder': 'yourhandle',
  'profile.instagramInvalid': 'Use 1–30 letters, numbers, dots, or underscores.',
  'profile.instagramOpen': 'View on Instagram',
  'profile.displayNameLabel': 'Display name',
  'profile.displayNameHelp': 'How other travelers see you. Your @username stays the same.',
  'profile.changePhoto': 'Change photo',
  'profile.uploadingPhoto': 'Uploading…',
  'profile.uploadFailed': 'Upload failed. Try again.',
  'settings.theme.livehappy.title': 'Live Happy',
  'settings.theme.livehappy.subtitle': 'Bright orange · inspired by livehappy.com',
  'settings.theme.mingaGreen.title': 'Minga Green',
  'settings.theme.mingaGreen.subtitle': 'Outdoorsy forest palette',
  'settings.theme.midnight.title': 'Midnight',
  'settings.theme.midnight.subtitle': 'Dark mode for late rides',
  'track.linkedTo': 'Linked to',
  'track.independent': 'Independent',
  'track.terrain': 'Terrain',
  'track.elevShort': 'elev m',
  'track.avgSpeedShort': 'avg km/h',
  'track.terrain.mountain': 'Mountain',
  'track.terrain.flat': 'Flat',
  'track.terrain.desert': 'Desert',
  'track.terrain.river': 'River',
  'track.terrain.forest': 'Forest',
  'track.terrain.coast': 'Coast',
  'track.terrain.urban': 'Urban',
  'track.terrain.jungle': 'Jungle',
  'track.terrain.snow': 'Snow',
  'salida.next': 'Next departure',
  'salida.scheduleTba': 'Schedule TBA',
  'salida.upcomingHeading': 'Upcoming departures',
  'salida.book': 'Book this date',
  'salida.soldOut': 'Sold out',
  'salida.seatsRemaining': '{n} seats left',
  'salida.openCapacity': 'Open capacity',
  'salida.empty': 'No upcoming departures yet — check back soon.',
  'cal.title': 'Calendar',
  'cal.subtitle': 'See every scheduled departure and filter by what you’re into.',
  'cal.prev': '← Prev',
  'cal.next': 'Next →',
  'cal.today': 'Today',
  'cal.empty': 'No departures match these filters.',
  'cal.filters.category': 'Category',
  'cal.filters.region': 'Region',
  'cal.filters.difficulty': 'Difficulty',
  'cal.filters.price': 'Price',
  'cal.filters.all': 'All',
  'cal.filters.free': 'Free',
  'cal.filters.paid': 'Paid',
  'cal.filters.reset': 'Reset',
  'nav.calendar': 'Calendar',
  'tab.calendar': 'Calendar',
  'activity.shareStory': 'Share to story',
  'activity.shareDownload': 'Download image',
  'activity.shareFallback':
    'Sharing isn’t available here — the image was downloaded so you can post it manually.',
  'activity.sharePreparing': 'Preparing your story…',
  'activity.shareTitle': 'My Minga expedition',
  'activity.shareUnavailable': 'Connect a social account on your profile to share.',
  'completion.title': 'Trip complete · {title}',
  'completion.subtitle': 'Here is how you did.',
  'completion.levelUpTitle': 'You leveled up to {tier}!',
  'completion.levelUpBody': 'You crossed a tier threshold during this trip. 🎉',
  'completion.statsHeading': 'Your numbers',
  'completion.distance': 'Distance',
  'completion.elevation': 'Elevation',
  'completion.duration': 'Duration',
  'completion.activities': 'Activities',
  'completion.reviewExpedition': 'Rate this expedition',
  'completion.reviewPlaceholder': 'Tell future travelers how it went (optional)',
  'completion.dismiss': 'Maybe later',
  'completion.submit': 'Save and continue',
  'completion.thanks': 'Thanks for the review!',
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
  'track.titleLabel': 'Título',
  'track.titlePlaceholder': 'Título (p. ej., Cerro Tusa · 8km)',
  'track.notesLabel': 'Notas',
  'track.notesPlaceholder': '¿Cómo te fue?',
  'detail.signInToRate': 'Inicia sesión para calificar esta expedición.',
  'detail.signInToComment': 'Inicia sesión para dejar un comentario.',
  'detail.signInToLike': 'Inicia sesión para dar me gusta a expediciones.',
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
  'common.back': '← Volver',
  'common.allExpeditions': 'Todas las expediciones',
  'common.signInToLike': 'Inicia sesión para dar me gusta',
  'common.signInToRate': 'Inicia sesión para calificar',
  'common.signInToComment': 'Inicia sesión para comentar',
  'common.loadError': 'Algo salió mal',
  'common.and': 'y',
  'common.expeditionCount': 'expediciones',
  'common.expeditionCountOne': 'expedición',
  'tier.bronze': 'BRONCE',
  'tier.silver': 'PLATA',
  'tier.gold': 'ORO',
  'tier.diamond': 'DIAMANTE',
  'tier.maxTier': 'CATEGORÍA MÁXIMA',
  'tier.thresholdSuffix': 'umbral',
  'detail.avgRating': 'promedio',
  'detail.avgSuffix': '',
  'detail.replyPlaceholder': 'Escribe una respuesta…',
  'detail.postReply': 'Publicar respuesta',
  'feed.pace': 'Ritmo',
  'footer.aboutHeading': 'Minga Expeditions',
  'footer.aboutBody': 'Conectamos viajeros con los senderos, ríos y pueblos de Colombia.',
  'footer.exploreHeading': 'Explorar',
  'footer.exploreBody': 'Caminata · Ciclismo · Trekking · Fauna · Cultural',
  'footer.pocHeading': 'Acerca de',
  'footer.pocBody': 'Build de prueba de concepto · 2026',
  'home.pillarsHeading': 'Pilares',
  'auth.demoHeading': 'Cuentas demo',
  'auth.demoBody':
    'Crea cualquier correo para probar la app. La semilla incluye autores demo (juliana, andres, carolina, lucas) cuyas expediciones aparecen en el feed sin necesidad de iniciar sesión.',
  'profile.avatarAlt': 'Avatar',
  'map.official': 'OFICIAL DE MINGA',
  'detail.photoBy': 'Foto',
  'settings.fontSize': 'Tamaño de texto',
  'settings.fontSizeSm': 'Pequeño',
  'settings.fontSizeMd': 'Normal',
  'settings.fontSizeLg': 'Grande',
  'settings.fontSizeXl': 'Extra grande',
  'activity.detailBack': '← Volver',
  'activity.commentsHeading': 'Tus notas',
  'activity.commentPlaceholder': 'Anota una reflexión sobre esta salida…',
  'activity.rateHeading': '¿Qué tal estuvo?',
  'activity.openExpedition': 'Abrir la expedición',
  'activity.noLinkedExpedition': 'Sin expedición vinculada.',
  'activity.notFound': 'Actividad no encontrada',
  'activity.share': 'Compartir',
  'activity.shareCaption': 'Acabo de completar {title} en Minga Expeditions 🌄',
  'activity.photosHeading': 'Fotos',
  'activity.addPhoto': 'Añadir foto',
  'activity.noPhotos': 'Aún no hay fotos. Añade algunas desde la cámara.',
  'profile.connectedAccounts': 'Cuentas conectadas',
  'profile.emailLabel': 'Correo',
  'profile.signInMethodLabel': 'Método de inicio de sesión',
  'profile.signInMethodEmailPassword': 'Correo + contraseña',
  'profile.signInMethodGuest': 'Sesión de invitado',
  'profile.whatsappLabel': 'WhatsApp',
  'profile.whatsappHelp': 'Se usa para enviar confirmaciones de reserva y recordatorios de viaje.',
  'profile.phoneSaving': 'Guardando…',
  'profile.phoneSaved': 'Guardado ✓',
  'profile.phoneRetry': 'Reintentar',
  'profile.phoneSave': 'Guardar',
  'profile.instagramLabel': 'Instagram',
  'profile.instagramHelp': 'Te etiquetamos en los resúmenes de viaje y tarjetas para compartir.',
  'profile.instagramPlaceholder': 'tuusuario',
  'profile.instagramInvalid': 'Usa 1–30 letras, números, puntos o guiones bajos.',
  'profile.instagramOpen': 'Ver en Instagram',
  'profile.displayNameLabel': 'Nombre visible',
  'profile.displayNameHelp': 'Lo que ven otros viajeros. Tu @usuario no cambia.',
  'profile.changePhoto': 'Cambiar foto',
  'profile.uploadingPhoto': 'Subiendo…',
  'profile.uploadFailed': 'Falló la subida. Inténtalo de nuevo.',
  'settings.theme.livehappy.title': 'Live Happy',
  'settings.theme.livehappy.subtitle': 'Naranja vivo · inspirado en livehappy.com',
  'settings.theme.mingaGreen.title': 'Minga Verde',
  'settings.theme.mingaGreen.subtitle': 'Paleta de bosque al aire libre',
  'settings.theme.midnight.title': 'Medianoche',
  'settings.theme.midnight.subtitle': 'Modo oscuro para rodadas nocturnas',
  'track.linkedTo': 'Vinculado a',
  'track.independent': 'Independiente',
  'track.terrain': 'Terreno',
  'track.elevShort': 'desnivel m',
  'track.avgSpeedShort': 'km/h prom',
  'track.terrain.mountain': 'Montaña',
  'track.terrain.flat': 'Llano',
  'track.terrain.desert': 'Desierto',
  'track.terrain.river': 'Río',
  'track.terrain.forest': 'Bosque',
  'track.terrain.coast': 'Costa',
  'track.terrain.urban': 'Urbano',
  'track.terrain.jungle': 'Selva',
  'track.terrain.snow': 'Nieve',
  'salida.next': 'Próxima salida',
  'salida.scheduleTba': 'Fechas por confirmar',
  'salida.upcomingHeading': 'Próximas salidas',
  'salida.book': 'Reservar esta fecha',
  'salida.soldOut': 'Agotada',
  'salida.seatsRemaining': '{n} cupos disponibles',
  'salida.openCapacity': 'Cupos abiertos',
  'salida.empty': 'Aún no hay fechas programadas — vuelve pronto.',
  'cal.title': 'Calendario',
  'cal.subtitle': 'Mira todas las salidas y filtra por lo que te interese.',
  'cal.prev': '← Anterior',
  'cal.next': 'Siguiente →',
  'cal.today': 'Hoy',
  'cal.empty': 'Ninguna salida coincide con estos filtros.',
  'cal.filters.category': 'Categoría',
  'cal.filters.region': 'Región',
  'cal.filters.difficulty': 'Dificultad',
  'cal.filters.price': 'Precio',
  'cal.filters.all': 'Todos',
  'cal.filters.free': 'Gratis',
  'cal.filters.paid': 'De pago',
  'cal.filters.reset': 'Restablecer',
  'nav.calendar': 'Calendario',
  'tab.calendar': 'Calendario',
  'activity.shareStory': 'Compartir en historia',
  'activity.shareDownload': 'Descargar imagen',
  'activity.shareFallback':
    'No se puede compartir aquí — descargamos la imagen para que la publiques manualmente.',
  'activity.sharePreparing': 'Preparando tu historia…',
  'activity.shareTitle': 'Mi expedición Minga',
  'activity.shareUnavailable':
    'Conecta una cuenta social en tu perfil para compartir.',
  'completion.title': '¡Viaje completado · {title}!',
  'completion.subtitle': 'Estas son tus cifras.',
  'completion.levelUpTitle': '¡Subiste a {tier}!',
  'completion.levelUpBody': 'Cruzaste un nivel durante este viaje. 🎉',
  'completion.statsHeading': 'Tus números',
  'completion.distance': 'Distancia',
  'completion.elevation': 'Desnivel',
  'completion.duration': 'Duración',
  'completion.activities': 'Actividades',
  'completion.reviewExpedition': 'Califica esta expedición',
  'completion.reviewPlaceholder': 'Cuéntale a otros viajeros qué tal estuvo (opcional)',
  'completion.dismiss': 'Más tarde',
  'completion.submit': 'Guardar y continuar',
  'completion.thanks': '¡Gracias por la reseña!',
};

export const dictionaries: Record<LanguageCode, Record<TranslationKey, string>> = { en, es };

export const defaultLanguage: LanguageCode = 'es'; // App is for Colombian travelers — default to Spanish.
