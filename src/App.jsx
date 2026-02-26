import React, { useState, useEffect, useRef } from 'react';
import {
  Coffee, Zap, Brain, Flame, CloudRain, Heart,
  Smile, Ghost, BookOpen, Sparkles, Palette,
  ArrowLeft, Play, ThumbsUp, Filter, Settings, X, Tv, ChevronDown, ChevronUp, Loader, RefreshCw, Star, Film
} from 'lucide-react';
import './App.css';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// --- Rate Limiter Utility ---
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_SECOND = 34; // keeping it strictly under 35

const fetchTMDB = async (url) => {
  const now = Date.now();
  if (now - lastResetTime >= 1000) {
    requestCount = 0;
    lastResetTime = now;
  }

  if (requestCount >= MAX_REQUESTS_PER_SECOND) {
    const delay = 1000 - (now - lastResetTime);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchTMDB(url); // retry after delay
  }

  requestCount++;
  return fetch(url);
};

const MOODS = [
  { id: 'Comedy', label: 'Laugh Out Loud', icon: Smile, genres: [35], withoutGenres: [28, 27, 53, 80], desc: 'Keep it light and easy with pure comedies and stand-up.' },
  { id: 'Action', label: 'Adrenaline Rush', icon: Zap, genres: [28], withoutGenres: [10749, 99], desc: 'High energy and fast-paced. Action and big explosions.' },
  { id: 'Sad', label: 'Sad & Emotional', icon: CloudRain, genres: [18], withoutGenres: [28, 35, 16, 878, 14], desc: 'Have a good cry with tearjerkers and deep, heavy dramas.' },
  { id: 'Horror', label: 'Pure Horror', icon: Ghost, genres: [27], withoutGenres: [35, 10749, 10751, 18, 10770], desc: 'Pure terror, jump scares, and supernatural frights.' },
  { id: 'Mystery', label: 'Brain Teasers', icon: Brain, genres: [9648, 80], withoutGenres: [28, 35, 10749, 16, 14, 878], desc: 'Twisty mysteries, psychological thrillers, and crime.' },
  { id: 'Documentary', label: 'Documentaries', icon: BookOpen, genres: [99], withoutGenres: [28, 35, 27, 878, 14], desc: 'Fascinating real-world documentaries and historical events.' },
  { id: 'Animation', label: 'Anime & Animation', icon: Sparkles, genres: [16], withoutGenres: [27, 99], desc: 'Visually stunning anime, colorful animations, and cartoons.' },
  { id: 'Romance', label: 'Hopeless Romantic', icon: Heart, genres: [10749], withoutGenres: [27, 80, 28, 99, 878, 14], desc: 'Love is in the air. Rom-coms and heartfelt love stories.' },
];

const TIME_RANGES = [
  { id: 'all', label: 'Any Era' },
  { id: 'last_year', label: 'Within Last Year' },
  { id: '2020_2025', label: '2020 - 2025' },
  { id: '2015_2019', label: '2015 - 2019' },
  { id: '2010_2014', label: '2010 - 2014' },
  { id: '2000_2009', label: '2000 - 2009' },
  { id: 'pre_2000', label: '< 2000' }
];

const PROVIDERS = {
  "Netflix": 8,
  "Hulu": 15,
  "Max": 384,
  "Amazon Prime": 9,
  "Disney+": 337,
  "Paramount+": 531,
  "Peacock": 386,
  "Apple TV+ & Store": "350|2",
  "Crunchyroll": 283
};

const AVAILABLE_SERVICES = Object.keys(PROVIDERS);

const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

export default function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedServices, setSelectedServices] = useState(["Netflix", "Hulu", "Max", "Amazon Prime"]);

  const [apiMovies, setApiMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [expandedMovies, setExpandedMovies] = useState({});
  const [expandedPlatforms, setExpandedPlatforms] = useState({});
  const [theme, setTheme] = useState(localStorage.getItem('cinecueTheme') || 'default');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'for this morning?';
    if (hour >= 12 && hour < 16) return 'for this afternoon?';
    if (hour >= 16 && hour < 18) return 'for this evening?';
    if ((hour >= 18 && hour <= 23) || hour === 0) return 'for tonight?';
    return 'for late tonight?';
  };

  useEffect(() => {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('cinecueTheme', theme);
  }, [theme]);

  useEffect(() => {
    const storedPrefs = localStorage.getItem('cinecuePreferences');
    if (storedPrefs) {
      try {
        setPreferences(JSON.parse(storedPrefs));
      } catch (e) {
        console.error("Could not parse preferences", e);
      }
    }
  }, []);

  const showToast = (message) => {
    setToastMessage({ id: Date.now(), msg: message });
  };

  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      if (selectedServices.length === 1) {
        showToast("You need at least one streaming service selected!");
        return;
      }
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // The actual TMDB API fetch effect
  useEffect(() => {
    if (!selectedMood) return;

    setCurrentBatchIndex(0);

    const fetchMoviesFromApi = async () => {
      setIsLoading(true);
      try {
        const moodConfig = MOODS.find(m => m.id === selectedMood);
        const genreString = moodConfig ? moodConfig.genres.join('|') : '';

        let url = `${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&watch_region=US&with_watch_monetization_types=flatrate|rent|buy`;

        if (genreString) {
          url += `&with_genres=${genreString}`;
        }
        if (moodConfig && moodConfig.withoutGenres) {
          url += `&without_genres=${moodConfig.withoutGenres.join(',')}`;
        }

        if (selectedServices.length > 0) {
          const providerIds = selectedServices.map(s => PROVIDERS[s]).join('|');
          url += `&with_watch_providers=${providerIds}`;
        }

        let dateGte, dateLte;
        if (selectedTimeRange === 'last_year') {
          dateGte = '2025-01-01';
        } else if (selectedTimeRange === '2020_2025') {
          dateGte = '2020-01-01'; dateLte = '2025-12-31';
        } else if (selectedTimeRange === '2015_2019') {
          dateGte = '2015-01-01'; dateLte = '2019-12-31';
        } else if (selectedTimeRange === '2010_2014') {
          dateGte = '2010-01-01'; dateLte = '2014-12-31';
        } else if (selectedTimeRange === '2000_2009') {
          dateGte = '2000-01-01'; dateLte = '2009-12-31';
        } else if (selectedTimeRange === 'pre_2000') {
          dateLte = '1999-12-31';
        }

        if (dateGte) url += `&primary_release_date.gte=${dateGte}`;
        if (dateLte) url += `&primary_release_date.lte=${dateLte}`;

        // Fetch top 2 pages of results to have enough data to sort via ML locally
        const responses = await Promise.all([
          fetchTMDB(url + '&page=1'),
          fetchTMDB(url + '&page=2')
        ]);

        const data1 = await responses[0].json();
        const data2 = await responses[1].json();

        let results = [...(data1.results || []), ...(data2.results || [])];

        // Ensure they have valid posters and overviews
        results = results.filter(m => m.poster_path && m.overview);

        // De-duplicate based on id
        const uniqueResults = [];
        const seenIds = new Set();
        for (const r of results) {
          if (!seenIds.has(r.id)) {
            uniqueResults.push(r);
            seenIds.add(r.id);
          }
        }

        setApiMovies(uniqueResults);
        if (uniqueResults.length === 0) setIsLoading(false);
      } catch (err) {
        console.error(err);
        showToast("Error retrieving movies from TMDB");
        setApiMovies([]);
        setIsLoading(false);
      }
    };

    fetchMoviesFromApi();
  }, [selectedMood, selectedTimeRange, selectedServices]);

  // Sort and Enrich movies whenever apiMovies, preferences, or currentBatchIndex changes
  useEffect(() => {
    if (apiMovies.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchEnrichedBatch = async () => {
      setIsLoading(true);
      try {
        const sorted = [...apiMovies].sort((a, b) => {
          // Calculate a score for each movie based on its genres and user prefs
          const scoreA = (a.genre_ids || []).reduce((total, id) => total + (preferences[GENRE_MAP[id]] || 0), 0);
          const scoreB = (b.genre_ids || []).reduce((total, id) => total + (preferences[GENRE_MAP[id]] || 0), 0);

          // If scores are equal, fallback to TMDB popularity
          if (scoreB === scoreA) {
            return b.popularity - a.popularity;
          }
          return scoreB - scoreA;
        });

        // Take 5 movies based on the batch index
        const batch = sorted.slice(currentBatchIndex * 5, (currentBatchIndex + 1) * 5);

        // Enrich with streaming service info
        const enrichedMovies = await Promise.all(batch.map(async (movie) => {
          try {
            const provRes = await fetchTMDB(`${TMDB_BASE_URL}/movie/${movie.id}/watch/providers?api_key=${API_KEY}`);
            const provData = await provRes.json();
            const usProviders = provData.results?.US?.flatrate || [];
            movie.services = usProviders
              .map(p => p.provider_name)
              .filter(name => AVAILABLE_SERVICES.some(validService => name.includes(validService) || validService.includes(name)));
          } catch (e) {
            movie.services = [];
          }

          // Fallback to user filters if api fails
          if (!movie.services || movie.services.length === 0) {
            movie.services = selectedServices.slice(0, 2);
          }
          return movie;
        }));

        setRecommendations(enrichedMovies);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrichedBatch();
  }, [apiMovies, preferences, currentBatchIndex, selectedServices]);

  const handleInteract = (movie, type) => {
    const increment = type === 'watch' ? 2 : 1;
    const newPrefs = { ...preferences };

    // Add points to all genres this movie belongs to
    movie.genre_ids.forEach(id => {
      const genreName = GENRE_MAP[id];
      if (genreName) {
        newPrefs[genreName] = (newPrefs[genreName] || 0) + increment;
      }
    });

    setPreferences(newPrefs);
    localStorage.setItem('cinecuePreferences', JSON.stringify(newPrefs));

    // Pick the defining genre of the movie to show in the toast
    const primaryGenre = GENRE_MAP[movie.genre_ids[0]] || "this type of movie";

    const message = type === 'watch'
      ? `Playing ${movie.title}... Learnt you like ${primaryGenre} !`
      : `Liked ${movie.title} !Adapting recommendations...`;

    showToast(message);
  };

  const selectedEraLabel = TIME_RANGES.find(r => r.id === selectedTimeRange)?.label || 'Any Era';

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo" onClick={() => { setSelectedMood(null); setApiMovies([]); setCurrentBatchIndex(0); }}>
          <div className="logo-icon-wrapper">
            <Film size={24} className="logo-icon-svg" stroke="var(--bg-color)" strokeWidth={2.5} />
            <Sparkles size={12} className="logo-icon-sparkle" fill="var(--bg-color)" stroke="none" />
          </div>
          <div className="logo-text">
            <span style={{ color: 'var(--text-main)' }}>Cine</span>
            <span style={{ color: 'var(--primary)' }}>Cue</span>
          </div>
        </div>

        <div className="theme-picker" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Palette size={18} className="glow-text-primary" style={{ marginRight: '4px', opacity: 0.8 }} />
          <button
            onClick={() => setTheme('default')}
            style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#C84B31', border: theme === 'default' ? '2px solid var(--text-main)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.2s', transform: theme === 'default' ? 'scale(1.1)' : 'scale(1)' }}
            title="Warm Editorial"
          />
          <button
            onClick={() => setTheme('green')}
            style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2E7D32', border: theme === 'green' ? '2px solid var(--text-main)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.2s', transform: theme === 'green' ? 'scale(1.1)' : 'scale(1)' }}
            title="Forest Green"
          />
          <button
            onClick={() => setTheme('space')}
            style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#6366F1', border: theme === 'space' ? '2px solid var(--text-main)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.2s', transform: theme === 'space' ? 'scale(1.1)' : 'scale(1)' }}
            title="Deep Space"
          />
        </div>
      </header>

      <main className="main-content">
        {!selectedMood ? (
          <div className="hero-section animate-fade-in">
            <h1 className="hero-title">
              What are you in the mood <span className="glow-text-primary">{getGreeting()}</span>
            </h1>
            <p className="hero-subtitle">
              Select your platforms, era, and mood to discover your next favorite movie.
            </p>

            <div className="onboarding-layout">
              <div className="onboarding-sidebar">
                <div className="onboarding-section glass-panel">
                  <h3 className="onboarding-title"><Tv size={18} className="glow-text-primary" /> 1. Your Platforms</h3>
                  <div className="services-grid">
                    {AVAILABLE_SERVICES.map(service => (
                      <button
                        key={service}
                        className={`service-pill ${selectedServices.includes(service) ? 'active' : ''}`}
                        onClick={() => toggleService(service)}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="onboarding-section glass-panel">
                  <h3 className="onboarding-title"><Filter size={18} className="glow-text-primary" /> 2. Release Era</h3>
                  <div className="services-grid">
                    {TIME_RANGES.map(range => (
                      <button
                        key={range.id}
                        className={`service-pill ${selectedTimeRange === range.id ? 'active' : ''}`}
                        onClick={() => setSelectedTimeRange(range.id)}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="onboarding-main">
                <div className="onboarding-section glass-panel" style={{ height: '100%', margin: 0 }}>
                  <h3 className="onboarding-title"><Flame size={18} className="glow-text-primary" /> 3. The Vibe</h3>
                  <div className="mood-grid">
                    {MOODS.map(mood => {
                      const Icon = mood.icon;
                      return (
                        <button
                          key={mood.id}
                          className="mood-button glass-panel"
                          onClick={() => {
                            setSelectedMood(mood.id);
                          }}
                        >
                          <Icon className="icon" />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>{mood.label}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400', lineHeight: 1.4 }}>
                              {mood.desc}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="recommendations-view">
            <div
              className="sticky-mobile-header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  className="recommendations-header"
                  style={{ marginBottom: '0' }}
                  onClick={() => {
                    setSelectedMood(null);
                    setApiMovies([]);
                    setCurrentBatchIndex(0);
                  }}
                >
                  <ArrowLeft size={28} />
                  <h2 className="recommendations-title" style={{ marginBottom: 0 }}>
                    Recommended for <span className="glow-text-primary">{selectedMood}</span>
                  </h2>
                </div>

                <div className="active-filters-summary">
                  <div className="filter-badge">
                    <Filter size={14} className="glow-text-primary" />
                    <span>{selectedEraLabel}</span>
                  </div>
                  <div className="filter-badge" title={selectedServices.join(', ')}>
                    <Tv size={14} className="glow-text-primary" />
                    <span className="truncate-text" style={{ verticalAlign: 'middle' }}>
                      {selectedServices.length === AVAILABLE_SERVICES.length ? 'All Platforms' : selectedServices.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {!isLoading && recommendations.length > 0 && (
                <button
                  className="btn-icon"
                  title="Refresh Vibe"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                  onClick={() => {
                    if ((currentBatchIndex + 1) * 5 >= apiMovies.length) {
                      setCurrentBatchIndex(0);
                    } else {
                      setCurrentBatchIndex(prev => prev + 1);
                    }
                  }}
                >
                  <RefreshCw size={20} className="glow-text-primary" />
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="no-results glass-panel animate-fade-in" style={{ padding: '5rem' }}>
                <Loader size={48} className="glow-text-primary spin-animation" style={{ marginBottom: '1rem' }} />
                <h3>Tuning into the vibe...</h3>
                <p>Fetching real-time recommendations matching your taste.</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="movies-grid animate-fade-in">
                {recommendations.map((movie, idx) => {

                  // Our ML scoring system validation
                  const scoreForMovie = (movie.genre_ids || []).reduce((total, id) => total + (preferences[GENRE_MAP[id]] || 0), 0);
                  const isTopMatch = scoreForMovie >= 2 && idx === 0; // If they watched/liked it significantly, give the top result a badge

                  // Get the release year from YYYY-MM-DD
                  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';

                  return (
                    <div
                      key={movie.id}
                      className="movie-card"
                      style={{ animationDelay: `${idx * 0.1} s` }}
                    >
                      <div className="movie-year-badge">{releaseYear}</div>
                      <img
                        src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path} `}
                        alt={movie.title}
                        className="movie-image"
                      />
                      <div className="movie-content">
                        <div className="movie-tags">
                          {movie.genre_ids && movie.genre_ids.slice(0, 2).map((gid) => {
                            const gName = GENRE_MAP[gid];
                            if (!gName) return null;
                            return <span key={gid} className="movie-tag">{gName}</span>
                          })}
                          {isTopMatch && (
                            <span className="movie-tag match-tag">🔥 Top Match</span>
                          )}
                        </div>
                        <h3 className="movie-title">{movie.title}</h3>

                        <div className="movie-rating" style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '0.75rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < Math.round((movie.vote_average || 0) / 2) ? 'var(--primary)' : 'transparent'}
                              color={i < Math.round((movie.vote_average || 0) / 2) ? 'var(--primary)' : 'rgba(255,255,255,0.3)'}
                            />
                          ))}
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.3rem', fontWeight: 500 }}>
                            {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10
                          </span>
                        </div>

                        <p className="movie-desc" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: expandedMovies[movie.id] ? 'unset' : 6,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {movie.overview}
                        </p>

                        {movie.overview && movie.overview.length > 200 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedMovies(prev => ({ ...prev, [movie.id]: !prev[movie.id] }));
                            }}
                            className="expand-desc-btn"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 0 8px 0',
                              fontSize: '0.85rem',
                              fontWeight: 500
                            }}
                          >
                            {expandedMovies[movie.id] ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Read More</>}
                          </button>
                        )}

                        <div className="movie-services">
                          {movie.services && (() => {
                            const isExpanded = expandedPlatforms[movie.id];
                            const visibleServices = isExpanded ? movie.services : movie.services.slice(0, 2);
                            const hasMore = movie.services.length > 2;

                            return (
                              <>
                                {visibleServices.map(s => (
                                  <span key={s} className="service-tag">{s}</span>
                                ))}
                                {hasMore && (
                                  <button
                                    onClick={() => setExpandedPlatforms(prev => ({ ...prev, [movie.id]: !prev[movie.id] }))}
                                    style={{
                                      background: 'rgba(0,0,0,0.05)',
                                      border: '1px solid rgba(0,0,0,0.1)',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '99px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      fontWeight: 600,
                                      marginLeft: '4px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'var(--glass-highlight)';
                                      e.currentTarget.style.color = 'var(--primary)';
                                      e.currentTarget.style.borderColor = 'var(--primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                                      e.currentTarget.style.color = 'var(--text-muted)';
                                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                                    }}
                                  >
                                    {isExpanded ? 'Less' : `+ ${movie.services.length - 2}`}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="movie-actions">
                          <button
                            className="btn-watch"
                            onClick={() => handleInteract(movie, 'watch')}
                          >
                            <Play size={18} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
                            <span style={{ verticalAlign: 'middle' }}>Watch Now</span>
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleInteract(movie, 'like')}
                            title="Like this recommendation"
                          >
                            <ThumbsUp size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="no-results glass-panel animate-fade-in">
                <Filter size={48} className="glow-text-primary" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>No movies match your exact vibe</h3>
                <p>Try expanding your streaming services or time range.</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                  <button
                    className="btn-watch"
                    style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                    onClick={() => setSelectedTimeRange('all')}
                  >
                    Clear Time Filter
                  </button>
                  <button
                    className="btn-watch"
                    style={{ width: 'auto', padding: '0.75rem 1.5rem', background: 'rgba(0,0,0,0.05)', color: '#2b2d42' }}
                    onClick={() => setSelectedServices(AVAILABLE_SERVICES)}
                  >
                    Select All Services
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {toastMessage && (
        <div key={toastMessage.id} className="toast">
          {toastMessage.msg}
        </div>
      )}
    </div>
  );
}
