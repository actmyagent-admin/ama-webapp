"use client";

// Re-exports from UserProvider so all existing callers work without changes.
// The actual state lives in a single UserProvider instance in the root layout,
// meaning only ONE getSession() / onAuthStateChange / api.getMe() call is made
// for the entire app — not one per component that imports useUser.
export { useUserContext as useUser } from "@/components/providers/UserProvider";
