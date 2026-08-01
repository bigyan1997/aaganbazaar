import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMe, updateProfile } from "../../api/auth";

export default function NotificationsPage() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => queryClient.setQueryData(["me"], updated),
  });

  if (isLoading || !user) return <p className="text-navy/60">Loading…</p>;

  return (
    <div className="rounded-lg border border-cream-dark bg-white/60 p-5">
      <p className="mb-4 text-sm font-medium text-navy">Email notifications</p>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={user.email_order_updates}
          onChange={(e) => mutation.mutate({ email_order_updates: e.target.checked })}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="text-navy">Order updates</span>
          <br />
          <span className="text-navy-light">
            Get an email when there's a status change on one of your orders, like a refund.
          </span>
        </span>
      </label>
      {mutation.isSuccess && <p className="mt-3 text-xs text-navy/60">Preference saved.</p>}
    </div>
  );
}
