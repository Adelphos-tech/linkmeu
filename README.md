# EventsX - Event Management & Registration System

A modern Progressive Web App (PWA) for managing events, registrations, and attendee check-ins with role-based access control. Built with React, Vite, and IndexedDB for offline-first functionality.

## Super Admin Credentials

- **Email**: Robocorpsg@gmail.com
- **Password**: [Set during first registration or configure via environment variable]

## User Roles

### Super Admin
- Full access to all events
- Can create, edit, and delete any event
- Export attendee lists (CSV)
- View all users and statistics

### Event Owner
- Create and manage their own events
- Edit only events they created
- Cannot export attendee lists (must contact super admin)
- Can register attendees and manage check-ins

### Public Users
- View all public events
- Register for events
- No edit access

## Features

### Event Management
- Create and edit events with comprehensive details:
  - Date, title, description, venue
  - Organiser information
  - Logo and event images
  - Dynamic lists for:
    - Guests of Honour (with photos)
    - Speakers (with photos)
    - Sponsors (with logos)
    - Media Partners (with logos)

### Registration System
- Auto-generated QR code for event registration
- Public registration form with fields:
  - Name
  - Email
  - Contact/Phone
  - Notes/Company
- Offline registration support

### Flyer Generation
- Auto-generate A5 PDF flyers with:
  - Event details
  - Registration QR code
  - Professional dark theme design
- Download and share flyers

### Check-in System
- Search attendees by name, email, or contact
- QR code scanning for quick check-in
- Mark attendance status
- Real-time statistics (Registered vs Attended)

### Data Export
- Export registered attendees to CSV
- Export attended attendees to CSV
- Includes all registration details

### PWA Features
- Install to home screen
- Offline functionality
- Fast and responsive
- Works on all devices

## Tech Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Database**: Dexie (IndexedDB wrapper)
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **QR Code**: qrcode, html5-qrcode
- **PDF**: jsPDF
- **PWA**: vite-plugin-pwa

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Usage

### Creating an Event
1. Click "New Event" on the home screen
2. Fill in event details (date, title, description, venue)
3. Add organisers
4. Upload logo and event image
5. Add guests of honour, speakers, sponsors, and media partners
6. Click "Create Event"

### Generating Registration QR & Flyer
1. Open the event
2. Go to "Flyer" tab
3. View the auto-generated QR code
4. Click "Download A5 Flyer (PDF)" to get the printable flyer

### Registering Attendees
1. Share the registration URL or QR code
2. Attendees fill in the registration form
3. Submissions are saved locally (works offline)

### Check-in on Event Day
1. Open the event
2. Go to "Check-in" tab
3. Search for attendees or scan their QR code
4. Mark attendance
5. Export lists as needed

## Offline Support

The app uses:
- Service Worker for offline caching
- IndexedDB for local data storage
- All features work without internet connection
- Data syncs when online

## Browser Support

- Chrome/Edge (recommended)
- Safari
- Firefox
- Any modern browser with PWA support

## License

MIT

## Credits

Powered by Robocorp
