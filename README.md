# Luvrix - Blog & Manga Platform

A full-featured blog and manga redirect platform built with Next.js and Firebase.

## Tech Stack

- **Frontend**: Next.js (Static Export)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Hosting**: Hostinger (public_html)
- **Styling**: TailwindCSS

## Features

- ✅ User Authentication (Login/Register)
- ✅ Blog System with SEO Scoring
- ✅ Manga Redirect Pages (5000+ chapters supported)
- ✅ Admin Dashboard
- ✅ Payment Integration (Pay per Blog)
- ✅ Google Ads & Analytics Integration
- ✅ Theme Customization
- ✅ Anti-Spam System

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Storage
   - Copy your config to `firebase/config.js`

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Deploy to Hostinger:
   - Upload contents of `out/` folder to `public_html/`

## Firestore Collections

- `users` - User accounts and roles
- `blogs` - Blog posts
- `manga` - Manga listings
- `payments` - Payment records
- `settings` - Admin settings

## Admin Access

To make a user admin, set their `role` field to `"ADMIN"` in Firestore.

## License

© 2026 Luvrix.com - All Rights Reserved
