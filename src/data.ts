export type ThemeId = 'conservatory' | 'gulmohar' | 'afterhours' | 'sunday' | 'azure';
export interface Ceremony { id: string; name: string; date: string; time: string; venue: string; address: string; note: string }
export interface CoupleProfile { role: string; photo: string; intro: string; familyName: string; guardians: string }
export interface CoupleDetails { enabled: boolean; showFamily: boolean; profiles: [CoupleProfile, CoupleProfile] }
export const emptyCouple = (): CoupleDetails => ({enabled:false,showFamily:false,profiles:[{role:'',photo:'',intro:'',familyName:'',guardians:''},{role:'',photo:'',intro:'',familyName:'',guardians:''}]});

export type FontMood = 'cormorant' | 'dm-serif' | 'space-grotesk' | 'script';
export type SealEmblem = 'monogram' | 'initials' | 'heart' | 'botanical' | 'palace';
export type AtmosphereKind = 'auto' | 'flowers' | 'petals' | 'sparkles' | 'fireflies' | 'silk' | 'none';

export interface DesignCustomization {
  accentColor?: string;
  paperColor?: string;
  fontMood?: FontMood;
  sealEmblem?: SealEmblem;
  sealColor?: string;
  envelopeNote?: string;
  atmosphere?: AtmosphereKind;
  countdown?: boolean;
  sectionOrder?: string[];
  sectionTitles?: Record<string, string>;
}

export interface DesignerColorway {
  id: string;
  name: string;
  accentColor: string;
  paperColor: string;
  description: string;
}

export const designerColorways: Record<ThemeId, DesignerColorway[]> = {
  conservatory: [
    { id: 'meadow-sage', name: 'Meadow Sage', accentColor: '#42573f', paperColor: '#f1efdf', description: 'Pressed herbs and soft sunlit morning linen' },
    { id: 'deep-emerald', name: 'Deep Emerald', accentColor: '#244533', paperColor: '#f4f2e6', description: 'Shaded botanical greenhouse and ivory parchment' },
    { id: 'dusty-eucalyptus', name: 'Dusty Eucalyptus', accentColor: '#4e625a', paperColor: '#f5f3ec', description: 'Muted olive foliage with cool heirloom cream' },
    { id: 'rose-botanical', name: 'Garden Rose', accentColor: '#7a4242', paperColor: '#f9f2ec', description: 'Vintage wild tea roses on warm deckled paper' },
  ],
  gulmohar: [
    { id: 'royal-vermilion', name: 'Royal Vermilion', accentColor: '#963e2d', paperColor: '#f6e7cc', description: 'Jaipur sandstone and blooming royal scarlet' },
    { id: 'saffron-marigold', name: 'Saffron Courtyard', accentColor: '#b55a22', paperColor: '#fbf0dc', description: 'Festive marigold warmth with sunlit sandstone' },
    { id: 'rani-pink', name: 'Rani Rose', accentColor: '#9c2d58', paperColor: '#f8e9ef', description: 'Jewel-toned royal magenta with soft silk paper' },
    { id: 'amber-haveli', name: 'Amber Haveli', accentColor: '#8a4b22', paperColor: '#f5ebd7', description: 'Carved jharokha teak and warm palace twilight' },
  ],
  afterhours: [
    { id: 'black-cherry', name: 'Black Cherry Noir', accentColor: '#dfc899', paperColor: '#2e1823', description: 'Midnight plum velvet and glowing champagne gold' },
    { id: 'midnight-emerald', name: 'Midnight Emerald', accentColor: '#d6c290', paperColor: '#17281f', description: 'Deep forest onyx with candelit gilded brass' },
    { id: 'classic-tuxedo', name: 'Tuxedo Black & Gold', accentColor: '#e5d1a2', paperColor: '#1a191b', description: 'Pure couture black with radiant foil lettering' },
    { id: 'velvet-sapphire', name: 'Nocturne Blue', accentColor: '#d2c7aa', paperColor: '#19202f', description: 'Deep starlit sapphire with glowing amber accents' },
  ],
  sunday: [
    { id: 'cobalt-butter', name: 'Cobalt & Butter', accentColor: '#2542a0', paperColor: '#f7e9a7', description: 'Electric cobalt ink on sunny buttercup paper' },
    { id: 'cherry-cream', name: 'Cherry & Cream', accentColor: '#a62d3a', paperColor: '#fbf4df', description: 'Playful retro cherry red on warm vanilla linen' },
    { id: 'matcha-latte', name: 'Matcha & Sunny', accentColor: '#3d613b', paperColor: '#f8edbb', description: 'Fresh herbal green with joyful butter yellow' },
    { id: 'lavender-pop', name: 'Lavender & Cornflower', accentColor: '#384894', paperColor: '#eee6f6', description: 'Editorial pastel lavender with bold ink' },
  ],
  azure: [
    { id: 'sea-glass', name: 'Sea Glass Blue', accentColor: '#305c88', paperColor: '#e9eef3', description: 'Mediterranean watercolor with crisp sea-spray white' },
    { id: 'coastal-terracotta', name: 'Amalfi Terracotta', accentColor: '#964d36', paperColor: '#f6ece5', description: 'Sun-baked cliffside clay with warm coastal sand' },
    { id: 'olive-coast', name: 'Riviera Olive', accentColor: '#455d49', paperColor: '#eef2ed', description: 'Coastal olive groves and whitewashed villas' },
    { id: 'deep-marina', name: 'Deep Marina', accentColor: '#1e3c5a', paperColor: '#ecf2f7', description: 'Twilight harbor waves with serene sea salt mist' },
  ],
};

export const defaultSectionOrder = [
  'welcome',
  'couple',
  'story',
  'events',
  'scratch',
  'gallery',
  'notes',
  'rsvp'
];

export interface InvitationData {
  couple?: CoupleDetails;
  design?: DesignCustomization;
  name1: string;
  name2: string;
  occasion: 'Wedding' | 'Engagement';
  theme: ThemeId;
  welcome: string;
  family: string;
  story: string;
  scratchNote: string;
  dressCode: string;
  transport: string;
  accommodation: string;
  gifts: string;
  closing: string;
  events: Ceremony[];
  photos: string[];
  music: boolean;
  scratch: boolean;
  sections: {
    story: boolean;
    gallery: boolean;
    travel: boolean;
    gifts: boolean;
    rsvp: boolean;
  };
}

export const themes: {id:ThemeId;name:string;subtitle:string;description:string;color:string;paper:string;art:string;opening:string}[] = [
{id:'conservatory',name:'The Conservatory',subtitle:'A love letter in bloom',description:'Pressed petals, soft sage and a secret garden. For a love that feels like coming home.',color:'#42573f',paper:'#f1efdf',art:'/art/conservatory.webp',opening:'A sealed garden letter'},
{id:'gulmohar',name:'Gulmohar',subtitle:'A celebration, beautifully rooted',description:'Hand-painted palaces, vermilion blooms and doors that open to your next chapter.',color:'#963e2d',paper:'#f6e7cc',art:'/art/gulmohar.webp',opening:'A palace gatefold'},
{id:'afterhours',name:'After Hours',subtitle:'For the once-in-a-lifetime party',description:'Black cherry, candlelight and a little theatre. The evening everyone will remember.',color:'#dfc899',paper:'#2e1823',art:'/art/afterhours.webp',opening:'A velvet evening envelope'},
{id:'sunday',name:'The Sunday Edit',subtitle:'Perfectly, playfully you',description:'Little doodles, collected memories and a generous helping of personality.',color:'#2542a0',paper:'#f7e9a7',art:'/art/sunday.webp',opening:'A paper keepsake unfolding'},
{id:'azure',name:'Azure',subtitle:'Meet us where the sea is blue',description:'Watercolour coastlines and handwritten postcards. An invitation to get a little lost together.',color:'#305c88',paper:'#e9eef3',art:'/art/azure.webp',opening:'A postcard from somewhere lovely'},
];

export const sample: InvitationData = {
  name1: 'Ishaan',
  name2: 'Ananya',
  occasion: 'Wedding',
  theme: 'conservatory',
  welcome: 'With full hearts and our favourite people, we’re beginning our forever. We would love for you to be there.',
  family: 'Together with our families',
  story: 'A chance meeting. A conversation that never quite ended. And a thousand little moments that led us here. Now, our favourite chapter begins with you beside us.',
  scratchNote: 'The best part of our day? Having you there.',
  dressCode: 'Garden formal. Think soft colours, flowing silhouettes and shoes made for dancing.',
  transport: 'A shuttle will leave the city centre at 3:30 PM. Please reach out to us for your pickup details.',
  accommodation: 'Make a weekend of it. We’re gathering a list of lovely places to stay nearby. Ask us for our recommendations.',
  gifts: 'Your presence is the present. Bring your love, your stories, and your best dance moves.',
  closing: 'Some days stay with us forever. This will be one of them.',
  events: [
    { id: 'ceremony', name: 'The wedding', date: '2027-02-14', time: '16:00', venue: 'The Glasshouse', address: 'Bengaluru, Karnataka, India', note: 'An afternoon of promises, followed by a lifetime of adventures.' },
    { id: 'reception', name: 'Dinner & dancing', date: '2027-02-14', time: '19:00', venue: 'The Garden Pavilion', address: 'Bengaluru, Karnataka, India', note: 'Raise a glass, find your people, and stay for one more song.' }
  ],
  photos: [],
  music: false,
  scratch: true,
  sections: { story: true, gallery: true, travel: true, gifts: true, rsvp: true },
  design: {
    fontMood: 'cormorant',
    sealEmblem: 'monogram',
    atmosphere: 'auto',
    countdown: true
  }
};

export const blankDraft: InvitationData = {
  ...sample,
  name1: '',
  name2: '',
  family: 'Together with our families',
  story: '',
  transport: '',
  accommodation: '',
  dressCode: '',
  events: [{ ...sample.events[0], name: 'The celebration', date: '', time: '', venue: '', address: '', note: '' }],
  photos: [],
  design: {
    fontMood: 'cormorant',
    sealEmblem: 'monogram',
    atmosphere: 'auto',
    countdown: true
  }
};

export const themeById = (id: string) => themes.find(t => t.id === id) || themes[0];
export const formatDate = (date: string) => date ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date + 'T12:00:00')) : 'Date to be announced';
export const formatTime = (time: string) => time ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date('2027-01-01T' + time)) : 'Time to be confirmed';

