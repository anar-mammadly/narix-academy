import type { BugHuntScenario } from "@/types/blocks";

// Seeded defects for each Bug Hunt mini app. The UI components in
// src/components/lesson/bug-hunt mark the matching elements with data-bug="<id>"
// only while the defect is visible, so a click is a valid find.

export type SeededBug = { id: string; title: string; explanation: string };
export type ScenarioDef = { title: string; requirements: string[]; bugs: SeededBug[] };

export const BUG_HUNT_SCENARIOS: Record<BugHuntScenario, ScenarioDef> = {
  login: {
    title: "Giriş səhifəsi",
    requirements: [
      "Email və şifrə məcburidir: boş forma göndərilməməlidir.",
      "Şifrə sahəsi yazılan simvolları gizlətməlidir.",
      "Yanlış məlumatda yalnız “Email və ya şifrə yanlışdır” mesajı görünməlidir.",
      "Düymənin adı “Daxil ol” olmalıdır.",
      "“Məni xatırla” standart olaraq seçilməmiş olmalıdır.",
    ],
    bugs: [
      { id: "password-visible", title: "Şifrə açıq görünür", explanation: "Şifrə sahəsi `type=\"password\"` olmalıdır. Açıq şifrə təhlükəsizlik baqıdır." },
      { id: "button-typo", title: "Düymədə yazı səhvi", explanation: "“Daxl ol” yazılıb, tələbdə “Daxil ol”. Kiçik, amma real UI baqıdır (Trivial severity)." },
      { id: "empty-submit", title: "Boş forma qəbul olunur", explanation: "Boş email və şifrə ilə “Xoş gəldin” görünür. Məcburi sahələrin yoxlanması işləmir." },
      { id: "error-leak", title: "Xəta mesajı hesab haqqında məlumat sızdırır", explanation: "“Bu email qeydiyyatdadır” demək hücumçuya mövcud hesabları tapmağa kömək edir. Mesaj ümumi olmalıdır." },
      { id: "remember-checked", title: "“Məni xatırla” öz-özünə seçilib", explanation: "Tələbə görə seçim standart olaraq boş olmalıdır." },
    ],
  },
  registration: {
    title: "Qeydiyyat forması",
    requirements: [
      "Ad sahəsinin etiketi “Ad” olmalıdır.",
      "Yaş 18–60 aralığında qəbul olunur (18 və 60 daxil).",
      "Email düzgün formatda olmalıdır (ad@domen.az).",
      "Şifrə ən az 8 simvol olmalıdır.",
      "“Qeydiyyatdan keç” düyməsi yalnız şərtlər qəbul edildikdə aktiv olur.",
    ],
    bugs: [
      { id: "name-label", title: "Etiket səhvdir", explanation: "Ad sahəsinin etiketi “Soyad” yazılıb. İstifadəçi səhv məlumat daxil edəcək." },
      { id: "age-boundary", title: "Yaş 18 rədd edilir", explanation: "Klassik boundary baqı: şərt `age > 18` yazılıb, `age >= 18` olmalıdır. BVA məhz bunu tapır." },
      { id: "email-validation", title: "Yanlış email qəbul edilir", explanation: "“@” və domeni olmayan email “düzgün” göstərilir." },
      { id: "password-length", title: "Qısa şifrə “güclü” sayılır", explanation: "6–7 simvollu şifrə qəbul edilir, halbuki minimum 8-dir." },
      { id: "terms-button", title: "Şərtlər qəbul edilmədən düymə aktivdir", explanation: "Checkbox seçilməyib, amma düymə basılır." },
    ],
  },
  cart: {
    title: "Alış-veriş səbəti",
    requirements: [
      "Miqdar dəyişdikdə həmin məhsulun cəmi yenilənməlidir.",
      "Miqdar 1-dən az ola bilməz.",
      "“SAVE10” promo kodu 10% endirim verir.",
      "50 AZN-dən yuxarı sifarişdə çatdırılma pulsuzdur.",
      "Silinən məhsul səbətdən yox olmalıdır.",
    ],
    bugs: [
      { id: "total-not-updated", title: "Məhsul cəmi yenilənmir", explanation: "Qulaqcığın miqdarı artır, amma sətrin cəmi köhnə qalır." },
      { id: "negative-qty", title: "Miqdar 0 və mənfi ola bilir", explanation: "Minimum dəyər yoxlanmır. Boundary: 1 qəbul, 0 rədd edilməlidir." },
      { id: "promo-wrong", title: "Promo kod 1% endirim verir", explanation: "SAVE10 10% əvəzinə 1% çıxır: hesablamada `/ 1000` səhvi." },
      { id: "shipping-threshold", title: "Pulsuz çatdırılma işləmir", explanation: "Cəm 50 AZN-i keçir, amma çatdırılma haqqı yenə hesablanır." },
      { id: "remove-fails", title: "Məhsul silinmir", explanation: "“Sil” basılanda məhsul sadəcə solğunlaşır, cəmə daxil olmağa davam edir." },
    ],
  },
};

export const BUG_HUNT_PASS_RATIO = 0.6;
