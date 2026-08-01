import { Bell, MapPin, ShieldCheck, Star, User } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/account", label: "Profile", icon: User, end: true },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/security", label: "Security", icon: ShieldCheck },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
  { to: "/account/reviews", label: "My Reviews", icon: Star },
];

export default function AccountLayout() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-navy">My Account</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:shrink-0 lg:flex-col lg:overflow-visible">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm whitespace-nowrap ${
                  isActive ? "bg-orange/10 font-medium text-orange" : "text-navy-light hover:bg-cream"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
