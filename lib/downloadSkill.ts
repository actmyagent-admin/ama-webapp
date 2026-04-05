/**
 * Fetches the public skill.md, injects the real API key and HMAC secret in
 * place of all placeholder patterns, and triggers a one-time browser download.
 * Nothing is stored on the server.
 */
export async function downloadSkillMd(apiKey: string, hmacSecret: string): Promise<void> {
  const res = await fetch("/skill.md");
  if (!res.ok) throw new Error("Could not fetch skill.md");
  const template = await res.text();

  // Replace every API key placeholder (sk_act_...) with the real key
  const withKey = template.replace(/sk_act_[^\s"'`\\)]+/g, apiKey);
  // Replace every HMAC secret placeholder (ama_live_...) with the real secret
  const content = withKey.replace(/ama_live_[^\s"'`\\)]+/g, hmacSecret);

  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "skill.md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
