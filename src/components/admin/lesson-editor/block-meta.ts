import {
  AlignLeft, Bug, Code2, FileCode2, FileWarning, Columns3, GitBranch, Heading, Image as ImageIcon, Lightbulb,
  ListChecks, ListOrdered, ListTodo, Megaphone, Minus, Network, NotebookPen, PencilLine, Rows3, Shapes,
  BookMarked, Target, TestTubes, Video, CircleHelp, type LucideIcon, ClipboardCheck,
} from "lucide-react";
import type { BadgeTone } from "@/components/ui/Badge";
import { BLOCK_TYPES, type BlockContentMap, type BlockType } from "@/types/blocks";

export type BlockGroup = "read" | "check" | "practice";

export type BlockMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
  group: BlockGroup;
  tone: BadgeTone;
};

export const GROUPS: { id: BlockGroup; label: string; description: string }[] = [
  { id: "read", label: "Oxu", description: "Mətn, media və izahlar" },
  { id: "check", label: "Yoxlama", description: "Sürətli bilik yoxlaması, XP qazandırır" },
  { id: "practice", label: "Praktika", description: "Real QA tapşırıqları" },
];

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  HEADING: { label: "Başlıq", description: "Bölmə başlığı (H2–H4)", icon: Heading, group: "read", tone: "iris" },
  TEXT: { label: "Mətn", description: "Abzas, siyahı, qalın və kod formatı ilə", icon: AlignLeft, group: "read", tone: "iris" },
  OBJECTIVES: { label: "Məqsədlər", description: "Dərsin sonunda tələbə nəyi bacaracaq", icon: Target, group: "read", tone: "pass" },
  KEY_TERMS: { label: "Açar terminlər", description: "Termin, tərcümə və qısa izah", icon: BookMarked, group: "read", tone: "sky" },
  IMAGE: { label: "Şəkil", description: "Yüklə və ya keçid ver, alt mətn ilə", icon: ImageIcon, group: "read", tone: "sky" },
  VIDEO: { label: "Video", description: "Fayl yüklə və ya YouTube/Loom keçidi", icon: Video, group: "read", tone: "bug" },
  EXAMPLE: { label: "Nümunə", description: "Real həyatdan misal və nəticə", icon: Lightbulb, group: "read", tone: "xp" },
  TABLE: { label: "Cədvəl", description: "Sətir və sütunlarla müqayisə", icon: Columns3, group: "read", tone: "sky" },
  NOTE: { label: "Qeyd", description: "Vacib, məsləhət, diqqət və ya yadda saxla", icon: NotebookPen, group: "read", tone: "xp" },
  CALLOUT: { label: "Diqqət bloku", description: "Rəngli, emojili vurğu", icon: Megaphone, group: "read", tone: "flame" },
  STEPPER: { label: "Addımlar", description: "Ardıcıl proses addım-addım", icon: ListOrdered, group: "read", tone: "iris" },
  CODE: { label: "Kod", description: "Sintaksis rəngləməsi ilə kod nümunəsi", icon: Code2, group: "read", tone: "neutral" },
  DIAGRAM: { label: "Diaqram", description: "Mermaid ilə axın sxemi", icon: GitBranch, group: "read", tone: "iris" },
  CHECKLIST: { label: "Yoxlama siyahısı", description: "Tələbənin işarələdiyi siyahı", icon: ListTodo, group: "read", tone: "pass" },
  SUMMARY: { label: "Xülasə", description: "Dərsin əsas fikirləri", icon: Rows3, group: "read", tone: "pass" },
  DIVIDER: { label: "Ayırıcı", description: "Bölmələr arasında xətt", icon: Minus, group: "read", tone: "neutral" },
  QUIZ: { label: "Quiz", description: "Çoxseçimli suallar və izahlar", icon: CircleHelp, group: "check", tone: "iris" },
  ORDERING: { label: "Sıralama", description: "Elementləri düzgün ardıcıllığa düz", icon: ListChecks, group: "check", tone: "sky" },
  CATEGORIZE: { label: "Qruplaşdırma", description: "Elementləri kateqoriyalara ayır", icon: Shapes, group: "check", tone: "xp" },
  CODE_EXERCISE: { label: "Kod tapşırığı", description: "JavaScript yaz, testlər yoxlasın", icon: FileCode2, group: "practice", tone: "iris" },
  BUG_HUNT: { label: "Baq ovu", description: "Mini tətbiqdə gizli baqları tap", icon: Bug, group: "practice", tone: "bug" },
  TEST_CASE_BUILDER: { label: "Test case qurucusu", description: "Tələbdən test case yaz", icon: TestTubes, group: "practice", tone: "pass" },
  BUG_REPORT_BUILDER: { label: "Bug report qurucusu", description: "Severity, priority və addımlarla report", icon: FileWarning, group: "practice", tone: "flame" },
  API_PLAYGROUND: { label: "API meydançası", description: "Sorğu göndər, cavabı analiz et", icon: Network, group: "practice", tone: "sky" },
  TASK: { label: "Açıq tapşırıq", description: "Yazılı cavab, müəllim yoxlayır", icon: PencilLine, group: "practice", tone: "neutral" },
};

export const TYPES_BY_GROUP: Record<BlockGroup, BlockType[]> = {
  read: BLOCK_TYPES.filter((t) => BLOCK_META[t].group === "read"),
  check: BLOCK_TYPES.filter((t) => BLOCK_META[t].group === "check"),
  practice: BLOCK_TYPES.filter((t) => BLOCK_META[t].group === "practice"),
};

/** Types edited with the raw JSON editor only (no form). */
export const JSON_ONLY: BlockType[] = ["CODE_EXERCISE", "TEST_CASE_BUILDER", "BUG_REPORT_BUILDER", "API_PLAYGROUND", "DIAGRAM"];

/** Types without a separate block title (it would duplicate the content). */
export const NO_TITLE: BlockType[] = ["HEADING", "DIVIDER"];

export function isBlockType(t: string): t is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(t);
}

export function uid(prefix = "") {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return prefix + rnd;
}

/** Starter content for a new block. Every value passes validateBlock. */
export function defaultContent<T extends BlockType>(type: T): BlockContentMap[T] {
  const map: { [K in BlockType]: () => BlockContentMap[K] } = {
    HEADING: () => ({ text: "Yeni bölmə", level: 2 }),
    TEXT: () => ({ body: "", highlight: "normal" }),
    OBJECTIVES: () => ({ items: ["Dərsin sonunda siz … bacaracaqsınız"] }),
    KEY_TERMS: () => ({ terms: [{ term: "Test case", az: "Test ssenarisi", definition: "Funksiyanın yoxlanması üçün addımlar və gözlənilən nəticə" }] }),
    IMAGE: () => ({ url: "", alt: "", caption: "", alignment: "center" }),
    VIDEO: () => ({ url: "", source: "external", caption: "" }),
    EXAMPLE: () => ({ description: "", takeaway: "" }),
    TABLE: () => ({ headers: ["Sütun 1", "Sütun 2"], rows: [["", ""], ["", ""]] }),
    NOTE: () => ({ variant: "tip", body: "" }),
    CALLOUT: () => ({ emoji: "💡", title: "", body: "", color: "blue" }),
    STEPPER: () => ({ steps: [{ title: "Birinci addım", description: "" }, { title: "İkinci addım", description: "" }] }),
    CODE: () => ({ code: "", language: "javascript", caption: "" }),
    DIAGRAM: () => ({ code: "flowchart LR\n  A[Tələb] --> B[Test case]\n  B --> C[İcra]\n  C --> D{Keçdi?}\n  D -- Bəli --> E[Bağla]\n  D -- Xeyr --> F[Bug report]", caption: "" }),
    CHECKLIST: () => ({ items: [{ id: uid("c"), text: "Birinci yoxlama" }, { id: uid("c"), text: "İkinci yoxlama" }] }),
    SUMMARY: () => ({ points: ["Əsas fikir"] }),
    DIVIDER: () => ({}),
    QUIZ: () => ({
      questions: [{ id: uid("q"), text: "Sualı yazın", options: ["Düzgün variant", "Yanlış variant"], correctIndex: 0, explanation: "" }],
    }),
    ORDERING: () => ({ instructions: "Addımları düzgün ardıcıllıqla düzün", items: ["Birinci", "İkinci", "Üçüncü"], explanation: "" }),
    CATEGORIZE: () => {
      const a = uid("k");
      const b = uid("k");
      return {
        instructions: "Hər elementi uyğun kateqoriyaya aparın",
        categories: [{ id: a, label: "Funksional" }, { id: b, label: "Qeyri-funksional" }],
        items: [
          { id: uid("i"), text: "Giriş düyməsi işləyir", categoryId: a },
          { id: uid("i"), text: "Səhifə 2 saniyədə açılır", categoryId: b },
        ],
        explanation: "",
      };
    },
    CODE_EXERCISE: () => ({
      language: "javascript",
      instructions: "`sum(a, b)` funksiyasını yazın: iki ədədin cəmini qaytarsın.",
      starterCode: "function sum(a, b) {\n  // kodunuzu bura yazın\n}\n",
      solution: "function sum(a, b) {\n  return a + b;\n}\n",
      tests: [
        { name: "2 + 3 = 5", assert: "sum(2, 3) === 5" },
        { name: "Mənfi ədədlər", assert: "sum(-1, -4) === -5" },
      ],
      hints: ["`return` açar sözünü unutmayın"],
    }),
    BUG_HUNT: () => ({ scenario: "login", instructions: "Tələblərə baxın və formada gizlənən baqları tapın." }),
    TEST_CASE_BUILDER: () => ({
      feature: "Giriş forması",
      requirement: "İstifadəçi düzgün email və şifrə ilə daxil olduqda idarə panelinə yönləndirilməlidir.",
      minSteps: 3,
      expectedKeywords: ["email", "şifrə", "daxil ol"],
      sampleSolution: {
        title: "Düzgün məlumatla uğurlu giriş",
        preconditions: "İstifadəçi qeydiyyatdan keçib",
        steps: ["Giriş səhifəsini açın", "Düzgün email və şifrə daxil edin", "“Daxil ol” düyməsini basın"],
        expected: "İdarə paneli açılır",
      },
    }),
    BUG_REPORT_BUILDER: () => ({
      scenario: "Səbətə məhsul əlavə etdikdən sonra ümumi məbləğ yenilənmir.",
      expectedSeverity: "Major",
      expectedPriority: "High",
      keywords: ["səbət", "məbləğ"],
      sampleSolution: {
        title: "Məhsul əlavə edildikdə səbət məbləği yenilənmir",
        steps: ["Mağazanı açın", "İstənilən məhsulu səbətə əlavə edin", "Səbətə keçin"],
        expected: "Ümumi məbləğ məhsulun qiymətinə bərabərdir",
        actual: "Ümumi məbləğ 0 AZN göstərilir",
      },
    }),
    API_PLAYGROUND: () => ({
      instructions: "Sorğunu göndərin və cavaba əsasən suala cavab verin.",
      baseUrl: "https://api.narix.az",
      endpoints: [{ method: "GET", path: "/users/:id", status: 200, body: { id: 1, name: "Aysel" }, description: "İstifadəçini qaytarır" }],
      tasks: [{ id: uid("t"), question: "Mövcud istifadəçi üçün status kodu nədir?", options: ["200", "404", "500"], correctIndex: 0, explanation: "" }],
    }),
    TASK: () => ({ instructions: "Tapşırığın şərtini yazın.", placeholder: "Cavabınızı bura yazın…", required: true }),
  };
  return map[type]() as BlockContentMap[T];
}

export const SAMPLE_IMPORT = JSON.stringify(
  {
    blocks: [
      { type: "HEADING", content: { text: "Smoke testing nədir?", level: 2 } },
      { type: "TEXT", content: { body: "**Smoke test** yeni build-in əsas funksiyalarının işlədiyini sürətlə yoxlayır." } },
      {
        type: "QUIZ",
        title: "Özünü yoxla",
        content: {
          questions: [
            { id: "q1", text: "Smoke test nə vaxt aparılır?", options: ["Hər yeni build-dən sonra", "Yalnız releasedən sonra"], correctIndex: 0 },
          ],
        },
      },
    ],
  },
  null,
  2
);
