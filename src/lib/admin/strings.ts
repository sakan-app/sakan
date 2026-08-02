import type { FeatureDictionary } from "@/i18n/feature";

export type AdminStrings = {
  nav: {
    dashboard: string;
    users: string;
    verification: string;
    reports: string;
    subscriptions: string;
    audit: string;
    roles: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    empty: string;
    search: string;
    status: string;
    all: string;
    page: string;
    of: string;
    next: string;
    previous: string;
    actions: string;
    apply: string;
    cancel: string;
    save: string;
    notes: string;
    confirm: string;
    success: string;
    failure: string;
    selected: string;
    bulkActions: string;
    filter: string;
    id: string;
    createdAt: string;
    unauthorizedRedirect: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    usersTotal: string;
    usersNew7d: string;
    usersActive24h: string;
    revenueThisMonth: string;
    reportsOpen: string;
    verificationsPending: string;
    messages7d: string;
    subscriptionsByPlan: string;
    signupsChart: string;
    revenueChart: string;
  };
  users: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterStatus: string;
    filterVerified: string;
    active: string;
    suspended: string;
    verified: string;
    unverified: string;
    name: string;
    city: string;
    joined: string;
    lastSeen: string;
    roles: string;
    view: string;
    suspend: string;
    unsuspend: string;
    ban: string;
    banConfirm: string;
    suspendReason: string;
    noUsers: string;
  };
  userDetail: {
    title: string;
    back: string;
    email: string;
    profile: string;
    subscription: string;
    payments: string;
    reportsFiled: string;
    reportsAgainst: string;
    grantRole: string;
    revokeRole: string;
    noSubscription: string;
    noPayments: string;
    notFound: string;
  };
  verification: {
    title: string;
    subtitle: string;
    pending: string;
    approved: string;
    rejected: string;
    approve: string;
    reject: string;
    reviewNotes: string;
    document: string;
    selfie: string;
    noRequests: string;
  };
  reports: {
    title: string;
    subtitle: string;
    open: string;
    reviewing: string;
    resolved: string;
    dismissed: string;
    reason: string;
    reporter: string;
    reported: string;
    resolve: string;
    dismiss: string;
    noReports: string;
    flagsTitle: string;
    flagsSubtitle: string;
    flagged: string;
    approve: string;
    reject: string;
    subjectType: string;
    excerpt: string;
    noFlags: string;
  };
  subscriptions: {
    title: string;
    subtitle: string;
    plan: string;
    status: string;
    interval: string;
    periodEnd: string;
    paymentsTitle: string;
    amount: string;
    provider: string;
    noSubscriptions: string;
    noPayments: string;
  };
  audit: {
    title: string;
    subtitle: string;
    action: string;
    admin: string;
    target: string;
    when: string;
    details: string;
    noEntries: string;
    filterAction: string;
    filterAdmin: string;
  };
  roles: {
    title: string;
    subtitle: string;
    userIdPlaceholder: string;
    grant: string;
    revoke: string;
    adminOnlyNotice: string;
  };
};

export const adminStrings: FeatureDictionary<AdminStrings> = {
  ar: {
    nav: {
      dashboard: "لوحة التحكم",
      users: "المستخدمون",
      verification: "التوثيق",
      reports: "البلاغات",
      subscriptions: "الاشتراكات",
      audit: "سجل النشاط",
      roles: "الصلاحيات",
    },
    common: {
      loading: "جارٍ التحميل…",
      error: "حدث خطأ ما.",
      retry: "إعادة المحاولة",
      empty: "لا توجد بيانات لعرضها.",
      search: "بحث",
      status: "الحالة",
      all: "الكل",
      page: "صفحة",
      of: "من",
      next: "التالي",
      previous: "السابق",
      actions: "إجراءات",
      apply: "تطبيق",
      cancel: "إلغاء",
      save: "حفظ",
      notes: "ملاحظات",
      confirm: "تأكيد",
      success: "تم بنجاح.",
      failure: "فشل تنفيذ الإجراء.",
      selected: "محدد",
      bulkActions: "إجراءات جماعية",
      filter: "تصفية",
      id: "المعرّف",
      createdAt: "تاريخ الإنشاء",
      unauthorizedRedirect: "لا تملك صلاحية الوصول إلى لوحة الإدارة.",
    },
    dashboard: {
      title: "لوحة تحكم الإدارة",
      subtitle: "نظرة عامة على أداء المنصة وصحتها.",
      usersTotal: "إجمالي المستخدمين",
      usersNew7d: "مستخدمون جدد (7 أيام)",
      usersActive24h: "نشطون خلال 24 ساعة",
      revenueThisMonth: "إيرادات هذا الشهر",
      reportsOpen: "بلاغات مفتوحة",
      verificationsPending: "توثيقات بانتظار المراجعة",
      messages7d: "رسائل مرسلة (7 أيام)",
      subscriptionsByPlan: "الاشتراكات حسب الباقة",
      signupsChart: "التسجيلات اليومية",
      revenueChart: "الإيرادات اليومية",
    },
    users: {
      title: "المستخدمون",
      subtitle: "إدارة الحسابات والأدوار والحالة.",
      searchPlaceholder: "ابحث بالاسم…",
      filterStatus: "الحالة",
      filterVerified: "التوثيق",
      active: "نشط",
      suspended: "موقوف",
      verified: "موثّق",
      unverified: "غير موثّق",
      name: "الاسم",
      city: "المدينة",
      joined: "تاريخ الانضمام",
      lastSeen: "آخر ظهور",
      roles: "الأدوار",
      view: "عرض",
      suspend: "إيقاف",
      unsuspend: "إلغاء الإيقاف",
      ban: "حظر",
      banConfirm: "هل تريد حظر هذا المستخدم نهائيًا؟",
      suspendReason: "سبب الإجراء (اختياري)",
      noUsers: "لا يوجد مستخدمون مطابقون.",
    },
    userDetail: {
      title: "تفاصيل المستخدم",
      back: "رجوع إلى القائمة",
      email: "البريد الإلكتروني",
      profile: "الملف الشخصي",
      subscription: "الاشتراك",
      payments: "المدفوعات",
      reportsFiled: "بلاغات قدّمها",
      reportsAgainst: "بلاغات ضده",
      grantRole: "منح دور",
      revokeRole: "سحب دور",
      noSubscription: "لا يوجد اشتراك نشط.",
      noPayments: "لا توجد مدفوعات مسجّلة.",
      notFound: "المستخدم غير موجود.",
    },
    verification: {
      title: "طلبات التوثيق",
      subtitle: "راجع مستندات وصور المستخدمين للتحقق من الهوية.",
      pending: "قيد الانتظار",
      approved: "مقبول",
      rejected: "مرفوض",
      approve: "قبول",
      reject: "رفض",
      reviewNotes: "ملاحظات المراجعة",
      document: "المستند",
      selfie: "صورة شخصية",
      noRequests: "لا توجد طلبات توثيق.",
    },
    reports: {
      title: "البلاغات",
      subtitle: "راجع بلاغات المستخدمين واتخذ الإجراء المناسب.",
      open: "مفتوح",
      reviewing: "قيد المراجعة",
      resolved: "تمت المعالجة",
      dismissed: "مرفوض",
      reason: "السبب",
      reporter: "المُبلِّغ",
      reported: "المُبلَّغ عنه",
      resolve: "معالجة",
      dismiss: "رفض البلاغ",
      noReports: "لا توجد بلاغات.",
      flagsTitle: "أعلام الإشراف الآلي",
      flagsSubtitle: "محتوى تم الإبلاغ عنه تلقائيًا لمراجعته.",
      flagged: "معلَّم",
      approve: "قبول",
      reject: "رفض",
      subjectType: "نوع المحتوى",
      excerpt: "مقتطف",
      noFlags: "لا توجد أعلام إشراف.",
    },
    subscriptions: {
      title: "الاشتراكات والمدفوعات",
      subtitle: "متابعة الاشتراكات النشطة وسجل المدفوعات.",
      plan: "الباقة",
      status: "الحالة",
      interval: "الدورة",
      periodEnd: "نهاية الفترة",
      paymentsTitle: "المدفوعات",
      amount: "المبلغ",
      provider: "المزوّد",
      noSubscriptions: "لا توجد اشتراكات.",
      noPayments: "لا توجد مدفوعات.",
    },
    audit: {
      title: "سجل النشاط",
      subtitle: "سجل تدقيق لكل الإجراءات الإدارية.",
      action: "الإجراء",
      admin: "المسؤول",
      target: "الهدف",
      when: "الوقت",
      details: "التفاصيل",
      noEntries: "لا توجد سجلات.",
      filterAction: "تصفية حسب الإجراء",
      filterAdmin: "تصفية حسب المسؤول",
    },
    roles: {
      title: "إدارة الصلاحيات",
      subtitle: "منح أو سحب أدوار المشرفين والمراقبين.",
      userIdPlaceholder: "معرّف المستخدم (UUID)",
      grant: "منح",
      revoke: "سحب",
      adminOnlyNotice: "هذه الصفحة متاحة للمسؤولين فقط.",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      users: "Users",
      verification: "Verification",
      reports: "Reports",
      subscriptions: "Subscriptions",
      audit: "Audit Log",
      roles: "Roles",
    },
    common: {
      loading: "Loading…",
      error: "Something went wrong.",
      retry: "Retry",
      empty: "No data to show.",
      search: "Search",
      status: "Status",
      all: "All",
      page: "Page",
      of: "of",
      next: "Next",
      previous: "Previous",
      actions: "Actions",
      apply: "Apply",
      cancel: "Cancel",
      save: "Save",
      notes: "Notes",
      confirm: "Confirm",
      success: "Done successfully.",
      failure: "Action failed.",
      selected: "selected",
      bulkActions: "Bulk actions",
      filter: "Filter",
      id: "ID",
      createdAt: "Created",
      unauthorizedRedirect: "You don't have access to the admin panel.",
    },
    dashboard: {
      title: "Admin Dashboard",
      subtitle: "An overview of platform health and activity.",
      usersTotal: "Total users",
      usersNew7d: "New users (7d)",
      usersActive24h: "Active in 24h",
      revenueThisMonth: "Revenue this month",
      reportsOpen: "Open reports",
      verificationsPending: "Pending verifications",
      messages7d: "Messages sent (7d)",
      subscriptionsByPlan: "Subscriptions by plan",
      signupsChart: "Daily signups",
      revenueChart: "Daily revenue",
    },
    users: {
      title: "Users",
      subtitle: "Manage accounts, roles, and status.",
      searchPlaceholder: "Search by name…",
      filterStatus: "Status",
      filterVerified: "Verification",
      active: "Active",
      suspended: "Suspended",
      verified: "Verified",
      unverified: "Unverified",
      name: "Name",
      city: "City",
      joined: "Joined",
      lastSeen: "Last seen",
      roles: "Roles",
      view: "View",
      suspend: "Suspend",
      unsuspend: "Unsuspend",
      ban: "Ban",
      banConfirm: "Permanently ban this user?",
      suspendReason: "Reason (optional)",
      noUsers: "No matching users.",
    },
    userDetail: {
      title: "User details",
      back: "Back to list",
      email: "Email",
      profile: "Profile",
      subscription: "Subscription",
      payments: "Payments",
      reportsFiled: "Reports filed",
      reportsAgainst: "Reports against",
      grantRole: "Grant role",
      revokeRole: "Revoke role",
      noSubscription: "No active subscription.",
      noPayments: "No payments recorded.",
      notFound: "User not found.",
    },
    verification: {
      title: "Verification requests",
      subtitle: "Review identity documents and selfies.",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      approve: "Approve",
      reject: "Reject",
      reviewNotes: "Review notes",
      document: "Document",
      selfie: "Selfie",
      noRequests: "No verification requests.",
    },
    reports: {
      title: "Reports",
      subtitle: "Review user reports and take action.",
      open: "Open",
      reviewing: "Reviewing",
      resolved: "Resolved",
      dismissed: "Dismissed",
      reason: "Reason",
      reporter: "Reporter",
      reported: "Reported",
      resolve: "Resolve",
      dismiss: "Dismiss",
      noReports: "No reports.",
      flagsTitle: "Automated moderation flags",
      flagsSubtitle: "Content auto-flagged for review.",
      flagged: "Flagged",
      approve: "Approve",
      reject: "Reject",
      subjectType: "Subject type",
      excerpt: "Excerpt",
      noFlags: "No moderation flags.",
    },
    subscriptions: {
      title: "Subscriptions & payments",
      subtitle: "Track active subscriptions and payment history.",
      plan: "Plan",
      status: "Status",
      interval: "Interval",
      periodEnd: "Period end",
      paymentsTitle: "Payments",
      amount: "Amount",
      provider: "Provider",
      noSubscriptions: "No subscriptions.",
      noPayments: "No payments.",
    },
    audit: {
      title: "Audit log",
      subtitle: "A record of every administrative action.",
      action: "Action",
      admin: "Admin",
      target: "Target",
      when: "When",
      details: "Details",
      noEntries: "No log entries.",
      filterAction: "Filter by action",
      filterAdmin: "Filter by admin",
    },
    roles: {
      title: "Role management",
      subtitle: "Grant or revoke admin and moderator roles.",
      userIdPlaceholder: "User ID (UUID)",
      grant: "Grant",
      revoke: "Revoke",
      adminOnlyNotice: "This page is available to admins only.",
    },
  },
  de: {
    nav: {
      dashboard: "Übersicht",
      users: "Benutzer",
      verification: "Verifizierung",
      reports: "Meldungen",
      subscriptions: "Abonnements",
      audit: "Protokoll",
      roles: "Rollen",
    },
    common: {
      loading: "Wird geladen…",
      error: "Etwas ist schiefgelaufen.",
      retry: "Erneut versuchen",
      empty: "Keine Daten vorhanden.",
      search: "Suche",
      status: "Status",
      all: "Alle",
      page: "Seite",
      of: "von",
      next: "Weiter",
      previous: "Zurück",
      actions: "Aktionen",
      apply: "Anwenden",
      cancel: "Abbrechen",
      save: "Speichern",
      notes: "Notizen",
      confirm: "Bestätigen",
      success: "Erfolgreich ausgeführt.",
      failure: "Aktion fehlgeschlagen.",
      selected: "ausgewählt",
      bulkActions: "Massenaktionen",
      filter: "Filter",
      id: "ID",
      createdAt: "Erstellt",
      unauthorizedRedirect: "Sie haben keinen Zugriff auf das Admin-Panel.",
    },
    dashboard: {
      title: "Admin-Übersicht",
      subtitle: "Überblick über Zustand und Aktivität der Plattform.",
      usersTotal: "Benutzer insgesamt",
      usersNew7d: "Neue Benutzer (7 Tage)",
      usersActive24h: "Aktiv in 24 Std.",
      revenueThisMonth: "Umsatz diesen Monat",
      reportsOpen: "Offene Meldungen",
      verificationsPending: "Ausstehende Verifizierungen",
      messages7d: "Nachrichten gesendet (7 Tage)",
      subscriptionsByPlan: "Abonnements nach Tarif",
      signupsChart: "Tägliche Registrierungen",
      revenueChart: "Täglicher Umsatz",
    },
    users: {
      title: "Benutzer",
      subtitle: "Konten, Rollen und Status verwalten.",
      searchPlaceholder: "Nach Name suchen…",
      filterStatus: "Status",
      filterVerified: "Verifizierung",
      active: "Aktiv",
      suspended: "Gesperrt",
      verified: "Verifiziert",
      unverified: "Nicht verifiziert",
      name: "Name",
      city: "Stadt",
      joined: "Beigetreten",
      lastSeen: "Zuletzt gesehen",
      roles: "Rollen",
      view: "Ansehen",
      suspend: "Sperren",
      unsuspend: "Entsperren",
      ban: "Bannen",
      banConfirm: "Diesen Benutzer dauerhaft bannen?",
      suspendReason: "Grund (optional)",
      noUsers: "Keine passenden Benutzer.",
    },
    userDetail: {
      title: "Benutzerdetails",
      back: "Zurück zur Liste",
      email: "E-Mail",
      profile: "Profil",
      subscription: "Abonnement",
      payments: "Zahlungen",
      reportsFiled: "Eingereichte Meldungen",
      reportsAgainst: "Meldungen dagegen",
      grantRole: "Rolle zuweisen",
      revokeRole: "Rolle entziehen",
      noSubscription: "Kein aktives Abonnement.",
      noPayments: "Keine Zahlungen erfasst.",
      notFound: "Benutzer nicht gefunden.",
    },
    verification: {
      title: "Verifizierungsanfragen",
      subtitle: "Ausweisdokumente und Selfies prüfen.",
      pending: "Ausstehend",
      approved: "Genehmigt",
      rejected: "Abgelehnt",
      approve: "Genehmigen",
      reject: "Ablehnen",
      reviewNotes: "Prüfnotizen",
      document: "Dokument",
      selfie: "Selfie",
      noRequests: "Keine Verifizierungsanfragen.",
    },
    reports: {
      title: "Meldungen",
      subtitle: "Benutzermeldungen prüfen und bearbeiten.",
      open: "Offen",
      reviewing: "In Prüfung",
      resolved: "Erledigt",
      dismissed: "Abgewiesen",
      reason: "Grund",
      reporter: "Meldender",
      reported: "Gemeldeter",
      resolve: "Erledigen",
      dismiss: "Abweisen",
      noReports: "Keine Meldungen.",
      flagsTitle: "Automatische Moderationsflags",
      flagsSubtitle: "Automatisch markierte Inhalte zur Prüfung.",
      flagged: "Markiert",
      approve: "Genehmigen",
      reject: "Ablehnen",
      subjectType: "Inhaltstyp",
      excerpt: "Auszug",
      noFlags: "Keine Moderationsflags.",
    },
    subscriptions: {
      title: "Abonnements & Zahlungen",
      subtitle: "Aktive Abonnements und Zahlungsverlauf verfolgen.",
      plan: "Tarif",
      status: "Status",
      interval: "Intervall",
      periodEnd: "Periodenende",
      paymentsTitle: "Zahlungen",
      amount: "Betrag",
      provider: "Anbieter",
      noSubscriptions: "Keine Abonnements.",
      noPayments: "Keine Zahlungen.",
    },
    audit: {
      title: "Protokoll",
      subtitle: "Aufzeichnung aller administrativen Aktionen.",
      action: "Aktion",
      admin: "Admin",
      target: "Ziel",
      when: "Zeitpunkt",
      details: "Details",
      noEntries: "Keine Protokolleinträge.",
      filterAction: "Nach Aktion filtern",
      filterAdmin: "Nach Admin filtern",
    },
    roles: {
      title: "Rollenverwaltung",
      subtitle: "Admin- und Moderatorrollen zuweisen oder entziehen.",
      userIdPlaceholder: "Benutzer-ID (UUID)",
      grant: "Zuweisen",
      revoke: "Entziehen",
      adminOnlyNotice: "Diese Seite ist nur für Admins verfügbar.",
    },
  },
  ru: {
    nav: {
      dashboard: "Панель",
      users: "Пользователи",
      verification: "Верификация",
      reports: "Жалобы",
      subscriptions: "Подписки",
      audit: "Журнал",
      roles: "Роли",
    },
    common: {
      loading: "Загрузка…",
      error: "Что-то пошло не так.",
      retry: "Повторить",
      empty: "Нет данных для отображения.",
      search: "Поиск",
      status: "Статус",
      all: "Все",
      page: "Стр.",
      of: "из",
      next: "Далее",
      previous: "Назад",
      actions: "Действия",
      apply: "Применить",
      cancel: "Отмена",
      save: "Сохранить",
      notes: "Заметки",
      confirm: "Подтвердить",
      success: "Успешно выполнено.",
      failure: "Действие не выполнено.",
      selected: "выбрано",
      bulkActions: "Массовые действия",
      filter: "Фильтр",
      id: "ID",
      createdAt: "Создано",
      unauthorizedRedirect: "У вас нет доступа к панели администратора.",
    },
    dashboard: {
      title: "Панель администратора",
      subtitle: "Обзор состояния и активности платформы.",
      usersTotal: "Всего пользователей",
      usersNew7d: "Новые (7 дней)",
      usersActive24h: "Активны за 24ч",
      revenueThisMonth: "Доход за месяц",
      reportsOpen: "Открытые жалобы",
      verificationsPending: "Ожидают верификации",
      messages7d: "Сообщений (7 дней)",
      subscriptionsByPlan: "Подписки по тарифам",
      signupsChart: "Регистрации по дням",
      revenueChart: "Доход по дням",
    },
    users: {
      title: "Пользователи",
      subtitle: "Управление аккаунтами, ролями и статусом.",
      searchPlaceholder: "Поиск по имени…",
      filterStatus: "Статус",
      filterVerified: "Верификация",
      active: "Активен",
      suspended: "Заблокирован",
      verified: "Верифицирован",
      unverified: "Не верифицирован",
      name: "Имя",
      city: "Город",
      joined: "Регистрация",
      lastSeen: "Был в сети",
      roles: "Роли",
      view: "Просмотр",
      suspend: "Заблокировать",
      unsuspend: "Разблокировать",
      ban: "Забанить",
      banConfirm: "Забанить этого пользователя навсегда?",
      suspendReason: "Причина (необязательно)",
      noUsers: "Подходящих пользователей нет.",
    },
    userDetail: {
      title: "Информация о пользователе",
      back: "Назад к списку",
      email: "Эл. почта",
      profile: "Профиль",
      subscription: "Подписка",
      payments: "Платежи",
      reportsFiled: "Поданные жалобы",
      reportsAgainst: "Жалобы на него",
      grantRole: "Выдать роль",
      revokeRole: "Отозвать роль",
      noSubscription: "Нет активной подписки.",
      noPayments: "Платежи не найдены.",
      notFound: "Пользователь не найден.",
    },
    verification: {
      title: "Запросы на верификацию",
      subtitle: "Проверка документов и селфи пользователей.",
      pending: "В ожидании",
      approved: "Одобрено",
      rejected: "Отклонено",
      approve: "Одобрить",
      reject: "Отклонить",
      reviewNotes: "Заметки проверки",
      document: "Документ",
      selfie: "Селфи",
      noRequests: "Нет запросов на верификацию.",
    },
    reports: {
      title: "Жалобы",
      subtitle: "Проверка жалоб пользователей и принятие мер.",
      open: "Открыта",
      reviewing: "На рассмотрении",
      resolved: "Решена",
      dismissed: "Отклонена",
      reason: "Причина",
      reporter: "Отправитель",
      reported: "На кого жалоба",
      resolve: "Решить",
      dismiss: "Отклонить",
      noReports: "Жалоб нет.",
      flagsTitle: "Автоматические флаги модерации",
      flagsSubtitle: "Контент, автоматически помеченный для проверки.",
      flagged: "Помечено",
      approve: "Одобрить",
      reject: "Отклонить",
      subjectType: "Тип контента",
      excerpt: "Фрагмент",
      noFlags: "Флагов модерации нет.",
    },
    subscriptions: {
      title: "Подписки и платежи",
      subtitle: "Отслеживание активных подписок и истории платежей.",
      plan: "Тариф",
      status: "Статус",
      interval: "Период",
      periodEnd: "Окончание периода",
      paymentsTitle: "Платежи",
      amount: "Сумма",
      provider: "Провайдер",
      noSubscriptions: "Подписок нет.",
      noPayments: "Платежей нет.",
    },
    audit: {
      title: "Журнал аудита",
      subtitle: "Запись всех административных действий.",
      action: "Действие",
      admin: "Администратор",
      target: "Цель",
      when: "Время",
      details: "Детали",
      noEntries: "Записей нет.",
      filterAction: "Фильтр по действию",
      filterAdmin: "Фильтр по администратору",
    },
    roles: {
      title: "Управление ролями",
      subtitle: "Выдача и отзыв ролей администратора и модератора.",
      userIdPlaceholder: "ID пользователя (UUID)",
      grant: "Выдать",
      revoke: "Отозвать",
      adminOnlyNotice: "Эта страница доступна только администраторам.",
    },
  },
};
