"use client";

export function panggilSuara(
  nomor: string,
  loket: number
) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const text =
    `Nomor antrian ${nomor}, silakan menuju loket ${loket}`;

  const suara = new SpeechSynthesisUtterance(text);

  suara.lang = "id-ID";
  suara.rate = 0.9;
  suara.pitch = 1;

  window.speechSynthesis.speak(suara);
}