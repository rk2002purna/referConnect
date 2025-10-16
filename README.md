# ReferConnect Frontend

A modern React frontend application for the ReferConnect platform, built with TypeScript, Tailwind CSS, and Shadcn-ui components.

## Features

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Authentication**: JWT-based authentication with refresh tokens
- **Role-based Access**: Different experiences for employees, job seekers, and admins
- **Job Search**: Advanced job search with filters and recommendations
- **Dashboard**: Personalized dashboard with analytics and quick actions
- **Responsive Design**: Mobile-first approach with responsive layouts

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Shadcn-ui** for UI components
- **Axios** for API calls
- **React Hook Form** for form handling
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- ReferConnect backend running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`:
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### Development

Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Card, etc.)
│   └── layout/         # Layout components (Header, Layout)
├── contexts/           # React contexts (AuthContext)
├── lib/                # Utility functions and API client
├── pages/              # Page components
└── App.tsx            # Main app component with routing
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## API Integration

The frontend integrates with the ReferConnect backend API:

- **Authentication**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*`
- **Jobs**: `/api/v1/jobs/*`
- **Referrals**: `/api/v1/referrals/*`
- **Search**: `/api/v1/search/*`
- **Notifications**: `/api/v1/notifications/*`
- **Analytics**: `/api/v1/analytics/*`
- **Trust**: `/api/v1/trust/*`

## User Roles

### Job Seeker
- Search and apply for jobs
- Request referrals from employees
- Track application status
- Manage profile and skills

### Employee
- Post job openings
- Manage referrals
- View analytics and metrics
- Company profile management

### Admin
- Platform analytics
- User management
- Trust and safety monitoring
- System administration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the ReferConnect platform.