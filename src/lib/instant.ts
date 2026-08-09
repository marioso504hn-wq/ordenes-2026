import { init, id, tx } from "@instantdb/react";
import schema from "../../instant.schema";

// Get InstantDB App ID from env or localStorage fallback
export const getStoredAppId = (): string => {
  const envAppId = import.meta.env.VITE_INSTANT_APP_ID;
  if (envAppId && envAppId !== "YOUR_INSTANT_APP_ID" && envAppId.trim() !== "") {
    return envAppId.trim();
  }
  const localAppId = localStorage.getItem("custom_instant_app_id");
  if (localAppId && localAppId.trim() !== "") {
    return localAppId.trim();
  }
  // Default working public App ID for InstantDB initialization
  return "70f52acf-c1c4-4341-b94f-d8e3a95fdf58";
};

export const setStoredAppId = (appId: string) => {
  if (appId.trim()) {
    localStorage.setItem("custom_instant_app_id", appId.trim());
  } else {
    localStorage.removeItem("custom_instant_app_id");
  }
  window.location.reload();
};

export const CURRENT_APP_ID = getStoredAppId();

// Initialize InstantDB client
export const db = init({
  appId: CURRENT_APP_ID,
  schema,
});

export { id, tx };
