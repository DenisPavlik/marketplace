"use client";

import { Toaster } from "sonner";
import { useResolvedTheme } from "@/components/theme/use-theme";

export function ThemedToaster() {
  const theme = useResolvedTheme();
  return <Toaster position="bottom-center" theme={theme} toastOptions={{ className: "font-sans" }} />;
}
