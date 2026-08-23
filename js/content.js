// Content for the schedule and hotel-block sections.
// Swap for a CMS/JSON fetch later without touching main.js's render logic.

export const settings = {
  showPaletteSwatches: true,
};

export const events = [
  {
    day: 'THU',
    time: '6:00 PM',
    title: 'Welcome Cocktails',
    sublabel: 'The Grill Terrace · garden attire',
    audience: 'All guests',
    tone: 'sun-pale',
  },
  {
    day: 'THU',
    time: '8:00 PM',
    title: 'Family Dinner',
    sublabel: 'The Wine Room · candlelight only',
    audience: 'Invitation',
    tone: 'sun-light',
  },
  {
    day: 'FRI',
    time: '6:00 PM',
    title: 'Ceremony',
    sublabel: 'Arroyo Lawn · seated by 4:15',
    audience: 'Black tie',
    tone: 'anchor',
  },
  {
    day: 'FRI',
    time: '6:45 PM',
    title: 'Cocktail Hour',
    sublabel: 'The Loggia · passed hors d’oeuvres',
    audience: 'All guests',
    tone: 'sun-mid',
  },
  {
    day: 'FRI',
    time: '7:30 PM',
    title: 'Dinner & Toasts',
    sublabel: 'The Ballroom · seated, iris throughout',
    audience: 'All guests',
    tone: 'sun-deep',
  },
  {
    day: 'FRI',
    time: '9:30 PM',
    title: 'Dancing',
    sublabel: 'Until one · late-night bites at midnight',
    audience: 'All guests',
    tone: 'dusk-warm',
  },
  {
    day: 'SAT',
    time: '10:00 AM',
    title: 'Farewell Brunch',
    sublabel: 'Poolside · come and go',
    audience: 'All guests',
    tone: 'dusk-cool',
  },
];

export const hotels = [
  {
    name: 'The Lodge',
    photo: 'assets/hotel-lodge.jpg',
    photoLabel: 'photo — the lodge',
    detail: ['On site · $495/night'],
    // detail: ['On site · $495/night', 'Code CLARAJULIAN'],
    href: '#stay',
    accent: 'gold-strong',
  },
  // {
  //   name: 'Estancia La Jolla',
  //   photo: null,
  //   photoLabel: 'photo — estancia',
  //   detail: ['1.2 miles · $319/night', 'Shuttle both ways'],
  //   href: '#stay',
  //   accent: 'neutral',
  // },
  {
    name: 'Hilton Torrey Pines',
    photo: 'assets/hotel-lajolla.jpg',
    photoLabel: 'photo — hotel la jolla',
    detail: ['0.05 miles · $268/night', 'Ocean-view rooms'],
    href: '#stay',
    accent: 'blue',
  },
];
