/**
 * DeepSeek TTS has no phoneme or lexicon support. "rgctl" is a vowel-less
 * token, so the voice drops or garbles it, especially in the outro where the
 * name is packed into URLs. Spell the letters and read the URLs aloud.
 */
const SPOKEN_NAME = "R, G, C, T, L";
const SITE = String.raw`rgctl\.io(?:\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)*`;

export function speakable(text) {
  return text
    .replace(new RegExp(`https?:\\/\\/${SITE}`, "gi"), (match) => speakUrl(match.replace(/^https?:\/\/rgctl\.io\/?/i, "")))
    .replace(/github\.com\/rgctl\/rgctl/gi, `github dot com slash ${SPOKEN_NAME} slash ${SPOKEN_NAME}`)
    .replace(new RegExp(SITE, "gi"), (match) => speakUrl(match.replace(/^rgctl\.io\/?/i, "")))
    .replace(/rgctl/gi, SPOKEN_NAME);
}

function speakUrl(rest) {
  const path = rest
    .replace(/\./g, " dot ")
    .replace(/\//g, " slash ")
    .replace(/\s+/g, " ")
    .trim();
  return path ? `${SPOKEN_NAME} dot io slash ${path}` : `${SPOKEN_NAME} dot io`;
}
