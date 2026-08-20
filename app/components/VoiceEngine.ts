async function playAudio(src: string) {
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(src);

    audio.onended = () => resolve();

    audio.onerror = () =>
      reject(new Error("Audio gagal diputar: " + src));

    audio.play().catch(reject);
  });
}

async function speak(text: string) {
  try {
    const response = await fetch("/api/tts-edge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("TTS API gagal");
    }

    const blob = await response.blob();

    const audioUrl = URL.createObjectURL(blob);

    try {
      await playAudio(audioUrl);
    } finally {
      URL.revokeObjectURL(audioUrl);
    }
  } catch (error) {
    console.error("TTS ERROR:", error);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function panggilVoice(
  nomor: string,
  loket: number
) {
  try {
    await playAudio("/sound/call-to-attention.mp3");

    await delay(500);

    await speak(
      `Nomor antrean ${nomor}. Silakan menuju loket ${loket}. Terima kasih.`
    );
  } catch (error) {
    console.error("VOICE ERROR:", error);
  }
}