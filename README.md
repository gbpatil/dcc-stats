# DCC Stats - Dundalk Cricket Club Statistics

A modern React application displaying statistics for Dundalk Cricket Club from the Leinster Cricket League in Ireland.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## Features

### Primary Statistics (Main Tabs)
- 🏏 **Top Runs** - Leading run scorers with detailed stats
- ⚾ **Top Wickets** - Leading wicket takers
- 🧤 **Fielding** - Catches, stumpings, and run-outs
- 🏆 **High Scores** - Individual highest scores
- 🎯 **Best Bowling** - Best bowling figures
- ⭐ **All-Rounders** - Combined batting & bowling performance

### Extended Statistics (Dropdown Menu)
**Batting:** Averages, Strike Rates, Most Sixes, Most Boundaries, Most 50s, Most 100s  
**Bowling:** Averages, Economy Rates, Most Maidens  
**Team:** Highest/Lowest Team Totals  
**Other:** Partnerships, Most Matches Played

## Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript 5.9** - Type-safe development
- **Vite 7** - Lightning-fast build tool
- **CSS Modules** - Scoped component styling
- **CSS Variables** - Consistent design system

## Project Structure

```
src/
├── components/                 # Shared/reusable components
│   ├── layout/                 # Layout components
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.module.css
│   │   │   └── index.ts
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   ├── Footer.module.css
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── ui/                     # Basic UI components
│   │   ├── Spinner/
│   │   │   ├── Spinner.tsx
│   │   │   ├── Spinner.module.css
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
├── features/                   # Feature-based modules
│   └── stats/                  # Stats feature
│       ├── components/         # Feature-specific components
│       │   ├── TabNavigation/
│       │   ├── StatsTable/
│       │   └── index.ts
│       ├── hooks/              # Feature-specific hooks
│       │   ├── useCricketStats.ts
│       │   ├── useAvailableSeasons.ts
│       │   └── index.ts
│       ├── services/           # API services
│       │   ├── cricketApi.ts
│       │   └── index.ts
│       ├── types/              # TypeScript types
│       │   └── index.ts
│       └── index.ts
│
├── styles/                     # Global styles
│   ├── global.css              # Global CSS reset & base styles
│   └── variables.css           # CSS custom properties (design tokens)
│
├── constants/                  # App-wide constants
├── utils/                      # Utility functions
│
├── App.tsx                     # Root component
├── App.module.css
└── main.tsx                    # Entry point
```

## Design Patterns

### Component Organization
- **Feature-based architecture** - Related code grouped by feature
- **Barrel exports** - Clean imports via `index.ts` files
- **CSS Modules** - Scoped styles prevent conflicts

### Path Aliases
```typescript
import { Header } from '@/components';
import { useCricketStats } from '@/features/stats';
import '@/styles/global.css';
```

### Design System
CSS variables defined in `src/styles/variables.css`:
- Colors (backgrounds, accents, text, borders)
- Typography (fonts, sizes, weights)
- Spacing scale
- Border radius
- Shadows
- Transitions
- Z-index scale

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Data Source

Statistics are fetched from [CricketStatz.com](https://www.cricketstatz.com), the official statistics provider for Leinster Cricket clubs in Ireland.

## License

MIT

---

Built with ❤️ for Dundalk Cricket Club
