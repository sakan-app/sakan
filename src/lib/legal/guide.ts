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
  ru: {
    title: "⚖️ Официальное руководство по брачному праву и безопасности",
    subtitle: "Платформа Sakan — правовое правило в Европе, необходимые документы и предупреждение о мошенничестве.",
    sections: [
      {
        title: "Основное правовое правило",
        body: [
          "Германия и страны ЕС признают брак, заключённый на их территории, только если он оформлен в государственном ЗАГСе (Standesamt).",
          "Чисто религиозный исламский брак (никах у имама) в Европе не имеет гражданско-правовых последствий и не принимается для иммиграции или воссоединения семьи.",
          "Большинство признанных мечетей требуют сначала свидетельство о гражданском браке.",
        ],
      },
      {
        title: "Необходимые документы",
        body: [
          "Брак в Германии: подача в Standesamt по месту жительства. Документы: действующий паспорт, легальное пребывание, свежее свидетельство о рождении (с переводом и заверением) и справка о брачной правоспособности из страны происхождения.",
          "Брак вне Европы и воссоединение семьи: гражданский брак в суде или министерстве юстиции страны партнёра, легализация в МИД этой страны и посольстве Германии, затем перевод присяжным переводчиком.",
          "Условия воссоединения: достаточный доход семьи без Jobcenter + достаточное жильё + сертификат немецкого языка A1 до въезда.",
          "Брак в Дании (быстрое решение в ЕС): минимальный пакет документов через Датское агентство семейного права при личном присутствии обоих; свидетельство автоматически признаётся в Германии и ЕС.",
        ],
      },
      {
        title: "Предупреждение о мошенничестве",
        body: [
          "Финансовые просьбы: запрещено переводить деньги онлайн на «билеты или визовые сборы». Администрация никогда не просит средства вне официальной платы (99 центов через Stripe).",
          "Ложные обещания: любой, кто обещает превратить религиозный брак в юридический документ для воссоединения без Standesamt, — мошенник.",
          "Мгновенная блокировка: если участник просит деньги, немедленно нажмите «Пожаловаться» — ИИ-менеджер заблокирует профиль навсегда.",
        ],
      },
    ],
  },
};