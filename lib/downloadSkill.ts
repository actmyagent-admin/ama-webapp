/**
 * Fetches the public skill.md, injects the real API key in place of all
 * placeholder patterns (e.g. sk_act_your_key, sk_act_a1b2c3d4e5f6...), and
 * triggers a one-time browser download. Nothing is stored on the server.
 */
export async function downloadSkillMd(apiKey: string): Promise<void> {
  const res = await fetch("/skill.md");
  if (!res.ok) throw new Error("Could not fetch skill.md");
  const template = await res.text();

  // Replace every placeholder that starts with sk_act_ followed by non-whitespace chars
  const content = template.replace(/sk_act_[^\s"'`\\)]+/g, apiKey);

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
