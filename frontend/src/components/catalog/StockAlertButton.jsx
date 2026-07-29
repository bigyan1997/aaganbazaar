import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";

import { getStockAlertStatus, subscribeStockAlert, unsubscribeStockAlert } from "../../api/catalog";
import useAuthStore from "../../store/authStore";

export default function StockAlertButton({ slug }) {
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["stock-alert", slug],
    queryFn: () => getStockAlertStatus(slug),
    enabled: status === "authenticated",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["stock-alert", slug] });
  const subscribe = useMutation({ mutationFn: () => subscribeStockAlert(slug), onSuccess: invalidate });
  const unsubscribe = useMutation({ mutationFn: () => unsubscribeStockAlert(slug), onSuccess: invalidate });

  if (status !== "authenticated") return null;

  if (data?.subscribed) {
    return (
      <button
        type="button"
        onClick={() => unsubscribe.mutate()}
        disabled={unsubscribe.isPending}
        className="flex min-h-11 items-center gap-1.5 text-sm text-navy/70 hover:text-navy"
      >
        <BellOff size={16} /> We'll email you when it's back
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => subscribe.mutate()}
      disabled={subscribe.isPending}
      className="flex min-h-11 items-center gap-1.5 rounded border border-navy/20 px-3 py-1.5 text-sm text-navy hover:bg-cream"
    >
      <Bell size={16} /> Notify me when back in stock
    </button>
  );
}
