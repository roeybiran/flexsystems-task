"use client";

import { type ReactNode, useState } from "react";
import { Provider } from "react-redux";
import { AppRuntimeGuards } from "@/app/components/AppRuntimeGuards";
import { FavoritesPersistence } from "@/app/components/FavoritesPersistence";
import { makeStore, type AppStore } from "@/store";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [store] = useState<AppStore>(() => makeStore());

  return (
    <Provider store={store}>
      <AppRuntimeGuards />
      <FavoritesPersistence />
      {children}
    </Provider>
  );
}
