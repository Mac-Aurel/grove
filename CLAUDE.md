# Grove — Claude Code Instructions

## Project
Daily planning app. Expo SDK 51, iOS first, TypeScript strict, Expo Router v3, NativeWind v4, Supabase.

## Code rules
- TypeScript strict — no `any`, no `as`, explicit return types on all functions
- No emojis anywhere in the codebase — use phosphor-react-native icons exclusively
- All colors from /constants/theme.ts — never hardcode hex values inline
- All components in /components, named exports only, no default exports except screens
- Every screen in /app follows Expo Router file conventions
- Supabase client only from /lib/supabase.ts — never instantiate elsewhere
- Never use AsyncStorage directly — always expo-secure-store for sensitive data
- All Supabase queries go through custom hooks in /hooks — never call supabase directly in a component

## Design system
- Background: cream #FAFAF7
- Text primary: warm black #1C1C1A
- Accent: sage green #7C9A6E
- Border: #E8E8E4
- Muted text: #9A9A96
- Heading font: Playfair Display
- Body font: Inter
- Border radius: sm=8 md=12 lg=20 xl=28
- Cards: 20px radius, shadow 0 2px 12px rgba(0,0,0,0.06)
- Icons: phosphor-react-native, weight="regular", size=22 default

## Folder structure
/app           → Expo Router screens
/components    → reusable UI components
/hooks         → all Supabase queries and auth logic
/lib           → supabase client, helpers
/constants     → theme, config
/types         → TypeScript interfaces and types

## Security
- RLS enabled on every Supabase table — never bypass
- No sensitive data in component state longer than necessary
- Validate all user inputs before sending to Supabase

## What to avoid
- No class components
- No inline styles — NativeWind classes only
- No console.log in committed code
- No TODO comments left in code
- No placeholder data in production code paths

## Current status (branch: feature/ui-components)

### Done
- Project initialized: Expo SDK 51, Expo Router v3, TypeScript strict, NativeWind v4 (pinned to 4.0.36)
- Conda environment `myapps` configured with Node.js 20.20.2
- `environment.yml` exported for collaborator onboarding
- `constants/theme.ts` created with full design token set
- Tab navigation scaffolded: Today, Feed, Garden, Profile (phosphor icons, fill on active)
- Placeholder screens for all 4 tabs ("Coming soon")
- `README.md` updated with full collaborator onboarding guide
- `.env.example` created
- Placeholder assets generated (icon, splash, adaptive-icon, favicon)

### Known dependency notes
- `nativewind` pinned to `4.0.36` — v4.2.x uses react-native-css-interop@0.2.x which requires reanimated v4 (incompatible with Expo SDK 51)
- `react-native-css-interop` pinned to `0.0.36` for same reason
- `react-native-svg` required explicitly as peer dep of phosphor-react-native
- npm install must be run with `--legacy-peer-deps`

### Next steps
- [ ] feature/auth — Supabase auth setup (lib/supabase.ts, useAuth hook, sign-in/sign-up screens)
- [ ] feature/onboarding — onboarding flow
- [ ] feature/home — Today screen (evening planning flow)
- [ ] feature/tasks — task CRUD, public/private toggle, photo proof
- [ ] feature/ui-components — shared UI components (Button, Card, Input...)
