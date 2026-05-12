// Flat key → string dictionaries for the admin console. Default locale is
// Spanish — flip with the language toggle in the dashboard sidebar.
//
// Adding a string: declare the key once in `Key`, then add it to BOTH `en`
// and `es` below. TypeScript will surface missing entries.

export type Locale = 'en' | 'es';

export const LOCALES: Locale[] = ['en', 'es'];
export const DEFAULT_LOCALE: Locale = 'es';

export type Key =
  // login
  | 'login.title'
  | 'login.subtitle'
  | 'login.email'
  | 'login.password'
  | 'login.signIn'
  | 'login.signingIn'
  | 'login.required'
  | 'login.error.missingProfile'
  | 'login.error.notAdmin'
  // sidebar
  | 'sidebar.brandSub'
  | 'sidebar.dashboard'
  | 'sidebar.categories'
  | 'sidebar.expeditions'
  | 'sidebar.calendar'
  | 'sidebar.vendorProposals'
  | 'sidebar.orders'
  | 'sidebar.comms'
  | 'sidebar.signOut'
  | 'sidebar.group.expeditions'
  | 'sidebar.group.users'
  | 'sidebar.group.providers'
  | 'sidebar.group.communications'
  | 'sidebar.item.categories'
  | 'sidebar.item.itineraries'
  | 'sidebar.item.dates'
  | 'sidebar.item.insights'
  | 'sidebar.item.userProfiles'
  | 'sidebar.item.orders'
  | 'sidebar.item.propuestas'
  | 'sidebar.item.directory'
  | 'sidebar.item.communications'
  | 'stub.title'
  | 'stub.subtitle'
  | 'stub.dataReady'
  | 'sidebar.language'
  | 'lang.english'
  | 'lang.spanish'
  // dashboard
  | 'dashboard.title'
  | 'dashboard.subtitle'
  | 'dashboard.stat.expeditions'
  | 'dashboard.stat.categories'
  | 'dashboard.stat.profiles'
  | 'dashboard.stat.newProposals'
  | 'dashboard.stat.approvedOrders'
  | 'dashboard.stat.pendingOrders'
  | 'dashboard.stat.declinedOrders'
  | 'dashboard.unreviewedOne'
  | 'dashboard.unreviewedMany'
  | 'dashboard.unreviewedBody'
  | 'dashboard.reviewNow'
  // categories list
  | 'categories.title'
  | 'categories.subtitle'
  | 'categories.new'
  | 'categories.col.slug'
  | 'categories.col.english'
  | 'categories.col.spanish'
  | 'categories.col.icon'
  | 'categories.col.sort'
  | 'categories.col.active'
  | 'categories.col.actions'
  | 'categories.status.active'
  | 'categories.status.hidden'
  | 'categories.action.edit'
  | 'categories.action.delete'
  | 'categories.empty'
  // category form
  | 'categoryForm.slug'
  | 'categoryForm.slugHelp'
  | 'categoryForm.nameEn'
  | 'categoryForm.nameEs'
  | 'categoryForm.icon'
  | 'categoryForm.iconNone'
  | 'categoryForm.iconHelp'
  | 'categoryForm.sortOrder'
  | 'categoryForm.visible'
  | 'categoryForm.saving'
  | 'categoryForm.cancel'
  // categories pages
  | 'categories.newPage.title'
  | 'categories.newPage.subtitle'
  | 'categories.newPage.submit'
  | 'categories.editPage.title'
  | 'categories.editPage.submit'
  // parser errors (categories)
  | 'error.category.required'
  | 'error.category.slugFormat'
  // expeditions list
  | 'expeditions.title'
  | 'expeditions.subtitle'
  | 'expeditions.new'
  | 'expeditions.col.title'
  | 'expeditions.col.category'
  | 'expeditions.col.location'
  | 'expeditions.col.price'
  | 'expeditions.col.status'
  | 'expeditions.col.actions'
  | 'expeditions.free'
  | 'expeditions.status.published'
  | 'expeditions.status.draft'
  | 'expeditions.badge.official'
  | 'expeditions.empty'
  // expedition form
  | 'expForm.title'
  | 'expForm.description'
  | 'expForm.category'
  | 'expForm.selectCategory'
  | 'expForm.difficulty'
  | 'expForm.location'
  | 'expForm.region'
  | 'expForm.country'
  | 'expForm.startLat'
  | 'expForm.startLng'
  | 'expForm.locationSearch'
  | 'expForm.locationSearchPlaceholder'
  | 'expForm.locationSearching'
  | 'expForm.locationNoResults'
  | 'expForm.locationHelp'
  | 'expForm.distance'
  | 'expForm.elevation'
  | 'expForm.currency'
  | 'expForm.priceCents'
  | 'expForm.priceHelp'
  | 'expForm.coverPhoto'
  | 'expForm.coverPreviewAlt'
  | 'expForm.coverHelp'
  | 'expForm.terrain'
  | 'expForm.terrainHelp'
  | 'expForm.terrain.mountain'
  | 'expForm.terrain.flat'
  | 'expForm.terrain.desert'
  | 'expForm.terrain.river'
  | 'expForm.terrain.forest'
  | 'expForm.terrain.coast'
  | 'expForm.terrain.urban'
  | 'expForm.terrain.jungle'
  | 'expForm.terrain.snow'
  | 'expForm.official'
  | 'expForm.published'
  | 'expForm.saving'
  | 'expForm.cancel'
  // expedition pages
  | 'expeditions.newPage.title'
  | 'expeditions.newPage.subtitle'
  | 'expeditions.newPage.submit'
  | 'expeditions.editPage.title'
  | 'expeditions.editPage.submit'
  // parser errors (expeditions)
  | 'error.expedition.required'
  | 'error.expedition.photoFailed'
  // vendor proposals
  | 'proposals.title'
  | 'proposals.subtitle'
  | 'proposals.statusFilter'
  | 'proposals.status.new'
  | 'proposals.status.reviewing'
  | 'proposals.status.accepted'
  | 'proposals.status.rejected'
  | 'proposals.status.archived'
  | 'proposals.status.all'
  | 'proposals.type.full_experience'
  | 'proposals.type.transportation'
  | 'proposals.type.lodging'
  | 'proposals.type.guide'
  | 'proposals.type.food'
  | 'proposals.type.other'
  | 'proposals.col.vendor'
  | 'proposals.col.type'
  | 'proposals.col.title'
  | 'proposals.col.region'
  | 'proposals.col.submitted'
  | 'proposals.col.status'
  | 'proposals.col.actions'
  | 'proposals.review'
  | 'proposals.empty'
  // proposal detail
  | 'proposalDetail.back'
  | 'proposalDetail.submitted'
  | 'proposalDetail.description'
  | 'proposalDetail.pricingNotes'
  | 'proposalDetail.attachments'
  | 'proposalDetail.internalNotes'
  | 'proposalDetail.notesPlaceholder'
  | 'proposalDetail.saveNotes'
  | 'proposalDetail.vendor'
  | 'proposalDetail.row.name'
  | 'proposalDetail.row.email'
  | 'proposalDetail.row.phone'
  | 'proposalDetail.statusTitle'
  | 'proposalDetail.updateStatus'
  | 'proposalDetail.lastReviewed'
  // orders list
  | 'orders.title'
  | 'orders.subtitle'
  | 'orders.status.pending'
  | 'orders.status.approved'
  | 'orders.status.declined'
  | 'orders.status.voided'
  | 'orders.status.error'
  | 'orders.status.refunded'
  | 'orders.status.all'
  | 'orders.col.reference'
  | 'orders.col.amount'
  | 'orders.col.status'
  | 'orders.col.buyer'
  | 'orders.col.created'
  | 'orders.col.actions'
  | 'orders.buyer.account'
  | 'orders.buyer.guest'
  | 'orders.action.view'
  | 'orders.empty'
  // order detail
  | 'orderDetail.back'
  | 'orderDetail.title'
  | 'orderDetail.payment'
  | 'orderDetail.row.status'
  | 'orderDetail.row.amount'
  | 'orderDetail.row.txId'
  | 'orderDetail.row.method'
  | 'orderDetail.row.statusMessage'
  | 'orderDetail.row.paidAt'
  | 'orderDetail.row.created'
  | 'orderDetail.expedition'
  | 'orderDetail.expeditionDeleted'
  | 'orderDetail.buyer'
  | 'orderDetail.guestNoName'
  | 'orderDetail.guestSignedIn'
  | 'orderDetail.guestClaimed'
  | 'orderDetail.guestUnclaimed'
  | 'orderDetail.buyerNone'
  | 'orderDetail.salida'
  | 'orderDetail.salidaNone'
  // salidas (admin list under expedition)
  | 'salidas.title'
  | 'salidas.subtitle'
  | 'salidas.new'
  | 'salidas.back'
  | 'salidas.manage'
  | 'salidas.col.starts'
  | 'salidas.col.ends'
  | 'salidas.col.capacity'
  | 'salidas.col.seats'
  | 'salidas.col.price'
  | 'salidas.col.status'
  | 'salidas.col.actions'
  | 'salidas.status.published'
  | 'salidas.status.draft'
  | 'salidas.status.soldOut'
  | 'salidas.inheritsPrice'
  | 'salidas.unlimited'
  | 'salidas.empty'
  | 'salidas.newPage.title'
  | 'salidas.newPage.submit'
  | 'salidas.editPage.title'
  | 'salidas.editPage.submit'
  // salida form
  | 'salidaForm.starts'
  | 'salidaForm.ends'
  | 'salidaForm.timezone'
  | 'salidaForm.capacity'
  | 'salidaForm.capacityHelp'
  | 'salidaForm.seatsTaken'
  | 'salidaForm.seatsHelp'
  | 'salidaForm.priceCents'
  | 'salidaForm.priceHelp'
  | 'salidaForm.currency'
  | 'salidaForm.notes'
  | 'salidaForm.published'
  | 'salidaForm.saving'
  | 'salidaForm.cancel'
  | 'error.salida.required'
  | 'error.salida.invalidWindow'
  // expedition calendar (admin)
  | 'calendar.title'
  | 'calendar.subtitle'
  | 'calendar.prev'
  | 'calendar.next'
  | 'calendar.today'
  | 'calendar.empty'
  | 'calendar.filters.title'
  | 'calendar.filters.category'
  | 'calendar.filters.region'
  | 'calendar.filters.difficulty'
  | 'calendar.filters.price'
  | 'calendar.filters.all'
  | 'calendar.filters.free'
  | 'calendar.filters.paid'
  | 'calendar.filters.reset'
  | 'calendar.legend.published'
  | 'calendar.legend.draft'
  | 'calendar.legend.soldOut'
  // comms
  | 'comms.title'
  | 'comms.subtitle'
  | 'comms.event.heading'
  | 'comms.template.empty'
  | 'comms.template.subject'
  | 'comms.template.body'
  | 'comms.template.locale'
  | 'comms.template.channel'
  | 'comms.template.active'
  | 'comms.template.save'
  | 'comms.template.saved'
  | 'comms.template.placeholdersHelp'
  | 'comms.channel.email'
  | 'comms.channel.whatsapp'
  | 'comms.tabs.automated'
  | 'comms.tabs.automatedDesc'
  | 'comms.tabs.broadcasts'
  | 'comms.tabs.broadcastsDesc'
  | 'comms.broadcasts.back'
  | 'comms.broadcasts.subtitle'
  | 'comms.broadcasts.empty'
  | 'comms.broadcasts.new'
  | 'comms.broadcasts.newTitle'
  | 'comms.broadcasts.delete'
  | 'comms.broadcasts.save'
  | 'comms.broadcasts.saved'
  | 'comms.broadcasts.field.name'
  | 'comms.broadcasts.field.category'
  | 'comms.broadcasts.field.channel'
  | 'comms.broadcasts.field.locale'
  | 'comms.broadcasts.field.subject'
  | 'comms.broadcasts.field.body'
  | 'comms.broadcasts.category.announcement'
  | 'comms.broadcasts.category.promotion'
  | 'comms.broadcasts.category.new_trip'
  | 'comms.broadcasts.category.reminder'
  | 'comms.broadcasts.category.other'
  // photo gallery
  | 'photoGallery.heading'
  | 'photoGallery.subtitle'
  | 'photoGallery.upload'
  | 'photoGallery.uploadHelp'
  | 'photoGallery.empty'
  | 'photoGallery.moveUp'
  | 'photoGallery.moveDown'
  | 'photoGallery.delete'
  | 'photoGallery.coverBadge';

export const dict: Record<Locale, Record<Key, string>> = {
  en: {
    'login.title': 'Minga Admin',
    'login.subtitle': 'Sign in with an admin account.',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.signIn': 'Sign in',
    'login.signingIn': 'Signing in…',
    'login.required': 'Email and password are required.',
    'login.error.missingProfile':
      'Your account has no Minga profile yet — contact an existing admin.',
    'login.error.notAdmin': 'This account is not authorized for the admin dashboard.',

    'sidebar.brandSub': 'Admin console',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.categories': 'Categories',
    'sidebar.expeditions': 'Expeditions',
    'sidebar.calendar': 'Calendar',
    'sidebar.vendorProposals': 'Vendor proposals',
    'sidebar.orders': 'Orders',
    'sidebar.comms': 'Communications',
    'sidebar.signOut': 'Sign out',
    'sidebar.language': 'Language',
    'sidebar.group.expeditions': 'Expeditions',
    'sidebar.group.users': 'Users',
    'sidebar.group.providers': 'Providers',
    'sidebar.group.communications': 'Communications',
    'sidebar.item.categories': 'Categories',
    'sidebar.item.itineraries': 'Itineraries',
    'sidebar.item.dates': 'Dates',
    'sidebar.item.insights': 'Insights',
    'sidebar.item.userProfiles': 'User profiles',
    'sidebar.item.orders': 'Orders',
    'sidebar.item.propuestas': 'Proposals',
    'sidebar.item.directory': 'Directory',
    'sidebar.item.communications': 'Communications',
    'stub.title': 'Coming soon',
    'stub.subtitle': 'The page lives at this route — the UI is still being built. The underlying data model is already in place.',
    'stub.dataReady': 'Underlying data ready ✓',
    'lang.english': 'English',
    'lang.spanish': 'Español',

    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'High-level snapshot of the platform.',
    'dashboard.stat.expeditions': 'Expeditions',
    'dashboard.stat.categories': 'Categories',
    'dashboard.stat.profiles': 'Profiles',
    'dashboard.stat.newProposals': 'New proposals',
    'dashboard.stat.approvedOrders': 'Approved orders',
    'dashboard.stat.pendingOrders': 'Pending orders',
    'dashboard.stat.declinedOrders': 'Declined orders',
    'dashboard.unreviewedOne': '{n} unreviewed vendor proposal',
    'dashboard.unreviewedMany': '{n} unreviewed vendor proposals',
    'dashboard.unreviewedBody':
      'Review submissions and update status to keep the queue moving.',
    'dashboard.reviewNow': 'Review now',

    'categories.title': 'Categories',
    'categories.subtitle':
      'Drives the filters in the mobile app and the picker on each expedition.',
    'categories.new': 'New category',
    'categories.col.slug': 'Slug',
    'categories.col.english': 'English',
    'categories.col.spanish': 'Spanish',
    'categories.col.icon': 'Icon',
    'categories.col.sort': 'Sort',
    'categories.col.active': 'Active',
    'categories.col.actions': 'Actions',
    'categories.status.active': 'Active',
    'categories.status.hidden': 'Hidden',
    'categories.action.edit': 'Edit',
    'categories.action.delete': 'Delete',
    'categories.empty': 'No categories yet — create the first one.',

    'categoryForm.slug': 'Slug',
    'categoryForm.slugHelp':
      'Lowercase, dashes only. Used in URLs and as the stable identifier.',
    'categoryForm.nameEn': 'Name (English)',
    'categoryForm.nameEs': 'Name (Spanish)',
    'categoryForm.icon': 'Icon',
    'categoryForm.iconNone': '— none —',
    'categoryForm.iconHelp': "Must match a name in the mobile app's Icon component.",
    'categoryForm.sortOrder': 'Sort order',
    'categoryForm.visible': 'Visible to users',
    'categoryForm.saving': 'Saving…',
    'categoryForm.cancel': 'Cancel',

    'categories.newPage.title': 'New category',
    'categories.newPage.subtitle':
      'Adds a category that mobile users can filter expeditions by.',
    'categories.newPage.submit': 'Create category',
    'categories.editPage.title': 'Edit category',
    'categories.editPage.submit': 'Save changes',

    'error.category.required': 'Slug, English name, and Spanish name are required.',
    'error.category.slugFormat':
      'Slug must be lowercase letters, numbers, and dashes only.',

    'expeditions.title': 'Expeditions',
    'expeditions.subtitle': 'Curated experiences shown in the mobile feed.',
    'expeditions.new': 'New expedition',
    'expeditions.col.title': 'Title',
    'expeditions.col.category': 'Category',
    'expeditions.col.location': 'Location',
    'expeditions.col.price': 'Price',
    'expeditions.col.status': 'Status',
    'expeditions.col.actions': 'Actions',
    'expeditions.free': 'Free',
    'expeditions.status.published': 'Published',
    'expeditions.status.draft': 'Draft',
    'expeditions.badge.official': 'Official',
    'expeditions.empty': 'No expeditions yet — create the first one.',

    'expForm.title': 'Title',
    'expForm.description': 'Description',
    'expForm.category': 'Category',
    'expForm.selectCategory': 'Select a category',
    'expForm.difficulty': 'Difficulty (1–5)',
    'expForm.location': 'Location',
    'expForm.region': 'Region',
    'expForm.country': 'Country',
    'expForm.startLat': 'Start latitude',
    'expForm.startLng': 'Start longitude',
    'expForm.locationSearch': 'Search for a place',
    'expForm.locationSearchPlaceholder': 'Search a place, town or natural landmark…',
    'expForm.locationSearching': 'Searching…',
    'expForm.locationNoResults': 'No matches — try a broader name.',
    'expForm.locationHelp':
      'Click the map or drag the marker to fine-tune. The lat/lng below stay editable.',
    'expForm.distance': 'Distance (km)',
    'expForm.elevation': 'Elevation gain (m)',
    'expForm.currency': 'Currency',
    'expForm.priceCents': 'Price (in cents — 0 = free)',
    'expForm.priceHelp':
      "Wompi expects integer cents in the order's currency. 50000 COP = 5,000,000 here.",
    'expForm.coverPhoto': 'Cover photo',
    'expForm.coverPreviewAlt': 'Cover preview',
    'expForm.coverHelp':
      'Uploads to the expedition-photos Supabase bucket. Leave empty to keep the existing photo.',
    'expForm.terrain': 'Terrain / biome',
    'expForm.terrainHelp': 'Pick every biome the expedition crosses — drives the calendar biome filter.',
    'expForm.terrain.mountain': 'Mountain',
    'expForm.terrain.flat': 'Flat',
    'expForm.terrain.desert': 'Desert',
    'expForm.terrain.river': 'River',
    'expForm.terrain.forest': 'Forest',
    'expForm.terrain.coast': 'Coast',
    'expForm.terrain.urban': 'Urban',
    'expForm.terrain.jungle': 'Jungle',
    'expForm.terrain.snow': 'Snow',
    'expForm.official': 'Official Minga listing',
    'expForm.published': 'Published (visible in mobile feed)',
    'expForm.saving': 'Saving…',
    'expForm.cancel': 'Cancel',

    'expeditions.newPage.title': 'New expedition',
    'expeditions.newPage.subtitle': 'Adds a new official Minga listing to the mobile feed.',
    'expeditions.newPage.submit': 'Create expedition',
    'expeditions.editPage.title': 'Edit expedition',
    'expeditions.editPage.submit': 'Save changes',

    'error.expedition.required':
      'Title, description, category and location are required.',
    'error.expedition.photoFailed': 'Photo upload failed: {msg}',

    'proposals.title': 'Vendor proposals',
    'proposals.subtitle':
      'Submissions from vendors offering experiences, transportation, lodging, or other services.',
    'proposals.statusFilter': 'Status filter',
    'proposals.status.new': 'New',
    'proposals.status.reviewing': 'In review',
    'proposals.status.accepted': 'Accepted',
    'proposals.status.rejected': 'Rejected',
    'proposals.status.archived': 'Archived',
    'proposals.status.all': 'All',
    'proposals.type.full_experience': 'Full experience',
    'proposals.type.transportation': 'Transportation',
    'proposals.type.lodging': 'Lodging',
    'proposals.type.guide': 'Guide',
    'proposals.type.food': 'Food',
    'proposals.type.other': 'Other',
    'proposals.col.vendor': 'Vendor',
    'proposals.col.type': 'Type',
    'proposals.col.title': 'Title',
    'proposals.col.region': 'Region',
    'proposals.col.submitted': 'Submitted',
    'proposals.col.status': 'Status',
    'proposals.col.actions': 'Actions',
    'proposals.review': 'Review',
    'proposals.empty': 'No proposals match this filter.',

    'proposalDetail.back': '← Back to proposals',
    'proposalDetail.submitted': 'Submitted',
    'proposalDetail.description': 'Description',
    'proposalDetail.pricingNotes': 'Pricing notes',
    'proposalDetail.attachments': 'Attachments',
    'proposalDetail.internalNotes': 'Internal notes',
    'proposalDetail.notesPlaceholder':
      'Visible only to admins. Outcome of phone calls, follow-ups, decision rationale, etc.',
    'proposalDetail.saveNotes': 'Save notes',
    'proposalDetail.vendor': 'Vendor',
    'proposalDetail.row.name': 'Name',
    'proposalDetail.row.email': 'Email',
    'proposalDetail.row.phone': 'Phone',
    'proposalDetail.statusTitle': 'Status',
    'proposalDetail.updateStatus': 'Update status',
    'proposalDetail.lastReviewed': 'Last reviewed',

    'orders.title': 'Orders',
    'orders.subtitle':
      'All Wompi transactions, including pending and failed payments.',
    'orders.status.pending': 'Pending',
    'orders.status.approved': 'Approved',
    'orders.status.declined': 'Declined',
    'orders.status.voided': 'Voided',
    'orders.status.error': 'Error',
    'orders.status.refunded': 'Refunded',
    'orders.status.all': 'All',
    'orders.col.reference': 'Reference',
    'orders.col.amount': 'Amount',
    'orders.col.status': 'Status',
    'orders.col.buyer': 'Buyer',
    'orders.col.created': 'Created',
    'orders.col.actions': 'Actions',
    'orders.buyer.account': 'Account',
    'orders.buyer.guest': 'Guest',
    'orders.action.view': 'View',
    'orders.empty': 'No orders match this filter.',

    'orderDetail.back': '← Back to orders',
    'orderDetail.title': 'Order detail',
    'orderDetail.payment': 'Payment',
    'orderDetail.row.status': 'Status',
    'orderDetail.row.amount': 'Amount',
    'orderDetail.row.txId': 'Wompi transaction id',
    'orderDetail.row.method': 'Payment method',
    'orderDetail.row.statusMessage': 'Status message',
    'orderDetail.row.paidAt': 'Paid at',
    'orderDetail.row.created': 'Created',
    'orderDetail.expedition': 'Expedition',
    'orderDetail.expeditionDeleted': 'Expedition deleted.',
    'orderDetail.buyer': 'Buyer',
    'orderDetail.guestNoName': '(no name)',
    'orderDetail.guestSignedIn': 'Signed-in account',
    'orderDetail.guestClaimed': 'Claimed',
    'orderDetail.guestUnclaimed': 'Unclaimed guest',
    'orderDetail.buyerNone': 'No buyer linked.',
    'orderDetail.salida': 'Salida (departure)',
    'orderDetail.salidaNone': 'No specific salida — template-level order.',

    'salidas.title': 'Salidas',
    'salidas.subtitle':
      'Scheduled departures for this expedition template. Buyers pick a specific salida at checkout.',
    'salidas.new': 'New salida',
    'salidas.back': '← Back to expedition',
    'salidas.manage': 'Manage salidas',
    'salidas.col.starts': 'Starts',
    'salidas.col.ends': 'Ends',
    'salidas.col.capacity': 'Capacity',
    'salidas.col.seats': 'Booked',
    'salidas.col.price': 'Price',
    'salidas.col.status': 'Status',
    'salidas.col.actions': 'Actions',
    'salidas.status.published': 'Published',
    'salidas.status.draft': 'Draft',
    'salidas.status.soldOut': 'Sold out',
    'salidas.inheritsPrice': 'Template price',
    'salidas.unlimited': 'Open',
    'salidas.empty': 'No salidas yet — add the first scheduled departure.',
    'salidas.newPage.title': 'New salida',
    'salidas.newPage.submit': 'Create salida',
    'salidas.editPage.title': 'Edit salida',
    'salidas.editPage.submit': 'Save changes',

    'salidaForm.starts': 'Starts at',
    'salidaForm.ends': 'Ends at (optional)',
    'salidaForm.timezone': 'Time zone',
    'salidaForm.capacity': 'Capacity',
    'salidaForm.capacityHelp': 'Leave blank for open capacity (no cap).',
    'salidaForm.seatsTaken': 'Seats booked',
    'salidaForm.seatsHelp': 'Manual override — Wompi webhooks bump this automatically.',
    'salidaForm.priceCents': 'Price override (cents)',
    'salidaForm.priceHelp':
      'Leave blank to inherit the template price. Match the cents-in-currency format Wompi expects.',
    'salidaForm.currency': 'Currency override',
    'salidaForm.notes': 'Internal notes',
    'salidaForm.published': 'Published (sellable & visible in calendar)',
    'salidaForm.saving': 'Saving…',
    'salidaForm.cancel': 'Cancel',
    'error.salida.required': 'Start date and time are required.',
    'error.salida.invalidWindow': 'End time must be after start time.',

    'calendar.title': 'Calendar',
    'calendar.subtitle': 'All scheduled salidas across every expedition template.',
    'calendar.prev': '← Prev',
    'calendar.next': 'Next →',
    'calendar.today': 'Today',
    'calendar.empty': 'No salidas match these filters.',
    'calendar.filters.title': 'Filters',
    'calendar.filters.category': 'Category',
    'calendar.filters.region': 'Region',
    'calendar.filters.difficulty': 'Difficulty',
    'calendar.filters.price': 'Price',
    'calendar.filters.all': 'All',
    'calendar.filters.free': 'Free only',
    'calendar.filters.paid': 'Paid only',
    'calendar.filters.reset': 'Reset filters',
    'calendar.legend.published': 'Published',
    'calendar.legend.draft': 'Draft',
    'calendar.legend.soldOut': 'Sold out',

    'comms.title': 'Communications',
    'comms.subtitle':
      'Per-event message templates. Each event supports an email and a WhatsApp variant, in English and Spanish.',
    'comms.event.heading': 'Event',
    'comms.template.empty': 'No template yet for this combination.',
    'comms.template.subject': 'Subject (email only)',
    'comms.template.body': 'Body',
    'comms.template.locale': 'Language',
    'comms.template.channel': 'Channel',
    'comms.template.active': 'Active',
    'comms.template.save': 'Save template',
    'comms.template.saved': 'Saved ✓',
    'comms.template.placeholdersHelp':
      'Use {display_name}, {expedition_title}, {salida_starts_at}, {distance_km}, {elevation_m}, {new_tier}, {total_distance_km}.',
    'comms.channel.email': 'Email',
    'comms.channel.whatsapp': 'WhatsApp',
    'comms.tabs.automated': 'Automated',
    'comms.tabs.automatedDesc': 'Triggered by events',
    'comms.tabs.broadcasts': 'Broadcasts',
    'comms.tabs.broadcastsDesc': 'Sent manually by an admin',
    'comms.broadcasts.back': '← Back to broadcasts',
    'comms.broadcasts.subtitle':
      'Reusable templates for one-off sends: promos, announcements, new-trip launches. Compose once, pick at send time.',
    'comms.broadcasts.empty': 'No broadcast templates yet. Create one to get started.',
    'comms.broadcasts.new': 'New broadcast template',
    'comms.broadcasts.newTitle': 'New broadcast template',
    'comms.broadcasts.delete': 'Delete template',
    'comms.broadcasts.save': 'Save template',
    'comms.broadcasts.saved': 'Saved ✓',
    'comms.broadcasts.field.name': 'Internal name',
    'comms.broadcasts.field.category': 'Category',
    'comms.broadcasts.field.channel': 'Channel',
    'comms.broadcasts.field.locale': 'Language',
    'comms.broadcasts.field.subject': 'Subject (email only)',
    'comms.broadcasts.field.body': 'Body',
    'comms.broadcasts.category.announcement': 'Announcement',
    'comms.broadcasts.category.promotion': 'Promotion',
    'comms.broadcasts.category.new_trip': 'New trip',
    'comms.broadcasts.category.reminder': 'Reminder',
    'comms.broadcasts.category.other': 'Other',

    'photoGallery.heading': 'Photo gallery',
    'photoGallery.subtitle':
      'Reorder, add, or remove gallery photos. The first photo is used as the card cover and the leading slide of the carousel.',
    'photoGallery.upload': 'Add photos',
    'photoGallery.uploadHelp': 'Select one or more files; they upload in order and append to the end.',
    'photoGallery.empty': 'No photos yet — drop a few in below to enable the carousel on the detail page.',
    'photoGallery.moveUp': 'Move up',
    'photoGallery.moveDown': 'Move down',
    'photoGallery.delete': 'Delete photo',
    'photoGallery.coverBadge': 'Cover',
  },
  es: {
    'login.title': 'Minga Admin',
    'login.subtitle': 'Inicia sesión con una cuenta de administrador.',
    'login.email': 'Correo',
    'login.password': 'Contraseña',
    'login.signIn': 'Iniciar sesión',
    'login.signingIn': 'Iniciando sesión…',
    'login.required': 'El correo y la contraseña son obligatorios.',
    'login.error.missingProfile':
      'Tu cuenta aún no tiene un perfil de Minga — contacta a un administrador existente.',
    'login.error.notAdmin':
      'Esta cuenta no está autorizada para el panel de administración.',

    'sidebar.brandSub': 'Consola de administración',
    'sidebar.dashboard': 'Panel',
    'sidebar.categories': 'Categorías',
    'sidebar.expeditions': 'Expediciones',
    'sidebar.calendar': 'Calendario',
    'sidebar.vendorProposals': 'Propuestas de proveedores',
    'sidebar.orders': 'Pedidos',
    'sidebar.comms': 'Comunicaciones',
    'sidebar.signOut': 'Cerrar sesión',
    'sidebar.language': 'Idioma',
    'sidebar.group.expeditions': 'Expediciones',
    'sidebar.group.users': 'Usuarios',
    'sidebar.group.providers': 'Proveedores',
    'sidebar.group.communications': 'Comunicaciones',
    'sidebar.item.categories': 'Categorías',
    'sidebar.item.itineraries': 'Itinerarios',
    'sidebar.item.dates': 'Fechas',
    'sidebar.item.insights': 'Métricas',
    'sidebar.item.userProfiles': 'Perfiles',
    'sidebar.item.orders': 'Pedidos',
    'sidebar.item.propuestas': 'Propuestas',
    'sidebar.item.directory': 'Directorio',
    'sidebar.item.communications': 'Comunicaciones',
    'stub.title': 'Próximamente',
    'stub.subtitle': 'La página vive en esta ruta — la UI aún está en construcción. El modelo de datos ya está listo.',
    'stub.dataReady': 'Datos listos ✓',
    'lang.english': 'English',
    'lang.spanish': 'Español',

    'dashboard.title': 'Panel',
    'dashboard.subtitle': 'Resumen general de la plataforma.',
    'dashboard.stat.expeditions': 'Expediciones',
    'dashboard.stat.categories': 'Categorías',
    'dashboard.stat.profiles': 'Perfiles',
    'dashboard.stat.newProposals': 'Propuestas nuevas',
    'dashboard.stat.approvedOrders': 'Pedidos aprobados',
    'dashboard.stat.pendingOrders': 'Pedidos pendientes',
    'dashboard.stat.declinedOrders': 'Pedidos rechazados',
    'dashboard.unreviewedOne': '{n} propuesta de proveedor sin revisar',
    'dashboard.unreviewedMany': '{n} propuestas de proveedor sin revisar',
    'dashboard.unreviewedBody':
      'Revisa las propuestas y actualiza su estado para mantener la fila en movimiento.',
    'dashboard.reviewNow': 'Revisar ahora',

    'categories.title': 'Categorías',
    'categories.subtitle':
      'Alimenta los filtros de la app móvil y el selector de cada expedición.',
    'categories.new': 'Nueva categoría',
    'categories.col.slug': 'Slug',
    'categories.col.english': 'Inglés',
    'categories.col.spanish': 'Español',
    'categories.col.icon': 'Icono',
    'categories.col.sort': 'Orden',
    'categories.col.active': 'Activa',
    'categories.col.actions': 'Acciones',
    'categories.status.active': 'Activa',
    'categories.status.hidden': 'Oculta',
    'categories.action.edit': 'Editar',
    'categories.action.delete': 'Eliminar',
    'categories.empty': 'Aún no hay categorías — crea la primera.',

    'categoryForm.slug': 'Slug',
    'categoryForm.slugHelp':
      'En minúsculas, sólo guiones. Se usa en URLs y como identificador estable.',
    'categoryForm.nameEn': 'Nombre (Inglés)',
    'categoryForm.nameEs': 'Nombre (Español)',
    'categoryForm.icon': 'Icono',
    'categoryForm.iconNone': '— ninguno —',
    'categoryForm.iconHelp':
      'Debe coincidir con un nombre del componente Icon de la app móvil.',
    'categoryForm.sortOrder': 'Orden',
    'categoryForm.visible': 'Visible para los usuarios',
    'categoryForm.saving': 'Guardando…',
    'categoryForm.cancel': 'Cancelar',

    'categories.newPage.title': 'Nueva categoría',
    'categories.newPage.subtitle':
      'Agrega una categoría con la que los usuarios móviles puedan filtrar expediciones.',
    'categories.newPage.submit': 'Crear categoría',
    'categories.editPage.title': 'Editar categoría',
    'categories.editPage.submit': 'Guardar cambios',

    'error.category.required':
      'El slug, el nombre en inglés y el nombre en español son obligatorios.',
    'error.category.slugFormat':
      'El slug solo puede tener letras minúsculas, números y guiones.',

    'expeditions.title': 'Expediciones',
    'expeditions.subtitle': 'Experiencias curadas mostradas en el feed móvil.',
    'expeditions.new': 'Nueva expedición',
    'expeditions.col.title': 'Título',
    'expeditions.col.category': 'Categoría',
    'expeditions.col.location': 'Ubicación',
    'expeditions.col.price': 'Precio',
    'expeditions.col.status': 'Estado',
    'expeditions.col.actions': 'Acciones',
    'expeditions.free': 'Gratis',
    'expeditions.status.published': 'Publicada',
    'expeditions.status.draft': 'Borrador',
    'expeditions.badge.official': 'Oficial',
    'expeditions.empty': 'Aún no hay expediciones — crea la primera.',

    'expForm.title': 'Título',
    'expForm.description': 'Descripción',
    'expForm.category': 'Categoría',
    'expForm.selectCategory': 'Selecciona una categoría',
    'expForm.difficulty': 'Dificultad (1–5)',
    'expForm.location': 'Ubicación',
    'expForm.region': 'Región',
    'expForm.country': 'País',
    'expForm.startLat': 'Latitud de inicio',
    'expForm.startLng': 'Longitud de inicio',
    'expForm.locationSearch': 'Buscar un lugar',
    'expForm.locationSearchPlaceholder':
      'Busca un lugar, municipio o referencia natural…',
    'expForm.locationSearching': 'Buscando…',
    'expForm.locationNoResults': 'Sin resultados — prueba un nombre más amplio.',
    'expForm.locationHelp':
      'Haz clic en el mapa o arrastra el marcador para ajustar. Puedes editar la latitud/longitud abajo.',
    'expForm.distance': 'Distancia (km)',
    'expForm.elevation': 'Desnivel positivo (m)',
    'expForm.currency': 'Moneda',
    'expForm.priceCents': 'Precio (en centavos — 0 = gratis)',
    'expForm.priceHelp':
      'Wompi espera centavos enteros en la moneda del pedido. 50000 COP = 5.000.000 aquí.',
    'expForm.coverPhoto': 'Foto de portada',
    'expForm.coverPreviewAlt': 'Vista previa de portada',
    'expForm.coverHelp':
      'Sube al bucket expedition-photos de Supabase. Déjalo vacío para conservar la foto actual.',
    'expForm.terrain': 'Terreno / bioma',
    'expForm.terrainHelp': 'Marca cada bioma que cruza la expedición — alimenta el filtro de bioma del calendario.',
    'expForm.terrain.mountain': 'Montaña',
    'expForm.terrain.flat': 'Llano',
    'expForm.terrain.desert': 'Desierto',
    'expForm.terrain.river': 'Río',
    'expForm.terrain.forest': 'Bosque',
    'expForm.terrain.coast': 'Costa',
    'expForm.terrain.urban': 'Urbano',
    'expForm.terrain.jungle': 'Selva',
    'expForm.terrain.snow': 'Nieve',
    'expForm.official': 'Listado oficial de Minga',
    'expForm.published': 'Publicada (visible en el feed móvil)',
    'expForm.saving': 'Guardando…',
    'expForm.cancel': 'Cancelar',

    'expeditions.newPage.title': 'Nueva expedición',
    'expeditions.newPage.subtitle':
      'Agrega un nuevo listado oficial de Minga al feed móvil.',
    'expeditions.newPage.submit': 'Crear expedición',
    'expeditions.editPage.title': 'Editar expedición',
    'expeditions.editPage.submit': 'Guardar cambios',

    'error.expedition.required':
      'El título, la descripción, la categoría y la ubicación son obligatorios.',
    'error.expedition.photoFailed': 'Falló la carga de la foto: {msg}',

    'proposals.title': 'Propuestas de proveedores',
    'proposals.subtitle':
      'Envíos de proveedores que ofrecen experiencias, transporte, alojamiento u otros servicios.',
    'proposals.statusFilter': 'Filtro de estado',
    'proposals.status.new': 'Nueva',
    'proposals.status.reviewing': 'En revisión',
    'proposals.status.accepted': 'Aceptada',
    'proposals.status.rejected': 'Rechazada',
    'proposals.status.archived': 'Archivada',
    'proposals.status.all': 'Todas',
    'proposals.type.full_experience': 'Experiencia completa',
    'proposals.type.transportation': 'Transporte',
    'proposals.type.lodging': 'Alojamiento',
    'proposals.type.guide': 'Guía',
    'proposals.type.food': 'Comida',
    'proposals.type.other': 'Otra',
    'proposals.col.vendor': 'Proveedor',
    'proposals.col.type': 'Tipo',
    'proposals.col.title': 'Título',
    'proposals.col.region': 'Región',
    'proposals.col.submitted': 'Enviada',
    'proposals.col.status': 'Estado',
    'proposals.col.actions': 'Acciones',
    'proposals.review': 'Revisar',
    'proposals.empty': 'Ninguna propuesta coincide con este filtro.',

    'proposalDetail.back': '← Volver a propuestas',
    'proposalDetail.submitted': 'Enviada',
    'proposalDetail.description': 'Descripción',
    'proposalDetail.pricingNotes': 'Notas de precios',
    'proposalDetail.attachments': 'Archivos adjuntos',
    'proposalDetail.internalNotes': 'Notas internas',
    'proposalDetail.notesPlaceholder':
      'Visible sólo para administradores. Resultado de llamadas, seguimientos, razón de la decisión, etc.',
    'proposalDetail.saveNotes': 'Guardar notas',
    'proposalDetail.vendor': 'Proveedor',
    'proposalDetail.row.name': 'Nombre',
    'proposalDetail.row.email': 'Correo',
    'proposalDetail.row.phone': 'Teléfono',
    'proposalDetail.statusTitle': 'Estado',
    'proposalDetail.updateStatus': 'Actualizar estado',
    'proposalDetail.lastReviewed': 'Última revisión',

    'orders.title': 'Pedidos',
    'orders.subtitle':
      'Todas las transacciones de Wompi, incluidas las pendientes y las fallidas.',
    'orders.status.pending': 'Pendiente',
    'orders.status.approved': 'Aprobado',
    'orders.status.declined': 'Rechazado',
    'orders.status.voided': 'Anulado',
    'orders.status.error': 'Error',
    'orders.status.refunded': 'Reembolsado',
    'orders.status.all': 'Todos',
    'orders.col.reference': 'Referencia',
    'orders.col.amount': 'Monto',
    'orders.col.status': 'Estado',
    'orders.col.buyer': 'Comprador',
    'orders.col.created': 'Creado',
    'orders.col.actions': 'Acciones',
    'orders.buyer.account': 'Cuenta',
    'orders.buyer.guest': 'Invitado',
    'orders.action.view': 'Ver',
    'orders.empty': 'Ningún pedido coincide con este filtro.',

    'orderDetail.back': '← Volver a pedidos',
    'orderDetail.title': 'Detalle del pedido',
    'orderDetail.payment': 'Pago',
    'orderDetail.row.status': 'Estado',
    'orderDetail.row.amount': 'Monto',
    'orderDetail.row.txId': 'ID de transacción de Wompi',
    'orderDetail.row.method': 'Método de pago',
    'orderDetail.row.statusMessage': 'Mensaje de estado',
    'orderDetail.row.paidAt': 'Pagado el',
    'orderDetail.row.created': 'Creado',
    'orderDetail.expedition': 'Expedición',
    'orderDetail.expeditionDeleted': 'Expedición eliminada.',
    'orderDetail.buyer': 'Comprador',
    'orderDetail.guestNoName': '(sin nombre)',
    'orderDetail.guestSignedIn': 'Cuenta con sesión iniciada',
    'orderDetail.guestClaimed': 'Reclamado',
    'orderDetail.guestUnclaimed': 'Invitado sin reclamar',
    'orderDetail.buyerNone': 'Sin comprador vinculado.',
    'orderDetail.salida': 'Salida (fecha)',
    'orderDetail.salidaNone': 'Sin salida específica — pedido a nivel de plantilla.',

    'salidas.title': 'Salidas',
    'salidas.subtitle':
      'Fechas programadas para esta plantilla de expedición. Los compradores eligen una salida al pagar.',
    'salidas.new': 'Nueva salida',
    'salidas.back': '← Volver a la expedición',
    'salidas.manage': 'Gestionar salidas',
    'salidas.col.starts': 'Inicia',
    'salidas.col.ends': 'Termina',
    'salidas.col.capacity': 'Cupos',
    'salidas.col.seats': 'Reservados',
    'salidas.col.price': 'Precio',
    'salidas.col.status': 'Estado',
    'salidas.col.actions': 'Acciones',
    'salidas.status.published': 'Publicada',
    'salidas.status.draft': 'Borrador',
    'salidas.status.soldOut': 'Agotada',
    'salidas.inheritsPrice': 'Precio plantilla',
    'salidas.unlimited': 'Abierto',
    'salidas.empty': 'Aún no hay salidas — agrega la primera fecha.',
    'salidas.newPage.title': 'Nueva salida',
    'salidas.newPage.submit': 'Crear salida',
    'salidas.editPage.title': 'Editar salida',
    'salidas.editPage.submit': 'Guardar cambios',

    'salidaForm.starts': 'Inicia el',
    'salidaForm.ends': 'Termina el (opcional)',
    'salidaForm.timezone': 'Zona horaria',
    'salidaForm.capacity': 'Cupos',
    'salidaForm.capacityHelp': 'Déjalo vacío si la salida no tiene cupo máximo.',
    'salidaForm.seatsTaken': 'Cupos reservados',
    'salidaForm.seatsHelp':
      'Ajuste manual — los webhooks de Wompi incrementan este número automáticamente.',
    'salidaForm.priceCents': 'Precio (en centavos, opcional)',
    'salidaForm.priceHelp':
      'Vacío para heredar el precio de la plantilla. Formato: centavos enteros en la moneda Wompi.',
    'salidaForm.currency': 'Moneda (opcional)',
    'salidaForm.notes': 'Notas internas',
    'salidaForm.published': 'Publicada (disponible para reservar y visible en el calendario)',
    'salidaForm.saving': 'Guardando…',
    'salidaForm.cancel': 'Cancelar',
    'error.salida.required': 'La fecha y hora de inicio son obligatorias.',
    'error.salida.invalidWindow': 'La hora de fin debe ser posterior a la de inicio.',

    'calendar.title': 'Calendario',
    'calendar.subtitle': 'Todas las salidas programadas en cada plantilla de expedición.',
    'calendar.prev': '← Anterior',
    'calendar.next': 'Siguiente →',
    'calendar.today': 'Hoy',
    'calendar.empty': 'Ninguna salida coincide con los filtros.',
    'calendar.filters.title': 'Filtros',
    'calendar.filters.category': 'Categoría',
    'calendar.filters.region': 'Región',
    'calendar.filters.difficulty': 'Dificultad',
    'calendar.filters.price': 'Precio',
    'calendar.filters.all': 'Todos',
    'calendar.filters.free': 'Solo gratis',
    'calendar.filters.paid': 'Solo pago',
    'calendar.filters.reset': 'Restablecer',
    'calendar.legend.published': 'Publicada',
    'calendar.legend.draft': 'Borrador',
    'calendar.legend.soldOut': 'Agotada',

    'comms.title': 'Comunicaciones',
    'comms.subtitle':
      'Plantillas de mensajes por evento. Cada evento tiene variantes para correo y WhatsApp, en inglés y español.',
    'comms.event.heading': 'Evento',
    'comms.template.empty': 'Aún no hay plantilla para esta combinación.',
    'comms.template.subject': 'Asunto (solo correo)',
    'comms.template.body': 'Cuerpo',
    'comms.template.locale': 'Idioma',
    'comms.template.channel': 'Canal',
    'comms.template.active': 'Activa',
    'comms.template.save': 'Guardar plantilla',
    'comms.template.saved': 'Guardada ✓',
    'comms.template.placeholdersHelp':
      'Usa {display_name}, {expedition_title}, {salida_starts_at}, {distance_km}, {elevation_m}, {new_tier}, {total_distance_km}.',
    'comms.channel.email': 'Correo',
    'comms.channel.whatsapp': 'WhatsApp',
    'comms.tabs.automated': 'Automáticas',
    'comms.tabs.automatedDesc': 'Disparadas por eventos',
    'comms.tabs.broadcasts': 'Envíos',
    'comms.tabs.broadcastsDesc': 'Las envía un admin manualmente',
    'comms.broadcasts.back': '← Volver a envíos',
    'comms.broadcasts.subtitle':
      'Plantillas reutilizables para envíos puntuales: promos, anuncios, lanzamientos de viajes. Las compones una vez y eliges al enviar.',
    'comms.broadcasts.empty': 'Aún no hay plantillas de envío. Crea una para empezar.',
    'comms.broadcasts.new': 'Nueva plantilla',
    'comms.broadcasts.newTitle': 'Nueva plantilla de envío',
    'comms.broadcasts.delete': 'Eliminar plantilla',
    'comms.broadcasts.save': 'Guardar plantilla',
    'comms.broadcasts.saved': 'Guardada ✓',
    'comms.broadcasts.field.name': 'Nombre interno',
    'comms.broadcasts.field.category': 'Categoría',
    'comms.broadcasts.field.channel': 'Canal',
    'comms.broadcasts.field.locale': 'Idioma',
    'comms.broadcasts.field.subject': 'Asunto (solo correo)',
    'comms.broadcasts.field.body': 'Cuerpo',
    'comms.broadcasts.category.announcement': 'Anuncio',
    'comms.broadcasts.category.promotion': 'Promoción',
    'comms.broadcasts.category.new_trip': 'Nuevo viaje',
    'comms.broadcasts.category.reminder': 'Recordatorio',
    'comms.broadcasts.category.other': 'Otro',

    'photoGallery.heading': 'Galería de fotos',
    'photoGallery.subtitle':
      'Reordena, agrega o elimina fotos. La primera foto se usa como portada de la tarjeta y como primera diapositiva del carrusel.',
    'photoGallery.upload': 'Agregar fotos',
    'photoGallery.uploadHelp':
      'Selecciona uno o más archivos; se suben en orden y se agregan al final.',
    'photoGallery.empty':
      'Aún no hay fotos — sube algunas abajo para habilitar el carrusel en el detalle.',
    'photoGallery.moveUp': 'Subir',
    'photoGallery.moveDown': 'Bajar',
    'photoGallery.delete': 'Eliminar foto',
    'photoGallery.coverBadge': 'Portada',
  },
};

export function translate(locale: Locale, key: Key, vars?: Record<string, string | number>): string {
  let s = dict[locale][key] ?? dict.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
