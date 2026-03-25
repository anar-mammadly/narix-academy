export function slugify(input: string): string {
  const map: Record<string, string> = {
    ə: "e",
    Ə: "e",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ü: "u",
    Ü: "u",
    ş: "s",
    Ş: "s",
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
  };
  let s = input.trim();
  for (const [k, v] of Object.entries(map)) {
    s = s.split(k).join(v);
  }
  s = s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "ders";
}
