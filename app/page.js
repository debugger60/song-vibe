'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { categories as fallbackCategories, editorial as fallbackEditorial, tracks as fallbackTracks } from '../lib/catalog';

const Icon = ({ name, size = 20, strokeWidth = 1.7 }) => {
  const paths = {
    play: <path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    next: <><path d="m5 6 8 6-8 6Z" fill="currentColor" stroke="none"/><path d="M17 6v12" /></>,
    prev: <><path d="m19 6-8 6 8 6Z" fill="currentColor" stroke="none"/><path d="M7 6v12" /></>,
    heart: <path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 22l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    menu: <><path d="M4 8h16M4 16h16"/></>,
    close: <><path d="m5 5 14 14M19 5 5 19"/></>,
    volume: <><path d="M11 5 6.5 9H3v6h3.5l4.5 4Z"/><path d="M15 9.5a4 4 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/></>,
    mute: <><path d="M11 5 6.5 9H3v6h3.5l4.5 4Z"/><path d="m16 10 5 5m0-5-5 5"/></>,
    shuffle: <><path d="M4 7h3.5c4 0 5 10 9 10H20M17 14l3 3-3 3"/><path d="M4 17h3.5c1.5 0 2.6-1.4 3.5-3M16.5 7H20M17 4l3 3-3 3"/></>,
    repeat: <><path d="M17 3l3 3-3 3"/><path d="M3 10V9a3 3 0 0 1 3-3h14M7 21l-3-3 3-3"/><path d="M21 14v1a3 3 0 0 1-3 3H4"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r=".7" fill="currentColor"/><circle cx="4" cy="12" r=".7" fill="currentColor"/><circle cx="4" cy="18" r=".7" fill="currentColor"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    chevron: <path d="m7 9 5 5 5-5"/>,
    spark: <><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="2.4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

function durationToSeconds(duration) {
  const [minutes, seconds] = duration.split(':').map(Number);
  return minutes * 60 + seconds;
}

function formatTime(total) {
  const value = Math.max(0, Number.isFinite(total) ? total : 0);
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

function RecordMark({ small = false }) {
  return (
    <span className={`recordMark ${small ? 'recordMark--small' : ''}`} aria-hidden="true">
      <span className="recordMark__groove" />
      <span className="recordMark__label">B</span>
    </span>
  );
}

function DustField({ count = 28 }) {
  return <div className="ambientDust" aria-hidden="true">{Array.from({ length: count }, (_, index) => (
    <i key={index} style={{
      '--x': `${(index * 37) % 100}%`,
      '--y': `${(index * 61) % 100}%`,
      '--delay': `${-(index % 13) * .73}s`,
      '--drift': `${36 + (index % 7) * 11}px`,
      '--size': `${1 + (index % 3) * .7}px`,
      '--speed': `${7 + (index % 9) * 1.4}s`,
    }} />
  ))}</div>;
}

export default function Home() {
  const [catalog, setCatalog] = useState(fallbackTracks);
  const [stations, setStations] = useState(fallbackCategories);
  const [editorial, setEditorial] = useState(fallbackEditorial);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.62);
  const [favorites, setFavorites] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [archiveFilter, setArchiveFilter] = useState('all');
  const [queueOpen, setQueueOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestTrack, setRequestTrack] = useState(fallbackTracks[0].id);
  const [requestNote, setRequestNote] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [toast, setToast] = useState('');
  const [compact, setCompact] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [time, setTime] = useState('');
  const [mediaDuration, setMediaDuration] = useState(0);
  const [sourceReady, setSourceReady] = useState(false);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const currentIndexRef = useRef(0);
  const catalogRef = useRef(fallbackTracks);
  const loadedVideoRef = useRef(null);
  const autoPlayNextRef = useRef(false);
  const repeatOneRef = useRef(false);

  const current = catalog[currentIndex] ?? catalog[0];
  const trackSeconds = mediaDuration || durationToSeconds(current?.duration ?? '0:00');
  const elapsed = progress * trackSeconds;

  currentIndexRef.current = currentIndex;
  catalogRef.current = catalog;
  repeatOneRef.current = repeatOne;

  useEffect(() => {
    Promise.all([
      fetch('/api/radio').then(r => r.ok ? r.json() : null),
      fetch('/api/favorites').then(r => r.ok ? r.json() : { favorites: [] })
    ]).then(([radio, liked]) => {
      if (radio?.tracks?.length) {
        setCatalog(radio.tracks);
        setStations(radio.categories);
        setEditorial(radio.editorial);
        const liveIndex = radio.tracks.findIndex(track => track.id === radio.nowPlaying?.id);
        if (liveIndex >= 0) setCurrentIndex(liveIndex);
      }
      setFavorites(liked?.favorites ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > window.innerHeight * 0.76);
    const onKey = event => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault(); setSearchOpen(true);
      }
      if (event.key === 'Escape') { setSearchOpen(false); setQueueOpen(false); setRequestOpen(false); setMobileNav(false); }
      if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName)) {
        event.preventDefault(); togglePlay();
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKey); };
  }, [playing]);

  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || playerRef.current || !window.YT?.Player) return;
      const first = catalogRef.current[currentIndexRef.current] ?? catalogRef.current[0];
      playerRef.current = new window.YT.Player('youtube-player', {
        width: '100%',
        height: '100%',
        videoId: first?.youtubeId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          playsinline: 1,
          rel: 0,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.href,
        },
        events: {
          onReady: event => {
            playerReadyRef.current = true;
            setSourceReady(true);
            event.target.setVolume(Math.round(volume * 100));
            const track = catalogRef.current[currentIndexRef.current] ?? catalogRef.current[0];
            if (track?.youtubeId) {
              loadedVideoRef.current = track.youtubeId;
              event.target.cueVideoById(track.youtubeId);
            }
          },
          onStateChange: event => {
            const state = event.data;
            setPlaying(state === window.YT.PlayerState.PLAYING);
            if (state === window.YT.PlayerState.ENDED) {
              if (repeatOneRef.current) {
                event.target.seekTo(0, true);
                event.target.playVideo();
              } else {
                const next = (currentIndexRef.current + 1) % catalogRef.current.length;
                autoPlayNextRef.current = true;
                currentIndexRef.current = next;
                setCurrentIndex(next);
                setRequestTrack(catalogRef.current[next].id);
                setProgress(0);
              }
            }
          },
          onError: () => {
            setToast('That source is unavailable right now — moving to the next record.');
            const next = (currentIndexRef.current + 1) % catalogRef.current.length;
            autoPlayNextRef.current = true;
            currentIndexRef.current = next;
            setCurrentIndex(next);
            setProgress(0);
          },
        },
      });
    };

    if (window.YT?.Player) createPlayer();
    else {
      const existing = document.querySelector('script[data-bside-youtube]');
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        createPlayer();
      };
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.bsideYoutube = 'true';
        document.head.appendChild(script);
      }
    }

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!playerReadyRef.current || !player?.setVolume) return;
    player.setVolume(Math.round(volume * 100));
  }, [volume]);

  useEffect(() => {
    const player = playerRef.current;
    if (!playerReadyRef.current || !current?.youtubeId || loadedVideoRef.current === current.youtubeId) return;
    loadedVideoRef.current = current.youtubeId;
    setMediaDuration(durationToSeconds(current.duration));
    if (autoPlayNextRef.current) player.loadVideoById(current.youtubeId);
    else player.cueVideoById(current.youtubeId);
    autoPlayNextRef.current = false;
  }, [current?.youtubeId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!playerReadyRef.current || !player?.getDuration) return;
      const duration = Number(player.getDuration()) || durationToSeconds(catalogRef.current[currentIndexRef.current]?.duration ?? '0:00');
      const position = Number(player.getCurrentTime()) || 0;
      if (duration > 0) {
        setMediaDuration(duration);
        setProgress(Math.min(1, position / duration));
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchOpen || queueOpen || requestOpen || mobileNav) document.body.classList.add('modalOpen');
    else document.body.classList.remove('modalOpen');
    return () => document.body.classList.remove('modalOpen');
  }, [searchOpen, queueOpen, requestOpen, mobileNav]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter(track => {
      const matchesSearch = !needle || `${track.title} ${track.artist} ${track.film} ${track.year}`.toLowerCase().includes(needle);
      const matchesFilter = archiveFilter === 'all'
        || (archiveFilter === 'favorites' && favorites.includes(track.id))
        || String(track.year).startsWith(archiveFilter);
      return matchesSearch && matchesFilter;
    });
  }, [catalog, query, archiveFilter, favorites]);

  function togglePlay() {
    const player = playerRef.current;
    if (!playerReadyRef.current || !player?.playVideo) {
      setToast('The record source is still warming up…');
      return;
    }
    if (playing) player.pauseVideo();
    else player.playVideo();
  }

  function changeTrack(nextIndex, autoPlay = playing) {
    const normalized = (nextIndex + catalog.length) % catalog.length;
    autoPlayNextRef.current = autoPlay;
    currentIndexRef.current = normalized;
    setCurrentIndex(normalized);
    setRequestTrack(catalog[normalized].id);
    setProgress(0);
    setMediaDuration(durationToSeconds(catalog[normalized].duration));
  }

  function selectTrack(id, autoPlay = true) {
    const index = catalog.findIndex(track => track.id === id);
    if (index >= 0) changeTrack(index, autoPlay);
    setSearchOpen(false);
  }

  function scrub(event) {
    const value = Number(event.target.value) / 1000;
    setProgress(value);
    const player = playerRef.current;
    if (playerReadyRef.current && player?.seekTo) player.seekTo(value * trackSeconds, true);
  }

  async function toggleFavorite(id = current.id) {
    const existed = favorites.includes(id);
    setFavorites(items => existed ? items.filter(item => item !== id) : [...items, id]);
    try {
      const response = await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId: id }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setFavorites(data.favorites);
      setToast(existed ? 'Removed from your record box.' : 'Saved to your record box.');
    } catch {
      setFavorites(items => existed ? [...items, id] : items.filter(item => item !== id));
      setToast('Could not update your record box.');
    }
  }

  async function submitRequest(event) {
    event.preventDefault();
    setRequesting(true);
    try {
      const response = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId: requestTrack, note: requestNote }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setToast(data.message);
      setRequestOpen(false);
      setRequestNote('');
    } catch (error) {
      setToast(error.message || 'The request desk is temporarily closed.');
    } finally { setRequesting(false); }
  }

  function openRequest(id = current.id) {
    setRequestTrack(id);
    setRequestOpen(true);
  }

  const liked = favorites.includes(current?.id);

  return (
    <main>
      <div className="globalFilm" aria-hidden="true"><i/><i/><i/></div>

      <header className={`siteHeader ${compact ? 'siteHeader--solid' : ''}`}>
        <a className="brand" href="#top" aria-label="The B-Side Archive home">
          <RecordMark small />
          <span className="brand__name">The B-Side Archive</span>
          <span className="brand__hindi">बिसरी हुई धुनें</span>
        </a>
        <nav className="desktopNav" aria-label="Main navigation">
          <a href="#stations">Stations</a>
          <a href="#archive">The archive</a>
          <a href="#journal">Journal</a>
          <button className="navSearch" onClick={() => setSearchOpen(true)}><Icon name="search" size={17}/> Search <kbd>/</kbd></button>
        </nav>
        <div className="headerActions">
          <button className="requestButton" onClick={() => openRequest()}>Request a record</button>
          <button className="iconButton mobileMenu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Icon name="menu" /></button>
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <picture className="hero__picture" aria-hidden="true">
          <source media="(max-width: 760px)" srcSet="/images/listening-room-mobile.jpg" />
          <img src="/images/listening-room-desktop.jpg" alt="" />
        </picture>
        <div className="hero__shade" />
        <div className="dust dust--one" aria-hidden="true" />
        <div className="dust dust--two" aria-hidden="true" />
        <DustField count={34} />
        <div className="filmBurn" aria-hidden="true" />

        <div className="hero__copy">
          <div className="hero__eyebrow"><span className="liveDot" /> LIVE FROM THE WARM SIDE OF MEMORY</div>
          <h1 id="hero-title">Songs that<br/><em>remember you.</em></h1>
          <p>Sixty full-length classics from Hindi cinema’s most tender hours — handpicked from the 1950s to the late ’70s.</p>
        </div>

        <div className="broadcastCard" aria-label="Current broadcast information">
          <div><span>NOW AIRING</span><strong>Twilight Classics</strong></div>
          <div className="broadcastCard__time"><span>LOCAL TIME</span><strong>{time}</strong></div>
          <span className="signal"><i/><i/><i/><i/></span>
        </div>

        <div className="heroPlayer" aria-label="Music player">
          <div className="trackMeta">
            <div className={`equalizer ${playing ? 'isPlaying' : ''}`} aria-hidden="true"><i/><i/><i/><i/></div>
            <div className="trackMeta__text">
              <span className="trackMeta__label">ON THE TURNTABLE · {current?.year}</span>
              <strong>{current?.title}</strong>
              <small>{current?.artist} <b>—</b> <em>{current?.film}</em></small>
            </div>
            <button className={`favoriteButton ${liked ? 'isLiked' : ''}`} onClick={() => toggleFavorite()} aria-label={liked ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={liked}>
              <Icon name="heart" size={21}/>
            </button>
          </div>
          <div className="progressWrap">
            <input className="progressRange" type="range" min="0" max="1000" value={Math.round(progress * 1000)} onChange={scrub} aria-label="Track progress" style={{'--progress': `${progress * 100}%`}} />
            <div className="timeRow"><span>{formatTime(elapsed)}</span><span>−{formatTime(trackSeconds - elapsed)}</span></div>
          </div>
          <div className="playerControls">
            <button className="controlMinor" onClick={() => changeTrack(Math.floor(Math.random() * catalog.length), true)} aria-label="Play a random record"><Icon name="shuffle" size={17}/></button>
            <button className="controlSkip" onClick={() => changeTrack(currentIndex - 1)} aria-label="Previous track"><Icon name="prev" size={23}/></button>
            <button className="playButton" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              <Icon name={playing ? 'pause' : 'play'} size={25}/>
            </button>
            <button className="controlSkip" onClick={() => changeTrack(currentIndex + 1)} aria-label="Next track"><Icon name="next" size={23}/></button>
            <button className={`controlMinor ${repeatOne ? 'isActive' : ''}`} onClick={() => setRepeatOne(value => !value)} aria-label="Repeat this record" aria-pressed={repeatOne}><Icon name="repeat" size={17}/></button>
            <div className="volumeControl">
              <Icon name={volume === 0 ? 'mute' : 'volume'} size={17}/>
              <input type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={e => setVolume(Number(e.target.value) / 100)} aria-label="Volume" style={{'--volume': `${volume * 100}%`}} />
            </div>
            <button className="queueButton" onClick={() => setQueueOpen(true)}><Icon name="list" size={17}/><span>Up next</span></button>
          </div>
        </div>

        <a className="scrollCue" href="#stations"><span>ENTER THE LISTENING ROOM</span><i><Icon name="chevron" size={15}/></i></a>
      </section>

      <section className="stationsSection" id="stations">
        <div className="paperTexture" aria-hidden="true" />
        <div className="sectionIntro reveal">
          <span className="sectionKicker">FOUR ROOMS · ONE FREQUENCY</span>
          <h2>Choose the hour<br/>you want to <em>remember.</em></h2>
          <p>No algorithms chasing your attention. Just small, human-made sets for the weather outside and the weather within.</p>
        </div>
        <div className="stationGrid">
          {stations.map((station, index) => {
            const firstTrack = catalog.find(track => track.mood === ['morning','monsoon','twilight','after-dark'][index]) ?? catalog[index];
            return (
              <article className="stationCard" key={station.id} style={{'--tint': station.tint}}>
                <div className="stationCard__number">0{index + 1}</div>
                <div className="stationCard__record"><span>{index + 1}</span></div>
                <span className="stationCard__eyebrow">{station.eyebrow}</span>
                <h3>{station.title}</h3>
                <p>{station.description}</p>
                <div className="stationCard__footer">
                  <span>{station.time}</span>
                  <button onClick={() => selectTrack(firstTrack.id, true)} aria-label={`Play ${station.title}`}><Icon name="play" size={16}/></button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="archiveSection" id="archive">
        <DustField count={22} />
        <div className="archiveHeader">
          <div>
            <span className="sectionKicker sectionKicker--light">THE KEEPER’S SHELF</span>
            <h2>Ten records.<br/><em>One warm room.</em></h2>
          </div>
          <p>Our signature selection: sepia-toned, literary and best heard when the day is nearly done.</p>
        </div>
        <div className="trackTable" role="list">
          {catalog.filter(track => track.signature).map((track, index) => (
            <div className={`trackRow ${track.id === current?.id ? 'isCurrent' : ''}`} role="listitem" key={track.id}>
              <span className="trackRow__index">{String(index + 1).padStart(2, '0')}</span>
              <button className="trackRow__play" onClick={() => selectTrack(track.id, true)} aria-label={`Play ${track.title}`}><Icon name={track.id === current?.id && playing ? 'pause' : 'play'} size={15}/></button>
              <div className="trackRow__title"><strong>{track.title}</strong><small>{track.film} · {track.year}</small></div>
              <span className="trackRow__artist">{track.artist}</span>
              <span className="trackRow__duration">{track.duration}</span>
              <button className={`trackRow__heart ${favorites.includes(track.id) ? 'isLiked' : ''}`} onClick={() => toggleFavorite(track.id)} aria-label="Save track"><Icon name="heart" size={17}/></button>
              <button className="trackRow__request" onClick={() => openRequest(track.id)}>Request</button>
            </div>
          ))}
        </div>
        <button className="browseButton" onClick={() => setSearchOpen(true)}>Browse all {catalog.length} records <Icon name="arrow" size={18}/></button>
      </section>

      <section className="sourceShelf" aria-label="Official playback source">
        <div className="sourceShelf__copy">
          <span className="sectionKicker">OFFICIAL PLAYBACK SOURCE</span>
          <h2>The film behind<br/><em>the frequency.</em></h2>
          <p>The main listening room stays uncluttered. This quiet source shelf keeps every recording connected to its official rights-holder upload.</p>
          <div><span>NOW SOURCING</span><strong>{current?.title}</strong><small>{current?.sourceChannel ?? 'Official YouTube source'}</small></div>
          <a href={`https://www.youtube.com/watch?v=${current?.youtubeId}`} target="_blank" rel="noreferrer">Open official source <Icon name="arrow" size={17}/></a>
        </div>
        <div className="sourceShelf__player">
          <div id="youtube-player" />
          {!sourceReady && <div className="sourceLoading"><RecordMark small/><span>Warming the valves…</span></div>}
        </div>
      </section>

      <section className="journalSection" id="journal">
        <div className="journalPhoto" role="img" aria-label="Close view of a vintage record player" />
        <article className="journalStory">
          <span className="sectionKicker">{editorial.issue}</span>
          <h2>{editorial.title}</h2>
          <p>{editorial.deck}</p>
          <a href="#archive">Read from the journal <Icon name="arrow" size={18}/></a>
          <span className="readTime">{editorial.readTime}</span>
        </article>
      </section>

      <section className="newsletterSection">
        <DustField count={18} />
        <RecordMark />
        <span className="sectionKicker">A LETTER, NOT A NEWSLETTER</span>
        <h2>One forgotten song,<br/>every Sunday morning.</h2>
        <form onSubmit={event => { event.preventDefault(); setToast('You’re on the Sunday listening list.'); event.currentTarget.reset(); }}>
          <label className="srOnly" htmlFor="email">Email address</label>
          <input id="email" type="email" required placeholder="your@email.com" />
          <button type="submit">Join the listening list <Icon name="arrow" size={17}/></button>
        </form>
        <small>No noise. No algorithms. Leave whenever you like.</small>
      </section>

      <footer className="siteFooter">
        <div className="footerBrand"><RecordMark small/><strong>The B-Side Archive</strong><span>बिसरी हुई धुनें</span></div>
        <p>Made for slow evenings, old souls<br/>and records that still carry fingerprints.</p>
        <div className="footerLinks"><a href="#stations">Stations</a><a href="#archive">Archive</a><a href="#journal">Journal</a><button onClick={() => openRequest()}>Requests</button></div>
        <div className="footerBase"><span>© 2026 The B-Side Archive</span><span>Playback from official YouTube / label sources · availability may vary by region</span></div>
      </footer>

      <div className={`miniPlayer ${compact ? 'miniPlayer--visible' : ''}`} aria-hidden={!compact}>
        <div className="miniPlayer__track"><div className={`equalizer ${playing ? 'isPlaying' : ''}`}><i/><i/><i/><i/></div><div><strong>{current?.title}</strong><span>{current?.artist} · {current?.year}</span></div></div>
        <div className="miniPlayer__controls"><button onClick={() => changeTrack(currentIndex - 1)} aria-label="Previous"><Icon name="prev" size={18}/></button><button className="miniPlayer__play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} size={19}/></button><button onClick={() => changeTrack(currentIndex + 1)} aria-label="Next"><Icon name="next" size={18}/></button></div>
        <div className="miniPlayer__right"><button className={liked ? 'isLiked' : ''} onClick={() => toggleFavorite()} aria-label="Save"><Icon name="heart" size={18}/></button><button onClick={() => setQueueOpen(true)}><Icon name="list" size={18}/><span>Queue</span></button></div>
        <div className="miniPlayer__progress" style={{width: `${progress * 100}%`}} />
      </div>

      {searchOpen && <div className="modalBackdrop" onMouseDown={event => event.target === event.currentTarget && setSearchOpen(false)}>
        <section className="searchModal" role="dialog" aria-modal="true" aria-label="Search the archive">
          <div className="searchModal__input"><Icon name="search" size={22}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a song, singer, film or year…"/><button onClick={() => setSearchOpen(false)}><span>ESC</span><Icon name="close" size={18}/></button></div>
          <div className="archiveFilters" aria-label="Filter the archive">
            {[['all','All 60'],['195','1950s'],['196','1960s'],['197','1970s'],['favorites','My record box']].map(([value,label]) => <button key={value} className={archiveFilter === value ? 'isActive' : ''} onClick={() => setArchiveFilter(value)}>{label}</button>)}
          </div>
          <div className="searchModal__caption">{query ? `${filtered.length} CLOSEST MATCHES` : `${filtered.length} RECORDS READY TO PLAY`}</div>
          <div className="searchResults">
            {filtered.map(track => <button key={track.id} onClick={() => selectTrack(track.id, true)}><span className="searchResults__play"><Icon name="play" size={14}/></span><span><strong>{track.title}</strong><small>{track.artist} · {track.film}</small></span><em>{track.year}</em></button>)}
            {!filtered.length && <p className="emptyState">No record found. Try a singer, film or year.</p>}
          </div>
        </section>
      </div>}

      <aside className={`queueDrawer ${queueOpen ? 'queueDrawer--open' : ''}`} aria-hidden={!queueOpen}>
        <div className="drawerHeader"><div><span>LIVE QUEUE</span><h2>Beside the turntable</h2></div><button onClick={() => setQueueOpen(false)} aria-label="Close queue"><Icon name="close"/></button></div>
        <div className="queueNow"><span>PLAYING NOW</span><strong>{current?.title}</strong><small>{current?.artist}</small></div>
        <div className="queueList">
          {[1,2,3,4,5,6].map(offset => {
            const track = catalog[(currentIndex + offset) % catalog.length];
            return <button key={`${track.id}-${offset}`} onClick={() => { selectTrack(track.id, true); setQueueOpen(false); }}><span>{String(offset).padStart(2,'0')}</span><div><strong>{track.title}</strong><small>{track.artist} · {track.year}</small></div><em>{track.duration}</em></button>;
          })}
        </div>
        <button className="drawerRequest" onClick={() => { setQueueOpen(false); openRequest(); }}>Request something else</button>
      </aside>
      {queueOpen && <button className="drawerShade" onClick={() => setQueueOpen(false)} aria-label="Close queue" />}

      {requestOpen && <div className="modalBackdrop" onMouseDown={event => event.target === event.currentTarget && setRequestOpen(false)}>
        <form className="requestModal" onSubmit={submitRequest}>
          <button className="modalClose" type="button" onClick={() => setRequestOpen(false)} aria-label="Close"><Icon name="close"/></button>
          <span className="sectionKicker">THE LISTENER’S NOTE</span>
          <h2>Place a record<br/>beside the turntable.</h2>
          <p>Tell our keeper what the room should hear next.</p>
          <label>Choose a record<select value={requestTrack} onChange={e => setRequestTrack(e.target.value)}>{catalog.map(track => <option value={track.id} key={track.id}>{track.title} — {track.artist}</option>)}</select></label>
          <label>A small dedication <span>(optional)</span><textarea maxLength="180" value={requestNote} onChange={e => setRequestNote(e.target.value)} placeholder="For the rain outside my window…"/></label>
          <button className="requestSubmit" disabled={requesting}>{requesting ? 'Placing the record…' : 'Send to the keeper'} <Icon name="arrow" size={18}/></button>
        </form>
      </div>}

      {mobileNav && <div className="mobileNavPanel">
        <div className="mobileNavTop"><div className="brand"><RecordMark small/><span className="brand__name">The B-Side Archive</span></div><button onClick={() => setMobileNav(false)}><Icon name="close"/></button></div>
        <nav><a href="#stations" onClick={() => setMobileNav(false)}><span>01</span>Stations</a><a href="#archive" onClick={() => setMobileNav(false)}><span>02</span>The archive</a><a href="#journal" onClick={() => setMobileNav(false)}><span>03</span>Journal</a><button onClick={() => {setMobileNav(false); setSearchOpen(true);}}><span>04</span>Search</button></nav>
        <button className="mobileNavRequest" onClick={() => {setMobileNav(false); openRequest();}}>Request a record <Icon name="arrow"/></button>
        <p>Songs that remember you.</p>
      </div>}

      <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status"><Icon name="spark" size={17}/>{toast}</div>
    </main>
  );
}
