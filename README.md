# 🎬 CineCue

CineCue is a stunning, cinematic movie recommendation engine designed to answer the hardest question of the night: *"What are we watching?"* 

By cutting through the noise of endless scrolls across a gazillion, CineCue directly curates perfect movies based exclusively on the streaming platforms you actually pay for, the era of film you want, and the exact mood you are in.

![CineCue Screenshot](public/cinecue.svg)

## ✨ The CineCue Experience

*   **Vibe-Based Curation:** Not sure what genre you want? Just pick a mood. Whether you're feeling *"Wholesome & Feel-Good"*, *"Dark & Gritty"*, or just want *"Mind-Bending"* twists, the TMDB filtering engine cross-references negative and positive genres behind the scenes to find a mathematically perfect match.
*   **True Streaming Filters:** Built-in streaming intelligence filters out rentals and paid VOD. Tell CineCue you only have *Netflix*, *Max*, and *Apple TV+*, and you will never see a movie you have to pay $3.99 to unlock.
*   **Adaptive Theming:** Personalize your interface. Toggle instantly between the elegant **Warm Editorial**, the deep mossy **Forest Green**, or the dramatic **Deep Space** UI paradigms.
*   **Smart State Memory:** CineCue learns you. Through LocalStorage, the engine remembers your platform subscriptions, favorite release eras, and tracks every movie you interact with across your sessions.
*   **Cinematic Design:** Built entirely on modern glass-morphic principles, CineCue functions less like a web app and more like a native media center—complete with responsive sticky mobile headers, auto-collapsing platform tags, and beautifully rendered film posters.

## 🚀 Tech Stack

*   **Frontend Library:** React (Vite)
*   **Styling:** Custom Vanilla CSS (Variables, Theme Support, Complex SVGs)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Backend / Data Engine:** [The Movie Database (TMDB) API](https://developer.themoviedb.org/docs/getting-started) 

## ⚙️ Getting Started

Want to run CineCue locally? Follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/legacyindeed/Cinecue.git
cd Cinecue
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure TMDB API Key
CineCue requires an active API Key from TMDB to ping their incredibly fast movie database. 
1. Create a free account at [TMDB](https://www.themoviedb.org/).
2. Request an API Key from your account settings.
3. In the root directory of your cloned project, rename the `.env.example` file to `.env`.
4. Paste your key into the file:
```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### 4. Ignite the Engine
```bash
npm run dev
```

Your local instance of CineCue is now running at `http://localhost:5173`. Grab some popcorn. 🍿

## 🤝 Contributing

Have an idea for a new mood, or a feature request? Open up an Issue or a Pull Request and let's make CineCue even better!

---
*Built with ❤️ utilizing the [TMDB API](https://www.themoviedb.org/)*
