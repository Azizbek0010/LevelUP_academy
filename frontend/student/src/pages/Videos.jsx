import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Skeleton, EmptyState, Modal } from '../components/ui.jsx';
import { fmtDate, fmtDuration } from '../format.js';

export default function Videos() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [playing, setPlaying] = useState(null); // { video, streamUrl }

  useEffect(() => {
    api
      .videos()
      .then((d) => setList(d.data))
      .catch((err) => toast(err.message, 'error'));
  }, [toast]);

  const play = async (video) => {
    try {
      const d = await api.videoStreamUrl(video.id);
      setPlaying({ video, streamUrl: d.data.streamUrl });
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Видеоуроки</h1>
          <p>Записи занятий твоих групп</p>
        </div>
      </div>

      {!list ? (
        <Skeleton h={72} count={4} />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon={PlayCircle} title="Видео пока нет" text="Записи появятся после занятий." />
        </div>
      ) : (
        <div className="card">
          {list.map((v) => (
            <div key={v.id} className="row row--clickable" onClick={() => play(v)}>
              <div className="avatar" style={{ borderRadius: 10 }}>
                <PlayCircle size={17} />
              </div>
              <div className="row__body">
                <div className="row__title">{v.title}</div>
                <div className="row__sub">{fmtDate(v.created_at)}</div>
              </div>
              {v.duration_sec > 0 && <span className="pill pill--muted num">{fmtDuration(v.duration_sec)}</span>}
            </div>
          ))}
        </div>
      )}

      {playing && (
        <Modal title={playing.video.title} onClose={() => setPlaying(null)}>
          {/* presigned GET живёт ограниченное время — плеер открываем сразу */}
          <video className="video-player" src={playing.streamUrl} controls autoPlay />
        </Modal>
      )}
    </>
  );
}
