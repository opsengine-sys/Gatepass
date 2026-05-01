function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface AvatarProps {
  name: string;
  photo?: string | null;
  size?: number | "sm" | "md" | "lg";
}

export function Avatar({ name, photo, size = "md" }: AvatarProps) {
  const px =
    size === "sm" ? 28 :
    size === "lg" ? 44 :
    typeof size === "number" ? size : 34;
  const fs = Math.round(px * 0.36);
  const style = { width: px, height: px, fontSize: fs };
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
