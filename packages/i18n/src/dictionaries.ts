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
  | 'track.locationGateTitle'
  | 'track.locationGateBody'
  | 'track.locationGateCta'
  | 'track.locationDeniedTitle'
  | 'track.locationDeniedBody'
  | 'track.locationDeniedRetry'
  | 'track.locationUnsupported'
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
  | 'auth.continueGoogle'
  | 'auth.continueFacebook'
  | 'auth.orDivider'
  | 'auth.oauthFailed'
  | 'settings.title'
  | 'settings.theme'
  | 'settings.language'
  | 'settings.about'
  | 'settings.aboutBody'
  | 'settings.languageEn'
  | 'settings.languageEs'
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
  | 'common.signInToTrack'
  | 'auth.signInRequiredTitle'
  | 'auth.signInRequiredCta'
  | 'auth.signInRequiredDismiss'
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
  | 'profile.googleLabel'
  | 'profile.facebookLabel'
  | 'profile.linked'
  | 'profile.notLinked'
  | 'profile.primaryLogin'
  | 'profile.connect'
  | 'profile.disconnect'
  | 'profile.countryPickerTitle'
  | 'profile.countrySearchPlaceholder'
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
  | 'cal.filters.open'
  | 'cal.filters.apply'
  | 'cal.filters.activity'
  | 'cal.filters.biome'
  | 'cal.filters.department'
  | 'cal.filters.minRating'
  | 'cal.filters.anyRating'
  | 'cal.filters.priceRange'
  | 'cal.filters.activeCount'
  | 'cal.view.label'
  | 'cal.view.grid'
  | 'cal.view.agenda'
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
  | 'completion.thanks'
  | 'nav.partners'
  | 'partners.eyebrow'
  | 'partners.title'
  | 'partners.intro'
  | 'partners.thanksTitle'
  | 'partners.thanksBody'
  | 'partners.submitAnother'
  | 'partners.fieldOfferType'
  | 'partners.fieldBusinessName'
  | 'partners.fieldEmail'
  | 'partners.fieldPhone'
  | 'partners.fieldPhonePlaceholder'
  | 'partners.fieldContactNote'
  | 'partners.fieldRegion'
  | 'partners.fieldRegionPlaceholder'
  | 'partners.fieldTitle'
  | 'partners.fieldTitlePlaceholder'
  | 'partners.fieldDescription'
  | 'partners.fieldPricingNotes'
  | 'partners.fieldPricingPlaceholder'
  | 'partners.fieldAttachments'
  | 'partners.submit'
  | 'partners.submitting'
  | 'partners.errorContactRequired'
  | 'partners.vendorType.full_experience'
  | 'partners.vendorType.transportation'
  | 'partners.vendorType.lodging'
  | 'partners.vendorType.guide'
  | 'partners.vendorType.food'
  | 'partners.vendorType.other'
  | 'partners.vendorHint.full_experience'
  | 'partners.vendorHint.transportation'
  | 'partners.vendorHint.lodging'
  | 'partners.vendorHint.guide'
  | 'partners.vendorHint.food'
  | 'partners.vendorHint.other'
  | 'checkout.eyebrow'
  | 'checkout.close'
  | 'checkout.signedInAs'
  | 'checkout.fieldName'
  | 'checkout.fieldNamePlaceholder'
  | 'checkout.fieldEmail'
  | 'checkout.fieldEmailPlaceholder'
  | 'checkout.fieldPhone'
  | 'checkout.fieldPhonePlaceholder'
  | 'checkout.fieldPhoneHelp'
  | 'checkout.confirmationEmail'
  | 'checkout.confirmationEmailWhatsapp'
  | 'checkout.payButton'
  | 'checkout.opening'
  | 'checkout.redirecting'
  | 'checkout.errorEmailRequired'
  | 'checkout.errorPhoneRequired'
  | 'checkout.errorGeneric'
  | 'order.expeditionLabel'
  | 'order.saveBookingTitle'
  | 'order.saveBookingBody'
  | 'order.createAccount'
  | 'order.backToExpedition'
  | 'order.done'
  | 'order.errorLoadFailed'
  | 'order.status.approvedTitle'
  | 'order.status.approvedSub'
  | 'order.status.declinedTitle'
  | 'order.status.declinedSub'
  | 'order.status.voidedTitle'
  | 'order.status.voidedSub'
  | 'order.status.errorTitle'
  | 'order.status.errorSub'
  | 'order.status.refundedTitle'
  | 'order.status.refundedSub'
  | 'order.status.pendingTitle'
  | 'order.status.pendingSub';

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
  'track.locationGateTitle': 'Location access is required',
  'track.locationGateBody':
    'Recording an activity needs your GPS — without location access we can’t measure distance, pace, or elevation.',
  'track.locationGateCta': 'Allow location access',
  'track.locationDeniedTitle': 'Location is blocked',
  'track.locationDeniedBody':
    'Open your device or browser settings, enable location for Minga, then come back and tap Retry.',
  'track.locationDeniedRetry': 'Retry',
  'track.locationUnsupported': 'This device can’t share its location, so activity tracking isn’t available here.',
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
  'auth.oauthNote': 'Sign in with Google, Meta, or your email.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.displayName': 'Display name',
  'auth.username': 'Username',
  'auth.signIn': 'Sign in',
  'auth.createAccount': 'Create account',
  'auth.switchToSignup': 'No account? Create one',
  'auth.switchToSignin': 'Already a member? Sign in',
  'auth.continueGoogle': 'Continue with Google',
  'auth.continueFacebook': 'Continue with Facebook',
  'auth.orDivider': 'OR',
  'auth.oauthFailed': 'OAuth sign-in failed',
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.about': 'About',
  'settings.aboutBody':
    'Minga Expeditions · PoC build. Cross-platform mobile + web client for the Colombia traveler community.',
  'settings.languageEn': 'English',
  'settings.languageEs': 'Español',
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
  'common.signInToTrack': 'Sign in to save your activity',
  'auth.signInRequiredTitle': 'Please sign in',
  'auth.signInRequiredCta': 'Sign in',
  'auth.signInRequiredDismiss': 'Not now',
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
  'profile.googleLabel': 'Google',
  'profile.facebookLabel': 'Facebook',
  'profile.linked': 'Linked',
  'profile.notLinked': 'Not linked',
  'profile.primaryLogin': 'Primary sign-in method',
  'profile.connect': 'Connect',
  'profile.disconnect': 'Disconnect',
  'profile.countryPickerTitle': 'Country code',
  'profile.countrySearchPlaceholder': 'Search by name or dial code',
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
  'cal.filters.open': 'Filters',
  'cal.filters.apply': 'Apply filters',
  'cal.filters.activity': 'Activity type',
  'cal.filters.biome': 'Biome',
  'cal.filters.department': 'Department',
  'cal.filters.minRating': 'Minimum rating',
  'cal.filters.anyRating': 'Any rating',
  'cal.filters.priceRange': 'Price range',
  'cal.filters.activeCount': '{n} active',
  'cal.view.label': 'View',
  'cal.view.grid': 'Calendar',
  'cal.view.agenda': 'List',
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
  'nav.partners': 'Partners',
  'partners.eyebrow': 'Become a partner',
  'partners.title': 'Offer your service to Minga travelers.',
  'partners.intro':
    "Tell us about an experience, route, transport, lodging, or any other service you offer. We'll review it and reach out to you. No account required.",
  'partners.thanksTitle': 'Thanks — we got it.',
  'partners.thanksBody':
    'A Minga team member will review your proposal and get back to you on the contact you provided. Most reviews happen within five business days.',
  'partners.submitAnother': 'Submit another',
  'partners.fieldOfferType': 'What are you offering?',
  'partners.fieldBusinessName': 'Your business or organization name',
  'partners.fieldEmail': 'Email',
  'partners.fieldPhone': 'Phone (WhatsApp)',
  'partners.fieldPhonePlaceholder': '+57 …',
  'partners.fieldContactNote':
    'At least one is required. We send all confirmations on WhatsApp.',
  'partners.fieldRegion': 'Region or city served',
  'partners.fieldRegionPlaceholder': 'Antioquia · Sierra Nevada · …',
  'partners.fieldTitle': 'Short title for your offer',
  'partners.fieldTitlePlaceholder': '2-day Cocora Valley wax-palm trek',
  'partners.fieldDescription': "Describe what's included, capacity, schedule, etc.",
  'partners.fieldPricingNotes': 'Pricing notes (optional)',
  'partners.fieldPricingPlaceholder':
    "Per-person rate, group discounts, what's included…",
  'partners.fieldAttachments': 'Brochure or photo gallery URL (optional)',
  'partners.submit': 'Submit proposal',
  'partners.submitting': 'Submitting…',
  'partners.errorContactRequired':
    'Add at least one way for us to reach you (email or phone).',
  'partners.vendorType.full_experience': 'Full experience',
  'partners.vendorType.transportation': 'Transportation',
  'partners.vendorType.lodging': 'Lodging',
  'partners.vendorType.guide': 'Guide',
  'partners.vendorType.food': 'Food',
  'partners.vendorType.other': 'Other',
  'partners.vendorHint.full_experience':
    'A complete tour or expedition you operate end-to-end.',
  'partners.vendorHint.transportation': 'Shuttles, 4×4 transfers, boat rides, etc.',
  'partners.vendorHint.lodging': 'Cabins, glamping, hostels, eco-lodges.',
  'partners.vendorHint.guide': 'Certified individual or team guiding services.',
  'partners.vendorHint.food': 'Catering, on-trail meals, restaurant partnerships.',
  'partners.vendorHint.other': 'Equipment rentals, photography, anything else.',
  'checkout.eyebrow': 'Checkout',
  'checkout.close': 'Close',
  'checkout.signedInAs': 'Signed in as',
  'checkout.fieldName': 'Your name',
  'checkout.fieldNamePlaceholder': 'Optional',
  'checkout.fieldEmail': 'Email',
  'checkout.fieldEmailPlaceholder': 'you@email.com',
  'checkout.fieldPhone': 'WhatsApp phone (optional)',
  'checkout.fieldPhonePlaceholder': '3001234567',
  'checkout.fieldPhoneHelp':
    "Optional but recommended — we'll send your booking confirmation and any last-minute trip updates via WhatsApp.",
  'checkout.confirmationEmail': 'We send the booking confirmation to your email.',
  'checkout.confirmationEmailWhatsapp':
    'We send the booking confirmation to your email and a WhatsApp message with trip details.',
  'checkout.payButton': 'Pay with Wompi',
  'checkout.opening': 'Opening checkout…',
  'checkout.redirecting': 'Redirecting…',
  'checkout.errorEmailRequired': 'Email is required.',
  'checkout.errorPhoneRequired': 'WhatsApp number is required.',
  'checkout.errorGeneric': 'Could not start checkout',
  'order.expeditionLabel': 'Expedition',
  'order.saveBookingTitle': 'Save your booking — create a Minga account',
  'order.saveBookingBody':
    "Sign up with the same email or WhatsApp number you just used and we'll attach this trip to your profile so you can chat with other travelers and track your activity.",
  'order.createAccount': 'Create account',
  'order.backToExpedition': '← Back to expedition',
  'order.done': 'Done',
  'order.errorLoadFailed': 'Failed to load order',
  'order.status.approvedTitle': 'Payment confirmed.',
  'order.status.approvedSub': "We're sending your confirmation now.",
  'order.status.declinedTitle': 'Payment declined.',
  'order.status.declinedSub': 'Try again or use a different payment method.',
  'order.status.voidedTitle': 'Payment voided.',
  'order.status.voidedSub': 'No charge was applied.',
  'order.status.errorTitle': 'Something went wrong.',
  'order.status.errorSub': 'No charge was applied. Please try again.',
  'order.status.refundedTitle': 'Payment refunded.',
  'order.status.refundedSub': 'We sent the funds back to your card.',
  'order.status.pendingTitle': 'Confirming your payment…',
  'order.status.pendingSub': 'This usually takes a few seconds.',
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
  'track.locationGateTitle': 'Necesitamos acceso a tu ubicación',
  'track.locationGateBody':
    'Para registrar una actividad necesitamos tu GPS — sin acceso a la ubicación no podemos medir distancia, ritmo ni desnivel.',
  'track.locationGateCta': 'Permitir ubicación',
  'track.locationDeniedTitle': 'La ubicación está bloqueada',
  'track.locationDeniedBody':
    'Abre los ajustes del dispositivo o del navegador, activa la ubicación para Minga y vuelve aquí para intentar de nuevo.',
  'track.locationDeniedRetry': 'Reintentar',
  'track.locationUnsupported': 'Este dispositivo no comparte ubicación, así que el seguimiento de actividades no está disponible aquí.',
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
  'auth.oauthNote': 'Inicia sesión con Google, Meta o tu correo.',
  'auth.email': 'Correo',
  'auth.password': 'Contraseña',
  'auth.displayName': 'Nombre visible',
  'auth.username': 'Usuario',
  'auth.signIn': 'Iniciar sesión',
  'auth.createAccount': 'Crear cuenta',
  'auth.switchToSignup': '¿Sin cuenta? Crea una',
  'auth.switchToSignin': '¿Ya tienes cuenta? Inicia sesión',
  'auth.continueGoogle': 'Continúa con Google',
  'auth.continueFacebook': 'Continúa con Facebook',
  'auth.orDivider': 'O',
  'auth.oauthFailed': 'Falló el inicio con OAuth',
  'settings.title': 'Ajustes',
  'settings.theme': 'Tema',
  'settings.language': 'Idioma',
  'settings.about': 'Acerca de',
  'settings.aboutBody':
    'Minga Expeditions · build PoC. Cliente multiplataforma móvil + web para la comunidad viajera en Colombia.',
  'settings.languageEn': 'English',
  'settings.languageEs': 'Español',
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
  'common.signInToTrack': 'Inicia sesión para guardar tu actividad',
  'auth.signInRequiredTitle': 'Inicia sesión',
  'auth.signInRequiredCta': 'Iniciar sesión',
  'auth.signInRequiredDismiss': 'Más tarde',
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
  'profile.googleLabel': 'Google',
  'profile.facebookLabel': 'Facebook',
  'profile.linked': 'Vinculado',
  'profile.notLinked': 'Sin vincular',
  'profile.primaryLogin': 'Método principal de inicio de sesión',
  'profile.connect': 'Vincular',
  'profile.disconnect': 'Desvincular',
  'profile.countryPickerTitle': 'Código de país',
  'profile.countrySearchPlaceholder': 'Busca por nombre o código',
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
  'cal.filters.open': 'Filtros',
  'cal.filters.apply': 'Aplicar filtros',
  'cal.filters.activity': 'Tipo de actividad',
  'cal.filters.biome': 'Bioma',
  'cal.filters.department': 'Departamento',
  'cal.filters.minRating': 'Calificación mínima',
  'cal.filters.anyRating': 'Cualquier calificación',
  'cal.filters.priceRange': 'Rango de precio',
  'cal.filters.activeCount': '{n} activos',
  'cal.view.label': 'Vista',
  'cal.view.grid': 'Calendario',
  'cal.view.agenda': 'Lista',
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
  'nav.partners': 'Aliados',
  'partners.eyebrow': 'Sé nuestro aliado',
  'partners.title': 'Ofrece tu servicio a los viajeros Minga.',
  'partners.intro':
    'Cuéntanos sobre una experiencia, ruta, transporte, alojamiento o cualquier otro servicio que ofrezcas. Lo revisaremos y te contactaremos. No necesitas cuenta.',
  'partners.thanksTitle': '¡Gracias — lo recibimos!',
  'partners.thanksBody':
    'Un integrante del equipo Minga revisará tu propuesta y te responderá al contacto que indicaste. La mayoría de revisiones se completa en cinco días hábiles.',
  'partners.submitAnother': 'Enviar otra',
  'partners.fieldOfferType': '¿Qué ofreces?',
  'partners.fieldBusinessName': 'Nombre de tu negocio u organización',
  'partners.fieldEmail': 'Correo',
  'partners.fieldPhone': 'Teléfono (WhatsApp)',
  'partners.fieldPhonePlaceholder': '+57 …',
  'partners.fieldContactNote':
    'Al menos uno es obligatorio. Enviamos las confirmaciones por WhatsApp.',
  'partners.fieldRegion': 'Región o ciudad que atiendes',
  'partners.fieldRegionPlaceholder': 'Antioquia · Sierra Nevada · …',
  'partners.fieldTitle': 'Título corto de tu oferta',
  'partners.fieldTitlePlaceholder': 'Trek 2 días al Valle del Cocora · palmas de cera',
  'partners.fieldDescription':
    'Describe qué incluye, capacidad, horarios, etc.',
  'partners.fieldPricingNotes': 'Notas de precio (opcional)',
  'partners.fieldPricingPlaceholder':
    'Tarifa por persona, descuentos de grupo, qué incluye…',
  'partners.fieldAttachments': 'Enlace a brochure o galería de fotos (opcional)',
  'partners.submit': 'Enviar propuesta',
  'partners.submitting': 'Enviando…',
  'partners.errorContactRequired':
    'Agrega al menos una forma de contacto (correo o teléfono).',
  'partners.vendorType.full_experience': 'Experiencia completa',
  'partners.vendorType.transportation': 'Transporte',
  'partners.vendorType.lodging': 'Alojamiento',
  'partners.vendorType.guide': 'Guía',
  'partners.vendorType.food': 'Comida',
  'partners.vendorType.other': 'Otro',
  'partners.vendorHint.full_experience':
    'Un tour o expedición completo que operas de principio a fin.',
  'partners.vendorHint.transportation': 'Shuttles, traslados 4×4, lanchas, etc.',
  'partners.vendorHint.lodging': 'Cabañas, glamping, hostales, eco-lodges.',
  'partners.vendorHint.guide': 'Guías individuales o equipos certificados.',
  'partners.vendorHint.food': 'Catering, comidas en ruta, alianzas con restaurantes.',
  'partners.vendorHint.other': 'Alquiler de equipo, fotografía, lo que se te ocurra.',
  'checkout.eyebrow': 'Pago',
  'checkout.close': 'Cerrar',
  'checkout.signedInAs': 'Sesión iniciada como',
  'checkout.fieldName': 'Tu nombre',
  'checkout.fieldNamePlaceholder': 'Opcional',
  'checkout.fieldEmail': 'Correo',
  'checkout.fieldEmailPlaceholder': 'tu@correo.com',
  'checkout.fieldPhone': 'Teléfono de WhatsApp (opcional)',
  'checkout.fieldPhonePlaceholder': '3001234567',
  'checkout.fieldPhoneHelp':
    'Opcional pero recomendado — te enviaremos la confirmación de tu reserva y avisos de último momento por WhatsApp.',
  'checkout.confirmationEmail': 'Enviamos la confirmación de la reserva a tu correo.',
  'checkout.confirmationEmailWhatsapp':
    'Enviamos la confirmación al correo y un mensaje por WhatsApp con los detalles del viaje.',
  'checkout.payButton': 'Pagar con Wompi',
  'checkout.opening': 'Abriendo el pago…',
  'checkout.redirecting': 'Redirigiendo…',
  'checkout.errorEmailRequired': 'El correo es obligatorio.',
  'checkout.errorPhoneRequired': 'El número de WhatsApp es obligatorio.',
  'checkout.errorGeneric': 'No se pudo iniciar el pago',
  'order.expeditionLabel': 'Expedición',
  'order.saveBookingTitle': 'Guarda tu reserva — crea una cuenta Minga',
  'order.saveBookingBody':
    'Regístrate con el mismo correo o número de WhatsApp que acabas de usar y vincularemos este viaje a tu perfil para que puedas conversar con otros viajeros y registrar tu actividad.',
  'order.createAccount': 'Crear cuenta',
  'order.backToExpedition': '← Volver a la expedición',
  'order.done': 'Listo',
  'order.errorLoadFailed': 'No se pudo cargar el pedido',
  'order.status.approvedTitle': 'Pago confirmado.',
  'order.status.approvedSub': 'Estamos enviando tu confirmación ahora.',
  'order.status.declinedTitle': 'Pago rechazado.',
  'order.status.declinedSub': 'Inténtalo de nuevo o usa otro método de pago.',
  'order.status.voidedTitle': 'Pago anulado.',
  'order.status.voidedSub': 'No se realizó ningún cobro.',
  'order.status.errorTitle': 'Algo salió mal.',
  'order.status.errorSub': 'No se realizó ningún cobro. Inténtalo de nuevo.',
  'order.status.refundedTitle': 'Pago reembolsado.',
  'order.status.refundedSub': 'Devolvimos los fondos a tu tarjeta.',
  'order.status.pendingTitle': 'Confirmando tu pago…',
  'order.status.pendingSub': 'Suele tardar unos segundos.',
};

export const dictionaries: Record<LanguageCode, Record<TranslationKey, string>> = { en, es };

export const defaultLanguage: LanguageCode = 'es'; // App is for Colombian travelers — default to Spanish.
