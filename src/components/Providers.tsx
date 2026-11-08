"use client";

import { MotionConfig } from "motion/react";
import { ToastHost } from "./ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 30 }}>
      {children}
      <ToastHost />
    </MotionConfig>
  );
}
