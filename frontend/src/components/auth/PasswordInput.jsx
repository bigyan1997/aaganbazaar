import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

export default function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
      <input type={visible ? "text" : "password"} className={className} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
