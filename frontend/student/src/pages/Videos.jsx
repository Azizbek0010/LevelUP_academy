import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, Modal, Pill } from '../components/ui.jsx';
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
      <PageHeader title="Видеоуроки" subtitle="Записи занятий твоих групп" />

      {!list ? (
        <Skeleton h={72} count={4} />
      ) : list.length === 0 ? (
        <div className="card bg-base-100">
          <EmptyState icon={PlayCircle} title="Видео пока нет" text="Записи появятся после занятий." />
        </div>
      ) : (
        <div className="card bg-base-100 divide-y divide-base-200">
          {list.map((v) => (
            <div
              key={v.id}
              role="button"
              tabIndex={0}
              onClick={() => play(v)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && play(v)}
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-base-200/60 transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <PlayCircle size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{v.title}</div>
                <div className="text-xs text-base-content/45 mt-0.5">{fmtDate(v.created_at)}</div>
              </div>
              {v.duration_sec > 0 && <Pill tone="muted" className="tabular-nums">{fmtDuration(v.duration_sec)}</Pill>}
            </div>
          ))}
        </div>
      )}

      {playing && (
        <Modal title={playing.video.title} onClose={() => setPlaying(null)}>
          {/* presigned GET живёт ограниченное время — плеер открываем сразу */}
          <video className="w-full rounded-xl bg-black max-h-[60vh]" src={playing.streamUrl} controls autoPlay />
        </Modal>
      )}
    </>
  );
}
