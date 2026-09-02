/* Client for POST /api/measure — sends a photo + the reference object,
   gets back board dimensions. The Anthropic key stays on the server. */

export async function measurePhoto(imageDataUrl, reference) {
  const res = await fetch("/api/measure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl, reference }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* fall through to the generic error below */
  }

  if (!res.ok || !data || data.error) {
    throw new Error(
      (data && data.error) ||
        "Could not analyze the photo. Try better lighting and a clearly visible reference object.",
    );
  }
  return data;
}
