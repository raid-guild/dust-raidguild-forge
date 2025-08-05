# RaidGuild Forge

A comprehensive toolkit for Dust adventures, built with React, TypeScript, and Vite.

## Features

- **Waypoint Management**: Save, organize, and navigate to waypoints in the Dust world
- **Sign Editor**: Edit signs in the game world
- **Force Field Management**: Manage force field memberships
- **Position Tracking**: Get player and cursor positions
- **MUD Integration**: Query the MUD database for entity information

## Tech Stack

- React 18
- TypeScript
- Vite
- React Query (TanStack Query)
- DustKit for Dust integration
- LatticeXYZ for MUD framework

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start the development server:
```bash
pnpm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

Build the app for production:
```bash
pnpm run build
```

The built files will be in the `dist` directory.

### Deployment

This app is configured for deployment on Vercel. The `vercel.json` file contains the necessary configuration for:

- Build command: `pnpm run build`
- Output directory: `dist`
- Framework: Vite
- SPA routing with rewrites
- CORS headers

## Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
├── index.css        # Global styles
└── index.html       # HTML template (moved to root for Vite)

public/
└── dust-app.json    # Dust app configuration

vercel.json          # Vercel deployment configuration
vite.config.ts       # Vite build configuration
tsconfig.json        # TypeScript configuration
package.json         # Dependencies and scripts
```

## Usage

1. **Waypoints Tab**: Add, edit, and manage waypoints for navigation
2. **Force Field Tab**: Manage force field memberships and permissions
3. **Signs Tab**: Edit signs in the game world
4. **Newsletter Tab**: Newsletter management (placeholder)

## Configuration

The app integrates with the Dust world and uses the MUD indexer for queries. Make sure you have the proper Dust client connection configured.

## License

This project is part of the RaidGuild ecosystem. # Updated for Vercel deployment
