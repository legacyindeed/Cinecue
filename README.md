# CineCue
Transform the endless scrolling of streaming platforms into perfectly curated, mood-based movie nights.

## Features
*   **Vibe-Based Curation**: Automatically maps abstract moods ("Dark & Gritty", "Wholesome & Feel-Good") to optimal TMDB genre combinations.
*   **True Streaming Filters**: Intelligent API fetching specifically filters out paid rentals so you only see movies included for free in your subscriptions.
*   **Adaptive Theming**: Choose your personalized cinematic interface: Warm Editorial, Forest Green, or Deep Space aesthetics.
*   **Smart State Memory**: Automatically remembers your streaming platforms and favorite eras using LocalStorage, so your setup is saved natively.
*   **Dynamic UI**: Fully responsive glass-morphic architecture, complete with an adaptive sticky mobile header and auto-collapsing UI tags.

## Quick Start
Clone and install:

```bash
git clone https://github.com/legacyindeed/Cinecue.git
cd Cinecue
npm install
```

Set up API keys:

```bash
cp .env.example .env
# Edit .env with your TMDB key
```

Ignite the Engine:

```bash
npm run dev
```

## Getting API Keys
### TMDB API (Free)
1. Go to [The Movie Database (TMDB)](https://www.themoviedb.org/) and create a free account.
2. Navigate to your Account Settings → API.
3. Request an API Key as a Developer.
4. Copy your `v3 auth` key into `.env` under `VITE_TMDB_API_KEY=`

## Known Issues & Solutions
This project documents several TMDB API quirks:

| Problem | Solution |
| --- | --- |
| Rental movies appearing in feed | Append `&with_watch_monetization_types=flatrate` to the discover query |
| Unrelated genres sneaking in (e.g., Action in Horror) | Implement a dedicated `without_genres` exclusions array in the mood config |
| Apple TV generating 0 results despite high catalog | Map TMDB provider ID 350 to both Apple TV+ *and* iTunes Store (ID 2) |
| Missing metadata in API payloads | Switch from simple `/search` endpoint to the robust `/discover/movie` engine |

## Project Structure
```text
├── src/                  
│   ├── App.jsx           # Core Engine & Main React UI
│   ├── App.css           # Component Scoped Styles & Layout Maps
│   └── index.css         # Global Styles & Complete CSS Theme Architecture
├── public/               
│   └── cinecue.svg       # Custom rendered SVG Vector Logo
├── .env                  # Your API keys (not committed)
├── .env.example          # Blank template for git cloning
└── package.json          # Node dependencies (Vite, React, Lucide)
```

## License
MIT - Use freely, modify as needed.

Built utilizing the **TMDB API**.
