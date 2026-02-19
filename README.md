# PubConv - Public Conversation Platform

PubConv is a real-time global chat application built with **Next.js**, **Supabase**, and **Tailwind CSS**. It allows users to connect, chat, and discover profiles in a modern, responsive environment.

![PubConv Banner](/opener.png)

## 🚀 Features

- **Global Chat**: Real-time messaging with all online users.
- **User Authentication**: Secure login and registration powered by Supabase Auth with reCAPTCHA protection.
- **Profile System**: Customizable user profiles with avatars and status updates.
- **Admin Dashboard**:
  - User management (Verify, Ban, Delete users).
  - System controls (Maintenance Mode, Disable Signups).
  - Real-time broadcasts and rate limiting.
- **Responsive Design**: Mobile-first UI with dark/light mode support.
- **PWA Support**: Installable as a Progressive Web App on mobile and desktop.
- **Real-time Notifications**: Toast notifications for user actions.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database & Realtime**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: React Hook Form & Zod Validation
- **State Management**: React Context & Hooks

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project credentials

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:oursprojects/CapsConv.git
   cd PubConv
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_key
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

**Developed by Group 1**
