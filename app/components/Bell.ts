export function playBell() {
  const audio = new Audio("/bell.mp3");
  audio.play();
}