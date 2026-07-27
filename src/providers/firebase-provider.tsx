'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const FirebaseContext = createContext<{ ready: boolean }>({ ready: true });
export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(true);

  return <FirebaseContext.Provider value={{ ready }}>{children}</FirebaseContext.Provider>;
}
