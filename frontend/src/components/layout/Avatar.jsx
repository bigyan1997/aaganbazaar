export default function Avatar({ user, size = 32 }) {
  const initial = (user?.first_name || user?.email || "?").charAt(0).toUpperCase();

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={{ height: size, width: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-cream-dark font-medium text-navy"
      style={{ height: size, width: size, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  );
}
