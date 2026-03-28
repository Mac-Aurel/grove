# grove

Daily planning app with social accountability and a garden that grows with your streaks.

A focused productivity app where you plan tomorrow's tasks the night before, share your accomplishments with friends through photo proofs, and grow a virtual garden as you maintain your daily streaks.

**Stack:** Expo SDK 51 · Expo Router v3 · TypeScript strict · NativeWind v4 · Supabase (Auth, Database, Storage, Edge Functions, Realtime) · Phosphor Icons · React Native Reanimated

---

## Core features

- Evening planning flow — write tomorrow's tasks the night before
- Public / private tasks — choose what to share with friends
- Photo proof — attach a photo when completing a task
- Social feed — masonry grid of friends' completed tasks
- Streak system — complete all daily tasks to maintain your streak
- My Garden — each streak earns a plant, build a garden over time
- Friend nudges — remind friends to complete their tasks
- Push notifications — daily reminders, streak alerts, friend nudges

---

## Getting started

### Prerequisites

- [Miniconda or Anaconda](https://docs.conda.io/en/latest/miniconda.html)
- [Xcode](https://developer.apple.com/xcode/) (iOS simulator, macOS only)
- [Expo Go](https://expo.dev/client) on your physical device (optional)

### 1. Clone the repo

```bash
git clone <repo-url>
cd grove
git checkout develop
```

### 2. Set up the environment

The project uses a conda environment to ensure everyone works with the same Node.js version.

```bash
conda env create -f environment.yml
conda activate myapps
```

### 3. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Set up environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Get these from your Supabase project dashboard under Settings > API.

### 5. Start the dev server

```bash
npx expo start
```

Then press `i` to open the iOS simulator, or scan the QR code with Expo Go on your phone.

---

## Project structure

```
grove/
├── app/                  # Expo Router screens
│   ├── _layout.tsx       # Root layout
│   └── (tabs)/           # Tab navigation
│       ├── _layout.tsx   # Tab bar config
│       ├── index.tsx     # Today screen
│       ├── feed.tsx      # Feed screen
│       ├── garden.tsx    # Garden screen
│       └── profile.tsx   # Profile screen
├── components/           # Reusable UI components
├── hooks/                # Supabase queries and auth logic
├── lib/                  # Supabase client, helpers
├── constants/
│   └── theme.ts          # Design tokens (colors, fonts, radius)
├── types/                # TypeScript interfaces and types
├── global.css            # Tailwind/NativeWind directives
├── tailwind.config.js    # NativeWind theme config
├── metro.config.js       # Metro bundler with NativeWind
├── babel.config.js       # Babel with NativeWind preset
└── environment.yml       # Conda environment spec
```

---

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Stable production code |
| `develop` | Integration branch — open PRs here |
| `feature/auth` | Authentication (Supabase Auth) |
| `feature/onboarding` | Onboarding flow |
| `feature/home` | Today / planning screen |
| `feature/tasks` | Task management |
| `feature/ui-components` | Design system and shared components |

Always branch off `develop`, never off `main`.

---

## Code rules (short version)

- TypeScript strict — no `any`, no `as`, explicit return types everywhere
- No emojis — use `phosphor-react-native` icons exclusively
- All colors from `constants/theme.ts` — never hardcode hex values inline
- NativeWind classes only — no inline styles
- All Supabase calls go through custom hooks in `/hooks`
- Sensitive data via `expo-secure-store` only — never `AsyncStorage`

See `CLAUDE.md` for the full rules.
