# Lake Forest Boys Golf

Team site for Lake Forest High School Frosh, JV, and Varsity boys golf: schedule and results, roster, stats, coaches, and announcements. Coaches sign in with a passcode to post scores and update everything else.

Plain HTML/CSS/JavaScript with no build step, hosted on GitHub Pages.

## Pages

| Page | What's on it |
| --- | --- |
| `index.html` | Season records, next events, latest results, announcements |
| `schedule.html` | Full schedule; tap a finished match for individual scores |
| `roster.html` | Players by team with scoring averages |
| `stats.html` | Team records and a sortable individual leaderboard |
| `coaches.html` | Coaching staff and home course |
| `coach.html` | Coach login and dashboard (scores, schedule, roster, announcements) |

Every page has an All / Varsity / JV / Frosh filter.

## Try it locally

Double-click `index.html` to open it in your browser. No server needed. Until Firebase is connected the site runs in **demo mode**: it shows fictional sample data, and coach edits are saved only in your browser. The demo coach passcode is `scouts`.

## Connect real data (Firebase, free tier)

GitHub Pages can only serve files, so scores are stored in Firebase. Anyone can read them, and only the coach account can write them.

1. Go to https://console.firebase.google.com and create a project (Analytics not needed).
2. **Build → Firestore Database → Create database** (production mode, a US region).
3. **Firestore → Rules**: paste in `firestore.rules`, change `coaches@example.com` to your coach email, and publish.
4. **Build → Authentication → Get started → Email/Password**: enable it. Under **Users**, add one user with the coach email. The password you choose is the **coach passcode**. Make it long.
5. **Authentication → Settings → Authorized domains**: add `<your-github-username>.github.io`.
6. **Project settings → Your apps → Web (`</>`)**: register an app and copy `apiKey`, `authDomain`, `projectId`, and `appId` into `FIREBASE` in `js/config.js`. Set `COACH_EMAIL` to the same coach email. (These keys are meant to be public; the rules are what protect the data.)
7. Sign in at `coach.html` and add the roster and schedule.

To change the passcode, reset that user's password in Firebase Authentication.

## Publish on GitHub Pages

1. Push to `main`.
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site appears at `https://<username>.github.io/<repo-name>/` within a minute or two.

## Customize

- **Team info, coaches, home course, links:** `js/config.js`
- **Logo:** `assets/logo.svg` is a placeholder monogram in the school colors (royal blue and gold). Replace it with the official athletics logo from the LFHS athletic department; keep the same filename, or update the references in `js/ui.js` and the HTML files.
- **Player photos:** add images under `assets/players/` and put the path in the Photo field on the coach roster tab.
- **Colors:** the variables at the top of `css/styles.css`.

## How scoring works

- Coaches enter each player's score. The lowest *N* (default 4) count toward the team score automatically.
- **Duals/triangulars:** enter opponent scores ("Libertyville, 162") and the site works out W/L/T against each opponent for the season record.
- **Invitationals/postseason:** enter the place and number of teams.
- Stats keep 9-hole and 18-hole averages separate.
