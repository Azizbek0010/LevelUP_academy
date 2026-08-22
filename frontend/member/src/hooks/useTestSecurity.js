import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../student/components/toast.jsx';
import { useI18n } from '../i18n/index.jsx';

const STORAGE_KEY = (testId) => `test_${testId}_answers`;
const STARTED_KEY = (testId) => `test_${testId}_started`;

export function useTestSecurity({ testId, phase, endsAt, answers, submit, onExit }) {
  const toast = useToast();
  const { t } = useI18n();

  const [showExitModal, setShowExitModal] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const visibilityTimer = useRef(null);
  const submittedRef = useRef(false);

  const saveAnswers = useCallback(() => {
    if (!testId || !answers.length) return;
    try {
      localStorage.setItem(STORAGE_KEY(testId), JSON.stringify({
        answers,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Auto-save failed:', e);
    }
  }, [testId, answers]);

  const loadSavedAnswers = useCallback(() => {
    if (!testId) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY(testId));
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Load saved answers failed:', e);
    }
    return null;
  }, [testId]);

  const clearSavedAnswers = useCallback(() => {
    if (!testId) return;
    localStorage.removeItem(STORAGE_KEY(testId));
    localStorage.removeItem(STARTED_KEY(testId));
  }, [testId]);

  const markTestStarted = useCallback(() => {
    if (!testId) return;
    localStorage.setItem(STARTED_KEY(testId), 'true');
  }, [testId]);

  const isTestStarted = useCallback(() => {
    if (!testId) return false;
    return localStorage.getItem(STARTED_KEY(testId)) === 'true';
  }, [testId]);

  useEffect(() => {
    autoSaveTimer.current = setInterval(saveAnswers, 10_000);
    return () => clearInterval(autoSaveTimer.current);
  }, [saveAnswers]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = document.fullscreenElement !== null;
      setIsFullscreen(fs);
      if (fs && phase === 'taking') {
        document.exitFullscreen().catch(() => {});
        toast(t.testTake.fullscreenBlocked, 'warning');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [phase, toast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isPrintScreen = e.key === 'PrintScreen';
      const isCtrlP = e.ctrlKey && e.key === 'p';
      const isF12 = e.key === 'F12';
      const isCtrlShiftI = e.ctrlKey && e.shiftKey && e.key === 'I';
      const isCtrlShiftC = e.ctrlKey && e.shiftKey && e.key === 'C';
      const isCtrlU = e.ctrlKey && e.key === 'u';
      const isCtrlS = e.ctrlKey && e.key === 's';
      const isF11 = e.key === 'F11';

      if (phase === 'taking' && (isPrintScreen || isCtrlP || isF12 || isCtrlShiftI || isCtrlShiftC || isCtrlU || isCtrlS || isF11)) {
        e.preventDefault();
        e.stopPropagation();
        if (isPrintScreen || isCtrlP) {
          toast(t.testTake.screenshotBlocked, 'warning');
        }
        return false;
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [phase, toast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (phase !== 'taking' || submittedRef.current) return;

      if (document.visibilityState === 'hidden') {
        setTabSwitchCount((c) => c + 1);
        clearTimeout(visibilityTimer.current);
        visibilityTimer.current = setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            toast(t.testTake.tabSwitchWarning, 'warning');
          }
        }, 3000);
      } else {
        clearTimeout(visibilityTimer.current);
      }
    };

    const handlePageHide = () => {
      if (phase === 'taking' && !submittedRef.current) {
        saveAnswers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      clearTimeout(visibilityTimer.current);
    };
  }, [phase, saveAnswers, toast]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (phase === 'taking' && !submittedRef.current) {
        e.preventDefault();
        e.returnValue = t.testTake.beforeUnloadWarning;
        return t.testTake.beforeUnloadWarning;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  const handleExitClick = useCallback(() => {
    if (phase === 'intro') {
      setShowExitModal(true);
    }
  }, [phase]);

  const confirmExit = useCallback(async () => {
    if (phase === 'intro') {
      markTestStarted();
      setShowExitModal(false);
      onExit?.();
    }
  }, [phase, markTestStarted, onExit]);

  const cancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  const handleSubmit = useCallback(async (auto = false) => {
    submittedRef.current = true;
    await submit(auto);
    if (!auto) {
      clearSavedAnswers();
    }
  }, [submit, clearSavedAnswers]);

  return {
    showExitModal,
    tabSwitchCount,
    isFullscreen,
    saveAnswers,
    loadSavedAnswers,
    clearSavedAnswers,
    markTestStarted,
    isTestStarted,
    handleExitClick,
    confirmExit,
    cancelExit,
    handleSubmit,
    setSubmittedRef: (v) => { submittedRef.current = v; },
  };
}