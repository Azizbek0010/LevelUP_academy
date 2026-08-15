import { useState } from 'react';
import { Bell, MessageSquareText, User, Star, Wallet, Check, LogOut, Send, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import Avatar from '../components/Avatar.jsx';
import { fmt } from '../format.js';
import { api } from '../api.js';
import { C, HUES, IconTile, PageHeader, Panel } from '../student/components/ui.jsx';
import { useI18n } from '../i18n.jsx';

/**
 * FE-PARENT-PROFILE-PREF: этих настроек нет ни в одной таблице на бэке, и
 * реального push-уведомления (service worker/VAPID) в проекте тоже нет — это
 * чисто клиентские переключатели ("звук чата в этом браузере"), поэтому
 * персистим в localStorage, а не изобретаем бэкенд под несуществующую фичу.
 */
function usePreference(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw === null ? defaultValue : raw === 'true';
  });
  const toggle = () => {
    setValue((v) => {
      localStorage.setItem(key, String(!v));
      return !v;
    });
  };
  return [value, toggle];
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className="k-press-sm relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: checked ? C.lime : C.line }}
    >
      <span
        className="absolute top-1 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          left: checked ? 24 : 4,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(18,25,14,0.25)',
        }}
      />
    </button>
  );
}

function SettingRow({ icon: Icon, hue, title, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <IconTile icon={Icon} hue={hue} size={38} />
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold" style={{ color: C.text }}>{title}</p>
          <p className="text-[12px] font-semibold mt-0.5" style={{ color: C.muted }}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const { t } = useI18n();
  const { user, token, logout } = useAuth();
  const { selectedChild } = useChild();
  const [notifyPush, toggleNotifyPush] = usePreference('pref_notify_push', true);
  const [chatSound, toggleChatSound] = usePreference('pref_chat_sound', false);

  const [tg, setTg] = useState({ status: 'idle', deepLink: null, error: null });
  const onBindTelegram = async () => {
    setTg({ status: 'loading', deepLink: null, error: null });
    try {
      const res = await api.telegramBindToken(token);
      setTg({ status: 'ready', deepLink: res.data.deepLink, error: null });
    } catch (err) {
      setTg({ status: 'error', deepLink: null, error: err.message || t('prof.tgError') });
    }
  };

  return (
    <>
      <PageHeader title={t('prof.title')} subtitle={t('prof.subtitle')} />

      {/* ══ Профиль родителя ══ */}
      <div
        className="p-5 sm:p-6 mb-4 relative overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #21391A 0%, #142A0F 100%)' }}
      >
        <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden="true" />
        <span className="absolute right-20 -bottom-12 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size={64} />
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full grid place-items-center"
              style={{ background: C.lime, border: '2px solid #142A0F' }}
            >
              <Check size={12} strokeWidth={3} color="#fff" />
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[20px] font-extrabold text-white truncate">{user?.firstName} {user?.lastName}</h2>
            <p className="text-[12.5px] font-semibold mt-0.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <User size={13} strokeWidth={2.4} />
              {t('common.role.parent')}
            </p>
            {user?.loginCode && (
              <p className="text-[11.5px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {t('prof.code', { code: user.loginCode })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ══ Ребёнок ══ */}
      {selectedChild && (
        <div className="mb-4">
          <Panel icon={User} title={t('prof.child')} hue="violet">
            <div
              className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: `${C.violet}0a`, border: `1px solid ${C.violet}26` }}
            >
              <Avatar name={`${selectedChild.firstName} ${selectedChild.lastName}`} size={42} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold truncate" style={{ color: C.text }}>
                  {selectedChild.firstName} {selectedChild.lastName}
                </p>
                <p className="text-[12px] font-semibold mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: C.muted }}>
                  <span className="flex items-center gap-1">
                    <Star size={12} strokeWidth={2.4} style={{ color: HUES.amber }} />
                    {fmt(selectedChild.coins)}
                  </span>
                  <span className="opacity-50">·</span>
                  {Number(selectedChild.totalDebt) > 0 ? (
                    <span className="flex items-center gap-1" style={{ color: C.coral }}>
                      <Wallet size={12} strokeWidth={2.4} />
                      {t('prof.debt')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1" style={{ color: C.limeDk }}>
                      <Check size={12} strokeWidth={2.6} />
                      {t('prof.noDebt')}
                    </span>
                  )}
                </p>
              </div>
              <span
                className="text-[10.5px] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: `${C.lime}1c`, color: C.limeDk }}
              >
                {t('prof.active')}
              </span>
            </div>
          </Panel>
        </div>
      )}

      {/* ══ Настройки ══ */}
      <div className="mb-4">
        <Panel icon={Bell} title={t('prof.settings')} hue="blue">
          <div className="divide-y" style={{ borderColor: C.line }}>
            <SettingRow icon={Bell} hue="blue" title={t('prof.notifications')} sub={t('prof.notificationsSub')}>
              <Toggle checked={notifyPush} onChange={toggleNotifyPush} />
            </SettingRow>
            <SettingRow icon={MessageSquareText} hue="teal" title={t('prof.chatSound')} sub={t('prof.chatSoundSub')}>
              <Toggle checked={chatSound} onChange={toggleChatSound} />
            </SettingRow>
          </div>
        </Panel>
      </div>

      {/* ══ Telegram ══ */}
      <div className="mb-4">
        <Panel icon={MessageSquareText} title={t('prof.telegram')} hue="violet">
          <p className="text-[12.5px] font-semibold mb-3" style={{ color: C.muted }}>{t('prof.telegramDesc')}</p>
          {tg.status !== 'ready' ? (
            <button
              className="k-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-bold"
              style={{ background: HUES.violet, color: '#fff', boxShadow: `0 4px 12px ${HUES.violet}3d` }}
              onClick={onBindTelegram}
              disabled={tg.status === 'loading'}
            >
              <Send size={15} strokeWidth={2.4} />
              {tg.status === 'loading' ? t('common.loading') : t('prof.bind')}
            </button>
          ) : (
            <a
              href={tg.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="k-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-bold"
              style={{ background: HUES.violet, color: '#fff', boxShadow: `0 4px 12px ${HUES.violet}3d` }}
            >
              {t('prof.openTg')} <ChevronRight size={15} strokeWidth={2.6} />
            </a>
          )}
          {tg.status === 'error' && (
            <p className="text-[12.5px] font-bold mt-3" style={{ color: C.coral }}>{tg.error}</p>
          )}
        </Panel>
      </div>

      {/* ══ Выход ══ */}
      <div className="k-card">
        <button
          className="k-press w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13.5px] font-bold"
          style={{ background: `${C.coral}14`, color: C.coral }}
          onClick={logout}
        >
          <LogOut size={16} strokeWidth={2.4} />
          {t('prof.logout')}
        </button>
      </div>
    </>
  );
}
