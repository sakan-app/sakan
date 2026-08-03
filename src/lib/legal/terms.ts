import type { FeatureDictionary } from "@/i18n/feature";
import type { LegalPageContent } from "./types";
import { COMPANY } from "@/lib/company";

export const termsContent: FeatureDictionary<LegalPageContent> = {
  ar: {
    title: "شروط الخدمة",
    subtitle: `الشروط والأحكام الخاصة باستخدام منصة سَكَن (${COMPANY.websiteLabel}).`,
    sections: [
      {
        title: "1. طبيعة الخدمة",
        body: [
          "سَكَن منصة للتعارف الجاد بهدف الزواج، وليست وكالة زواج ولا جهة قانونية، ولا تضمن حدوث ارتباط.",
          "العضوية والشات مجانيان 100%؛ الخدمات المدفوعة اختيارية بالكامل.",
        ],
      },
      {
        title: "2. الأهلية والحساب",
        body: [
          "يُشترط بلوغ 18 عاماً على الأقل وتقديم بيانات صحيحة وصور حقيقية لك أنت شخصياً.",
          "حساب واحد لكل شخص، ويُمنع انتحال الشخصية أو إنشاء حسابات وهمية.",
          "يبقى الحساب تحت المراجعة الآلية حتى اجتياز فحص التوثيق.",
        ],
      },
      {
        title: "3. قواعد السلوك",
        body: [
          "يُمنع أي محتوى مسيء أو جنسي صريح أو تحريضي أو تجاري غير مصرّح به.",
          "يُمنع منعاً باتاً طلب الأموال من الأعضاء أو الترويج لخدمات فيزا أو سفر مقابل مال.",
          "أي مخالفة تؤدي إلى إيقاف الحساب أو حظره نهائياً من قبل نظام المراجعة الآلي.",
        ],
      },
      {
        title: "4. المدفوعات ورسوم التميّز",
        body: [
          "الرسوم الوحيدة المعتمدة هي 0.99 يورو (99 سنتاً) لكل صورة/إعلان في شريط التميّز، وخطط الاشتراك الاختيارية المعروضة في صفحة الباقات.",
          "تتم المعالجة عبر Stripe. في المرحلة التجريبية لا تُخصم أموال حقيقية.",
          "حق الانسحاب: للمستهلك في الاتحاد الأوروبي حق الإلغاء خلال 14 يوماً، ويسقط هذا الحق فور بدء تنفيذ الخدمة الرقمية بموافقته الصريحة.",
        ],
      },
      {
        title: "5. المسؤولية وإنهاء الخدمة",
        body: [
          "لا تتحمل المنصة مسؤولية سلوك الأعضاء خارج نطاقها، وننصح دائماً بالحذر واللقاء في أماكن عامة.",
          "يمكنك حذف حسابك في أي وقت من الإعدادات، ويحق للمنصة إنهاء الحساب عند مخالفة هذه الشروط.",
          "القانون الواجب التطبيق هو القانون الألماني.",
        ],
      },
    ],
  },
  de: {
    title: "Nutzungsbedingungen (AGB)",
    subtitle: `Bedingungen für die Nutzung der Sakan-Plattform (${COMPANY.websiteLabel}).`,
    sections: [
      {
        title: "1. Art der Leistung",
        body: [
          "Sakan ist eine Plattform für ernsthafte Partnersuche mit Heiratsabsicht – keine Heiratsvermittlung und keine Rechtsberatung. Ein Erfolg wird nicht garantiert.",
          "Mitgliedschaft und Chat sind zu 100% kostenlos; kostenpflichtige Funktionen sind rein optional.",
        ],
      },
      {
        title: "2. Zulassung und Konto",
        body: [
          "Mindestalter 18 Jahre, wahrheitsgemäße Angaben und echte eigene Fotos sind Pflicht.",
          "Ein Konto pro Person; Identitätsmissbrauch und Fake-Profile sind untersagt.",
          "Das Konto bleibt bis zum Abschluss der automatisierten Prüfung im Status „in Überprüfung“.",
        ],
      },
      {
        title: "3. Verhaltensregeln",
        body: [
          "Beleidigende, sexuell explizite, hetzerische oder nicht genehmigte werbliche Inhalte sind verboten.",
          "Geldforderungen an Mitglieder sowie das Anbieten von Visa- oder Reiseleistungen gegen Bezahlung sind strikt untersagt.",
          "Verstöße führen zur Sperrung oder dauerhaften Löschung durch den KI-Manager.",
        ],
      },
      {
        title: "4. Zahlungen und Premium-Gebühr",
        body: [
          "Die einzige Premium-Gebühr beträgt 0,99 EUR (99 Cent) pro Bild/Anzeige im Ticker; zusätzlich gelten die optionalen Abopläne der Preisseite.",
          "Abwicklung über Stripe. Im Testbetrieb wird kein echtes Geld abgebucht.",
          "Widerrufsrecht: Verbraucher in der EU haben 14 Tage Widerrufsrecht; es erlischt mit ausdrücklich gewünschtem Beginn der digitalen Leistung.",
        ],
      },
      {
        title: "5. Haftung und Beendigung",
        body: [
          "Für das Verhalten von Mitgliedern außerhalb der Plattform übernehmen wir keine Haftung; Treffen bitte stets an öffentlichen Orten.",
          "Sie können Ihr Konto jederzeit in den Einstellungen löschen; wir dürfen Konten bei Verstößen beenden.",
          "Es gilt deutsches Recht.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of service",
    subtitle: `Terms governing the use of the Sakan platform (${COMPANY.websiteLabel}).`,
    sections: [
      {
        title: "1. Nature of the service",
        body: [
          "Sakan is a platform for serious matchmaking with marriage intent — not a marriage agency and not a legal advisor. No outcome is guaranteed.",
          "Membership and chat are 100% free; paid features are entirely optional.",
        ],
      },
      {
        title: "2. Eligibility and account",
        body: [
          "You must be at least 18, provide truthful details and use real photos of yourself.",
          "One account per person; impersonation and fake profiles are prohibited.",
          "Accounts stay under automated review until verification succeeds.",
        ],
      },
      {
        title: "3. Conduct rules",
        body: [
          "Abusive, sexually explicit, hateful or unauthorised commercial content is forbidden.",
          "Requesting money from members or selling visa/travel services is strictly prohibited.",
          "Violations lead to suspension or permanent ban by the AI moderation system.",
        ],
      },
      {
        title: "4. Payments and premium fee",
        body: [
          "The only premium fee is EUR 0.99 (99 cents) per image/ad in the featured ticker, plus the optional subscription plans listed on the pricing page.",
          "Processing runs through Stripe. In test mode no real money is charged.",
          "Right of withdrawal: EU consumers have 14 days to withdraw; the right expires once the digital service starts with their explicit consent.",
        ],
      },
      {
        title: "5. Liability and termination",
        body: [
          "We are not liable for member behaviour off-platform; always meet in public places.",
          "You may delete your account at any time in settings; we may terminate accounts that breach these terms.",
          "German law applies.",
        ],
      },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    subtitle: `Conditions générales régissant l'utilisation de la plateforme Sakan (${COMPANY.websiteLabel}).`,
    sections: [
      {
        title: "1. Nature du service",
        body: [
          "Sakan est une plateforme de rencontres sérieuses en vue du mariage ; ce n'est ni une agence matrimoniale ni un service juridique, et aucune union n'est garantie.",
          "L'inscription et le chat sont gratuits à 100 % ; les services payants sont entièrement optionnels.",
        ],
      },
      {
        title: "2. Éligibilité et compte",
        body: [
          "Il est exigé d'avoir au moins 18 ans et de fournir des informations exactes ainsi que de véritables photos personnelles.",
          "Un seul compte par personne ; l'usurpation d'identité et la création de faux comptes sont interdites.",
          "Le compte reste sous vérification automatique jusqu'à la validation du contrôle de vérification.",
        ],
      },
      {
        title: "3. Règles de conduite",
        body: [
          "Tout contenu offensant, sexuellement explicite, incitant à la haine ou publicitaire non autorisé est interdit.",
          "Il est strictement interdit de demander de l'argent aux membres ou de proposer des services de visa ou de voyage contre paiement.",
          "Toute infraction entraîne la suspension ou le bannissement définitif du compte par le système de modération automatique.",
        ],
      },
      {
        title: "4. Paiements et frais de mise en avant",
        body: [
          "Les seuls frais autorisés sont de 0,99 euro (99 centimes) par photo/annonce dans le bandeau de mise en avant, ainsi que les formules d'abonnement optionnelles présentées sur la page des tarifs.",
          "Le traitement s'effectue via Stripe. En phase de test, aucun montant réel n'est débité.",
          "Droit de rétractation : les consommateurs de l'Union européenne disposent d'un délai de rétractation de 14 jours, qui s'éteint dès le début de l'exécution du service numérique avec leur accord explicite.",
        ],
      },
      {
        title: "5. Responsabilité et résiliation",
        body: [
          "La plateforme n'assume aucune responsabilité quant au comportement des membres en dehors de son cadre ; nous recommandons toujours la prudence et de se rencontrer dans des lieux publics.",
          "Vous pouvez supprimer votre compte à tout moment depuis les paramètres, et la plateforme se réserve le droit de résilier un compte en cas de non-respect des présentes conditions.",
          "Le droit applicable est le droit allemand.",
        ],
      },
    ],
  },
};