// providers/Providers.tsx
"use client";

import { ReactNode, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApolloProvider } from "@apollo/client";
import client from "@/lib/apollo-client"; // Make sure this path is correct

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ApolloProvider client={client}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                {children}
              </AuthProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </ApolloProvider>
      </PersistGate>
    </Provider>
  );
}
