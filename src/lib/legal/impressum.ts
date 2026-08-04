import type { FeatureDictionary } from "@/i18n/feature";
import type { LegalPageContent } from "./types";
import { COMPANY } from "@/lib/company";

const address = `${COMPANY.legalName}\n${COMPANY.street}\n${COMPANY.postalCode} ${COMPANY.city}\n${COMPANY.country}`;

export const impressumContent: FeatureDictionary<LegalPageContent> = {
  ar: {
    title: "بيانات الناشر (Impressum)",
    subtitle: "البيانات الإلزامية وفقاً للمادة 5 من قانون الخدمات الرقمية الألماني (§5 DDG/TMG)",
    sections: [
      { title: "المسؤول عن المحتوى", body: [address] },
      {
        title: "التواصل",
        body: [
          `الموقع الرسمي: ${COMPANY.websiteLabel}`,
          `البريد العام: ${COMPANY.infoEmail}`,
          `بريد خدمة العملاء: ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "الوضع التجاري",
        body: [
          "تعمل المنصة حالياً في مرحلة التشغيل التجريبي؛ المدفوعات تتم عبر بيئة Stripe التجريبية ولا تدخل أموال حقيقية.",
          "عند الانتقال إلى الوضع الحقيقي (Live Mode) يُضاف رقم السجل التجاري (Gewerbe) والرقم الضريبي (Steuernummer / USt-IdNr.) في هذه الصفحة، وهي حقول قابلة للتعديل من لوحة التحكم دون تعديل الكود.",
        ],
      },
      {
        title: "تسوية المنازعات",
        body: [
          "منصة الاتحاد الأوروبي لتسوية المنازعات عبر الإنترنت: https://ec.europa.eu/consumers/odr",
          "لسنا ملزمين ولا راغبين في المشاركة في إجراءات تسوية المنازعات أمام هيئة تحكيم استهلاكية.",
        ],
      },
    ],
  },
  de: {
    title: "Impressum",
    subtitle: "Angaben gemäß § 5 DDG (ehemals § 5 TMG)",
    sections: [
      { title: "Diensteanbieter / inhaltlich verantwortlich", body: [address] },
      {
        title: "Kontakt",
        body: [
          `Website: ${COMPANY.websiteLabel}`,
          `E-Mail: ${COMPANY.infoEmail}`,
          `Kundenservice: ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "Gewerbliche Angaben",
        body: [
          "Die Plattform befindet sich derzeit im Testbetrieb; Zahlungen laufen ausschließlich über den Stripe-Testmodus, es fließt kein echtes Geld.",
          "Mit Umstellung auf den Live-Modus werden Gewerbeanmeldung und Steuernummer (bzw. USt-IdNr. gem. § 27a UStG) hier ergänzt; die Felder sind über das Admin-Dashboard pflegbar.",
        ],
      },
      {
        title: "Streitbeilegung",
        body: [
          "EU-Plattform zur Online-Streitbeilegung: https://ec.europa.eu/consumers/odr",
          "Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
    ],
  },
  en: {
    title: "Imprint (Impressum)",
    subtitle: "Legal disclosure according to § 5 of the German Digital Services Act (DDG/TMG)",
    sections: [
      { title: "Service provider / responsible for content", body: [address] },
      {
        title: "Contact",
        body: [
          `Website: ${COMPANY.websiteLabel}`,
          `General email: ${COMPANY.infoEmail}`,
          `Customer service: ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "Commercial status",
        body: [
          "The platform currently runs in test mode; payments go through the Stripe test environment and no real money is processed.",
          "When switching to live mode, the German trade registration (Gewerbe) and tax number (Steuernummer / VAT ID) will be published here; both fields are editable from the admin dashboard.",
        ],
      },
      {
        title: "Dispute resolution",
        body: [
          "EU online dispute resolution platform: https://ec.europa.eu/consumers/odr",
          "We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board.",
        ],
      },
    ],
  },
  fr: {
    title: "Mentions légales (Impressum)",
    subtitle: "Informations obligatoires conformément à l'article 5 de la loi allemande sur les services numériques (§5 DDG/TMG)",
    sections: [
      { title: "Responsable du contenu", body: [address] },
      {
        title: "Contact",
        body: [
          `Site officiel : ${COMPANY.websiteLabel}`,
          `E-mail général : ${COMPANY.infoEmail}`,
          `E-mail du service client : ${COMPANY.serviceEmail}`,
        ],
      },
      {
        title: "Statut commercial",
        body: [
          "La plateforme fonctionne actuellement en phase d'exploitation test ; les paiements s'effectuent via l'environnement de test Stripe et aucun montant réel n'est débité.",
          "Lors du passage en mode réel (Live Mode), le numéro d'immatriculation commerciale (Gewerbe) et le numéro fiscal (Steuernummer / USt-IdNr.) seront ajoutés sur cette page ; ces champs sont modifiables depuis le tableau de bord d'administration sans modification du code.",
        ],
      },
      {
        title: "Règlement des litiges",
        body: [
          "Plateforme de règlement en ligne des litiges de l'Union européenne : https://ec.europa.eu/consumers/odr",
          "Nous ne sommes ni tenus ni disposés à participer à une procédure de règlement des litiges devant un organisme de médiation de la consommation.",
        ],
      },
    ],
  },
};