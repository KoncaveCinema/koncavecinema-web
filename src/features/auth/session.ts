"use client";

import { useEffect } from "react";
import { create } from "zustand";

import type { UserProfile } from "./api-types";
import { restoreSession } from "./service";

/*
 * Who is signed in, for the header's account menu and the private pages. Holds the profile
 * only; the access token stays in the API client's memory and the refresh token in its
 * HttpOnly cookie.
 */

type SessionStatus = "loading" | "signed-in" | "signed-out";

interface SessionState {
  status: SessionStatus;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  status: "loading",
  user: null,
  setUser: (user) => set({ user, status: user ? "signed-in" : "signed-out" }),
}));

let restoring = false;

/** Restores the session once per page load. Mounted once, in the app providers. */
export function SessionRestorer() {
  useEffect(() => {
    if (restoring) return;
    restoring = true;
    restoreSession()
      .then((user) => useSession.getState().setUser(user))
      .catch(() => useSession.getState().setUser(null));
  }, []);
  return null;
}
