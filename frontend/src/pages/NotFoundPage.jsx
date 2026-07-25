import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-sm text-center">
      <h1 className="mb-2 text-2xl font-semibold text-navy">Page not found</h1>
      <Link to="/" className="text-orange hover:underline">
        Back to home
      </Link>
    </div>
  );
}
