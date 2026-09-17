import { sample, type InvitationData, type ThemeId } from './data';

export const suites: Record<ThemeId, { chapter: string; welcome: string; story: string; events: string; details: string; reply: string; closing: string; scene: string; detail: string }> = {
  conservatory: { chapter: 'A garden letter', welcome: 'Love, in full bloom.', story: 'Some things were always meant to grow.', events: 'An afternoon into forever.', details: 'A few notes from the garden.', reply: 'A place at our table.', closing: 'Meet us among the flowers.', scene: '/art/scenes/conservatory-glasshouse.webp', detail: '/art/layers/flowers.png' },
  gulmohar: { chapter: 'The palace journal', welcome: 'A union. A family. A forever.', story: 'A new chapter. A thousand blessings.', events: 'The days we’ll remember.', details: 'Be our most treasured guest.', reply: 'With your blessings.', closing: 'Our celebration begins with you.', scene: '/films/scroll/gulmohar-moving-poster.webp', detail: '/art/layers/palace-arch.png' },
  afterhours: { chapter: 'An evening in good company', welcome: 'Some nights become stories.', story: 'Of all the people. Of all the nights.', events: 'The evening’s programme.', details: 'Before the evening begins.', reply: 'Your name on the guest list.', closing: 'Until the very last dance.', scene: '/art/scenes/afterhours-chandelier.webp', detail: '/art/layers/velvet.png' },
  sunday: { chapter: 'The best day edition', welcome: 'A very big yes. A very good day.', story: 'Our favourite plot twist? Us.', events: 'A day full of good things.', details: 'The little need-to-knows.', reply: 'Save you a slice?', closing: 'Here’s to our kind of happy.', scene: '/films/scroll/sunday-moving-poster.webp', detail: '/art/interiors/sunday-bow-v1.webp' },
  azure: { chapter: 'A postcard for you', welcome: 'Somewhere lovely. Together.', story: 'Every road brought us here.', events: 'Your itinerary for happiness.', details: 'Pack a little. Stay a while.', reply: 'Wish you were here. Will you be?', closing: 'With love, from the coast.', scene: '/films/scroll/azure-moving-poster.webp', detail: '/art/layers/lemons.png' },
};

/** Demo content only. Switching a customer's design never rewrites their plans. */
export function sampleForTheme(theme: ThemeId, occasion: InvitationData['occasion'] = 'Wedding'): InvitationData {
  const data = structuredClone(sample);
  data.theme = theme;
  data.occasion = occasion;
  if (theme === 'gulmohar') {
    data.family = 'Together with our families, and with the blessings of those we love';
    data.welcome = 'Two families, a thousand little traditions, and one beautiful beginning. Join us for the colour, the music, and the promises that bring us together.';
    data.dressCode = 'Indian festive. Marigold and rose for the daytime; jewel tones for the evening.';
    data.transport = 'Guest transfers leave the hotel lobby before each celebration. Our families will share your pickup details.';
    data.accommodation = 'Make a weekend of it in Jaipur. Please contact our families for the guest hotel details.';
    data.events = [
      { id: 'haldi', name: 'Haldi & mehendi', date: '2027-02-13', time: '11:00', venue: 'The Palace Courtyard', address: 'Jaipur, Rajasthan, India', note: 'Marigold mornings, henna-stained hands, and the happiest kind of chaos.' },
      { id: 'sangeet', name: 'The sangeet', date: '2027-02-13', time: '19:00', venue: 'The Mirror Hall', address: 'Jaipur, Rajasthan, India', note: 'Two families. One dance floor. A night of music before a lifetime together.' },
      { id: 'ceremony', name: 'The wedding', date: '2027-02-14', time: '16:00', venue: 'The Palace Gardens', address: 'Jaipur, Rajasthan, India', note: 'Join us for our wedding ceremony, followed by dinner beneath the stars.' },
    ];
  } else if (theme === 'afterhours') {
    data.welcome = 'A room full of our favourite people. A toast to everything ahead. Join us for an evening of promises, candlelight, and one more song.';
    data.dressCode = 'Black tie, with personality. Deep tones, something that catches the light, and your dancing shoes.';
    data.events = data.events.map((event, index) => ({ ...event, time: index ? '20:00' : '18:00', name: index ? 'Dinner & the afterparty' : 'Vows & champagne', venue: index ? 'The Grand Ballroom' : 'The Candlelit Salon', note: index ? 'A long dinner, a favourite song, and absolutely no reason to leave early.' : 'Be there for the promises. Stay for the first toast.' }));
  } else if (theme === 'sunday') {
    data.welcome = 'We’re getting married. There will be happy tears, very good cake, and a seat with your name on it. Bring yourself. We’ll bring the happy.';
    data.dressCode = 'Your Sunday best. Colour encouraged, comfortable shoes essential.';
    data.events = data.events.map((event, index) => ({ ...event, time: index ? '13:00' : '11:00', name: index ? 'Lunch, cake & a little dancing' : 'The “I do” bit', venue: index ? 'The Picnic Lawn' : 'The Garden', note: index ? 'Help yourself to seconds. Especially the cake.' : 'A few promises, a few happy tears, and our favourite people in the front row.' }));
  } else if (theme === 'azure') {
    data.welcome = 'We found our favourite place. Now all it needs is our favourite people. Come for the vows, stay for the sea air, and make a few memories with us.';
    data.dressCode = 'Coastal formal. Linen, sea blues, and something that moves in the breeze.';
    data.transport = 'Transfers from the guest hotel will be arranged. Please share your arrival details with us before travelling.';
    data.accommodation = 'We’re putting together our favourite places to stay near the coast. Contact us for the guest arrangements.';
    data.events = data.events.map((event, index) => ({ ...event, venue: index ? 'The Seafront Terrace' : 'The Coastal Garden', address: 'Goa, India', name: index ? 'Dinner by the water' : 'Vows with a view', note: index ? 'A sunset toast, a long table, and nowhere else to be.' : 'Sea air, soft light, and the beginning of our next adventure.' }));
  }
  if (occasion === 'Engagement') data.events = [{ ...(data.events.find(event => event.id === 'ceremony') || data.events[0]), id: 'engagement', name: 'The engagement', note: 'Join us as we celebrate the beginning of our forever.' }];
  return data;
}
