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
  | 'sidebar.vendorProposals'
  | 'sidebar.orders'
  | 'sidebar.signOut'
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
  | 'orderDetail.buyerNone';

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
    'sidebar.vendorProposals': 'Vendor proposals',
    'sidebar.orders': 'Orders',
    'sidebar.signOut': 'Sign out',
    'sidebar.language': 'Language',
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
    'sidebar.vendorProposals': 'Propuestas de proveedores',
    'sidebar.orders': 'Pedidos',
    'sidebar.signOut': 'Cerrar sesión',
    'sidebar.language': 'Idioma',
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
  },
};

export function translate(locale: Locale, key: Key, vars?: Record<string, string | number>): string {
  let s = dict[locale][key] ?? dict.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
