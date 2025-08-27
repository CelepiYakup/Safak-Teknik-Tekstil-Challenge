# Factory Production Schedule - Frontend

A modern React-based Gantt chart application for visualizing and managing factory work orders with drag-and-drop scheduling capabilities.

##  Tech Stack

- **Framework**: React 19.1.1 with TypeScript 5.9.2
- **Build Tool**: Vite 5.4.19
- **State Management**: Zustand 5.0.8
- **Styling**: SCSS with custom design system
- **HTTP Client**: Axios 1.11.0
- **Drag & Drop**: @dnd-kit/core 6.3.1
- **Date Utilities**: date-fns 4.1.0
- **Notifications**: react-hot-toast 2.6.0

##  Features

### Core Features
- **Interactive Gantt Chart**: Visual timeline with machine-based lanes
- **Drag & Drop Scheduling**: Intuitive operation rescheduling
- **Real-time Validation**: Server-side constraint checking
- **Work Order Management**: Comprehensive work order visualization
- **Conflict Detection**: Visual highlighting of scheduling conflicts
- **Click-to-Highlight**: Easy work order identification

### Advanced Features
- **Responsive Design**: Mobile-friendly interface
- **Dark Theme**: Modern, professional appearance
- **Search & Filter**: Quick work order and operation search
- **Multiple View Modes**: Daily and weekly timeline views
- **Machine Statistics**: Utilization tracking and operation counts
- **Toast Notifications**: User feedback for all operations
- **Loading States**: Smooth user experience during data operations

##  Project Structure

```
client/
├── public/                  # Static assets
├── src/
│   ├── api/
│   │   └── index.ts        # API client and endpoints
│   ├── components/
│   │   ├── GanttChart/     # Main Gantt chart component
│   │   ├── Toast/          # Notification system
│   │   └── DnDList.tsx     # Drag and drop utilities
│   ├── store/
│   │   └── useScheduleStore.ts  # Zustand state management
│   ├── styles/
│   │   ├── main.scss       # Global styles
│   │   ├── variables.scss  # Design system variables
│   │   └── mixins.scss     # SCSS mixins and utilities
│   ├── utils/
│   │   └── ganttUtils.ts   # Timeline calculations and utilities
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── package.json
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── .env.example            # Environment variables template
```

##  Installation & Setup

### Prerequisites

- Node.js 18.0.0+ (LTS recommended)
- npm 8.0.0+ or yarn 1.22.0+

### 1. Clone and Navigate

```bash
cd client
```

### 2. Install Dependencies

```bash
npm install

yarn install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file:

```bash
VITE_API_URL=http://localhost:5000/api
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

### Development

```bash

npm run dev

npm run build

npm run preview


npx tsc --noEmit
```

### Code Quality

```bash

npm run lint

npm run lint --fix
```

##  Design System

The application uses a comprehensive SCSS-based design system:

### Color Palette
- **Background**: Multi-level dark theme (`$bg-primary`, `$bg-secondary`, `$bg-tertiary`)
- **Text**: Hierarchical text colors (`$text-primary`, `$text-secondary`, `$text-muted`)
- **Accent Colors**: Semantic colors for success, warning, error, and info states
- **Operation Colors**: Color-coded operation states (normal, hover, selected, conflict)

### Layout System
- **Responsive Breakpoints**: Mobile-first approach with tablet and desktop breakpoints
- **Spacing Scale**: Consistent spacing using `$space-*` variables
- **Typography**: Modern font stack with Inter and JetBrains Mono

### Component Patterns
- **Mixins**: Reusable SCSS patterns for buttons, cards, and layouts
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: Focus states and semantic markup

##  Key Components

### GanttChart
The main visualization component featuring:
- Machine-based lane rendering
- Interactive timeline with adaptive time ticks
- Drag-and-drop operation scheduling
- Real-time conflict detection
- Responsive design patterns

### ScheduleStore (Zustand)
Centralized state management handling:
- Work order and operation data
- API integration with optimistic updates
- Toast notification system
- Highlight state management
- Error handling with rollback capabilities

### Timeline Utilities
Mathematical utilities for:
- Date-to-pixel conversions
- Adaptive time tick generation
- Conflict detection algorithms
- Duration calculations
- Time rounding functions

##  Configuration

### Vite Configuration
- Path aliases (`@/` for `src/`)
- Development server settings
- Build optimizations

### TypeScript Configuration
- Strict type checking
- Modern ES features
- React JSX support
- Path mapping

### SCSS Configuration
- Global styles and variables
- Component-scoped styling
- Responsive mixins



##  User Interactions

### Navigation
- **Search**: Real-time filtering of work orders and operations
- **View Modes**: Toggle between daily and weekly timeline views
- **Sidebar**: Collapsible work order management panel

### Timeline Interactions
- **Click Operations**: Highlight all operations in the same work order
- **Drag Operations**: Reschedule operations with visual feedback
- **Scroll Timeline**: Horizontal scrolling for extended time ranges
- **Clear Selection**: Click empty space to clear highlights

### Visual Feedback
- **Loading States**: Spinner animations during data loading
- **Toast Notifications**: Success/error messages for user actions
- **Conflict Highlighting**: Visual warnings for scheduling violations
- **Hover Effects**: Interactive feedback on all clickable elements

##  Performance Optimizations

- **Memoized Calculations**: Expensive timeline calculations cached
- **Optimistic Updates**: Immediate UI updates with rollback on errors
- **Efficient Rendering**: React optimization patterns and minimal re-renders
- **Lazy Loading**: Code splitting where appropriate

##  Key Dependencies

### Core Framework
- `react@19.1.1` - UI framework
- `typescript@5.9.2` - Type safety
- `vite@5.4.19` - Build tool and dev server

### State & Data
- `zustand@5.0.8` - State management
- `axios@1.11.0` - HTTP client
- `date-fns@4.1.0` - Date utilities

### UI & Interactions
- `@dnd-kit/core@6.3.1` - Drag and drop functionality
- `react-hot-toast@2.6.0` - Toast notifications
- `clsx@2.1.1` - Conditional CSS classes

### Development
- `sass@1.91.0` - SCSS preprocessing
- `eslint@9.34.0` - Code linting
- `typescript-eslint@8.41.0` - TypeScript ESLint rules

##  Development Tips

### Custom Hooks Pattern
The application uses Zustand for state management instead of traditional React hooks, providing:
- Better TypeScript integration
- Automatic subscription management
- Simplified async state handling

### SCSS Architecture
- Use `@use` instead of `@import` for better namespace management
- Leverage mixins for consistent component patterns
- Follow BEM naming convention for CSS classes

### TypeScript Best Practices
- Strict type checking enabled
- Proper interface definitions for all data structures
- Generic types for reusable components

##  Production Deployment

### Build Process
```bash
npm run build
```

### Environment Variables
Set the following in your production environment:
```bash
VITE_API_URL=https://your-api-domain.com/api
```

### Static Hosting
The built application can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Performance Considerations
- Enable gzip compression
- Configure proper cache headers
- Use CDN for static assets
- Monitor Core Web Vitals

