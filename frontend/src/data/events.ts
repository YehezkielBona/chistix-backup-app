export interface EventItem {
  id: string;
  title: string;
  location: string;
  date: string;
  price: number;
  originalPrice?: number;
  image: string;
  landscapeImage?: string;
  isPresale?: boolean;
  isHot?: boolean;
  isPopular?: boolean;
  presaleTag?: string;
  status?: 'available' | 'sold-out';
  category?: string;
  organizer?: string;
  description?: string;
}

export const CATEGORIES = [
  'Concert',
  'Festival',
  'Workshop',
  'Standup Comedy',
];

export const LOCATIONS = [
  'North Jakarta, Jakarta',
  'Central Jakarta, Jakarta',
  'South Jakarta, Jakarta',
  'Bandung, West Java',
  'Bali, Indonesia',
  'Surabaya, East Java',
  'Yogyakarta, DI Yogyakarta',
];

export const DUMMY_EVENTS: EventItem[] = [
  {
    id: '1',
    title: 'Night Symphony: Classic Meets Rock',
    location: 'North Jakarta, Jakarta',
    date: '2026-12-19T19:00:00',
    price: 50000,
    originalPrice: 100000,
    image: '/images/img-event-1-sq.jpg',
    landscapeImage: '/images/img-event-1-ls.jpg',
    isPresale: true,
    isHot: true,
    isPopular: true,
    presaleTag: 'Presale 1',
    category: 'Concert',
  },
  {
    id: '2',
    title: 'Electronic Space Night: Neon Odyssey',
    location: 'North Jakarta, Jakarta',
    date: '2027-03-20T21:00:00',
    price: 50000,
    originalPrice: 100000,
    image: '/images/img-event-2-sq.jpg',
    landscapeImage: '/images/img-event-2-ls.jpg',
    isPresale: true,
    isHot: true,
    isPopular: true,
    presaleTag: 'Presale 1',
    category: 'Concert',
  },
  {
    id: '3',
    title: 'Jazz Evening at the Park',
    location: 'Central Jakarta, Jakarta',
    date: '2027-02-06T17:00:00',
    price: 88000,
    originalPrice: 120000,
    image: '/images/img-event-3-sq.jpg',
    landscapeImage: '/images/img-event-3-ls.jpg',
    isPresale: true,
    isHot: true,
    isPopular: true,
    presaleTag: 'Presale 2',
    category: 'Concert',
  },
  {
    id: '4',
    title: 'Indie Music Summit & Showcase',
    location: 'Bandung, West Java',
    date: '2026-11-15T16:00:00',
    price: 65000,
    originalPrice: 90000,
    image: '/images/img-event-4-sq.jpg',
    landscapeImage: '/images/img-event-4-ls.jpg',
    isPresale: true,
    isHot: false,
    isPopular: true,
    presaleTag: 'Early Bird',
    category: 'Festival',
  },
  {
    id: '5',
    title: 'Urban Soundwave Festival 2026',
    location: 'South Jakarta, Jakarta',
    date: '2026-11-28T18:00:00',
    price: 75000,
    originalPrice: 110000,
    image: '/images/img-event-5-sq.jpg',
    landscapeImage: '/images/img-event-5-ls.jpg',
    isPresale: true,
    isHot: true,
    isPopular: false,
    presaleTag: 'Presale 1',
    category: 'Festival',
  },
  {
    id: '6',
    title: 'Resonance Night Live Showcase',
    location: 'South Jakarta, Jakarta',
    date: '2026-11-15T18:30:00',
    price: 89000,
    originalPrice: 100000,
    image: '/images/img-event-6-sq.jpg',
    landscapeImage: '/images/img-event-6-ls.jpg',
    isPresale: false,
    isHot: true,
    isPopular: true,
    status: 'sold-out',
    category: 'Concert',
  },
  {
    id: '7',
    title: 'Standup Comedy Special: Local Pride',
    location: 'Bandung, West Java',
    date: '2026-12-05T20:00:00',
    price: 50000,
    image: '/images/img-event-7-sq.jpg',
    landscapeImage: '/images/img-event-7-ls.jpg',
    isPresale: false,
    isHot: true,
    isPopular: true,
    status: 'available',
    category: 'Standup Comedy',
  },
];