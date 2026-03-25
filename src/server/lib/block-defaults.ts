import type { BlockType } from "@/shared/types/blocks";

export function defaultContentForType(type: BlockType): { content: string; settings: string; title: string | null } {
  switch (type) {
    case "HEADING":
      return {
        title: null,
        content: JSON.stringify({ text: "Yeni başlıq", level: 2 }),
        settings: JSON.stringify({}),
      };
    case "TEXT":
      return {
        title: null,
        content: JSON.stringify({ body: "", highlight: "normal" }),
        settings: JSON.stringify({}),
      };
    case "IMAGE":
      return {
        title: null,
        content: JSON.stringify({
          url: "",
          caption: "",
          alt: "",
          alignment: "center",
        }),
        settings: JSON.stringify({}),
      };
    case "EXAMPLE":
      return {
        title: "Nümunə",
        content: JSON.stringify({
          description: "",
          takeaway: "",
          relatedImageUrl: null,
        }),
        settings: JSON.stringify({}),
      };
    case "TABLE":
      return {
        title: "Cədvəl",
        content: JSON.stringify({
          headers: ["Sütun 1", "Sütun 2"],
          rows: [
            ["", ""],
            ["", ""],
          ],
        }),
        settings: JSON.stringify({}),
      };
    case "QUIZ":
      return {
        title: "Test",
        content: JSON.stringify({
          questions: [
            {
              id: crypto.randomUUID(),
              text: "Sual mətni",
              options: ["Seçim A", "Seçim B", "Seçim C", "Seçim D"],
              correctIndex: 0,
              explanation: "",
              imageUrl: null,
            },
          ],
        }),
        settings: JSON.stringify({}),
      };
    case "TASK":
      return {
        title: "Tapşırıq",
        content: JSON.stringify({
          instructions: "",
          placeholder: "",
          required: false,
        }),
        settings: JSON.stringify({}),
      };
    case "NOTE":
      return {
        title: "Qeyd",
        content: JSON.stringify({
          variant: "tip",
          body: "",
        }),
        settings: JSON.stringify({}),
      };
    case "DIVIDER":
      return {
        title: null,
        content: JSON.stringify({}),
        settings: JSON.stringify({}),
      };
    default:
      return {
        title: null,
        content: "{}",
        settings: "{}",
      };
  }
}
