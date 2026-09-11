import React, { useEffect, useState, useRef } from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';
import { usePlayerStore } from '../stores/player';
import { useNavigationStore } from '../stores/navigation';
import { useSettingsStore } from '../stores/settings';

const PlayerPage: React.FC<{ args?: any }> = ({ args }) => {
  const { navigate } = useNavigationStore();
  const { gui } = useSettingsStore();
  const {
    currentEpisode,
    episodes,
    isPlaying,
    volume,
    quality,
    currentTime,
    duration,
    showControls,
    anime4kEnabled,
    setPlaying,
    setVolume,
    setTime,
    setShowControls,
    toggleAnime4k,
    nextEpisode,
    prevEpisode,
  } = usePlayerStore();

  const [isLoading, setIsLoading] = useState(true);
  const [sources, setSources] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const animeId = args?.id;
  const title = args?.title || `Аниме #${animeId}`;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 800));
      setSources([
        { name: 'Kodik', quality: '1080p', url: '' },
        { name: 'Libria', quality: '720p', url: '' },
      ]);
      setIsLoading(false);
    };
    load();
  }, [animeId, currentEpisode]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000) as any;
  };

  return (
    <>
      <MetaInfo subTitle={`Плеер - ${title}`} />
      
      <div className="player-page" onMouseMove={handleMouseMove}>
        <div className="player-header">
          <button className="player-back" onClick={() => navigate('anime', { id: animeId, title })}>
            <AppIcon name="chevron-left" size={20} />
            Назад
          </button>
          <div className="player-title">
            <span className="player-anime-title">{title}</span>
            <span className="player-episode-title">• Эпизод {currentEpisode + 1}</span>
          </div>
          <div className="player-header-actions">
            <button className={`player-action-btn ${anime4kEnabled ? 'active' : ''}`} onClick={toggleAnime4k} title="Anime4K">
              <AppIcon name="zap" size={18} />
              4K
            </button>
            <button className="player-action-btn" title="Картинка-в-картинке">
              <AppIcon name="pip" size={18} />
            </button>
          </div>
        </div>

        <div className="player-container">
          <div className="player-video-wrapper">
            {isLoading ? (
              <div className="player-loading">
                <div className="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                <p>Загрузка плеера...</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="player-video"
                  poster={`https://picsum.photos/seed/${animeId}/1280/720`}
                  controls={false}
                />
                <div className={`player-controls ${showControls ? 'visible' : 'hidden'}`}>
                  <div className="player-timeline">
                    <div className="timeline-track">
                      <div className="timeline-progress" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                      <div className="timeline-handle" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                    </div>
                    <div className="timeline-time">
                      {formatTime(currentTime)} / {formatTime(duration || 1440)}
                    </div>
                  </div>

                  <div className="player-controls-row">
                    <div className="player-controls-left">
                      <button className="control-btn" onClick={() => setPlaying(!isPlaying)}>
                        <AppIcon name={isPlaying ? 'play' : 'play'} size={20} />
                      </button>
                      <button className="control-btn" onClick={prevEpisode}>
                        <AppIcon name="skip-back" size={18} />
                      </button>
                      <button className="control-btn" onClick={nextEpisode}>
                        <AppIcon name="skip-forward" size={18} />
                      </button>
                      <div className="volume-control">
                        <AppIcon name="volume" size={18} />
                        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="player-controls-right">
                      <button className="control-btn">Авто</button>
                      <select value={quality} onChange={() => {}} className="quality-select">
                        <option value={1080}>1080p</option>
                        <option value={720}>720p</option>
                      </select>
                      <button className="control-btn">
                        <AppIcon name="maximize" size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="player-center-play" onClick={() => setPlaying(!isPlaying)}>
                  {!isPlaying && <AppIcon name="play" size={48} />}
                </div>
              </>
            )}
          </div>

          <div className="player-sidebar">
            <div className="player-episodes-header">
              <h3>Эпизоды</h3>
              <span className="episodes-count">{episodes.length || 12} серий</span>
            </div>
            <div className="player-episodes-list">
              {Array.from({ length: episodes.length || 12 }).map((_, i) => (
                <div key={i} className={`player-episode-item ${currentEpisode === i ? 'active' : ''}`} onClick={() => usePlayerStore.getState().setEpisode(i)}>
                  <div className="episode-thumb">
                    <img src={`https://picsum.photos/seed/${animeId}${i}/160/90`} alt="" />
                    {currentEpisode === i && isPlaying && <div className="playing-indicator"><AppIcon name="play" size={12} /></div>}
                  </div>
                  <div className="episode-info">
                    <div className="episode-title">Эпизод {i + 1}</div>
                    <div className="episode-duration">24:00</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="player-sources">
              <h4>Источник</h4>
              {sources.map((s, i) => (
                <button key={i} className="source-item active">
                  <span>{s.name}</span>
                  <span className="source-quality">{s.quality}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default PlayerPage;
