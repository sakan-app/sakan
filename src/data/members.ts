import p1 from "@/assets/members/s1_0.jpg";
import p2 from "@/assets/members/s1_1.jpg";
import p3 from "@/assets/members/s1_2.jpg";
import p4 from "@/assets/members/s1_3.jpg";
import p5 from "@/assets/members/s1_4.jpg";
import p6 from "@/assets/members/s1_5.jpg";
import p7 from "@/assets/members/s2_0.jpg";
import p8 from "@/assets/members/s2_1.jpg";
import p9 from "@/assets/members/s2_2.jpg";
import p10 from "@/assets/members/s2_3.jpg";
import p11 from "@/assets/members/s2_4.jpg";
import p12 from "@/assets/members/s2_5.jpg";
import p13 from "@/assets/members/s2_6.jpg";
import p14 from "@/assets/members/s2_7.jpg";

export type Gender = "male" | "female";

export interface Member {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  lookingFor: Gender;
  country: string;
  countryAr: string;
  city: string;
  cityAr: string;
  profilePhoto: string;
  additionalPhotos: string[];
  isVerified: boolean;
  countryFlag: string;
  bio: string;
  interests: string[];
  education: string;
  job: string;
  maritalStatus: string;
  languages: string[];
  religiousLevel: string;
  online: boolean;
}

export const countries = [
  { code: "DE", ar: "ألمانيا", flag: "🇩🇪" },
  { code: "FR", ar: "فرنسا", flag: "🇫🇷" },
  { code: "AT", ar: "النمسا", flag: "🇦🇹" },
  { code: "CZ", ar: "التشيك", flag: "🇨🇿" },
  { code: "PL", ar: "بولندا", flag: "🇵🇱" },
  { code: "ES", ar: "إسبانيا", flag: "🇪🇸" },
  { code: "IT", ar: "إيطاليا", flag: "🇮🇹" },
  { code: "CH", ar: "سويسرا", flag: "🇨🇭" },
  { code: "BE", ar: "بلجيكا", flag: "🇧🇪" },
  { code: "NL", ar: "هولندا", flag: "🇳🇱" },
];

export const members: Member[] = [
  {
    id: "1",
    name: "أحمد",
    age: 31,
    gender: "male",
    lookingFor: "female",
    country: "AT",
    countryAr: "النمسا",
    city: "Vienna",
    cityAr: "فيينا",
    profilePhoto: p1,
    additionalPhotos: [p3, p7, p9],
    isVerified: true,
    countryFlag: "🇦🇹",
    bio: "مهندس برمجيات مقيم في فيينا، أبحث عن شريكة حياة متدينة وطموحة لبناء بيت هادئ قائم على الاحترام والمودة.",
    interests: ["القراءة", "السفر", "الرياضة", "الطبخ"],
    education: "ماجستير هندسة",
    job: "مهندس برمجيات",
    maritalStatus: "أعزب",
    languages: ["العربية", "الألمانية", "الإنجليزية"],
    religiousLevel: "متدين",
    online: true,
  },
  {
    id: "2",
    name: "يوليا",
    age: 28,
    gender: "female",
    lookingFor: "male",
    country: "DE",
    countryAr: "ألمانيا",
    city: "Berlin",
    cityAr: "برلين",
    profilePhoto: p10,
    additionalPhotos: [p12, p14, p9],
    isVerified: true,
    countryFlag: "🇩🇪",
    bio: "مسلمة جديدة أعيش في برلين، أحب اللغات والفن، أبحث عن زوج صادق يقدّر الأسرة والاستقرار.",
    interests: ["اللغات", "الفن", "المشي", "التصوير"],
    education: "بكالوريوس تصميم",
    job: "مصممة جرافيك",
    maritalStatus: "عزباء",
    languages: ["الألمانية", "الإنجليزية", "العربية"],
    religiousLevel: "ملتزمة",
    online: true,
  },
  {
    id: "3",
    name: "عمر",
    age: 30,
    gender: "male",
    lookingFor: "female",
    country: "DE",
    countryAr: "ألمانيا",
    city: "Munich",
    cityAr: "ميونخ",
    profilePhoto: p2,
    additionalPhotos: [p4, p8, p1],
    isVerified: true,
    countryFlag: "🇩🇪",
    bio: "طبيب أسنان في ميونخ، هادئ الطباع وأحب الحياة العائلية البسيطة.",
    interests: ["الطب", "السباحة", "القهوة", "التاريخ"],
    education: "دكتوراه طب أسنان",
    job: "طبيب أسنان",
    maritalStatus: "أعزب",
    languages: ["العربية", "الألمانية"],
    religiousLevel: "متدين",
    online: false,
  },
  {
    id: "4",
    name: "سفيتلانا",
    age: 27,
    gender: "female",
    lookingFor: "male",
    country: "CZ",
    countryAr: "التشيك",
    city: "Prague",
    cityAr: "براغ",
    profilePhoto: p6,
    additionalPhotos: [p10, p5, p12],
    isVerified: true,
    countryFlag: "🇨🇿",
    bio: "أعمل في مجال التعليم في براغ، أبحث عن علاقة جادة تنتهي بالزواج بإذن الله.",
    interests: ["التعليم", "الموسيقى", "الطبيعة"],
    education: "بكالوريوس تربية",
    job: "معلمة",
    maritalStatus: "عزباء",
    languages: ["التشيكية", "الإنجليزية"],
    religiousLevel: "ملتزمة",
    online: true,
  },
  {
    id: "5",
    name: "كريم",
    age: 29,
    gender: "male",
    lookingFor: "female",
    country: "FR",
    countryAr: "فرنسا",
    city: "Paris",
    cityAr: "باريس",
    profilePhoto: p4,
    additionalPhotos: [p11, p2, p7],
    isVerified: true,
    countryFlag: "🇫🇷",
    bio: "رائد أعمال في باريس، أؤمن أن السكن الحقيقي هو شريك يفهمك بصمت.",
    interests: ["ريادة الأعمال", "الجري", "السفر"],
    education: "ماجستير إدارة أعمال",
    job: "رائد أعمال",
    maritalStatus: "أعزب",
    languages: ["الفرنسية", "العربية", "الإنجليزية"],
    religiousLevel: "متدين",
    online: true,
  },
  {
    id: "6",
    name: "إيلينا",
    age: 32,
    gender: "female",
    lookingFor: "male",
    country: "PL",
    countryAr: "بولندا",
    city: "Warsaw",
    cityAr: "وارسو",
    profilePhoto: p12,
    additionalPhotos: [p14, p6, p10],
    isVerified: true,
    countryFlag: "🇵🇱",
    bio: "صيدلانية في وارسو، هادئة ومحبة للعائلة وأبحث عن شريك متزن.",
    interests: ["الصحة", "المطالعة", "اليوغا"],
    education: "بكالوريوس صيدلة",
    job: "صيدلانية",
    maritalStatus: "عزباء",
    languages: ["البولندية", "الإنجليزية"],
    religiousLevel: "ملتزمة",
    online: false,
  },
  {
    id: "7",
    name: "دانيال",
    age: 33,
    gender: "male",
    lookingFor: "female",
    country: "CH",
    countryAr: "سويسرا",
    city: "Zurich",
    cityAr: "زيورخ",
    profilePhoto: p8,
    additionalPhotos: [p1, p11, p3],
    isVerified: true,
    countryFlag: "🇨🇭",
    bio: "محاسب مقيم في زيورخ، أبحث عن الاستقرار والسكينة مع شريكة صادقة.",
    interests: ["المالية", "التزلج", "الشطرنج"],
    education: "بكالوريوس محاسبة",
    job: "محاسب قانوني",
    maritalStatus: "أعزب",
    languages: ["الألمانية", "الإنجليزية"],
    religiousLevel: "متدين",
    online: true,
  },
  {
    id: "8",
    name: "أمينة",
    age: 31,
    gender: "female",
    lookingFor: "male",
    country: "AT",
    countryAr: "النمسا",
    city: "Graz",
    cityAr: "غراتس",
    profilePhoto: p9,
    additionalPhotos: [p13, p12, p14],
    isVerified: true,
    countryFlag: "🇦🇹",
    bio: "ممرضة في غراتس، أحب العمل التطوعي وأبحث عن بيت مبني على التقوى.",
    interests: ["التطوع", "الخياطة", "القرآن"],
    education: "دبلوم تمريض",
    job: "ممرضة",
    maritalStatus: "عزباء",
    languages: ["العربية", "الألمانية"],
    religiousLevel: "ملتزمة",
    online: true,
  },
  {
    id: "9",
    name: "ليلى",
    age: 26,
    gender: "female",
    lookingFor: "male",
    country: "NL",
    countryAr: "هولندا",
    city: "Amsterdam",
    cityAr: "أمستردام",
    profilePhoto: p13,
    additionalPhotos: [p9, p5, p10],
    isVerified: true,
    countryFlag: "🇳🇱",
    bio: "طالبة دراسات عليا في أمستردام، أبحث عن شريك يشاركني الطموح والدين.",
    interests: ["البحث العلمي", "الدراجات", "الكتب"],
    education: "ماجستير علوم بيانات",
    job: "باحثة",
    maritalStatus: "عزباء",
    languages: ["الهولندية", "الإنجليزية", "العربية"],
    religiousLevel: "ملتزمة",
    online: false,
  },
  {
    id: "10",
    name: "يوسف",
    age: 32,
    gender: "male",
    lookingFor: "female",
    country: "IT",
    countryAr: "إيطاليا",
    city: "Milan",
    cityAr: "ميلانو",
    profilePhoto: p11,
    additionalPhotos: [p7, p2, p4],
    isVerified: false,
    countryFlag: "🇮🇹",
    bio: "مهندس معماري في ميلانو، أصمم البيوت وأحلم ببناء بيتي الخاص.",
    interests: ["العمارة", "الرسم", "السفر"],
    education: "ماجستير عمارة",
    job: "مهندس معماري",
    maritalStatus: "أعزب",
    languages: ["الإيطالية", "العربية"],
    religiousLevel: "متدين",
    online: true,
  },
  {
    id: "11",
    name: "سارة",
    age: 27,
    gender: "female",
    lookingFor: "male",
    country: "ES",
    countryAr: "إسبانيا",
    city: "Madrid",
    cityAr: "مدريد",
    profilePhoto: p5,
    additionalPhotos: [p6, p13, p9],
    isVerified: true,
    countryFlag: "🇪🇸",
    bio: "مترجمة في مدريد، أحب اللغات والثقافات وأبحث عن شريك متفهم.",
    interests: ["الترجمة", "الرقص", "المطبخ"],
    education: "بكالوريوس لغات",
    job: "مترجمة",
    maritalStatus: "عزباء",
    languages: ["الإسبانية", "العربية", "الإنجليزية"],
    religiousLevel: "ملتزمة",
    online: true,
  },
  {
    id: "12",
    name: "محمد",
    age: 30,
    gender: "male",
    lookingFor: "female",
    country: "BE",
    countryAr: "بلجيكا",
    city: "Brussels",
    cityAr: "بروكسل",
    profilePhoto: p7,
    additionalPhotos: [p8, p1, p11],
    isVerified: true,
    countryFlag: "🇧🇪",
    bio: "أعمل في مجال اللوجستيات ببروكسل، هادئ وأبحث عن حياة زوجية مستقرة.",
    interests: ["كرة القدم", "الدراجات", "التاريخ"],
    education: "بكالوريوس إدارة",
    job: "مدير لوجستيات",
    maritalStatus: "أعزب",
    languages: ["الفرنسية", "العربية"],
    religiousLevel: "متدين",
    online: false,
  },
];

export interface SearchCriteria {
  iAm: Gender;
  lookingFor: Gender;
  minAge: number;
  maxAge: number;
  country: string;
}

export function filterMembers(c: Partial<SearchCriteria>): Member[] {
  return members.filter((m) => {
    if (c.lookingFor && m.gender !== c.lookingFor) return false;
    if (c.iAm && m.lookingFor !== c.iAm) return false;
    if (c.minAge && m.age < c.minAge) return false;
    if (c.maxAge && m.age > c.maxAge) return false;
    if (c.country && c.country !== "all" && m.country !== c.country) return false;
    return true;
  });
}