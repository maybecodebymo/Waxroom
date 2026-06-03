const track = (title, category) => ({ title, category });

export const mockRooms = [
  {
    id: 'room-seed-shadow',
    ownerName: 'DJ Shadow',
    roomName: "DJ Shadow's Room",
    description: 'Sample-heavy trip-hop, vinyl scratching culture essentials, and late-night instrumental beats.',
    genres: 'Hip-Hop, Electronic',
    albums: [
      {
        id: 'seed-shadow-1',
        artist: 'DJ Shadow',
        album_title: 'Endtroducing.....',
        genre: 'Electronic',
        rating: 9.8,
        description: 'The first album created entirely from samples. A landmark trip-hop masterpiece.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/64/73/ce647310-97f2-698e-49b0-466d49826359/00602557174780.rgb.jpg/600x600bb.jpg',
        tracklist: [
          track('Best Foot Forward', 'meh'),
          track('Building Steam With a Grain of Salt', 'hit'),
          track('The Number Song', 'hit'),
          track('Changeling', 'bop'),
          track('What Does Your Soul Look Like (Part 4)', 'hit'),
          track('Stem/Long Stem', 'bop'),
          track('Mutual Slump', 'bop'),
          track('Organ Donor', 'hit'),
          track('Midnight in a Perfect World', 'hit')
        ]
      },
      {
        id: 'seed-shadow-2',
        artist: 'Portishead',
        album_title: 'Dummy',
        genre: 'Electronic',
        rating: 9.5,
        description: 'Haunting trip-hop with vinyl crackle and dark jazz instrumentation.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/07/e2/2d/07e22d99-52e8-5f25-83e9-74d3fb06001a/00602537508680.rgb.jpg/600x600bb.jpg',
        tracklist: [
          track('Mysterons', 'bop'),
          track('Sour Times', 'hit'),
          track('Strangers', 'meh'),
          track('It Could Be Sweet', 'bop'),
          track('Wandering Star', 'hit'),
          track('Roads', 'hit'),
          track('Glory Box', 'hit')
        ]
      },
      {
        id: 'seed-shadow-3',
        artist: 'Massive Attack',
        album_title: 'Mezzanine',
        genre: 'Electronic',
        rating: 9.7,
        description: 'Dark, claustrophobic electronics fused with post-punk guitars and dub bass.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/81/2a/3b/812a3bbf-fb19-6126-7244-1234c2b9a76d/00602537546095.rgb.jpg/600x600bb.jpg',
        tracklist: [
          track('Angel', 'hit'),
          track('Risingson', 'bop'),
          track('Teardrop', 'hit'),
          track('Inertia Creeps', 'hit'),
          track('Dissolved Girl', 'bop'),
          track('Man Next Door', 'meh'),
          track('Black Milk', 'bop'),
          track('Group Four', 'bop')
        ]
      },
      {
        id: 'seed-shadow-4',
        artist: 'A Tribe Called Quest',
        album_title: 'Midnight Marauders',
        genre: 'Hip-Hop/Rap',
        rating: 9.6,
        description: 'Smooth jazz samples, crisp drum breaks, and iconic lyrical back-and-forth.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e5/26/18/e52618cb-7e3f-6771-469b-8e1cbab18c47/886445582967.jpg/600x600bb.jpg',
        tracklist: [
          track('Steve Biko (Stir It Up)', 'bop'),
          track('Award Tour', 'hit'),
          track('Sucka Nigga', 'meh'),
          track('Midnight', 'bop'),
          track('Electric Relaxation', 'hit'),
          track('Clap Your Hands', 'bop'),
          track('Oh My God', 'hit'),
          track('Keep It Rollin', 'bop'),
          track('The Chase, Part II', 'hit')
        ]
      },
      {
        id: 'seed-shadow-5',
        artist: 'J Dilla',
        album_title: 'Donuts',
        genre: 'Hip-Hop/Rap',
        rating: 9.8,
        description: 'Dilla\'s swan song. 31 short tracks of absolute beatmaking genius.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/8a/cc/78/8acc7896-bd7c-50bc-b9e7-f138f5f4625b/881626507425.jpg/600x600bb.jpg',
        tracklist: [
          track('Workinonit', 'hit'),
          track('Waves', 'hit'),
          track('Time: The Donut of the Heart', 'hit'),
          track('Glazed', 'bop'),
          track('Stop', 'hit'),
          track('U-Love', 'bop'),
          track('Hi.', 'meh'),
          track('Bye.', 'hit')
        ]
      }
    ]
  },
  {
    id: 'room-seed-jazz',
    ownerName: 'Miles',
    roomName: "Miles' Jazz Lounge",
    description: 'A curated collection of absolute jazz masterpieces, cool grooves, and blue note acoustics.',
    genres: 'Jazz',
    albums: [
      {
        id: 'seed-jazz-1',
        artist: 'Miles Davis',
        album_title: 'Kind of Blue',
        genre: 'Jazz',
        rating: 10,
        description: 'The best-selling jazz album of all time. Masterful modal jazz improvisations.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/21/cf/3e/21cf3e63-4c91-d242-b883-79d865c69784/886443834372.jpg/600x600bb.jpg',
        tracklist: [
          track('So What', 'hit'),
          track('Freddie Freeloader', 'bop'),
          track('Blue in Green', 'hit'),
          track('All Blues', 'hit'),
          track('Flamenco Sketches', 'bop')
        ]
      },
      {
        id: 'seed-jazz-2',
        artist: 'John Coltrane',
        album_title: 'A Love Supreme',
        genre: 'Jazz',
        rating: 9.9,
        description: 'A deeply spiritual four-part jazz suite showcasing Coltrane\'s legendary tenor sax.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4a/60/a6/4a60a6a4-4cc4-659f-d31a-e66699ebf80f/16UMGIM33615.rgb.jpg/600x600bb.jpg',
        tracklist: [
          track('Part 1: Acknowledgement', 'hit'),
          track('Part 2: Resolution', 'hit'),
          track('Part 3: Pursuance', 'bop'),
          track('Part 4: Psalm', 'bop')
        ]
      },
      {
        id: 'seed-jazz-3',
        artist: 'The Dave Brubeck Quartet',
        album_title: 'Time Out',
        genre: 'Jazz',
        rating: 9.4,
        description: 'West Coast cool jazz utilizing unconventional, complex time signatures.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ec/3b/bc/ec3bbcf7-8025-a131-0df8-bead069a5089/886443729906.jpg/600x600bb.jpg',
        tracklist: [
          track('Blue Rondo à la Turk', 'bop'),
          track('Strange Meadow Lark', 'meh'),
          track('Take Five', 'hit'),
          track('Three to Get Ready', 'bop'),
          track('Kathy\'s Waltz', 'meh'),
          track('Everybody\'s Jumpin\'', 'bop'),
          track('Pick Up Sticks', 'bop')
        ]
      },
      {
        id: 'seed-jazz-4',
        artist: 'Herbie Hancock',
        album_title: 'Head Hunters',
        genre: 'Jazz',
        rating: 9.6,
        description: 'Sublime jazz-funk fusion with analog synthesizers, clavinet grooves, and heavy basslines.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/05/cc/21/05cc2140-5e3e-4fb8-4b72-f81e1bb8864c/886443657780.jpg/600x600bb.jpg',
        tracklist: [
          track('Chameleon', 'hit'),
          track('Watermelon Man', 'hit'),
          track('Sly', 'bop'),
          track('Vein Melter', 'bop')
        ]
      }
    ]
  },
  {
    id: 'room-seed-french',
    ownerName: 'Daft Punk Fan',
    roomName: "Daft Punk Fan's Room",
    description: 'French house, synthwave, electronic club anthems, and robotic vocoder harmonies.',
    genres: 'Electronic',
    albums: [
      {
        id: 'seed-french-1',
        artist: 'Daft Punk',
        album_title: 'Discovery',
        genre: 'Electronic',
        rating: 10,
        description: 'The pinnacle of French house. Synthesized samples, pop hooks, and nostalgic anime visuals.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/1e/8c/d7/1e8cd717-38d7-75c1-1188-466d3a82dc26/0825646101732.jpg/600x600bb.jpg',
        tracklist: [
          track('One More Time', 'hit'),
          track('Aerodynamic', 'hit'),
          track('Digital Love', 'hit'),
          track('Harder, Better, Faster, Stronger', 'hit'),
          track('Crescendolls', 'bop'),
          track('Nightvision', 'meh'),
          track('Superheroes', 'bop'),
          track('High Life', 'bop'),
          track('Something About Us', 'hit'),
          track('Voyager', 'hit'),
          track('Veridis Quo', 'hit'),
          track('Short Circuit', 'bop'),
          track('Face to Face', 'hit'),
          track('Too Long', 'bop')
        ]
      },
      {
        id: 'seed-french-2',
        artist: 'Justice',
        album_title: '† (Cross)',
        genre: 'Electronic',
        rating: 9.3,
        description: 'Gritty, distorted electro house with church organ hooks and pop sensibilities.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4a/60/a6/4a60a6a4-4cc4-659f-d31a-e66699ebf80f/16UMGIM33615.rgb.jpg/600x600bb.jpg', // Using a placeholder since Cross url is long, let's keep it clean
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ad/7f/7a/ad7f7af9-5c4e-f2b3-db82-2736b0abfbfa/825646961474.jpg/600x600bb.jpg',
        tracklist: [
          track('Genesis', 'hit'),
          track('Let There Be Light', 'bop'),
          track('D.A.N.C.E.', 'hit'),
          track('Newjack', 'meh'),
          track('Phantom', 'bop'),
          track('Valentine', 'bop'),
          track('The Party', 'meh'),
          track('DVNO', 'hit'),
          track('Waters of Nazareth', 'bop'),
          track('One Minute to Midnight', 'bop')
        ]
      },
      {
        id: 'seed-french-3',
        artist: 'Disclosure',
        album_title: 'Settle',
        genre: 'Electronic',
        rating: 9.1,
        description: 'UK garage and deep house resurgence, filled with brilliant guest vocal features.',
        texture_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/71/cd/72/71cd72bd-fe3a-59dc-44b4-0994cc13bb93/13UMGIM13926.rgb.jpg/600x600bb.jpg',
        tracklist: [
          track('Intro', 'meh'),
          track('When a Fire Starts to Burn', 'hit'),
          track('Latch (feat. Sam Smith)', 'hit'),
          track('F for You', 'hit'),
          track('White Noise (feat. AlunaGeorge)', 'hit'),
          track('Defeated No More', 'bop'),
          track('Stimulation', 'bop'),
          track('Voices (feat. Sasha Keable)', 'bop'),
          track('Help Me Lose My Mind (feat. London Grammar)', 'hit')
        ]
      }
    ]
  }
];
