import React, { useState, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { createDefaultParentConfig } from './mockData';
import { getTheme, TASK_MENU } from './studentThemes';
import { applyColorMode, getSurfaceBg, syncDocumentTheme, useColorMode } from './colorMode';
import StudentWorkspace from './StudentWorkspace';
import ParentDebugPanel from './ParentDebugPanel';
import CoinCounter from './CoinCounter';
import CoinEarnGuide from './CoinEarnGuide';
import CoinRewardsPanel from './CoinRewardsPanel';
import StreakWidget from './StreakWidget';
import ColorModeToggle from './ColorModeToggle';
import SpeechVoiceHeaderMenu from './SpeechVoiceHeaderMenu';
import { VoicePreferencesProvider } from './VoicePreferencesContext';
import { SpeechProvider } from './SpeechContext';
import { loadAllAsList, recordWrongWord } from './wrongWordStore';
import { loadAllAsList as loadWrongAnswers, clearByTask } from './wrongAnswerStore';
import { loadStreakState, claimStreakToday } from './streakStore';
import { useAuth } from './auth/AuthContext';
import { makeDisplayText } from './chineseScript';
import { LearningAnalyticsProvider } from './context/LearningAnalyticsContext';
import { BilingualLabel } from './BilingualLabel';
import { STUDENT_THEME_LABELS } from './studentI18n';

const LANGUAGE_STORAGE = 'xinghang_ui_language';

function loadLanguage() {
  try {
    const v = localStorage.getItem(LANGUAGE_STORAGE);
    if (v === 'zh-HK' || v === 'zh-CN') return v;
  } catch { /* ignore */ }
  return 'zh-HK';
}

export default function DashboardDemo() {
  const { profile, logout, busy: authBusy, postLoginRoute } = useAuth();
  const [parentConfig, setParentConfig] = useState(createDefaultParentConfig);

  const [language, setLanguage] = useState(loadLanguage);
  const { mode, isNight } = useColorMode();

  // ── 打卡連擊（含護盾） ──
  const [streakState, setStreakState] = useState(loadStreakState);

  const [coins, setCoins] = useState(120);
  const [coinFloat, setCoinFloat] = useState(null);
  const [coinDeducting, setCoinDeducting] = useState(false);
  const [ownedRewards, setOwnedRewards] = useState([]);
  const [showCoinPanel, setShowCoinPanel] = useState(false);
  const [wrongWordReminders, setWrongWordReminders] = useState([]);
  const [wrongAnswerReviews, setWrongAnswerReviews] = useState([]);

  /** 兌換事件 — 同步至家長端後台 */
  const [parentRedemptions, setParentRedemptions] = useState([]);

  useEffect(() => {
    setWrongWordReminders(loadAllAsList());
    setWrongAnswerReviews(loadWrongAnswers());
  }, []);

  /** 護盾自動消耗提示 — 5 秒後淡出，避免長期佔位 */
  useEffect(() => {
    if (!streakState.shieldUsedNotice) return undefined;
    const t = setTimeout(() => {
      setStreakState((s) => ({ ...s, shieldUsedNotice: null }));
    }, 5000);
    return () => clearTimeout(t);
  }, [streakState.shieldUsedNotice]);

  const handleRecordWrong = useCallback((entry) => {
    setWrongWordReminders(recordWrongWord(entry));
  }, []);

  const handleRecordWrongAnswer = useCallback(() => {
    setWrongAnswerReviews(loadWrongAnswers());
  }, []);

  const handleClearWrongAnswers = useCallback((taskId) => {
    setWrongAnswerReviews(clearByTask(taskId));
  }, []);

  const { studentType, activeTask } = parentConfig;
  const baseTheme = getTheme(studentType);
  const theme = applyColorMode(baseTheme, mode);
  const surfaces = getSurfaceBg(mode);
  const isSEN = studentType === 'sen';
  const isNCS = studentType === 'ncs';
  const dt = useMemo(() => makeDisplayText(language, studentType), [language, studentType]);

  /** 同步色彩模式至 <html>；日間由 syncDocumentTheme 內 paintDaySurfaces 處理 */
  useLayoutEffect(() => {
    syncDocumentTheme({ colorMode: mode, isSEN });
  }, [mode, isSEN]);

  const awardCoins = useCallback((amount) => {
    setCoins((c) => c + amount);
    const id = Date.now();
    setCoinFloat({ amount, id });
    setTimeout(() => setCoinFloat(null), 1200);
  }, []);

  const handleStreakClaim = useCallback(() => {
    setStreakState((prev) => claimStreakToday(prev));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      /* 錯誤已由 AuthContext 處理 */
    }
  }, [logout]);

  const [parentPanelOpen, setParentPanelOpen] = useState(false);

  /** 返回學習首頁 — 預設科目 + 關閉浮層 + 收起家長端 + 捲回主畫面 */
  const goHome = useCallback(() => {
    setShowCoinPanel(false);
    setParentPanelOpen(false);
    setParentConfig((prev) => ({
      ...prev,
      activeTask: createDefaultParentConfig().activeTask,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const returnToStudyArea = useCallback(() => {
    setParentPanelOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const assignTask = useCallback((taskId) => {
    setParentConfig((prev) => ({ ...prev, activeTask: taskId }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /** 顯示名稱：Google 姓名或 Email 前綴 */
  const displayName = profile?.displayName ?? '星航用戶';
  const roleLabelZh = profile?.userRole === 'student' ? '學生端' : '家長端';
  const roleLabelEn = profile?.userRole === 'student' ? 'Student' : 'Parent';
  const themeLabels = STUDENT_THEME_LABELS[studentType] ?? { zh: theme.label, en: theme.label };
  const avatarUrl = profile?.avatarUrl;

  /** 金幣兌換 — 扣款動畫 + 家長通知 */
  const handleRedeem = useCallback((reward) => {
    if (ownedRewards.includes(reward.id)) return false;
    if (coins < reward.cost) return false;

    setCoinDeducting(true);
    setCoins((c) => c - reward.cost);
    setOwnedRewards((prev) => [...prev, reward.id]);

    setParentRedemptions((prev) => [
      {
        id: Date.now(),
        rewardId: reward.id,
        name: reward.name,
        cost: reward.cost,
        at: new Date().toLocaleString('zh-HK'),
      },
      ...prev,
    ].slice(0, 10));

    setTimeout(() => setCoinDeducting(false), 650);
    return true;
  }, [coins, ownedRewards]);

  return (
    <LearningAnalyticsProvider
      parentConfig={parentConfig}
      onWrongAnswerReviewsChange={setWrongAnswerReviews}
      studentName={displayName.includes('同學') ? displayName : `${displayName.split(/\s+/)[0]}同學`}
    >
    <VoicePreferencesProvider studentType={studentType} language={language}>
      <SpeechProvider studentType={studentType} isSEN={isSEN} language={language}>
    <div
      className={`xh-app-shell min-h-screen font-sans transition-colors duration-500 ${theme.shell}`}
      style={{ backgroundColor: surfaces.shell }}
    >

      <header
        className={`xh-app-header sticky top-0 z-[70] flex items-center justify-between px-6 py-4 border-b overflow-visible transition-colors duration-500 ${theme.header}`}
        style={{ backgroundColor: surfaces.header }}
      >
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={goHome}
            title={dt('返回學習首頁')}
            className={`font-black tracking-wider text-left hover:opacity-90 transition-opacity ${isNight ? 'text-amber-300' : 'text-amber-100'} ${isSEN ? 'text-2xl' : 'text-xl'}`}
          >
            <BilingualLabel
              zh={dt('星航中文')}
              en="Xinghang Chinese"
              size={isSEN ? 'lg' : 'md'}
              className={`font-black tracking-wider ${isNight ? '[&_span:first-child]:text-amber-300 [&_span:last-child]:text-amber-400/70' : '[&_span:first-child]:text-amber-100 [&_span:last-child]:text-amber-200/70'}`}
            />
          </button>
          <span className={`px-3 py-1 rounded-full font-bold border ${theme.badge} ${isSEN ? 'text-sm' : 'text-xs'}`}>
            <BilingualLabel zh={dt('小六 呈分試特訓')} en="P6 SSPA Training" size="sm" center />
          </span>
          <span className={`px-2 py-0.5 rounded-full font-bold border opacity-80 ${theme.badge} text-xs`}>
            <BilingualLabel zh={themeLabels.zh} en={themeLabels.en} size="sm" center />
          </span>
        </div>

        <div className={`flex items-center ${isSEN ? 'gap-4' : 'gap-3'}`}>
          <StreakWidget
            streakCount={streakState.streakCount}
            streakClaimed={streakState.claimedToday}
            streakShields={streakState.streakShields ?? 0}
            weekCheckIns={streakState.weekCheckIns}
            checkInDates={streakState.checkInDates ?? []}
            shieldNotice={streakState.shieldUsedNotice}
            isSEN={isSEN}
            isNight={isNight}
            onClaim={handleStreakClaim}
          />

          <div className="relative flex items-center gap-1.5">
            <CoinCounter
              coins={coins}
              floatingDelta={coinFloat}
              isDeducting={coinDeducting}
              isSEN={isSEN}
              isNight={isNight}
              ownedCount={ownedRewards.length}
              onClick={() => setShowCoinPanel((v) => !v)}
            />
            <CoinEarnGuide isSEN={isSEN} isNight={isNight} />
          </div>
        </div>

        <div className={`flex items-center ${isSEN ? 'gap-3' : 'gap-2'}`}>
          <ColorModeToggle isSEN={isSEN} />
          <button
            type="button"
            onClick={goHome}
            title={dt('返回學習首頁')}
            className={`rounded-lg border font-bold transition-colors duration-300
              ${isNight
                ? 'border-amber-600/60 bg-stone-800 text-amber-200 hover:bg-stone-700'
                : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'}
              ${isSEN ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'}`}
          >
            {dt('🏠 首頁')}
            <span className="block text-[9px] font-normal opacity-70">Home</span>
          </button>
          {activeTask && (
            <SpeechVoiceHeaderMenu
              isSEN={isSEN}
              isNight={isNight}
              theme={theme}
              task={activeTask}
            />
          )}
          <select
            value={language}
            onChange={(e) => {
              const next = e.target.value;
              setLanguage(next);
              try { localStorage.setItem(LANGUAGE_STORAGE, next); } catch { /* ignore */ }
            }}
            className={`p-2 rounded-lg border font-bold transition-colors duration-300 ${theme.select} ${isSEN ? 'text-sm' : 'text-xs'}`}
          >
            <option value="zh-HK">繁體中文 (HK)</option>
            <option value="zh-CN">简体中文 (CN)</option>
          </select>
          <button
            type="button"
            onClick={handleLogout}
            disabled={authBusy}
            title={profile?.email ?? ''}
            className={`rounded-lg border font-bold transition-colors duration-300
              ${isNight
                ? 'border-stone-500 bg-stone-800 text-amber-200 hover:bg-stone-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}
              ${isSEN ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'}
              disabled:opacity-50`}
          >
            {authBusy ? dt('登出中…') : dt('登出')}
            {!authBusy && <span className="block text-[9px] font-normal opacity-70">Log out</span>}
          </button>
        </div>
      </header>

      <div
        className={`flex flex-col lg:flex-row min-w-0 transition-colors duration-500 ${parentPanelOpen ? 'pb-[min(520px,52vh)]' : 'pb-16'}`}
      >
        <aside
          className={`xh-app-sidebar hidden lg:block w-72 shrink-0 min-h-[calc(100vh-4.5rem)] p-4 border-r transition-colors duration-500 ${theme.sidebar}`}
          style={{ backgroundColor: surfaces.sidebar }}
        >
          <div
            className={`p-4 rounded-xl mb-6 flex items-center space-x-3 shadow-sm border ${theme.card}`}
            style={{ backgroundColor: surfaces.card }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/60"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-white text-lg shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className={`font-bold opacity-70 space-y-0.5 ${isSEN ? 'text-sm' : 'text-xs'}`}>
                <BilingualLabel
                  zh={dt(roleLabelZh)}
                  en={roleLabelEn}
                  size="sm"
                />
                {postLoginRoute === 'student' && (
                  <BilingualLabel zh={dt('沉浸模式')} en="Focus Mode" size="sm" />
                )}
              </div>
              <p className={`font-black truncate ${isSEN ? 'text-base' : 'text-sm'}`} title={profile?.email}>
                {displayName}
                {ownedRewards.includes('badge') && <span className="ml-1">🌟</span>}
              </p>
            </div>
          </div>

          <BilingualLabel
            zh={dt('📌 家長指派科目（自動同步）')}
            en="Parent-assigned tasks (auto-synced)"
            size="sm"
            className="opacity-50 mb-2 px-1"
          />

          <nav className={`space-y-2 ${isSEN ? 'space-y-3' : ''}`}>
            {TASK_MENU.map((need) => {
              const isActive = activeTask === need.id;
              return (
                <button
                  key={need.id}
                  type="button"
                  onClick={() => assignTask(need.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between rounded-xl transition-all duration-300 border-2 text-left
                    ${isSEN ? 'p-4' : 'p-3'}
                    ${isActive
                      ? `${theme.navActive} font-black shadow-sm scale-[1.02]`
                      : `${theme.navIdle} opacity-80 hover:opacity-100 hover:scale-[1.01]`}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isSEN ? 'text-2xl' : 'text-xl'}>{need.icon}</span>
                    <div>
                      <span className={`block font-bold ${isSEN ? 'text-base' : 'text-sm'}`}>{dt(need.label)}</span>
                      <span className="text-[10px] block opacity-70 font-mono">{need.sub}</span>
                    </div>
                  </div>
                  {isActive && <span className="text-xs font-black">●</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          className="xh-app-main flex-1 min-w-0 p-3 sm:p-4 lg:p-8 transition-all duration-500"
          style={{ backgroundColor: surfaces.main }}
        >
          <div
            className={`xh-app-card max-w-6xl mx-auto rounded-2xl transition-all duration-500 ${theme.card} ${isSEN ? 'p-4 sm:p-6 lg:p-8' : 'p-3 sm:p-4 lg:p-6'}`}
            style={{ backgroundColor: surfaces.card }}
          >
              <StudentWorkspace
                parentConfig={parentConfig}
                language={language}
                theme={theme}
                onAwardCoins={awardCoins}
                wrongWordReminders={wrongWordReminders}
                wrongAnswerReviews={wrongAnswerReviews}
                onRecordWrong={handleRecordWrong}
                onRecordWrongAnswer={handleRecordWrongAnswer}
                onClearWrongAnswers={handleClearWrongAnswers}
                onGoHome={goHome}
                onSwitchTask={assignTask}
              />
          </div>
        </main>
      </div>

      {showCoinPanel && (
        <CoinRewardsPanel
          coins={coins}
          ownedRewards={ownedRewards}
          onRedeem={handleRedeem}
          onClose={() => setShowCoinPanel(false)}
          isSEN={isSEN}
          isNight={isNight}
        />
      )}

      <ParentDebugPanel
        parentConfig={parentConfig}
        onConfigChange={setParentConfig}
        wrongWordReminders={wrongWordReminders}
        onWrongWordsChange={setWrongWordReminders}
        parentRedemptions={parentRedemptions}
        isOpen={parentPanelOpen}
        onOpenChange={setParentPanelOpen}
        onGoHome={goHome}
        onReturnToStudy={returnToStudyArea}
      />
    </div>
      </SpeechProvider>
    </VoicePreferencesProvider>
    </LearningAnalyticsProvider>
  );
}
