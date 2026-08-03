import type { FeatureDictionary } from "@/i18n/feature";

export type ChatStrings = {
  title: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyText: string;
  loadError: string;
  retry: string;
  you: string;
  photoMessage: string;
  fileMessage: string;
  typing: string;
  online: string;
  offline: string;
  lastSeenJustNow: string;
  lastSeenMinutesAgo: (n: number) => string;
  lastSeenHoursAgo: (n: number) => string;
  lastSeenDaysAgo: (n: number) => string;
  loadOlder: string;
  send: string;
  writeMessage: string;
  attach: string;
  emoji: string;
  download: string;
  translate: string;
  translating: string;
  translated: string;
  showOriginal: string;
  attachmentTooLarge: string;
  attachmentInvalidType: string;
  attachmentFailed: string;
  sendFailed: string;
  retrySend: string;
  deleted: string;
  today: string;
  yesterday: string;
  back: string;
  startChatError: string;
  loading: string;
  /* Premium chat */
  reply: string;
  replyingTo: string;
  copy: string;
  copied: string;
  edit: string;
  edited: string;
  editMessage: string;
  saveEdit: string;
  cancelEdit: string;
  editEmpty: string;
  editSaved: string;
  editFailed: string;
  deleteAction: string;
  deleteTitle: string;
  deleteText: string;
  deleteForMe: string;
  deleteForEveryone: string;
  deleted2: string;
  deleteFailed: string;
  cancel: string;
  forward: string;
  forwardTitle: string;
  forwarded: string;
  share: string;
  shareFailed: string;
  selectAction: string;
  selectedCount: (n: number) => string;
  exitSelection: string;
  messageInfo: string;
  pin: string;
  unpin: string;
  pinned: string;
  pinnedMessages: string;
  unpinned: string;
  searchInChat: string;
  searchNoResults: string;
  searchCounter: (i: number, n: number) => string;
  previousResult: string;
  nextResult: string;
  closeSearch: string;
  unreadDivider: string;
  jumpToUnread: string;
  newMessages: (n: number) => string;
  scrollToBottom: string;
  sentAt: string;
  deliveredAt: string;
  readAt: string;
  notDelivered: string;
  notRead: string;
  statusLabel: string;
  attachmentLabel: string;
  dropToSend: string;
  openImage: string;
  closeViewer: string;
  zoomIn: string;
  zoomOut: string;
  nextImage: string;
  previousImage: string;
  messageActions: string;
  jumpToMessage: string;
  originalUnavailable: string;
  react: string;
  reactions: string;
  removeReaction: string;
  report: string;
  reported: string;
  reportFailed: string;
  voiceCall: string;
  videoCall: string;
  moreActions: string;
  verifiedMember: string;
  compatibility: string;
  featureSoon: string;
  noSearchResults: string;
  statusSending: string;
  statusSent: string;
  statusDelivered: string;
  statusRead: string;
  statusFailed: string;
};

export const chatStrings: FeatureDictionary<ChatStrings> = {
  ar: {
    title: "الرسائل",
    searchPlaceholder: "ابحث عن محادثة أو رسالة…",
    emptyTitle: "لا توجد محادثات بعد",
    emptyText: "ابدأ محادثة من صفحة أي عضو لتظهر هنا.",
    loadError: "تعذّر تحميل المحادثات، حاول مرة أخرى.",
    retry: "إعادة المحاولة",
    you: "أنت",
    photoMessage: "📷 صورة",
    fileMessage: "📎 ملف",
    typing: "يكتب الآن…",
    online: "متصل الآن",
    offline: "غير متصل",
    lastSeenJustNow: "متصل قبل قليل",
    lastSeenMinutesAgo: (n) => `آخر ظهور قبل ${n} د`,
    lastSeenHoursAgo: (n) => `آخر ظهور قبل ${n} س`,
    lastSeenDaysAgo: (n) => `آخر ظهور قبل ${n} ي`,
    loadOlder: "تحميل رسائل أقدم",
    send: "إرسال",
    writeMessage: "اكتب رسالة…",
    attach: "إرفاق ملف",
    emoji: "الرموز التعبيرية",
    download: "تنزيل",
    translate: "ترجمة",
    translating: "جاري الترجمة…",
    translated: "مُترجمة",
    showOriginal: "عرض النص الأصلي",
    attachmentTooLarge: "حجم الملف يتجاوز 5 ميجابايت.",
    attachmentInvalidType: "نوع الملف غير مدعوم.",
    attachmentFailed: "تعذّر رفع المرفق.",
    sendFailed: "تعذّر إرسال الرسالة.",
    retrySend: "إعادة الإرسال",
    deleted: "تم حذف هذه الرسالة.",
    today: "اليوم",
    yesterday: "أمس",
    back: "رجوع",
    startChatError: "تعذّر بدء المحادثة، حاول مرة أخرى.",
    loading: "جارٍ التحميل…",
    reply: "رد",
    replyingTo: "رد على",
    copy: "نسخ",
    copied: "تم نسخ النص",
    edit: "تعديل",
    edited: "مُعدّلة",
    editMessage: "تعديل الرسالة",
    saveEdit: "حفظ",
    cancelEdit: "إلغاء التعديل",
    editEmpty: "لا يمكن ترك الرسالة فارغة.",
    editSaved: "تم تعديل الرسالة",
    editFailed: "تعذّر تعديل الرسالة",
    deleteAction: "حذف",
    deleteTitle: "حذف الرسالة؟",
    deleteText: "اختر طريقة الحذف. لا يمكن التراجع عن الحذف للجميع.",
    deleteForMe: "حذف عندي",
    deleteForEveryone: "حذف عند الجميع",
    deleted2: "تم حذف الرسالة",
    deleteFailed: "تعذّر حذف الرسالة",
    cancel: "إلغاء",
    forward: "إعادة توجيه",
    forwardTitle: "إعادة التوجيه إلى",
    forwarded: "تمت إعادة التوجيه",
    share: "مشاركة",
    shareFailed: "تعذّرت المشاركة",
    selectAction: "تحديد",
    selectedCount: (n) => `${n} محدّدة`,
    exitSelection: "إنهاء التحديد",
    messageInfo: "معلومات الرسالة",
    pin: "تثبيت",
    unpin: "إلغاء التثبيت",
    pinned: "تم التثبيت",
    pinnedMessages: "الرسائل المثبّتة",
    unpinned: "تم إلغاء التثبيت",
    searchInChat: "بحث داخل المحادثة",
    searchNoResults: "لا نتائج",
    searchCounter: (i, n) => `${i} من ${n}`,
    previousResult: "النتيجة السابقة",
    nextResult: "النتيجة التالية",
    closeSearch: "إغلاق البحث",
    unreadDivider: "رسائل غير مقروءة",
    jumpToUnread: "الانتقال لأول غير مقروءة",
    newMessages: (n) => `${n} رسالة جديدة`,
    scrollToBottom: "النزول لآخر رسالة",
    sentAt: "أُرسلت",
    deliveredAt: "وصلت",
    readAt: "قُرئت",
    notDelivered: "لم تصل بعد",
    notRead: "لم تُقرأ بعد",
    statusLabel: "الحالة",
    attachmentLabel: "المرفق",
    dropToSend: "أفلت الملف للإرسال",
    openImage: "فتح الصورة",
    closeViewer: "إغلاق العارض",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    nextImage: "الصورة التالية",
    previousImage: "الصورة السابقة",
    messageActions: "خيارات الرسالة",
    jumpToMessage: "الانتقال إلى الرسالة",
    originalUnavailable: "الرسالة الأصلية غير متاحة",
    react: "تفاعل",
    reactions: "التفاعلات",
    removeReaction: "إزالة التفاعل",
    report: "إبلاغ",
    reported: "تم إرسال البلاغ",
    reportFailed: "تعذّر إرسال البلاغ",
    voiceCall: "مكالمة صوتية",
    videoCall: "مكالمة فيديو",
    moreActions: "خيارات أخرى",
    verifiedMember: "عضو موثّق",
    compatibility: "التوافق",
    featureSoon: "قريبًا",
    noSearchResults: "لا توجد نتائج مطابقة",
    statusSending: "جارٍ الإرسال",
    statusSent: "أُرسلت",
    statusDelivered: "وصلت",
    statusRead: "تمت القراءة",
    statusFailed: "فشل الإرسال",
  },
  en: {
    title: "Messages",
    searchPlaceholder: "Search conversations or messages…",
    emptyTitle: "No conversations yet",
    emptyText: "Start a chat from any member's page to see it here.",
    loadError: "Couldn't load conversations, try again.",
    retry: "Try again",
    you: "You",
    photoMessage: "📷 Photo",
    fileMessage: "📎 File",
    typing: "Typing…",
    online: "Online now",
    offline: "Offline",
    lastSeenJustNow: "Active just now",
    lastSeenMinutesAgo: (n) => `Last seen ${n}m ago`,
    lastSeenHoursAgo: (n) => `Last seen ${n}h ago`,
    lastSeenDaysAgo: (n) => `Last seen ${n}d ago`,
    loadOlder: "Load older messages",
    send: "Send",
    writeMessage: "Write a message…",
    attach: "Attach a file",
    emoji: "Emoji",
    download: "Download",
    translate: "Translate",
    translating: "Translating…",
    translated: "Translated",
    showOriginal: "Show original",
    attachmentTooLarge: "File is larger than 5MB.",
    attachmentInvalidType: "Unsupported file type.",
    attachmentFailed: "Couldn't upload the attachment.",
    sendFailed: "Couldn't send the message.",
    retrySend: "Retry",
    deleted: "This message was deleted.",
    today: "Today",
    yesterday: "Yesterday",
    back: "Back",
    startChatError: "Couldn't start the conversation, try again.",
    loading: "Loading…",
    reply: "Reply",
    replyingTo: "Replying to",
    copy: "Copy",
    copied: "Copied to clipboard",
    edit: "Edit",
    edited: "edited",
    editMessage: "Edit message",
    saveEdit: "Save",
    cancelEdit: "Cancel edit",
    editEmpty: "Message can't be empty.",
    editSaved: "Message edited",
    editFailed: "Couldn't edit the message",
    deleteAction: "Delete",
    deleteTitle: "Delete message?",
    deleteText: "Choose how to delete. Deleting for everyone can't be undone.",
    deleteForMe: "Delete for me",
    deleteForEveryone: "Delete for everyone",
    deleted2: "Message deleted",
    deleteFailed: "Couldn't delete the message",
    cancel: "Cancel",
    forward: "Forward",
    forwardTitle: "Forward to",
    forwarded: "Message forwarded",
    share: "Share",
    shareFailed: "Couldn't share",
    selectAction: "Select",
    selectedCount: (n) => `${n} selected`,
    exitSelection: "Exit selection",
    messageInfo: "Message info",
    pin: "Pin",
    unpin: "Unpin",
    pinned: "Message pinned",
    pinnedMessages: "Pinned messages",
    unpinned: "Message unpinned",
    searchInChat: "Search in conversation",
    searchNoResults: "No results",
    searchCounter: (i, n) => `${i} of ${n}`,
    previousResult: "Previous result",
    nextResult: "Next result",
    closeSearch: "Close search",
    unreadDivider: "Unread messages",
    jumpToUnread: "Jump to first unread",
    newMessages: (n) => `${n} new messages`,
    scrollToBottom: "Scroll to latest",
    sentAt: "Sent",
    deliveredAt: "Delivered",
    readAt: "Read",
    notDelivered: "Not delivered yet",
    notRead: "Not read yet",
    statusLabel: "Status",
    attachmentLabel: "Attachment",
    dropToSend: "Drop the file to send",
    openImage: "Open image",
    closeViewer: "Close viewer",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    nextImage: "Next image",
    previousImage: "Previous image",
    messageActions: "Message actions",
    jumpToMessage: "Jump to message",
    originalUnavailable: "Original message unavailable",
    react: "React",
    reactions: "Reactions",
    removeReaction: "Remove reaction",
    report: "Report",
    reported: "Report submitted",
    reportFailed: "Could not submit the report",
    voiceCall: "Voice call",
    videoCall: "Video call",
    moreActions: "More actions",
    verifiedMember: "Verified member",
    compatibility: "Compatibility",
    featureSoon: "Coming soon",
    noSearchResults: "No matching messages",
    statusSending: "Sending",
    statusSent: "Sent",
    statusDelivered: "Delivered",
    statusRead: "Read",
    statusFailed: "Failed",
  },
  de: {
    title: "Nachrichten",
    searchPlaceholder: "Unterhaltungen oder Nachrichten durchsuchen…",
    emptyTitle: "Noch keine Unterhaltungen",
    emptyText: "Starte einen Chat über das Profil eines Mitglieds.",
    loadError: "Unterhaltungen konnten nicht geladen werden.",
    retry: "Erneut versuchen",
    you: "Du",
    photoMessage: "📷 Foto",
    fileMessage: "📎 Datei",
    typing: "Schreibt gerade…",
    online: "Jetzt online",
    offline: "Offline",
    lastSeenJustNow: "Gerade aktiv",
    lastSeenMinutesAgo: (n) => `Zuletzt vor ${n} Min. aktiv`,
    lastSeenHoursAgo: (n) => `Zuletzt vor ${n} Std. aktiv`,
    lastSeenDaysAgo: (n) => `Zuletzt vor ${n} T. aktiv`,
    loadOlder: "Ältere Nachrichten laden",
    send: "Senden",
    writeMessage: "Nachricht schreiben…",
    attach: "Datei anhängen",
    emoji: "Emoji",
    download: "Herunterladen",
    translate: "Übersetzen",
    translating: "Übersetzt…",
    translated: "Übersetzt",
    showOriginal: "Original anzeigen",
    attachmentTooLarge: "Die Datei ist größer als 5 MB.",
    attachmentInvalidType: "Nicht unterstützter Dateityp.",
    attachmentFailed: "Anhang konnte nicht hochgeladen werden.",
    sendFailed: "Nachricht konnte nicht gesendet werden.",
    retrySend: "Erneut senden",
    deleted: "Diese Nachricht wurde gelöscht.",
    today: "Heute",
    yesterday: "Gestern",
    back: "Zurück",
    startChatError: "Unterhaltung konnte nicht gestartet werden.",
    loading: "Wird geladen…",
    reply: "Antworten",
    replyingTo: "Antwort an",
    copy: "Kopieren",
    copied: "In die Zwischenablage kopiert",
    edit: "Bearbeiten",
    edited: "bearbeitet",
    editMessage: "Nachricht bearbeiten",
    saveEdit: "Speichern",
    cancelEdit: "Bearbeitung abbrechen",
    editEmpty: "Nachricht darf nicht leer sein.",
    editSaved: "Nachricht bearbeitet",
    editFailed: "Nachricht konnte nicht bearbeitet werden",
    deleteAction: "Löschen",
    deleteTitle: "Nachricht löschen?",
    deleteText: "Wähle die Löschart. Für alle löschen ist endgültig.",
    deleteForMe: "Für mich löschen",
    deleteForEveryone: "Für alle löschen",
    deleted2: "Nachricht gelöscht",
    deleteFailed: "Nachricht konnte nicht gelöscht werden",
    cancel: "Abbrechen",
    forward: "Weiterleiten",
    forwardTitle: "Weiterleiten an",
    forwarded: "Nachricht weitergeleitet",
    share: "Teilen",
    shareFailed: "Teilen fehlgeschlagen",
    selectAction: "Auswählen",
    selectedCount: (n) => `${n} ausgewählt`,
    exitSelection: "Auswahl beenden",
    messageInfo: "Nachrichteninfo",
    pin: "Anheften",
    unpin: "Loslösen",
    pinned: "Nachricht angeheftet",
    pinnedMessages: "Angeheftete Nachrichten",
    unpinned: "Nachricht losgelöst",
    searchInChat: "In Unterhaltung suchen",
    searchNoResults: "Keine Treffer",
    searchCounter: (i, n) => `${i} von ${n}`,
    previousResult: "Vorheriger Treffer",
    nextResult: "Nächster Treffer",
    closeSearch: "Suche schließen",
    unreadDivider: "Ungelesene Nachrichten",
    jumpToUnread: "Zur ersten ungelesenen",
    newMessages: (n) => `${n} neue Nachrichten`,
    scrollToBottom: "Zur neuesten Nachricht",
    sentAt: "Gesendet",
    deliveredAt: "Zugestellt",
    readAt: "Gelesen",
    notDelivered: "Noch nicht zugestellt",
    notRead: "Noch nicht gelesen",
    statusLabel: "Status",
    attachmentLabel: "Anhang",
    dropToSend: "Datei zum Senden ablegen",
    openImage: "Bild öffnen",
    closeViewer: "Ansicht schließen",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    nextImage: "Nächstes Bild",
    previousImage: "Vorheriges Bild",
    messageActions: "Nachrichtenaktionen",
    jumpToMessage: "Zur Nachricht springen",
    originalUnavailable: "Originalnachricht nicht verfügbar",
    react: "Reagieren",
    reactions: "Reaktionen",
    removeReaction: "Reaktion entfernen",
    report: "Melden",
    reported: "Meldung gesendet",
    reportFailed: "Meldung fehlgeschlagen",
    voiceCall: "Sprachanruf",
    videoCall: "Videoanruf",
    moreActions: "Weitere Aktionen",
    verifiedMember: "Verifiziertes Mitglied",
    compatibility: "Übereinstimmung",
    featureSoon: "Demnächst",
    noSearchResults: "Keine passenden Nachrichten",
    statusSending: "Wird gesendet",
    statusSent: "Gesendet",
    statusDelivered: "Zugestellt",
    statusRead: "Gelesen",
    statusFailed: "Fehlgeschlagen",
  },
  fr: {
    title: "Messages",
    searchPlaceholder: "Rechercher des conversations ou des messages…",
    emptyTitle: "Aucune conversation pour l'instant",
    emptyText: "Démarrez une discussion depuis la page d'un membre, elle apparaîtra ici.",
    loadError: "Impossible de charger les conversations, veuillez réessayer.",
    retry: "Réessayer",
    you: "Vous",
    photoMessage: "📷 Photo",
    fileMessage: "📎 Fichier",
    typing: "En train d'écrire…",
    online: "En ligne",
    offline: "Hors ligne",
    lastSeenJustNow: "Vu(e) à l'instant",
    lastSeenMinutesAgo: (n: number) => `Vu(e) il y a ${n} min`,
    lastSeenHoursAgo: (n: number) => `Vu(e) il y a ${n} h`,
    lastSeenDaysAgo: (n: number) => `Vu(e) il y a ${n} j`,
    loadOlder: "Charger les messages plus anciens",
    send: "Envoyer",
    writeMessage: "Écrivez un message…",
    attach: "Joindre un fichier",
    emoji: "Émoji",
    download: "Télécharger",
    translate: "Traduire",
    translating: "Traduction…",
    translated: "Traduit",
    showOriginal: "Afficher l'original",
    attachmentTooLarge: "Le fichier dépasse 5 Mo.",
    attachmentInvalidType: "Type de fichier non pris en charge.",
    attachmentFailed: "Échec de l'envoi de la pièce jointe.",
    sendFailed: "Échec de l'envoi du message.",
    retrySend: "Renvoyer",
    deleted: "Ce message a été supprimé.",
    today: "Aujourd'hui",
    yesterday: "Hier",
    back: "Retour",
    startChatError: "Impossible de démarrer la conversation.",
    loading: "Chargement…",
    reply: "Répondre",
    replyingTo: "En réponse à",
    copy: "Copier",
    copied: "Copié",
    edit: "Modifier",
    edited: "modifié",
    editMessage: "Modifier le message",
    saveEdit: "Enregistrer",
    cancelEdit: "Annuler la modification",
    editEmpty: "Le message ne peut pas être vide.",
    editSaved: "Message modifié",
    editFailed: "Échec de la modification du message",
    deleteAction: "Supprimer",
    deleteTitle: "Supprimer le message ?",
    deleteText: "Choisissez le mode de suppression. Supprimer pour tout le monde est irréversible.",
    deleteForMe: "Supprimer pour moi",
    deleteForEveryone: "Supprimer pour tout le monde",
    deleted2: "Message supprimé",
    deleteFailed: "Échec de la suppression du message",
    cancel: "Annuler",
    forward: "Transférer",
    forwardTitle: "Transférer",
    forwarded: "Message transféré",
    share: "Partager",
    shareFailed: "Échec du partage",
    selectAction: "Sélectionner",
    selectedCount: (n: number) => `${n} sélectionné(s)`,
    exitSelection: "Quitter la sélection",
    messageInfo: "Informations sur le message",
    pin: "Épingler",
    unpin: "Désépingler",
    pinned: "Message épinglé",
    pinnedMessages: "Messages épinglés",
    unpinned: "Message désépinglé",
    searchInChat: "Rechercher dans la conversation",
    searchNoResults: "Aucun résultat",
    searchCounter: (i: number, n: number) => `${i} sur ${n}`,
    previousResult: "Résultat précédent",
    nextResult: "Résultat suivant",
    closeSearch: "Fermer la recherche",
    unreadDivider: "Messages non lus",
    jumpToUnread: "Aller au premier non lu",
    newMessages: (n: number) => `${n} nouveaux messages`,
    scrollToBottom: "Aller au dernier message",
    sentAt: "Envoyé",
    deliveredAt: "Remis",
    readAt: "Lu",
    notDelivered: "Pas encore remis",
    notRead: "Pas encore lu",
    statusLabel: "Statut",
    attachmentLabel: "Pièce jointe",
    dropToSend: "Déposez le fichier pour l'envoyer",
    openImage: "Ouvrir l'image",
    closeViewer: "Fermer la visionneuse",
    zoomIn: "Zoom avant",
    zoomOut: "Zoom arrière",
    nextImage: "Image suivante",
    previousImage: "Image précédente",
    messageActions: "Actions du message",
    jumpToMessage: "Aller au message",
    originalUnavailable: "Message d'origine indisponible",
    react: "Réagir",
    reactions: "Réactions",
    removeReaction: "Retirer la réaction",
    report: "Signaler",
    reported: "Signalement envoyé",
    reportFailed: "Échec de l'envoi du signalement",
    voiceCall: "Appel vocal",
    videoCall: "Appel vidéo",
    moreActions: "Plus",
    verifiedMember: "Membre vérifié",
    compatibility: "Compatibilité",
    featureSoon: "Bientôt",
    noSearchResults: "Aucune correspondance",
    statusSending: "Envoi",
    statusSent: "Envoyé",
    statusDelivered: "Remis",
    statusRead: "Lu",
    statusFailed: "Échec",
  },
};
