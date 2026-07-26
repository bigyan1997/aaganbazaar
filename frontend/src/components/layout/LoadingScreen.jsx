import logoIcon from "../../assets/logo-icon.png";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <img src={logoIcon} alt="" className="h-10 w-10" />
      <div className="flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-orange [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-orange [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-orange" />
      </div>
    </div>
  );
}
