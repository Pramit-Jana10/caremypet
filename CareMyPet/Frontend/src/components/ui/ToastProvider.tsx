"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "14px",
          background: "#ffffff",
          color: "#0b0f1a",
          boxShadow: "0 10px 30px rgba(2, 6, 23, 0.10)"
        }
      }}
    />
  );
}

