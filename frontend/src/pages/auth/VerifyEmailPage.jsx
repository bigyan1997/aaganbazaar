import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { resendVerification, verifyEmail } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import { extractErrorMessage } from "../../utils/errors";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const attempted = useRef(false);
  const status = useAuthStore((s) => s.status);
  const [resendMessage, setResendMessage] = useState("");

  const verifyMutation = useMutation({ mutationFn: verifyEmail });
  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => setResendMessage("Verification email sent."),
  });

  useEffect(() => {
    if (uid && token && !attempted.current) {
      attempted.current = true;
      verifyMutation.mutate({ uid, token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, token]);

  if (uid && token) {
    return (
      <div className="mx-auto max-w-sm text-center">
        {verifyMutation.isPending && <p className="text-navy/70">Verifying your email…</p>}
        {verifyMutation.isSuccess && (
          <>
            <h1 className="mb-2 text-xl font-semibold text-navy">Email verified</h1>
            <p className="text-navy/70">
              Your email is confirmed.{" "}
              <Link to="/" className="text-orange hover:underline">
                Continue shopping
              </Link>
            </p>
          </>
        )}
        {verifyMutation.isError && (
          <>
            <h1 className="mb-2 text-xl font-semibold text-navy">Verification failed</h1>
            <p className="text-red-600">{extractErrorMessage(verifyMutation.error)}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <h1 className="mb-2 text-xl font-semibold text-navy">Check your email</h1>
      <p className="text-navy/70">
        We've sent a verification link to your inbox. Click it to verify your account.
      </p>
      {status === "authenticated" && (
        <button
          type="button"
          onClick={() => resendMutation.mutate()}
          disabled={resendMutation.isPending}
          className="mt-4 rounded bg-orange px-4 py-2 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
        >
          {resendMutation.isPending ? "Sending…" : "Resend verification email"}
        </button>
      )}
      {resendMessage && <p className="mt-2 text-sm text-navy/70">{resendMessage}</p>}
      {resendMutation.isError && (
        <p className="mt-2 text-sm text-red-600">{extractErrorMessage(resendMutation.error)}</p>
      )}
    </div>
  );
}
