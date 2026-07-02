export function panggilSuara(nomor: string, loket: number) {
  speechSynthesis.cancel();

  const suara = new SpeechSynthesisUtterance(
    `Nomor antrean ${nomor}, silakan menuju loket ${loket}`
  );

  suara.lang = "id-ID";
  suara.rate = 0.9;
  suara.pitch = 1;

  speechSynthesis.speak(suara);
}