import type { FeatureDictionary } from "@/i18n/feature";

export type CallStrings = {
  voiceCall: string;
  videoCall: string;
  incomingVoice: string;
  incomingVideo: string;
  outgoing: string;
  ringing: string;
  connecting: string;
  reconnecting: string;
  ended: string;
  rejected: string;
  missed: string;
  busy: string;
  failed: string;
  noAnswer: string;
  accept: string;
  decline: string;
  hangUp: string;
  mute: string;
  unmute: string;
  speakerOn: string;
  speakerOff: string;
  cameraOn: string;
  cameraOff: string;
  switchCamera: string;
  fullscreen: string;
  exitFullscreen: string;
  permissionTitle: string;
  permissionMic: string;
  permissionCam: string;
  premiumVoice: string;
  premiumVideo: string;
  upgrade: string;
  close: string;
  you: string;
  waitingPeer: string;
  relayWarning: string;
  micLabel: string;
  errors: Record<string, string>;
};

export const callStrings: FeatureDictionary<CallStrings> = {
  ar: {
    voiceCall: "مكالمة صوتية",
    videoCall: "مكالمة فيديو",
    incomingVoice: "مكالمة صوتية واردة",
    incomingVideo: "مكالمة فيديو واردة",
    outgoing: "جارٍ الاتصال…",
    ringing: "يرن…",
    connecting: "جارٍ الاتصال…",
    reconnecting: "إعادة الاتصال…",
    ended: "انتهت المكالمة",
    rejected: "تم رفض المكالمة",
    missed: "مكالمة فائتة",
    busy: "العضو مشغول في مكالمة أخرى",
    failed: "تعذّر إتمام المكالمة",
    noAnswer: "لا يوجد رد",
    accept: "قبول",
    decline: "رفض",
    hangUp: "إنهاء",
    mute: "كتم المايك",
    unmute: "إلغاء الكتم",
    speakerOn: "تشغيل مكبر الصوت",
    speakerOff: "إيقاف مكبر الصوت",
    cameraOn: "تشغيل الكاميرا",
    cameraOff: "إيقاف الكاميرا",
    switchCamera: "تبديل الكاميرا",
    fullscreen: "ملء الشاشة",
    exitFullscreen: "إنهاء ملء الشاشة",
    permissionTitle: "الإذن مطلوب",
    permissionMic: "نحتاج إذن الميكروفون لإجراء المكالمة الصوتية.",
    permissionCam: "نحتاج إذن الكاميرا والميكروفون لإجراء مكالمة الفيديو.",
    premiumVoice: "المكالمات الصوتية متاحة لباقة بريميوم.",
    premiumVideo: "مكالمات الفيديو متاحة لباقة بريميوم بلس.",
    upgrade: "ترقية الباقة",
    close: "إغلاق",
    you: "أنت",
    waitingPeer: "بانتظار انضمام الطرف الآخر…",
    relayWarning: "قد لا تعمل المكالمة على بعض الشبكات المقيّدة.",
    micLabel: "الميكروفون",
    errors: {
      call_plan_required: "باقتك الحالية لا تسمح بهذا النوع من المكالمات.",
      call_peer_busy: "العضو مشغول في مكالمة أخرى.",
      call_not_member: "لا يمكنك الاتصال بهذه المحادثة.",
      call_forbidden: "غير مسموح.",
      call_not_found: "المكالمة غير متاحة.",
      call_self: "لا يمكنك الاتصال بنفسك.",
      media_denied: "تم رفض إذن الميكروفون أو الكاميرا.",
      media_missing: "لم يتم العثور على ميكروفون أو كاميرا.",
      unsupported: "متصفحك لا يدعم المكالمات.",
      generic: "حدث خطأ أثناء المكالمة.",
    },
  },
  en: {
    voiceCall: "Voice call",
    videoCall: "Video call",
    incomingVoice: "Incoming voice call",
    incomingVideo: "Incoming video call",
    outgoing: "Calling…",
    ringing: "Ringing…",
    connecting: "Connecting…",
    reconnecting: "Reconnecting…",
    ended: "Call ended",
    rejected: "Call declined",
    missed: "Missed call",
    busy: "Member is on another call",
    failed: "Call failed",
    noAnswer: "No answer",
    accept: "Accept",
    decline: "Decline",
    hangUp: "End call",
    mute: "Mute",
    unmute: "Unmute",
    speakerOn: "Speaker on",
    speakerOff: "Speaker off",
    cameraOn: "Turn camera on",
    cameraOff: "Turn camera off",
    switchCamera: "Switch camera",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    permissionTitle: "Permission required",
    permissionMic: "We need microphone access to start the voice call.",
    permissionCam: "We need camera and microphone access to start the video call.",
    premiumVoice: "Voice calls are part of the Premium plan.",
    premiumVideo: "Video calls are part of the Premium Plus plan.",
    upgrade: "Upgrade plan",
    close: "Close",
    you: "You",
    waitingPeer: "Waiting for the other member…",
    relayWarning: "Calls may not connect on restricted networks.",
    micLabel: "Microphone",
    errors: {
      call_plan_required: "Your current plan does not include this call type.",
      call_peer_busy: "The member is already on another call.",
      call_not_member: "You cannot call in this conversation.",
      call_forbidden: "Not allowed.",
      call_not_found: "This call is no longer available.",
      call_self: "You cannot call yourself.",
      media_denied: "Microphone or camera permission was denied.",
      media_missing: "No microphone or camera was found.",
      unsupported: "Your browser does not support calls.",
      generic: "Something went wrong during the call.",
    },
  },
  de: {
    voiceCall: "Sprachanruf",
    videoCall: "Videoanruf",
    incomingVoice: "Eingehender Sprachanruf",
    incomingVideo: "Eingehender Videoanruf",
    outgoing: "Wird angerufen…",
    ringing: "Es klingelt…",
    connecting: "Verbindung wird hergestellt…",
    reconnecting: "Erneute Verbindung…",
    ended: "Anruf beendet",
    rejected: "Anruf abgelehnt",
    missed: "Verpasster Anruf",
    busy: "Mitglied telefoniert bereits",
    failed: "Anruf fehlgeschlagen",
    noAnswer: "Keine Antwort",
    accept: "Annehmen",
    decline: "Ablehnen",
    hangUp: "Auflegen",
    mute: "Stummschalten",
    unmute: "Stummschaltung aufheben",
    speakerOn: "Lautsprecher an",
    speakerOff: "Lautsprecher aus",
    cameraOn: "Kamera einschalten",
    cameraOff: "Kamera ausschalten",
    switchCamera: "Kamera wechseln",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",
    permissionTitle: "Berechtigung erforderlich",
    permissionMic: "Für den Sprachanruf wird Mikrofonzugriff benötigt.",
    permissionCam: "Für den Videoanruf werden Kamera- und Mikrofonzugriff benötigt.",
    premiumVoice: "Sprachanrufe gehören zum Premium-Paket.",
    premiumVideo: "Videoanrufe gehören zum Premium-Plus-Paket.",
    upgrade: "Paket upgraden",
    close: "Schließen",
    you: "Du",
    waitingPeer: "Warten auf das andere Mitglied…",
    relayWarning: "In eingeschränkten Netzwerken kann der Anruf fehlschlagen.",
    micLabel: "Mikrofon",
    errors: {
      call_plan_required: "Dein Paket enthält diese Anrufart nicht.",
      call_peer_busy: "Das Mitglied telefoniert bereits.",
      call_not_member: "Du kannst in dieser Unterhaltung nicht anrufen.",
      call_forbidden: "Nicht erlaubt.",
      call_not_found: "Dieser Anruf ist nicht mehr verfügbar.",
      call_self: "Du kannst dich nicht selbst anrufen.",
      media_denied: "Mikrofon- oder Kamerazugriff wurde verweigert.",
      media_missing: "Kein Mikrofon oder keine Kamera gefunden.",
      unsupported: "Dein Browser unterstützt keine Anrufe.",
      generic: "Beim Anruf ist ein Fehler aufgetreten.",
    },
  },
  fr: {
    voiceCall: "Appel vocal",
    videoCall: "Appel vidéo",
    incomingVoice: "Appel vocal entrant",
    incomingVideo: "Appel vidéo entrant",
    outgoing: "Appel en cours…",
    ringing: "Sonnerie…",
    connecting: "Connexion…",
    reconnecting: "Reconnexion…",
    ended: "Appel terminé",
    rejected: "Appel refusé",
    missed: "Appel manqué",
    busy: "Le membre est déjà en appel",
    failed: "Échec de l'appel",
    noAnswer: "Pas de réponse",
    accept: "Accepter",
    decline: "Refuser",
    hangUp: "Raccrocher",
    mute: "Couper le micro",
    unmute: "Réactiver le micro",
    speakerOn: "Haut-parleur activé",
    speakerOff: "Haut-parleur désactivé",
    cameraOn: "Activer la caméra",
    cameraOff: "Désactiver la caméra",
    switchCamera: "Changer de caméra",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter le plein écran",
    permissionTitle: "Autorisation requise",
    permissionMic: "L'accès au microphone est nécessaire pour l'appel vocal.",
    permissionCam: "L'accès à la caméra et au microphone est nécessaire pour l'appel vidéo.",
    premiumVoice: "Les appels vocaux font partie du plan Premium.",
    premiumVideo: "Les appels vidéo font partie du plan Premium Plus.",
    upgrade: "Changer de plan",
    close: "Fermer",
    you: "Vous",
    waitingPeer: "En attente de l'autre membre…",
    relayWarning: "L'appel peut échouer sur les réseaux restreints.",
    micLabel: "Microphone",
    errors: {
      call_plan_required: "Votre plan actuel n'inclut pas ce type d'appel.",
      call_peer_busy: "Le membre est déjà en appel.",
      call_not_member: "Vous ne pouvez pas appeler dans cette conversation.",
      call_forbidden: "Action non autorisée.",
      call_not_found: "Cet appel n'est plus disponible.",
      call_self: "Vous ne pouvez pas vous appeler vous-même.",
      media_denied: "Accès au microphone ou à la caméra refusé.",
      media_missing: "Aucun microphone ou caméra détecté.",
      unsupported: "Votre navigateur ne prend pas en charge les appels.",
      generic: "Une erreur est survenue pendant l'appel.",
    },
  },
};