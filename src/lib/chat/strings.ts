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
  },
  ru: {
    title: "Сообщения",
    searchPlaceholder: "Поиск бесед или сообщений…",
    emptyTitle: "Пока нет бесед",
    emptyText: "Начните чат со страницы участника, и он появится здесь.",
    loadError: "Не удалось загрузить беседы, попробуйте снова.",
    retry: "Повторить",
    you: "Вы",
    photoMessage: "📷 Фото",
    fileMessage: "📎 Файл",
    typing: "Печатает…",
    online: "В сети",
    offline: "Не в сети",
    lastSeenJustNow: "Был(а) в сети только что",
    lastSeenMinutesAgo: (n) => `Был(а) в сети ${n} мин назад`,
    lastSeenHoursAgo: (n) => `Был(а) в сети ${n} ч назад`,
    lastSeenDaysAgo: (n) => `Был(а) в сети ${n} дн назад`,
    loadOlder: "Загрузить более старые сообщения",
    send: "Отправить",
    writeMessage: "Напишите сообщение…",
    attach: "Прикрепить файл",
    emoji: "Эмодзи",
    download: "Скачать",
    translate: "Перевести",
    translating: "Перевод…",
    translated: "Переведено",
    showOriginal: "Показать оригинал",
    attachmentTooLarge: "Файл больше 5 МБ.",
    attachmentInvalidType: "Неподдерживаемый тип файла.",
    attachmentFailed: "Не удалось загрузить вложение.",
    sendFailed: "Не удалось отправить сообщение.",
    retrySend: "Повторить отправку",
    deleted: "Это сообщение удалено.",
    today: "Сегодня",
    yesterday: "Вчера",
    back: "Назад",
    startChatError: "Не удалось начать беседу.",
    loading: "Загрузка…",
  },
};
