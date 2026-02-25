# Web App Tech Stack: PubConv

## Core Framework & Language
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Library**: [React 18](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Backend & Database (BaaS)
- **Platform**: [Supabase](https://supabase.com/)
  - **Database**: PostgreSQL
  - **Authentication**: Supabase Auth (SSR support)
  - **Realtime**: Supabase Realtime (WebSockets for Chat & Admin features)
  - **Security**: Google reCAPTCHA

## Design & Icons
- **Icon Library**: [Lucide React](https://lucide.dev/)
- **Commonly Used Icons**:
  - **Navigation**: `Home`, `Search`, `User`, `MessageSquare`, `CalendarDays`, `LayoutGrid`
  - **Chat & Actions**: `Send`, `Reply`, `Smile`, `Trash2`, `RefreshCw`, `Save`, `Upload`, `Plus`
  - **Auth & Security**: `Shield`, `ShieldCheck`, `Lock`, `Unlock`, `Ban`, `Key`, `EyeIcon`, `EyeOffIcon`
  - **System & Utility**: `Loader2` (Spinner), `Sun`, `Moon`, `Wrench`, `Construction`, `WifiOff`, `Info`, `X`, `ChevronRight`, `Download`
  - **Features**: `Sparkles`, `Crown`, `Globe`, `Users`, `MapPin`, `Heart`, `Code`

## Frontend & Styling
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Animations**: [Framer Motion](https://www.framer.com/motion/), `@formkit/auto-animate`

## UI Utilities
- **Modals/Toasts**: [Sonner](https://smartswatch.github.io/sonner/), [SweetAlert2](https://sweetalert2.github.io/)
- **State/Hooks**: Custom React Hooks for Chat and Admin logic
- **Formatters**: `date-fns` (Date handling), `clsx` & `tailwind-merge` (Class management)

## Development Tools
- **Linter**: ESLint
- **Build Tool**: Next.js Compiler (SWC)
- **Environment**: Node.js
