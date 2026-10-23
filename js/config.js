// Site-wide settings. Edit this file to update team info, coaches, and the backend.

const TEAM = {
  school: 'Lake Forest High School',
  name: 'Lake Forest Boys Golf',
  mascot: 'Scouts',
  conference: 'North Suburban Conference',
  season: 2026,
  homeCourse: {
    name: 'Home course', // TODO: set the team's home course
    address: '',
    mapUrl: '',
    description: '',
  },
  levels: [
    { id: 'varsity', label: 'Varsity' },
    { id: 'jv', label: 'JV' },
    { id: 'frosh', label: 'Frosh' },
  ],
  links: [
    { label: 'IHSA Boys Golf', url: 'https://www.ihsa.org/Sports-Activities/Boys-Golf' },
    { label: 'The Forest Scout (student news)', url: 'https://theforestscout.com' },
  ],
};

// TODO: replace with the real coaching staff. `photo` is optional (path or URL).
const COACHES = [
  { name: 'Head Coach Name', role: 'Head Coach · Varsity', email: '', photo: '', bio: 'Add a short bio in js/config.js.' },
  { name: 'Assistant Coach Name', role: 'Assistant Coach · JV', email: '', photo: '', bio: 'Add a short bio in js/config.js.' },
  { name: 'Assistant Coach Name', role: 'Assistant Coach · Frosh', email: '', photo: '', bio: 'Add a short bio in js/config.js.' },
];

// Firebase project settings (Project settings → Your apps → Web app).
// While apiKey is empty the site runs in demo mode with sample data stored in the browser.
const FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

// The single Firebase Auth account coaches sign in with. Its password is the coach passcode.
// Must match the email in firestore.rules.
const COACH_EMAIL = 'coaches@example.com';

// Passcode for demo mode only. Not secure; it exists so you can try coach mode before Firebase is set up.
const DEMO_PASSCODE = 'scouts';
