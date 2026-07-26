import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { googleLogin } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", resolve, { once: true }));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Renders Google's own "Sign in with Google" button (Google Identity
// Services) into a div we own. Loaded lazily here rather than in
// index.html - only pages that actually show this button pay for it.
export default function GoogleLoginButton({ onSuccess }) {
  const buttonRef = useRef(null);
  const setUser = useAuthStore((s) => s.setUser);

  const mutation = useMutation({
    mutationFn: googleLogin,
    onSuccess: (user) => {
      setUser(user);
      onSuccess?.();
    },
  });
  // The GSI callback is registered once on mount, but must always call
  // the latest mutate - a ref sidesteps relying on mutate's identity
  // staying stable across renders.
  const mutateRef = useRef(mutation.mutate);
  mutateRef.current = mutation.mutate;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let cancelled = false;

    loadGoogleScript().then(() => {
      if (cancelled || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => mutateRef.current({ credential: response.credential }),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} />
      {mutation.isError && <p className="text-sm text-red-600">{extractErrorMessage(mutation.error)}</p>}
    </div>
  );
}
