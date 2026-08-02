import type { FeatureDictionary } from "@/i18n/feature";
import type { LegalPageContent } from "./types";
import { COMPANY } from "@/lib/company";

export const privacyContent: FeatureDictionary<LegalPageContent> = {
  ar: {
    title: "سياسة الخصوصية (GDPR / DSGVO)",
    subtitle: `تلتزم منصة سَكَن (${COMPANY.websiteLabel}) بحماية بياناتك وفقاً للمادة 13 من اللائحة الأوروبية GDPR وقانون حماية البيانات الألماني BDSG.`,
    sections: [
      {
        title: "1. المسؤول عن المعالجة",
        body: [
          `${COMPANY.legalName}، ${COMPANY.street}، ${COMPANY.postalCode} ${COMPANY.city}، ${COMPANY.country}`,
          `للاستفسارات المتعلقة بالبيانات: ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "2. البيانات التي نعالجها",
        body: [
          "بيانات الحساب: الاسم، البريد الإلكتروني، تاريخ الميلاد، الجنس، الدولة والمدينة.",
          "بيانات الملف: الصور، النبذة، التفضيلات، ومعلومات التوثيق التي ترفعها طوعاً.",
          "بيانات الاستخدام: الرسائل، الإعجابات، سجلات الدخول، وبيانات تقنية لأغراض الأمان ومنع الاحتيال.",
        ],
      },
      {
        title: "3. المعالجة بواسطة الذكاء الاصطناعي",
        body: [
          "تُفحص الصور والنصوص آلياً عبر واجهات برمجة مشفّرة لمنع المحتوى غير اللائق والاحتيال، ولا تُستخدم هذه البيانات لتدريب نماذج ذكاء اصطناعي عامة ولا يتم كشفها لأطراف خارجية، امتثالاً للمادة 9 من GDPR.",
          "الترجمة الآلية للنبذة والرسائل تتم لغرض تمكين التواصل فقط.",
        ],
      },
      {
        title: "4. أساس المعالجة ومدة الحفظ",
        body: [
          "الأساس القانوني: تنفيذ العقد (م6/1/ب)، المصلحة المشروعة في الأمان (م6/1/و)، والموافقة الصريحة للبيانات الحساسة (م9/2/أ).",
          "تُحفظ البيانات ما دام الحساب نشطاً، وتُحذف خلال 30 يوماً من طلب الحذف باستثناء ما يلزم قانونياً.",
        ],
      },
      {
        title: "5. التخزين والتشفير",
        body: [
          "تُخزَّن كافة البيانات على خوادم مشفّرة داخل الاتحاد الأوروبي (AWS Frankfurt) مع تشفير أثناء النقل والتخزين، وصور الملفات في مخازن خاصة تُقدَّم عبر روابط موقّتة موقّعة.",
        ],
      },
      {
        title: "6. حقوقك",
        body: [
          "المادة 15: حق الوصول إلى بياناتك ونسخة منها.",
          "المادة 16: حق التصحيح. المادة 18: حق تقييد المعالجة. المادة 20: حق نقل البيانات.",
          "المادة 17: حق الحذف الكامل والنهائي للملف والصور بضغطة زر من إعدادات الحساب.",
          "لك أيضاً حق تقديم شكوى إلى هيئة حماية البيانات المختصة في ولايتك.",
        ],
      },
      {
        title: "7. المدفوعات وملفات الارتباط",
        body: [
          "تتم المدفوعات عبر Stripe؛ لا نخزّن بيانات بطاقتك على خوادمنا إطلاقاً.",
          "نستخدم ملفات ارتباط ضرورية فقط لتشغيل الجلسة وتفضيل اللغة، ولا نستخدم تتبعاً إعلانياً دون موافقتك.",
        ],
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung (DSGVO)",
    subtitle: `Sakan (${COMPANY.websiteLabel}) schützt Ihre Daten gemäß Art. 13 DSGVO und dem BDSG.`,
    sections: [
      {
        title: "1. Verantwortlicher",
        body: [
          `${COMPANY.legalName}, ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}, ${COMPANY.country}`,
          `Datenschutzanfragen: ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "2. Verarbeitete Daten",
        body: [
          "Kontodaten: Name, E-Mail, Geburtsdatum, Geschlecht, Land und Stadt.",
          "Profildaten: Fotos, Beschreibung, Präferenzen und freiwillig hochgeladene Verifizierungsunterlagen.",
          "Nutzungsdaten: Nachrichten, Likes, Login-Protokolle und technische Daten zur Sicherheit und Betrugsprävention.",
        ],
      },
      {
        title: "3. KI-gestützte Verarbeitung",
        body: [
          "Bilder und Texte werden automatisiert über verschlüsselte Schnittstellen geprüft. Diese Daten werden weder zum Training öffentlicher KI-Modelle verwendet noch an Dritte weitergegeben (Art. 9 DSGVO).",
          "Die maschinelle Übersetzung dient ausschließlich der Verständigung zwischen Mitgliedern.",
        ],
      },
      {
        title: "4. Rechtsgrundlage und Speicherdauer",
        body: [
          "Vertragserfüllung (Art. 6 Abs. 1 lit. b), berechtigtes Interesse an Sicherheit (lit. f) und ausdrückliche Einwilligung für besondere Kategorien (Art. 9 Abs. 2 lit. a).",
          "Daten werden für die Dauer des Kontos gespeichert und binnen 30 Tagen nach Löschantrag entfernt, soweit keine gesetzliche Aufbewahrungspflicht besteht.",
        ],
      },
      {
        title: "5. Speicherung und Verschlüsselung",
        body: [
          "Alle Daten liegen auf verschlüsselten Servern innerhalb der EU (AWS Frankfurt); Bilder werden in privaten Buckets über signierte, zeitlich begrenzte URLs ausgeliefert.",
        ],
      },
      {
        title: "6. Ihre Rechte",
        body: [
          "Art. 15 Auskunft, Art. 16 Berichtigung, Art. 18 Einschränkung, Art. 20 Datenübertragbarkeit.",
          "Art. 17 Löschung: vollständige und endgültige Löschung von Profil und Bildern per Klick in den Kontoeinstellungen.",
          "Beschwerderecht bei der zuständigen Datenschutzaufsichtsbehörde.",
        ],
      },
      {
        title: "7. Zahlungen und Cookies",
        body: [
          "Zahlungen laufen über Stripe; Kartendaten werden niemals auf unseren Servern gespeichert.",
          "Wir setzen nur technisch notwendige Cookies für Sitzung und Sprachwahl ein, kein Werbetracking ohne Einwilligung.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy (GDPR)",
    subtitle: `Sakan (${COMPANY.websiteLabel}) protects your data under Art. 13 GDPR and the German BDSG.`,
    sections: [
      {
        title: "1. Controller",
        body: [
          `${COMPANY.legalName}, ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}, ${COMPANY.country}`,
          `Data requests: ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "2. Data we process",
        body: [
          "Account data: name, email, date of birth, gender, country and city.",
          "Profile data: photos, bio, preferences and any verification documents you upload voluntarily.",
          "Usage data: messages, likes, sign-in logs and technical data used for security and fraud prevention.",
        ],
      },
      {
        title: "3. AI processing",
        body: [
          "Photos and text are screened automatically through encrypted APIs. This data is never used to train public AI models and is never disclosed to third parties (Art. 9 GDPR).",
          "Machine translation of bios and messages exists solely to enable communication between members.",
        ],
      },
      {
        title: "4. Legal basis and retention",
        body: [
          "Contract performance (Art. 6(1)(b)), legitimate interest in safety (Art. 6(1)(f)) and explicit consent for special categories (Art. 9(2)(a)).",
          "Data is kept while the account is active and deleted within 30 days of an erasure request, except where the law requires retention.",
        ],
      },
      {
        title: "5. Storage and encryption",
        body: [
          "All data is stored on encrypted servers inside the EU (AWS Frankfurt); images live in private buckets and are served through short-lived signed URLs.",
        ],
      },
      {
        title: "6. Your rights",
        body: [
          "Art. 15 access, Art. 16 rectification, Art. 18 restriction, Art. 20 portability.",
          "Art. 17 erasure: permanently delete your profile and photos with one click in account settings.",
          "You may also lodge a complaint with your competent data protection authority.",
        ],
      },
      {
        title: "7. Payments and cookies",
        body: [
          "Payments run through Stripe; card details are never stored on our servers.",
          "We only use strictly necessary cookies for session and language preference — no advertising tracking without consent.",
        ],
      },
    ],
  },
  ru: {
    title: "Политика конфиденциальности (GDPR)",
    subtitle: `Sakan (${COMPANY.websiteLabel}) защищает ваши данные согласно ст. 13 GDPR и немецкому BDSG.`,
    sections: [
      {
        title: "1. Оператор данных",
        body: [
          `${COMPANY.legalName}, ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}, ${COMPANY.country}`,
          `Запросы по данным: ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "2. Какие данные обрабатываются",
        body: [
          "Данные аккаунта: имя, e-mail, дата рождения, пол, страна и город.",
          "Данные профиля: фото, описание, предпочтения и добровольно загруженные документы верификации.",
          "Данные использования: сообщения, лайки, журналы входа и технические данные для безопасности.",
        ],
      },
      {
        title: "3. Обработка с помощью ИИ",
        body: [
          "Фото и тексты проверяются автоматически через зашифрованные API. Эти данные не используются для обучения публичных моделей ИИ и не передаются третьим лицам (ст. 9 GDPR).",
          "Машинный перевод служит только для общения между участниками.",
        ],
      },
      {
        title: "4. Правовая основа и сроки хранения",
        body: [
          "Исполнение договора (ст. 6(1)(b)), законный интерес в безопасности (ст. 6(1)(f)) и явное согласие для особых категорий (ст. 9(2)(a)).",
          "Данные хранятся, пока аккаунт активен, и удаляются в течение 30 дней после запроса на удаление.",
        ],
      },
      {
        title: "5. Хранение и шифрование",
        body: [
          "Все данные размещены на зашифрованных серверах в ЕС (AWS Frankfurt); изображения хранятся в приватных хранилищах и отдаются по подписанным ссылкам.",
        ],
      },
      {
        title: "6. Ваши права",
        body: [
          "Ст. 15 — доступ, ст. 16 — исправление, ст. 18 — ограничение, ст. 20 — переносимость.",
          "Ст. 17 — удаление: полное удаление профиля и фотографий одним нажатием в настройках.",
          "Вы также вправе подать жалобу в надзорный орган по защите данных.",
        ],
      },
      {
        title: "7. Платежи и cookie",
        body: [
          "Платежи проходят через Stripe; данные карты не хранятся на наших серверах.",
          "Мы используем только технически необходимые cookie для сессии и выбора языка.",
        ],
      },
    ],
  },
};