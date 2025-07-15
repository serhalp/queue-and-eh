# Queue and Eh 🎤

A demo application showcasing [**@netlify/nuxt**](https://www.npmjs.com/package/@netlify/nuxt) — bringing full local Netlify platform emulation to `nuxt dev`.

This interactive Q&A platform demonstrates real-time features powered by Netlify's edge infrastructure, including Edge Functions, Blobs storage, and Server-Sent Events (SSE).

## Features

- ✨ **Real-time Q&A Sessions**: Create interactive question and answer sessions for events
- 📊 **Live Voting**: Audience can vote on questions in real-time
- 🌍 **Geographic Insights**: Shows participant locations using Netlify Edge Functions
- 💾 **Persistent Storage**: Questions and votes stored using Netlify Blobs
- 🔄 **Live Updates**: Real-time updates via Server-Sent Events
- 👥 **User Presence**: See who's currently online in each session

## Netlify Platform Features Demonstrated

This demo showcases various Netlify platform capabilities:

- **Edge Functions**: Geographic middleware and SSE handling
- **Blobs**: Persistent data storage for events, questions, and votes
- **Server-Sent Events**: Real-time communication between server and clients
- **Nuxt Integration**: Seamless development experience with full platform emulation

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
```

### Development

Start the development server with full Netlify platform emulation:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Usage

1. **Create an Event**: Enter a title and description for your Q&A session
2. **Share the Link**: Copy the generated link to share with your audience
3. **Collect Questions**: Participants can submit questions in real-time
4. **Vote & Prioritize**: Questions are ranked by community votes
5. **Monitor Activity**: See live updates and participant geography

## Project Structure

```
├── netlify/
│   └── edge-functions/
│       ├── geo-middleware.ts    # Geographic data collection
│       └── sse.ts               # Server-Sent Events handling
├── server/
│   └── api/                     # Nuxt server API routes
├── components/
│   ├── LiveUpdatesIndicator.vue # Real-time status indicator
│   └── OnlineUsers.vue          # User presence component
├── composables/
│   ├── useGeo.ts               # Geographic data composable
│   └── useSSE.ts               # Server-Sent Events composable
├── stores/
│   └── questions.ts            # Pinia state management
└── utils/
    └── shared-storage.ts       # Netlify Blobs utilities
```

## Deployment

Deploy to Netlify:

```bash
# Build for production
npm run build

# Deploy via Netlify CLI
netlify deploy --prod
```

## Technology Stack

- **[Nuxt 4](https://nuxt.com/)**: Vue.js framework with server-side rendering
- **[@netlify/nuxt](https://www.npmjs.com/package/@netlify/nuxt)**: Nuxt module for Netlify
- **[Netlify Blobs](https://docs.netlify.com/blobs/)**: Persistent data storage
- **[Netlify Edge Functions](https://docs.netlify.com/edge-functions/)**: Serverless functions at the edge
- **[Pinia](https://pinia.vuejs.org/)**: Vue state management
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
