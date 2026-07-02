"use client";

type Props = {
  src: string;
};

export default function VideoPlayer({ src }: Props) {
  return (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full rounded-2xl object-cover shadow-lg"
    />
  );
}