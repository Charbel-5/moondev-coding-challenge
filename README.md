# MoonDev Coding Challenge

A Next.js application built for the MoonDev march 2025 coding challenge. This platform streamlines the technical evaluation of developers through a role-based system with real-time updates.

## Core Features

- **Authentication** - Role-based access system (Developer/Evaluator)
- **Developer Submission Portal** - Form for personal details and code upload
- **Evaluator Interface** - Review submissions and provide feedback in real-time
- **Automated Notifications** - Email alerts when submissions receive feedback

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Email**: Gmail integration via Supabase Edge Function

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Gmail account (for email notifications)

### Installation

1. Clone this repository
```bash
git clone https://github.com/Charbel-5/moondev-march-coding-challenge.git
cd moondev-march-coding-challenge
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables

####  For Web Application
```bash
# Create a .env.local file with:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_URL=your_supabase_url
```

####  For Supabase Edge Function
```bash
# Database Configuration
SUPABASE_DB_URL=your_supabase_db_url

# Supabase API Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
```
Note: For Gmail integration, you'll need to create an App Password in your Google Account security settings rather than using your regular Gmail password.

4. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Authentication

The application implements two distinct user roles:
- **Developer**: Can access the submission form
- **Evaluator**: Can access the evaluation dashboard

Routes are protected based on user roles with automatic redirects to appropriate pages.

## Local Development

### Database Setup

1. Create a new Supabase project
2. Run the SQL setup scripts found in `Database` directory
3. Enable email authentication in the Supabase dashboard

### Email Notifications

To configure email notifications:
1. Create a Gmail account
2. Deploy the provided edge function to your Supabase project
3. Update environment variables with your API keys

## Deployment

The application can be deployed to Vercel:
```bash
vercel
```

Remember to set the required environment variables in your Vercel dashboard.

## Acknowledgements

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)