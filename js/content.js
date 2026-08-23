// Content for the schedule and hotel-block sections.
// Swap for a CMS/JSON fetch later without touching main.js's render logic.
//
// `details` on an event is optional placeholder copy for the schedule pill's
// expandable panel — worth reviewing/rewriting in your own voice before this
// goes live, since it's a reasonable-guess elaboration on the sublabel, not
// anything specific I actually know about the day.

export const settings = {
  showPaletteSwatches: true,
};

export const events = [
  {
    day: 'THU',
    time: '6:00 PM',
    title: 'Optional: Welcome Cocktails',
    sublabel: 'The Grill Terrace · garden attire',
    audience: 'Optional; for early arrivals',
    tone: 'sun-pale',
    details: 'A relaxed start to the weekend; stop by anytime for a drink and to say hello before the festivities begin.',
  },
  {
    day: 'THU',
    time: '8:00 PM',
    title: 'Optional: Pool Day',
    sublabel: 'The Grill Terrace · swimsuits',
    audience: 'Optional; for early arrivals',
    tone: 'sun-light',
    details: 'Come unwind by the pool before the weekend kicks off. Bring a suit and towel.',
  },
  {
    day: 'FRI',
    time: '6:00 PM',
    title: 'Ceremony',
    sublabel: 'Arroyo Terrace · outdoors onsite',
    audience: 'California Black tie',
    tone: 'anchor',
    details: 'This will be an outdoor seated ceremony. Looking for some fun with the dress code. Feel free to bring some color and add a twist. More details below.',
  },
  {
    day: 'FRI',
    time: '6:45 PM',
    title: 'Cocktail Hour',
    sublabel: 'The Loggia · passed hors d’oeuvres',
    audience: 'All guests',
    tone: 'sun-mid',
    details: 'Passed hors d’oeuvres and drinks on the balcony while we prep for dinner. Enjoy the music, views and (hopefully) moves.',
  },
  {
    day: 'FRI',
    time: '7:30 PM',
    title: 'Dinner & Toasts',
    sublabel: 'Arroyo Terrace · outdoors onsite',
    audience: 'All guests',
    tone: 'sun-deep',
    details: 'A seated dinner outdoors, followed by toasts from our favorite people. Feel free to bring a shawl or light jacket.',
  },
  {
    day: 'FRI',
    time: '9:00 PM',
    title: 'Dancing',
    sublabel: 'Until tomorrow · late-night bites at midnight',
    audience: 'All guests',
    tone: 'dusk-warm',
    details: 'The dance floor is open and staying open. late-night bites make an appearance around midnight.',
  },
  {
    day: 'SAT',
    time: '12:00 PM',
    title: 'Beach Brunch',
    sublabel: 'La Jolla Beach · Catered Persian Food',
    audience: 'All guests',
    tone: 'dusk-cool',
    details: 'Come debrief with us and explore some of our favorite parts of San Diego. We are starting on the beach with Persian food, ocean views, tea (of both kinds). How could we go wrong. Dress code is fun casual.',
  },
];

export const hotels = [
  {
    name: 'The Lodge',
    photo: 'assets/hotel-lodge.jpg',
    photoLabel: 'photo — the lodge',
    detail: ['On site · $495/night'],
    // detail: ['On site · $495/night', 'Code CLARAJULIAN'],
    href: 'https://www.lodgetorreypines.com/rooms',
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
    href: 'https://www.hilton.com/en/hotels/santphh-hilton-la-jolla-torrey-pines/',
    accent: 'blue',
  },
];
