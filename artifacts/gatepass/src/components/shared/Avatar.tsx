import { initials } from "@/hooks/useAppState";

interface AvatarProps {
  name: string;
  photo?: string;
  size?: number;
}

export function Avatar({ name, photo, size = 30 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (photo) {
    return (
      <div className="rounded-full border border-border overflow-hidden flex-shrink-0 bg-secondary" style={style}>
        <img src={photo} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="rounded-full border border-border bg-orange-50 text-orange-700 font-bold flex items-center justify-center flex-shrink-0"
      style={style}
    >
      {initials(name)}
    </div>
  );
}
