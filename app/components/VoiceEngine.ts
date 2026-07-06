"use client";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playAudio(src: string) {
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(src);

    audio.onended = () => resolve();

    audio.onerror = () =>
      reject(new Error("Audio gagal diputar : " + src));

    audio.play().catch(reject);
  });
}

async function speak(text: string) {
  return new Promise<void>((resolve) => {
    const suara = new SpeechSynthesisUtterance(text);

    suara.lang = "id-ID";
    suara.rate = 0.9;
    suara.pitch = 1;

    suara.onend = () => resolve();

    speechSynthesis.speak(suara);
  });
}

export async function panggilVoice(
  nomor: string,
  loket: number
) {
  speechSynthesis.cancel();

  await playAudio("/sound/call-to-attention.mp3");

  await delay(500);

  await speak(
    `Nomor antrean ${nomor}. Silakan menuju loket ${loket}. Terima kasih.`
  );
}