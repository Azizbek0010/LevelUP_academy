import { createContext, useContext } from 'react';
import { useParentChildren } from './queries.js';

const ChildCtx = createContext(null);

export function ChildProvider({ children }) {
  const { data } = useParentChildren();
  const childList = data?.data || [];
  const selectedChild = childList[0] || null;
  const selectedId = selectedChild?.id || null;

  return (
    <ChildCtx.Provider value={{ childList, selectedChild, selectedId, selectChild: () => {} }}>
      {children}
    </ChildCtx.Provider>
  );
}

export const useChild = () => useContext(ChildCtx);
