import type { Locale } from "@/i18n";

/** Four-locale tuple: [ar, en, de, fr]. Keeps the catalog readable. */
type L4 = readonly [string, string, string, string];

const LOCALE_INDEX: Record<Locale, 0 | 1 | 2 | 3> = { ar: 0, en: 1, de: 2, fr: 3 };

export function t4(value: L4, locale: Locale): string {
  return value[LOCALE_INDEX[locale]] ?? value[1]!;
}

export type WallpaperCategory =
  | "minimal"
  | "dark"
  | "gradient"
  | "abstract"
  | "islamic"
  | "nature"
  | "mountains"
  | "sea"
  | "sky"
  | "night"
  | "gold"
  | "marble"
  | "paper"
  | "glass"
  | "blur"
  | "fabric"
  | "arabic"
  | "premium";

export const WALLPAPER_CATEGORIES: { id: WallpaperCategory; label: L4 }[] = [
  { id: "minimal", label: ["بسيط", "Minimal", "Minimal", "Minimaliste"] },
  { id: "dark", label: ["داكن", "Dark", "Dunkel", "Sombre"] },
  { id: "gradient", label: ["تدرّج", "Gradient", "Verlauf", "Dégradé"] },
  { id: "abstract", label: ["تجريدي", "Abstract", "Abstrakt", "Abstrait"] },
  { id: "islamic", label: ["زخرفة إسلامية", "Islamic Geometry", "Islamische Geometrie", "Géométrie islamique"] },
  { id: "nature", label: ["طبيعة", "Nature", "Natur", "Nature"] },
  { id: "mountains", label: ["جبال", "Mountains", "Berge", "Montagnes"] },
  { id: "sea", label: ["بحر", "Sea", "Meer", "Mer"] },
  { id: "sky", label: ["سماء", "Sky", "Himmel", "Ciel"] },
  { id: "night", label: ["ليل", "Night", "Nacht", "Nuit"] },
  { id: "gold", label: ["نقش ذهبي", "Gold Pattern", "Goldmuster", "Motif doré"] },
  { id: "marble", label: ["رخام", "Marble", "Marmor", "Marbre"] },
  { id: "paper", label: ["ورق", "Paper", "Papier", "Papier"] },
  { id: "glass", label: ["زجاج", "Glass", "Glas", "Verre"] },
  { id: "blur", label: ["ضبابي", "Blur", "Unschärfe", "Flou"] },
  { id: "fabric", label: ["قماش", "Fabric", "Stoff", "Tissu"] },
  { id: "arabic", label: ["نقش عربي", "Arabic Pattern", "Arabisches Muster", "Motif arabe"] },
  { id: "premium", label: ["حصري بريميوم", "Premium Exclusive", "Premium Exklusiv", "Premium exclusif"] },
];

export type BuiltinWallpaper = {
  id: string;
  category: WallpaperCategory;
  name: L4;
  /** CSS background shorthand — resolution independent, never stretches. */
  image: string;
  /** Optional extra pattern layer rendered above `image`. */
  thumbnail?: string;
  premium: boolean;
  /** Designed for the dark navy shell (all Sakan wallpapers are). */
  darkCompatible: boolean;
  /** Suggested starting blur in px. */
  recommendedBlur: number;
};

const NAVY = "#0D1B3D";
const NAVY_DEEP = "#0A1430";
const GOLD = "#D4AF37";

function dots(color: string, size = 22) {
  return `radial-gradient(${color} 1px, transparent 1px) 0 0 / ${size}px ${size}px`;
}
function grid(color: string, size = 28) {
  return `linear-gradient(${color} 1px, transparent 1px) 0 0 / 100% ${size}px, linear-gradient(90deg, ${color} 1px, transparent 1px) 0 0 / ${size}px 100%`;
}
function diagonal(color: string, size = 16) {
  return `repeating-linear-gradient(45deg, ${color} 0 1px, transparent 1px ${size}px)`;
}
function starGeometry(color: string, size = 46) {
  return [
    `repeating-linear-gradient(60deg, ${color} 0 1px, transparent 1px ${size}px)`,
    `repeating-linear-gradient(-60deg, ${color} 0 1px, transparent 1px ${size}px)`,
    `repeating-linear-gradient(0deg, ${color} 0 1px, transparent 1px ${size}px)`,
  ].join(", ");
}
function arabesque(color: string, size = 40) {
  return [
    `radial-gradient(circle at 50% 0, transparent ${size / 2.6}px, ${color} ${size / 2.6}px, transparent ${size / 2.4}px) 0 0 / ${size}px ${size}px`,
    `radial-gradient(circle at 0 50%, transparent ${size / 2.6}px, ${color} ${size / 2.6}px, transparent ${size / 2.4}px) 0 0 / ${size}px ${size}px`,
  ].join(", ");
}

/** The full built-in gallery. Pure CSS: zero payload, crisp on every DPI. */
export const BUILTIN_WALLPAPERS: BuiltinWallpaper[] = [
  {
    id: "default",
    category: "minimal",
    name: ["سَكَن الافتراضي", "Sakan Default", "Sakan Standard", "Sakan par défaut"],
    image: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "minimal-dots",
    category: "minimal",
    name: ["نقاط هادئة", "Quiet Dots", "Ruhige Punkte", "Points discrets"],
    image: `${dots("rgba(212,175,55,0.16)")}, linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "minimal-grid",
    category: "minimal",
    name: ["شبكة ناعمة", "Soft Grid", "Weiches Raster", "Grille douce"],
    image: `${grid("rgba(255,255,255,0.05)")}, linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "dark-ink",
    category: "dark",
    name: ["حبر داكن", "Dark Ink", "Dunkle Tinte", "Encre sombre"],
    image: "radial-gradient(120% 90% at 50% 0%, #16203f 0%, #070c1c 100%)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "dark-carbon",
    category: "dark",
    name: ["كربون", "Carbon", "Karbon", "Carbone"],
    image: `${diagonal("rgba(255,255,255,0.04)", 10)}, linear-gradient(180deg, #0b1226, #060a17)`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "gradient-royal",
    category: "gradient",
    name: ["ملكي", "Royal", "Royal", "Royal"],
    image: "linear-gradient(140deg, #0D1B3D 0%, #1b2b63 45%, #3a2c5e 100%)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "gradient-sunset",
    category: "gradient",
    name: ["غروب", "Sunset", "Sonnenuntergang", "Coucher de soleil"],
    image: "linear-gradient(160deg, #1a1436 0%, #4a2340 50%, #7a3b2e 100%)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "abstract-aurora",
    category: "abstract",
    name: ["شفق", "Aurora", "Aurora", "Aurore"],
    image:
      "radial-gradient(60% 45% at 15% 20%, rgba(64,196,180,0.35), transparent 70%), radial-gradient(55% 45% at 85% 30%, rgba(120,90,220,0.35), transparent 70%), linear-gradient(180deg, #081026, #0D1B3D)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 6,
  },
  {
    id: "abstract-orbits",
    category: "abstract",
    name: ["مدارات", "Orbits", "Orbits", "Orbites"],
    image: `repeating-radial-gradient(circle at 30% 40%, rgba(212,175,55,0.10) 0 1px, transparent 1px 34px), linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "islamic-stars",
    category: "islamic",
    name: ["نجوم إسلامية", "Islamic Stars", "Islamische Sterne", "Étoiles islamiques"],
    image: `${starGeometry("rgba(212,175,55,0.13)")}, linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "islamic-mosaic",
    category: "islamic",
    name: ["فسيفساء", "Mosaic", "Mosaik", "Mosaïque"],
    image: `${starGeometry("rgba(255,255,255,0.07)", 30)}, radial-gradient(90% 70% at 50% 0%, #16255a, #0A1430)`,
    premium: true,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "nature-olive",
    category: "nature",
    name: ["زيتون", "Olive", "Olive", "Olive"],
    image: "linear-gradient(170deg, #0f2018 0%, #17311f 55%, #0b1a13 100%)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "mountains-dusk",
    category: "mountains",
    name: ["جبال الغسق", "Dusk Peaks", "Gipfel im Zwielicht", "Sommets au crépuscule"],
    image:
      "linear-gradient(115deg, transparent 45%, rgba(255,255,255,0.05) 45.5% 55%, transparent 55.5%), linear-gradient(-115deg, transparent 40%, rgba(255,255,255,0.04) 40.5% 52%, transparent 52.5%), linear-gradient(180deg, #1a2547, #070c1c)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "sea-deep",
    category: "sea",
    name: ["بحر عميق", "Deep Sea", "Tiefsee", "Mer profonde"],
    image: "radial-gradient(100% 70% at 50% 100%, #0f3a55 0%, #07172e 70%, #050c1c 100%)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "sky-dawn",
    category: "sky",
    name: ["فجر", "Dawn Sky", "Morgenhimmel", "Ciel d'aube"],
    image: "linear-gradient(180deg, #16224a 0%, #2c3a72 45%, #6b4a63 100%)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "night-stars",
    category: "night",
    name: ["ليلة نجوم", "Starry Night", "Sternennacht", "Nuit étoilée"],
    image: `${dots("rgba(255,255,255,0.22)", 38)}, ${dots("rgba(255,255,255,0.10)", 17)}, radial-gradient(120% 90% at 70% 10%, #14224b, #04070f)`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "gold-lattice",
    category: "gold",
    name: ["شبك ذهبي", "Gold Lattice", "Goldgitter", "Treillis doré"],
    image: `${diagonal("rgba(212,175,55,0.16)", 18)}, ${diagonal("rgba(212,175,55,0.10)", 18).replace("45deg", "-45deg")}, linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "gold-silk",
    category: "gold",
    name: ["حرير ذهبي", "Gold Silk", "Goldseide", "Soie dorée"],
    image: `repeating-linear-gradient(115deg, rgba(212,175,55,0.12) 0 2px, transparent 2px 12px), linear-gradient(150deg, #10193a, #241d10 130%)`,
    premium: true,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "marble-navy",
    category: "marble",
    name: ["رخام كحلي", "Navy Marble", "Marineblauer Marmor", "Marbre sombre"],
    image:
      "repeating-linear-gradient(58deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 9px), repeating-linear-gradient(-24deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 23px), radial-gradient(90% 70% at 30% 20%, #1d2a55, #0b1229)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "paper-grain",
    category: "paper",
    name: ["ورق محبب", "Grain Paper", "Körniges Papier", "Papier grainé"],
    image: `${dots("rgba(255,255,255,0.05)", 5)}, linear-gradient(180deg, #1a1c26, #101219)`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "glass-panes",
    category: "glass",
    name: ["ألواح زجاج", "Glass Panes", "Glasflächen", "Panneaux de verre"],
    image: `${grid("rgba(255,255,255,0.07)", 64)}, linear-gradient(135deg, rgba(255,255,255,0.06), transparent 60%), linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 2,
  },
  {
    id: "blur-bokeh",
    category: "blur",
    name: ["بوكيه", "Bokeh", "Bokeh", "Bokeh"],
    image:
      "radial-gradient(closest-side, rgba(212,175,55,0.30), transparent) 12% 20% / 180px 180px no-repeat, radial-gradient(closest-side, rgba(120,160,255,0.28), transparent) 78% 35% / 220px 220px no-repeat, radial-gradient(closest-side, rgba(255,255,255,0.16), transparent) 45% 80% / 260px 260px no-repeat, linear-gradient(180deg, #0b1229, #060a17)",
    premium: false,
    darkCompatible: true,
    recommendedBlur: 18,
  },
  {
    id: "fabric-weave",
    category: "fabric",
    name: ["نسيج", "Weave", "Gewebe", "Tissage"],
    image: `${grid("rgba(255,255,255,0.05)", 8)}, linear-gradient(180deg, #141a30, #0b1020)`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "arabic-arabesque",
    category: "arabic",
    name: ["أرابيسك", "Arabesque", "Arabeske", "Arabesque"],
    image: `${arabesque("rgba(212,175,55,0.18)")}, linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`,
    premium: false,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "arabic-kufic",
    category: "arabic",
    name: ["كوفي", "Kufic", "Kufi", "Coufique"],
    image: `${grid("rgba(212,175,55,0.12)", 18)}, ${diagonal("rgba(212,175,55,0.08)", 36)}, linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`,
    premium: true,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "premium-obsidian-gold",
    category: "premium",
    name: ["أوبسيديان ذهبي", "Obsidian Gold", "Obsidian Gold", "Obsidienne et or"],
    image: `radial-gradient(80% 60% at 20% 10%, rgba(212,175,55,0.22), transparent 60%), ${starGeometry("rgba(212,175,55,0.10)", 60)}, linear-gradient(160deg, #0a0f22, #1a1408)`,
    premium: true,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "premium-velvet",
    category: "premium",
    name: ["مخمل ملكي", "Royal Velvet", "Königlicher Samt", "Velours royal"],
    image:
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 14px), radial-gradient(90% 70% at 50% 0%, #2b1740, #0b0616)",
    premium: true,
    darkCompatible: true,
    recommendedBlur: 0,
  },
  {
    id: "premium-aurora-gold",
    category: "premium",
    name: ["شفق ذهبي", "Aurora Gold", "Aurora Gold", "Aurore dorée"],
    image:
      "radial-gradient(55% 40% at 10% 15%, rgba(212,175,55,0.35), transparent 70%), radial-gradient(55% 45% at 90% 25%, rgba(90,200,255,0.25), transparent 70%), linear-gradient(180deg, #070d1f, #0D1B3D)",
    premium: true,
    darkCompatible: true,
    recommendedBlur: 10,
  },
];

export const DEFAULT_WALLPAPER = BUILTIN_WALLPAPERS[0]!;

export function findWallpaper(id: string | null | undefined): BuiltinWallpaper {
  return BUILTIN_WALLPAPERS.find((w) => w.id === id) ?? DEFAULT_WALLPAPER;
}

export type WallpaperSettings = {
  wallpaperId: string;
  wallpaperType: "builtin" | "custom" | "none";
  customImage: string | null;
  opacity: number;
  blur: number;
  brightness: number;
  overlay: number;
};

export const DEFAULT_SETTINGS: WallpaperSettings = {
  wallpaperId: "default",
  wallpaperType: "builtin",
  customImage: null,
  opacity: 100,
  blur: 0,
  brightness: 100,
  overlay: 20,
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

/**
 * Guarantees bubble contrast: photo wallpapers always keep a minimum dark
 * scrim and a capped brightness, so message text never drops below AA.
 */
export function ensureReadable(settings: WallpaperSettings): WallpaperSettings {
  const isPhoto = settings.wallpaperType === "custom";
  return {
    ...settings,
    opacity: clamp(settings.opacity, 0, 100),
    blur: clamp(settings.blur, 0, 40),
    brightness: clamp(settings.brightness, isPhoto ? 40 : 30, isPhoto ? 110 : 130),
    overlay: clamp(settings.overlay, isPhoto ? 30 : 0, 90),
  };
}

export const GOLD_ACCENT = GOLD;
