// Fictional sample data used in demo mode only. Real data lives in Firebase once it is configured.
const SAMPLE = (() => {

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(2026);
const between = (lo, hi) => Math.round(lo + rand() * (hi - lo));

const ROSTER = {
  varsity: [
    ['Owen Carter', 12], ['Liam Brooks', 12], ['Jack Morales', 11], ['Henry Walsh', 12],
    ['Ethan Park', 11], ['Charlie Novak', 10], ['Sam Okafor', 11], ['Will Dempsey', 12],
  ],
  jv: [
    ['Ben Hartley', 11], ['Leo Fischer', 10], ['Max Sullivan', 10], ['Nate Kim', 11],
    ['Ryan Doyle', 10], ['Aiden Patel', 10], ['Cole Bennett', 11], ['Theo Larsen', 10],
  ],
  frosh: [
    ['Luke Reyes', 9], ['Finn Gallagher', 9], ['Jonah Weiss', 9], ['Eli Thompson', 9],
    ['Gavin Shah', 9], ['Miles Ortega', 9], ['Danny Kowalski', 9], ['Oscar Lindqvist', 9],
  ],
};

const players = [];
for (const [level, list] of Object.entries(ROSTER)) {
  list.forEach(([name, grade], i) => players.push({ id: `${level}-${i + 1}`, name, grade, level, photo: '' }));
}

// [level, format, date, name, home, holes, par, opponents, place?, fieldSize?]
const SCHEDULE = [
  ['varsity', 'invite', '2026-08-14', 'Season Opener Invitational', false, 18, 72, [], 2, 14],
  ['varsity', 'dual', '2026-08-18', 'vs. Libertyville', true, 9, 36, ['Libertyville']],
  ['varsity', 'dual', '2026-08-25', 'at Stevenson', false, 9, 36, ['Stevenson']],
  ['varsity', 'dual', '2026-09-01', 'vs. Warren & Mundelein', true, 9, 36, ['Warren', 'Mundelein']],
  ['varsity', 'invite', '2026-09-12', 'Scouts Invitational', true, 18, 72, [], 1, 16],
  ['varsity', 'dual', '2026-09-15', 'at Lake Zurich', false, 9, 35, ['Lake Zurich']],
  ['varsity', 'dual', '2026-09-22', 'vs. Zion-Benton', true, 9, 36, ['Zion-Benton']],
  ['varsity', 'postseason', '2026-09-28', 'NSC Conference Tournament', false, 18, 72, [], 1, 9],
  ['varsity', 'postseason', '2026-10-01', 'IHSA Regional', false, 18, 72, [], 1, 10],
  ['varsity', 'postseason', '2026-10-06', 'IHSA Sectional', false, 18, 71, [], 3, 12],
  ['jv', 'dual', '2026-08-19', 'vs. Libertyville', true, 9, 36, ['Libertyville']],
  ['jv', 'dual', '2026-08-26', 'at Stevenson', false, 9, 36, ['Stevenson']],
  ['jv', 'invite', '2026-09-05', 'JV Invitational', false, 9, 36, [], 4, 10],
  ['jv', 'dual', '2026-09-16', 'at Lake Zurich', false, 9, 35, ['Lake Zurich']],
  ['jv', 'postseason', '2026-09-29', 'NSC JV Tournament', false, 9, 36, [], 2, 9],
  ['frosh', 'dual', '2026-08-20', 'vs. Grayslake Central', true, 9, 36, ['Grayslake Central']],
  ['frosh', 'dual', '2026-09-03', 'at Warren', false, 9, 36, ['Warren']],
  ['frosh', 'invite', '2026-09-19', 'Frosh-Soph Invitational', false, 9, 36, [], 3, 8],
  ['frosh', 'postseason', '2026-09-30', 'NSC Frosh Tournament', false, 9, 36, [], 2, 9],
];

const BASE = { varsity: 38, jv: 43, frosh: 46 };

const matches = SCHEDULE.map(([level, format, date, name, home, holes, par, opponents, place, fieldSize], i) => {
  const lineup = players.filter((p) => p.level === level).slice(0, level === 'varsity' ? 6 : 5);
  const scale = holes / 9;
  const scores = lineup.map((p, j) => ({
    playerId: p.id,
    score: Math.round((BASE[level] + j * 0.7) * scale + between(-3, 3) * scale),
  }));
  const ours = scores.map((s) => s.score).sort((a, b) => a - b).slice(0, 4).reduce((a, b) => a + b, 0);
  return {
    id: `m${i + 1}`,
    level, format, date, name, home, holes, par,
    time: holes === 18 ? '8:00 AM' : '3:30 PM',
    course: home ? 'Home course' : '',
    counting: 4,
    status: 'final',
    scores,
    oppScores: opponents.map((team) => ({ team, score: ours + between(-3, 16) })),
    place: place ?? '',
    fieldSize: fieldSize ?? '',
    notes: '',
  };
});

matches.push({
  id: 'e1', level: 'varsity', format: 'event', name: 'End-of-Season Banquet', date: '2026-11-09', time: '6:30 PM',
  course: 'LFHS Cafeteria', home: true, status: 'upcoming', scores: [], oppScores: [], notes: 'All levels and families welcome.',
});

const announcements = [
  { id: 'a1', date: '2026-10-07', level: '', title: 'Thanks for a great season!', body: 'Congrats to all three levels on a strong 2026. Banquet details are on the schedule.' },
  { id: 'a2', date: '2026-09-29', level: 'varsity', title: 'Conference champs', body: 'Varsity won the NSC tournament. Regional is Thursday; bus leaves at 6:45 AM.' },
  { id: 'a3', date: '2026-09-02', level: 'frosh', title: 'Practice moved', body: 'Frosh practice moves to 4:00 PM this week because of course maintenance.' },
];

return { players, matches, announcements };
})();
