import { auth } from "./config";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

export function listenAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInAnon() {
  const result = await signInAnonymously(auth);
  return result.user;
} 