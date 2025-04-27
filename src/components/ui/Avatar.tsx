import React from "react";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

export const Avatar: React.FC<AvatarProps> = ({ name = "?", src, size = 40 }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const bgColor = stringToColor(name);

  return src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover border-2 border-white shadow"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full text-white font-bold border-2 border-white shadow"
      style={{ width: size, height: size, background: bgColor }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}; 