import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'neutron_workflow_project';
const MAX_HISTORY = 50;

interface WorkflowSnapshot {
  tags: any[];
  connections: any[];
  nextId: number;
}

function loadSaved(): WorkflowSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (!Array.isArray(parsed.tags) || !Array.isArray(parsed.connections)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (typeof parsed.nextId !== 'number' || parsed.nextId < 0) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveToStorage(tags: any[], connections: any[], nextId: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tags, connections, nextId }));
  } catch { /* quota exceeded */ }
}

export function useWorkflowHistory(initialTags: any[], initialConnections: any[], initialNextId: number) {
  const saved = useRef(loadSaved());

  const [tags, setTags] = useState<any[]>(() => {
    const s = saved.current?.tags;
    return Array.isArray(s) ? s : initialTags;
  });
  const [connections, setConnections] = useState<any[]>(() => {
    const s = saved.current?.connections;
    return Array.isArray(s) ? s : initialConnections;
  });
  const [nextId, setNextId] = useState<number>(() => {
    const s = saved.current?.nextId;
    return typeof s === 'number' ? s : initialNextId;
  });

  const historyRef = useRef<WorkflowSnapshot[]>([]);
  const futureRef = useRef<WorkflowSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback(() => {
    const snapshot: WorkflowSnapshot = {
      tags: JSON.parse(JSON.stringify(tags)),
      connections: JSON.parse(JSON.stringify(connections)),
      nextId,
    };
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), snapshot];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [tags, connections, nextId]);

  const setTagsTracked = useCallback((updater: any) => {
    setTags(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const next = typeof updater === 'function' ? updater(safePrev) : updater;
      pushHistory();
      return Array.isArray(next) ? next : safePrev;
    });
  }, [pushHistory]);

  const setConnectionsTracked = useCallback((updater: any) => {
    setConnections(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const next = typeof updater === 'function' ? updater(safePrev) : updater;
      pushHistory();
      return Array.isArray(next) ? next : safePrev;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const current: WorkflowSnapshot = {
      tags: JSON.parse(JSON.stringify(tags)),
      connections: JSON.parse(JSON.stringify(connections)),
      nextId,
    };
    futureRef.current = [...futureRef.current, current];

    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);

    setTags(Array.isArray(prev.tags) ? prev.tags : []);
    setConnections(Array.isArray(prev.connections) ? prev.connections : []);
    setNextId(typeof prev.nextId === 'number' ? prev.nextId : 0);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  }, [tags, connections, nextId]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const current: WorkflowSnapshot = {
      tags: JSON.parse(JSON.stringify(tags)),
      connections: JSON.parse(JSON.stringify(connections)),
      nextId,
    };
    historyRef.current = [...historyRef.current, current];

    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);

    setTags(Array.isArray(next.tags) ? next.tags : []);
    setConnections(Array.isArray(next.connections) ? next.connections : []);
    setNextId(typeof next.nextId === 'number' ? next.nextId : 0);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  }, [tags, connections, nextId]);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage(tags, connections, nextId);
    }, 500);
    return () => clearTimeout(timer);
  }, [tags, connections, nextId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToStorage(tags, connections, nextId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, tags, connections, nextId]);

  // Force save on tab close or visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToStorage(tags, connections, nextId);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToStorage(tags, connections, nextId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tags, connections, nextId]);

  const clearSaved = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const loadSnapshot = useCallback((snapshot: WorkflowSnapshot) => {
    pushHistory();
    setTags(Array.isArray(snapshot.tags) ? snapshot.tags : []);
    setConnections(Array.isArray(snapshot.connections) ? snapshot.connections : []);
    setNextId(typeof snapshot.nextId === 'number' ? snapshot.nextId : 0);
  }, [pushHistory]);

  return {
    tags, setTags: setTagsTracked,
    connections, setConnections: setConnectionsTracked,
    nextId, setNextId,
    undo, redo, canUndo, canRedo,
    clearSaved, loadSnapshot,
  };
}
