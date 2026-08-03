import type { FeatureDictionary } from "@/i18n/feature";
import type { LegalPageContent } from "./types";

/**
 * "Marriage Law & Security Guide" — the header premium document required by the
 * project brief, rendered as a real page (printable) in all four languages.
 */
export const guideContent: FeatureDictionary<LegalPageContent> = {
  ar: {
    title: "⚖️ دليل قانون الزواج الرسمي والتحذيرات الأمنية",
    subtitle: "منصة سَكَن — القاعدة القانونية في أوروبا، الأوراق المطلوبة، وتحذير صارم من الاحتيال.",
    sections: [
      {
        title: "القاعدة القانونية في أوروبا",
        body: [
          "لا تعترف ألمانيا ودول الاتحاد الأوروبي بأي زواج يتم داخل حدودها إلا إذا أُبرم رسمياً في مكتب السجل المدني الحكومي (Standesamt).",
          "عقد الزواج الشرعي الإسلامي (عقد الشيخ في المسجد) داخل أوروبا لا يترتب عليه أي أثر قانوني مدني ولا يُقبل في معاملات الهجرة أو لم الشمل.",
          "تشترط معظم المساجد المعتمدة إبراز وثيقة الزواج المدني أولاً قبل إتمام القران الشرعي.",
        ],
      },
      {
        title: "مسارات الأوراق المطلوبة",
        body: [
          "الزواج داخل ألمانيا: التقديم في الـ Standesamt التابع للمدينة. الأوراق: جواز سفر ساري، إقامة قانونية، شهادة ميلاد حديثة (مترجمة ومصدقة)، وشهادة إثبات عزوبية (Ledigkeitsbescheinigung) مصدقة من بلد المنشأ.",
          "الزواج من خارج أوروبا ولم الشمل: يُعقد الزواج المدني الرسمي في المحكمة أو وزارة العدل في بلد الشريك، ويُصدَّق من وزارة خارجية ذلك البلد ومن السفارة الألمانية، ثم يُترجم لدى مترجم محلَّف في ألمانيا.",
          "شروط لم الشمل: دخل مالي كافٍ للأسرة خارج الجوب سنتر + سكن بمساحة كافية + شهادة لغة ألمانية مستوى A1 للشريك قبل السفر.",
          "الزواج في الدنمارك (الحل الأوروبي السريع): مستندات بسيطة عبر وكالة قانون الأسرة الدنماركية مع حضور الطرفين شخصياً، والعقد معترف به تلقائياً في ألمانيا وبقية دول الاتحاد لمعاملات الإقامة وتغيير فئة الضرائب.",
        ],
      },
      {
        title: "تحذير أمني صارم من الاحتيال",
        body: [
          "الطلبات المالية: يُمنع منعاً باتاً إرسال أموال لأي شخص أونلاين بحجة تذاكر الطيران أو رسوم الفيزا. إدارة المنصة لا تطلب أي مبالغ خارج الرسوم المعتمدة (99 سنتاً عبر Stripe).",
          "الوعود الوهمية: أي طرف يدّعي تحويل عقد شرعي إلى مستند قانوني للم الشمل دون الـ Standesamt فهو محتال.",
          "الحظر الفوري: عند طلب أي عضو للمال، اضغط زر الإبلاغ فوراً ليقوم المدير الآلي بحظره نهائياً ومسح ملفه.",
        ],
      },
    ],
  },
  de: {
    title: "⚖️ Offizieller Leitfaden zum Eherecht & Sicherheitshinweise",
    subtitle: "Sakan Plattform — rechtliche Grundregel, erforderliche Dokumente und Schutz vor Betrug.",
    sections: [
      {
        title: "Rechtliche Grundregel",
        body: [
          "Deutschland und die EU-Staaten erkennen eine im Inland geschlossene Ehe rechtlich nur an, wenn sie vor dem staatlichen Standesamt geschlossen wurde.",
          "Eine rein religiöse islamische Trauung (Imam-Ehe) innerhalb Europas hat keinerlei zivilrechtliche Wirkung und wird für Einwanderung oder Familiennachzug nicht akzeptiert.",
          "Die meisten anerkannten Moscheen verlangen zuerst die standesamtliche Heiratsurkunde.",
        ],
      },
      {
        title: "Erforderliche Dokumente",
        body: [
          "Eheschließung in Deutschland: Anmeldung beim zuständigen Standesamt. Unterlagen: gültiger Pass, legaler Aufenthalt, aktuelle Geburtsurkunde (übersetzt und beglaubigt) und Ledigkeitsbescheinigung aus dem Herkunftsland.",
          "Heirat außerhalb Europas & Familiennachzug: zivile Eheschließung im Heimatland des Partners, Beglaubigung durch das dortige Außenministerium und die deutsche Botschaft, danach Übersetzung durch einen vereidigten Übersetzer.",
          "Voraussetzungen für den Nachzug: ausreichendes Einkommen ohne Jobcenter + ausreichender Wohnraum + Deutschzertifikat A1 vor der Einreise.",
          "Heirat in Dänemark (schnelle EU-Lösung): sehr einfache Unterlagen über die dänische Familienrechtsbehörde, persönliche Anwesenheit beider Partner; die Ehe wird in Deutschland und der EU automatisch anerkannt.",
        ],
      },
      {
        title: "Schutz vor Betrug",
        body: [
          "Geldanforderungen: Es ist verboten, Geld online für „Flugtickets oder Visumgebühren“ zu senden. Die Verwaltung verlangt niemals Gelder außerhalb der Systemgebühr (99 Cent via Stripe).",
          "Falsche Versprechen: Wer behauptet, eine religiöse Ehe ohne Standesamt rechtlich für den Familiennachzug bindend zu machen, betreibt Betrug.",
          "Sofortige Sperrung: Wenn ein Mitglied nach Geld fragt, melden Sie es sofort — der KI-Manager sperrt das Profil dauerhaft.",
        ],
      },
    ],
  },
  en: {
    title: "⚖️ Official marriage law guide & security notice",
    subtitle: "Sakan platform — the legal rule in Europe, required documents and a strict anti-fraud warning.",
    sections: [
      {
        title: "The core legal rule",
        body: [
          "Germany and EU countries do not legally recognise any marriage concluded within their borders unless it is officially registered at the civil registry office (Standesamt).",
          "A purely religious Islamic marriage (imam marriage) inside Europe has no civil legal effect and is not accepted for immigration or family reunification.",
          "Most recognised mosques require a civil marriage certificate before performing the religious ceremony.",
        ],
      },
      {
        title: "Required documents",
        body: [
          "Marriage inside Germany: apply at your city's Standesamt with a valid passport, legal residence, a recent birth certificate (translated and certified) and a certificate of no impediment (Ledigkeitsbescheinigung) from your country of origin.",
          "Marriage abroad & family reunification: conclude the civil marriage at the court or ministry of justice in the partner's country, legalise it through that country's foreign ministry and the German embassy, then have it translated by a sworn translator in Germany.",
          "Reunification requirements: sufficient family income without Jobcenter support + adequate housing + German language certificate level A1 before travel.",
          "Marriage in Denmark (the fast EU solution): very simple documents through the Danish Family Law Agency with both partners present; the certificate is automatically recognised across Germany and the EU for residence and tax class changes.",
        ],
      },
      {
        title: "Anti-fraud warning",
        body: [
          "Financial requests: never transfer money online for \"flight tickets or visa fees\". Sakan never requests funds outside the official fee (the 99-cent premium feature via Stripe).",
          "False promises: anyone claiming to turn a religious contract into a legal reunification document without the Standesamt is committing fraud.",
          "Instant block: if a member asks for money, report them immediately so the AI manager bans the profile permanently.",
        ],
      },
    ],
  },
  fr: {
    title: "⚖️ Guide officiel du droit du mariage et avertissements de sécurité",
    subtitle: "Plateforme Sakan — la règle légale en Europe, les documents requis et une mise en garde stricte contre la fraude.",
    sections: [
      {
        title: "La règle légale fondamentale",
        body: [
          "L'Allemagne et les pays de l'UE ne reconnaissent légalement aucun mariage conclu sur leur territoire s'il n'a pas été officiellement enregistré auprès du bureau d'état civil (Standesamt).",
          "Un mariage islamique purement religieux (mariage devant un imam) conclu en Europe n'a aucun effet juridique civil et n'est pas accepté pour l'immigration ou le regroupement familial.",
          "La plupart des mosquées reconnues exigent d'abord la présentation de l'acte de mariage civil avant de célébrer le mariage religieux.",
        ],
      },
      {
        title: "Parcours des documents requis",
        body: [
          "Mariage en Allemagne : dépôt de la demande au Standesamt de la ville concernée. Documents : passeport valide, séjour légal, acte de naissance récent (traduit et certifié), et certificat de célibat (Ledigkeitsbescheinigung) légalisé par le pays d'origine.",
          "Mariage hors d'Europe et regroupement familial : le mariage civil officiel est célébré devant le tribunal ou le ministère de la Justice du pays du partenaire, puis légalisé par le ministère des Affaires étrangères de ce pays et par l'ambassade d'Allemagne, avant d'être traduit par un traducteur assermenté en Allemagne.",
          "Conditions du regroupement familial : revenu familial suffisant sans recours au Jobcenter + logement d'une superficie adéquate + certificat de langue allemande niveau A1 pour le partenaire avant le départ.",
          "Mariage au Danemark (la solution européenne rapide) : documents simplifiés via l'agence danoise du droit de la famille, avec présence physique des deux parties ; l'acte est automatiquement reconnu en Allemagne et dans le reste de l'UE pour les démarches de séjour et le changement de classe fiscale.",
        ],
      },
      {
        title: "Avertissement strict contre la fraude",
        body: [
          "Demandes financières : il est strictement interdit d'envoyer de l'argent à quiconque en ligne sous prétexte de billets d'avion ou de frais de visa. La direction de la plateforme ne demande aucune somme en dehors des frais officiels (99 centimes via Stripe).",
          "Fausses promesses : toute personne prétendant transformer un contrat religieux en document légal pour le regroupement familial sans passer par le Standesamt est un escroc.",
          "Blocage immédiat : dès qu'un membre demande de l'argent, appuyez immédiatement sur le bouton de signalement afin que le gestionnaire automatique le bannisse définitivement et efface son profil.",
        ],
      },
    ],
  },
};