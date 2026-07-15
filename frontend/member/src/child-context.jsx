import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useParentChildren } from './queries.js';

const ChildCtx = createContext(null);

const STORAGE_KEY = 'parent_selected_child';

export function ChildProvider({ children }) {
  const { data } = useParentChildren();
  const childList = data?.data || [];

  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (childList.length > 0) {
      const exists = childList.some((c) => c.id === selectedId);
      if (!exists) {
        const first = childList[0].id;
        setSelectedId(first);
        localStorage.setItem(STORAGE_KEY, first);
      }
    }
  }, [childList, selectedId]);

  const selectChild = useCallback((id) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedChild = childList.find((c) => c.id === selectedId) || null;

  return (
    <ChildCtx.Provider value={{ childList, selectedChild, selectedId, selectChild }}>
      {children}
    </ChildCtx.Provider>
  );
}

export const useChild = () => useContext(ChildCtx);
