// Content for the schedule and hotel-block sections.
// Swap for a CMS/JSON fetch later without touching main.js's render logic.

export const settings = {
  showPaletteSwatches: true,
};

export const events = [
  {
    day: 'FRI',
    time: '6:00 PM',
    title: 'Welcome Cocktails',
    sublabel: 'The Grill Terrace · garden attire',
    audience: 'All guests',
    tone: 'sun-pale',
  },
  {
    day: 'FRI',
    time: '8:00 PM',
    title: 'Family Dinner',
    sublabel: 'The Wine Room · candlelight only',
    audience: 'Invitation',
    tone: 'sun-light',
  },
  {
    day: 'SAT',
    time: '4:30 PM',
    title: 'Ceremony',
    sublabel: 'Arroyo Lawn · seated by 4:15',
    audience: 'Black tie',
    tone: 'anchor',
  },
  {
    day: 'SAT',
    time: '5:15 PM',
    title: 'Cocktail Hour',
    sublabel: 'The Loggia · passed hors d’oeuvres',
    audience: 'All guests',
    tone: 'sun-mid',
  },
  {
    day: 'SAT',
    time: '7:00 PM',
    title: 'Dinner & Toasts',
    sublabel: 'The Ballroom · seated, iris throughout',
    audience: 'All guests',
    tone: 'sun-deep',
  },
  {
    day: 'SAT',
    time: '9:30 PM',
    title: 'Dancing',
    sublabel: 'Until one · late-night bites at midnight',
    audience: 'All guests',
    tone: 'dusk-warm',
  },
  {
    day: 'SUN',
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
    photoLabel: 'photo — the lodge',
    detail: ['On site · $495/night', 'Code CLARAJULIAN'],
    href: '#stay',
    accent: 'gold-strong',
  },
  {
    name: 'Estancia La Jolla',
    photoLabel: 'photo — estancia',
    detail: ['1.2 miles · $319/night', 'Shuttle both ways'],
    href: '#stay',
    accent: 'neutral',
  },
  {
    name: 'Hotel La Jolla',
    photoLabel: 'photo — hotel la jolla',
    detail: ['3 miles · $268/night', 'Ocean-view rooms'],
    href: '#stay',
    accent: 'blue',
  },
];
