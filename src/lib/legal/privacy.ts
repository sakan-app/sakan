import type { FeatureDictionary } from "@/i18n/feature";
import type { LegalPageContent } from "./types";
import { COMPANY, COMPANY_PUBLIC_LOCATION } from "@/lib/company";

export const privacyContent: FeatureDictionary<LegalPageContent> = {
  ar: {
    title: "سياسة الخصوصية (GDPR / DSGVO)",
    subtitle: `تلتزم منصة سَكَن (${COMPANY.websiteLabel}) بحماية بياناتك وفقاً للمادة 13 من اللائحة الأوروبية GDPR وقانون حماية البيانات الألماني BDSG.`,
    sections: [
      {
        title: "1. المسؤول عن المعالجة",
        body: [
          COMPANY_PUBLIC_LOCATION,
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
          COMPANY_PUBLIC_LOCATION,
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
          COMPANY_PUBLIC_LOCATION,
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
  fr: {
    title: "Politique de confidentialité (RGPD / DSGVO)",
    subtitle: `La plateforme Sakan (${COMPANY.websiteLabel}) s'engage à protéger vos données conformément à l'article 13 du RGPD européen et à la loi allemande sur la protection des données (BDSG).`,
    sections: [
      {
        title: "1. Responsable du traitement",
        body: [
          COMPANY_PUBLIC_LOCATION,
          `Pour toute question relative aux données : ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "2. Données que nous traitons",
        body: [
          "Données de compte : nom, e-mail, date de naissance, sexe, pays et ville.",
          "Données de profil : photos, présentation, préférences et informations de vérification que vous téléversez volontairement.",
          "Données d'utilisation : messages, likes, journaux de connexion et données techniques à des fins de sécurité et de prévention de la fraude.",
        ],
      },
      {
        title: "3. Traitement par intelligence artificielle",
        body: [
          "Les photos et les textes sont analysés automatiquement via des interfaces de programmation chiffrées afin d'empêcher tout contenu inapproprié ou frauduleux ; ces données ne sont jamais utilisées pour entraîner des modèles d'IA publics ni divulguées à des tiers, conformément à l'article 9 du RGPD.",
          "La traduction automatique de la présentation et des messages a pour seul objectif de faciliter la communication.",
        ],
      },
      {
        title: "4. Base juridique et durée de conservation",
        body: [
          "Base juridique : exécution du contrat (art. 6§1 b), intérêt légitime pour la sécurité (art. 6§1 f) et consentement explicite pour les données sensibles (art. 9§2 a).",
          "Les données sont conservées tant que le compte est actif et sont supprimées dans un délai de 30 jours après la demande de suppression, sauf obligation légale contraire.",
        ],
      },
      {
        title: "5. Stockage et chiffrement",
        body: [
          "Toutes les données sont stockées sur des serveurs chiffrés au sein de l'Union européenne (AWS Francfort), avec un chiffrement lors du transfert et du stockage ; les photos de profil sont conservées dans des espaces privés accessibles via des liens temporaires signés.",
        ],
      },
      {
        title: "6. Vos droits",
        body: [
          "Article 15 : droit d'accès à vos données et d'en obtenir une copie.",
          "Article 16 : droit de rectification. Article 18 : droit à la limitation du traitement. Article 20 : droit à la portabilité des données.",
          "Article 17 : droit à la suppression complète et définitive de votre profil et de vos photos en un clic depuis les paramètres du compte.",
          "Vous avez également le droit de déposer une plainte auprès de l'autorité de protection des données compétente.",
        ],
      },
      {
        title: "7. Paiements et cookies",
        body: [
          "Les paiements sont traités via Stripe ; nous ne stockons jamais les données de votre carte sur nos serveurs.",
          "Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement de la session et à la préférence linguistique, sans traçage publicitaire sans votre consentement.",
        ],
      },
    ],
  },
};