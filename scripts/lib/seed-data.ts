export interface SeedImage {
  url: string;
  alt?: string;
  sort_order?: number;
}

export interface SeedItem {
  title: string;
  description: string;
  price_cents: number;
  category: string;
  condition: string;
  status: string;
  is_featured: boolean;
  city: string;
  postal_code: string;
  country: string;
  delivery_available: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  images: SeedImage[];
}

const CATEGORIES = [
  'Ordinateurs',
  'Appareils Photo',
  'Consoles',
  'Telephones',
  'Tablettes',
  'Audio',
  'Accessoires',
  'Montres'
] as const;

const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'parts', 'unknown'] as const;
const STATUSES = ['draft', 'active', 'reserved', 'sold', 'archived'] as const;

const CITIES = [
  { name: 'Strasbourg', postalCode: '67000' },
  { name: 'Paris', postalCode: '75001' },
  { name: 'Lyon', postalCode: '69001' },
  { name: 'Marseille', postalCode: '13001' },
  { name: 'Bordeaux', postalCode: '33000' },
  { name: 'Toulouse', postalCode: '31000' },
  { name: 'Nice', postalCode: '06000' },
  { name: 'Nantes', postalCode: '44000' },
  { name: 'Montpellier', postalCode: '34000' },
  { name: 'Rennes', postalCode: '35000' }
] as const;

const TITLES = [
  'iPhone 13 Pro 256GB',
  'MacBook Pro M1 2021',
  'PlayStation 5',
  'Canon EOS R6',
  'iPad Air 5',
  'Samsung Galaxy S22',
  'Nintendo Switch OLED',
  'Sony WH-1000XM4',
  'Dell XPS 15',
  'GoPro Hero 11',
  'Apple Watch Series 7',
  'Bose SoundLink Revolve',
  'Logitech MX Master 3',
  'Kindle Paperwhite',
  'Fujifilm X-T4'
] as const;

const DESCRIPTIONS = [
  "Excellent etat, fonctionne parfaitement. Vendu avec chargeur et cable d'origine.",
  'Comme neuf, utilise seulement quelques fois. Toujours sous garantie.',
  "Bon etat general, traces d'utilisation normales. Tout fonctionne correctement.",
  'Etat correct, quelques rayures sur le boitier mais fonctionne tres bien.',
  'Neuf sous plastique, jamais ouvert. Facture disponible.',
  'Tres bon etat, bien entretenu. Accessoires inclus.',
  "Occasion de particulier, en parfait etat de marche.",
  'Modele recent, tres peu utilise. Vendu avec tous les accessoires.'
] as const;

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

function generateImages(rng: SeededRandom): SeedImage[] {
  const imageCount = rng.int(1, 4);
  const images: SeedImage[] = [];
  for (let i = 0; i < imageCount; i++) {
    const imageSeed = rng.int(1000, 9999);
    images.push({
      url: `https://picsum.photos/seed/${imageSeed}/800/600.jpg`,
      alt: `Image ${i + 1}`,
      sort_order: i
    });
  }
  return images;
}

export function generateSeedItems(count: number, seed: number = 424242): SeedItem[] {
  const rng = new SeededRandom(seed);
  const now = new Date();
  const items: SeedItem[] = [];

  for (let i = 0; i < count; i++) {
    const city = rng.pick(CITIES);
    const condition = rng.pick(CONDITIONS);
    const status = rng.pick(STATUSES);
    const createdAt = new Date(now.getTime() - rng.int(0, 60 * 24 * 60 * 60 * 1000)).toISOString();
    const updatedAt = new Date(now.getTime() - rng.int(0, 7 * 24 * 60 * 60 * 1000)).toISOString();

    items.push({
      title: rng.pick(TITLES),
      description: rng.pick(DESCRIPTIONS),
      price_cents: rng.int(1000, 150000),
      category: rng.pick(CATEGORIES),
      condition,
      status,
      is_featured: rng.next() > 0.8,
      city: city.name,
      postal_code: city.postalCode,
      country: 'FR',
      delivery_available: rng.next() > 0.3,
      created_at: createdAt,
      updated_at: updatedAt,
      published_at: status === 'active'
        ? new Date(now.getTime() - rng.int(0, 30 * 24 * 60 * 60 * 1000)).toISOString()
        : null,
      images: generateImages(rng)
    });
  }

  return items;
}
