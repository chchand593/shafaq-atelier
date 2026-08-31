// Centralised site data for the ShafaQ Atelier abaya store.
// Images are generated assets living in /public/images.

// ---------------------------------------------------------------------------
// Business configuration — single source of truth
// ---------------------------------------------------------------------------
export const BUSINESS_NAME = "ShafaQ Atelier";
export const BUSINESS_ADDRESS = "M.A. Jinnah Road, Okara, Punjab, Pakistan";
export const BUSINESS_EMAIL = "hello@shafaqatelier.pk";
export const BUSINESS_TAGLINE = "Your Style, Your Modesty, Your Abaya";

export type NavItem = {
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "Daily Wear", href: "/daily-wear" },
  { label: "Customized Abayas", href: "/customized-abayas" },
  { label: "New Arrivals", href: "#new-arrivals" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export type ColorOption = {
  hex: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  category: "Daily Wear" | "New Arrivals" | "Best Sellers";
  price: number;
  originalPrice?: number;
  image: string;
  colors: string[];
  colorOptions: ColorOption[];
  sizes: string[];
  rating: number;
  reviews: number;
  stock?: number;
  badge?: string;
  fabric: string;
  care: string;
  description: string;
};

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function colors(
  list: Array<{ hex: string; name: string }>
): ColorOption[] {
  return list;
}

export const PRODUCTS: Product[] = [
  {
    id: "dw-01",
    name: "Noor Everyday Abaya",
    category: "Daily Wear",
    price: 7400,
    image: "/images/daily-1.jpg",
    colors: ["#1a1a1a", "#6b5246", "#d8c7a8"],
    colorOptions: colors([
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#6b5246", name: "Mocha" },
      { hex: "#d8c7a8", name: "Sand" },
    ]),
    sizes: ALL_SIZES,
    rating: 4.9,
    reviews: 128,
    badge: "Everyday Essential",
    fabric: "Premium matte crepe — fluid, breathable and softly structured.",
    care: "Dry clean recommended. Alternatively hand-wash cold, hang dry in shade. Cool iron inside out.",
    description:
      "An everyday essential reimagined. The Noor abaya drapes in a flowing matte crepe with a clean A-line silhouette, concealed front buttons and a softly rounded collar. Designed to move with you from dawn prayers to evening errands.",
  },
  {
    id: "dw-02",
    name: "Sahar Mocha Abaya",
    category: "Daily Wear",
    price: 8200,
    image: "/images/daily-2.jpg",
    colors: ["#6b5246", "#1a1a1a"],
    colorOptions: colors([
      { hex: "#6b5246", name: "Mocha" },
      { hex: "#1a1a1a", name: "Black" },
    ]),
    sizes: ALL_SIZES,
    rating: 4.8,
    reviews: 94,
    fabric: "Washed nida — buttery soft with a subtle sheen.",
    care: "Dry clean recommended. Steam to refresh between wears.",
    description:
      "Warm, grounded and endlessly wearable. The Sahar abaya in mocha nida catches the light softly and skims the body in a relaxed, flattering line. A quiet luxury for the everyday wardrobe.",
  },
  {
    id: "dw-03",
    name: "Ayla Beige Abaya",
    category: "Daily Wear",
    price: 6900,
    image: "/images/daily-3.jpg",
    colors: ["#d8c7a8", "#e8dcc4", "#1a1a1a"],
    colorOptions: colors([
      { hex: "#d8c7a8", name: "Beige" },
      { hex: "#e8dcc4", name: "Cream" },
      { hex: "#1a1a1a", name: "Black" },
    ]),
    sizes: ALL_SIZES,
    rating: 4.7,
    reviews: 76,
    fabric: "Lightweight satin-crepe — cool to touch, easy to wear.",
    care: "Hand-wash cold, hang dry in shade. Cool iron inside out.",
    description:
      "Effortless elegance in soft beige. The Ayla features a relaxed open cut with a matching belt and cuff details — versatile enough for the office, the school run or a quiet afternoon out.",
  },
  {
    id: "dw-04",
    name: "Mira Charcoal Abaya",
    category: "Daily Wear",
    price: 7800,
    image: "/images/daily-4.jpg",
    colors: ["#3a3633", "#1a1a1a"],
    colorOptions: colors([
      { hex: "#3a3633", name: "Charcoal" },
      { hex: "#1a1a1a", name: "Black" },
    ]),
    sizes: ALL_SIZES,
    rating: 4.9,
    reviews: 112,
    badge: "Best for Travel",
    fabric: "Wrinkle-resistant travel crepe — packs small, wears beautifully.",
    care: "Machine wash gentle, hang dry. Steams smooth in seconds.",
    description:
      "Designed for the woman on the move. The Mira in charcoal resists creases, packs down small and emerges ready to wear — making it the perfect travel companion for journeys near and far.",
  },
  {
    id: "na-01",
    name: "Zara Gold-Trim Abaya",
    category: "New Arrivals",
    price: 12500,
    originalPrice: 14500,
    image: "/images/new-1.jpg",
    colors: ["#1a1a1a", "#c9a24b"],
    colorOptions: colors([
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#c9a24b", name: "Gold" },
    ]),
    sizes: ALL_SIZES,
    rating: 5.0,
    reviews: 41,
    badge: "Just In",
    fabric: "Silk-blend nida with hand-embroidered gold thread cuffs.",
    care: "Dry clean only. Store folded with acid-free tissue.",
    description:
      "A statement of quiet opulence. The Zara pairs a fluid black silhouette with delicately hand-embroidered gold thread work along the sleeves — an heirloom detail for the moments that matter most.",
  },
  {
    id: "na-02",
    name: "Leila Beaded Abaya",
    category: "New Arrivals",
    price: 13800,
    image: "/images/new-2.jpg",
    colors: ["#e8dcc4", "#d8c7a8"],
    colorOptions: colors([
      { hex: "#e8dcc4", name: "Cream" },
      { hex: "#d8c7a8", name: "Beige" },
    ]),
    sizes: ALL_SIZES,
    rating: 4.9,
    reviews: 33,
    badge: "New",
    fabric: "Flowing chiffon over a crepe base, with hand-set seed beads.",
    care: "Dry clean only. Handle beaded areas with care.",
    description:
      "Soft, luminous and quietly detailed. The Leila layers a flowing chiffon over a crepe base, scattered with hand-set seed beads along the placket and cuffs — a piece that catches the light as you move.",
  },
  {
    id: "bs-01",
    name: "Rania Bell-Sleeve Abaya",
    category: "Best Sellers",
    price: 11200,
    image: "/images/best-1.jpg",
    colors: ["#6b5246", "#c9a24b"],
    colorOptions: colors([
      { hex: "#6b5246", name: "Mocha" },
      { hex: "#c9a24b", name: "Gold" },
    ]),
    sizes: ALL_SIZES,
    rating: 4.9,
    reviews: 286,
    badge: "Best Seller",
    fabric: "Heavyweight crepe with a gold-tone trim at the bell cuffs.",
    care: "Dry clean recommended. Steam to refresh.",
    description:
      "Our most-loved silhouette for a reason. The Rania’s dramatic bell sleeves and subtle gold trim bring a touch of occasion to any day — equally at home at a family gathering or a festive evening.",
  },
  {
    id: "bs-02",
    name: "Yasmin Open-Front Abaya",
    category: "Best Sellers",
    price: 13400,
    image: "/images/best-2.jpg",
    colors: ["#1a1a1a", "#e8dcc4", "#c9a24b"],
    colorOptions: colors([
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#e8dcc4", name: "Cream" },
      { hex: "#c9a24b", name: "Gold" },
    ]),
    sizes: ALL_SIZES,
    rating: 4.8,
    reviews: 203,
    badge: "Trending",
    fabric: "Layered crepe with a detachable gold-tone belt.",
    care: "Dry clean recommended. Store on a padded hanger.",
    description:
      "An open-front masterpiece you’ll style a hundred ways. The Yasmin layers a black outer over a cream inner dress, cinched with a detachable gold-tone belt — a versatile showpiece for the modern modest wardrobe.",
  },
];

export type Review = {
  id: string;
  name: string;
  location: string;
  rating: number;
  title: string;
  body: string;
  product: string;
};

export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Ayesha Khan",
    location: "Okara",
    rating: 5,
    title: "Feels like couture, fits like a dream",
    body:
      "The Noor Everyday Abaya has become my go-to. The crepe falls beautifully and the stitching is impeccable — I have never received so many compliments.",
    product: "Noor Everyday Abaya",
  },
  {
    id: "r2",
    name: "Fatima Sheikh",
    location: "Karachi",
    rating: 5,
    title: "My custom abaya exceeded every expectation",
    body:
      "I designed my own abaya with the gold embroidery I always dreamed of. The artisan team understood my vision perfectly. Truly a heirloom piece.",
    product: "Customized Abaya",
  },
  {
    id: "r3",
    name: "Zainab Riaz",
    location: "Islamabad",
    rating: 5,
    title: "Premium quality, modestly perfect",
    body:
      "Finally a brand that understands modest fashion without compromise. The fabric quality is exceptional and the mocha shade is stunning in person.",
    product: "Sahar Mocha Abaya",
  },
  {
    id: "r4",
    name: "Mariam Tariq",
    location: "Multan",
    rating: 5,
    title: "Worth every rupee",
    body:
      "I bought the Rania Bell-Sleeve for a wedding and it was the talk of the evening. The gold trim detailing is exquisite and so tasteful.",
    product: "Rania Bell-Sleeve Abaya",
  },
];

export type Feature = {
  icon: "scissors" | "leaf" | "truck" | "shield" | "heart" | "sparkles";
  title: string;
  description: string;
};

export const WHY_CHOOSE_US: Feature[] = [
  {
    icon: "scissors",
    title: "Bespoke Craftsmanship",
    description:
      "Every abaya is tailored by master artisans with decades of experience in modest couture.",
  },
  {
    icon: "leaf",
    title: "Premium Fabrics",
    description:
      "We source only the finest crepes, nidas and chiffons — breathable, flowing and built to last.",
  },
  {
    icon: "truck",
    title: "Nationwide Delivery",
    description:
      "Free, insured shipping across Pakistan with careful packaging that respects every garment.",
  },
  {
    icon: "shield",
    title: "Modesty, Guaranteed",
    description:
      "Thoughtfully designed silhouettes that honour modesty without ever compromising on elegance.",
  },
];
