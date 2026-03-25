import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function ensureDemoImage() {
  const uploads = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploads, { recursive: true });
  const filename = "demo-lesson-banner.webp";
  const full = path.join(uploads, filename);
  const buf = await sharp({
    create: {
      width: 960,
      height: 360,
      channels: 3,
      background: { r: 37, g: 99, b: 235 },
    },
  })
    .webp({ quality: 85 })
    .toBuffer();
  await writeFile(full, buf);
  return `/uploads/${filename}`;
}

async function main() {
  const demoImageUrl = await ensureDemoImage();

  const passwordTeacher = await bcrypt.hash("Teacher123!", 12);
  const passwordStudent = await bcrypt.hash("Student123!", 12);

  await prisma.submission.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.lessonBlock.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@qaacademy.local",
      name: "Dərs müəllimi",
      role: "TEACHER",
      passwordHash: passwordTeacher,
    },
  });

  const student = await prisma.user.create({
    data: {
      email: "student@qaacademy.local",
      name: "Tələbə nümunəsi",
      role: "STUDENT",
      passwordHash: passwordStudent,
    },
  });

  const mod = await prisma.module.create({
    data: {
      title: "Demo modul",
      description: "Platformanın blok tiplərini göstərmək üçün qısa nümunə.",
      order: 0,
      published: true,
    },
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      title: "Blok tipləri — sistem nümunəsi",
      slug: "demo-blok-numuneleri",
      shortDescription:
        "Başlıq, mətn, qeyd, nümunə, cədvəl, şəkil, tapşırıq və kiçik test.",
      moduleId: mod.id,
      order: 0,
      estimatedMinutes: 20,
      coverImageUrl: demoImageUrl,
      published: true,
      quizEnabled: true,
      minQuizScore: 50,
    },
  });

  const blocks1 = [
    {
      type: "HEADING",
      title: null,
      order: 0,
      content: JSON.stringify({ text: "Bu dərs yalnız platformanı nümayiş etdirir", level: 2 }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
    {
      type: "TEXT",
      title: "Giriş",
      order: 1,
      content: JSON.stringify({
        body: "Real dərs məzmununu özünüz admin paneldən əlavə edəcəksiniz. Burada yalnız struktur və UI nümunəsi var.",
        highlight: "info",
      }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
    {
      type: "NOTE",
      title: "Vacib",
      order: 2,
      content: JSON.stringify({
        variant: "important",
        body: "Canlı Google Meet dərsindən sonra materialları burada əlavə edin.",
      }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
    {
      type: "DIVIDER",
      title: null,
      order: 3,
      content: JSON.stringify({}),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
    {
      type: "EXAMPLE",
      title: "Nümunə: bug hesabatı",
      order: 4,
      content: JSON.stringify({
        description:
          "Başlıq qısa olmalıdır, addımlar təkrarlanabilir olmalıdır, gözlənilən və faktiki nəticə aydın yazılmalıdır.",
        takeaway: "Yaxşı hesabat həm developer, həm də PM üçün oxunaqlıdır.",
        relatedImageUrl: null,
      }),
      settings: JSON.stringify({}),
      imageUrl: demoImageUrl,
    },
    {
      type: "TABLE",
      title: "Cədvəl nümunəsi",
      order: 5,
      content: JSON.stringify({
        headers: ["Prioritet", "Təsir"],
        rows: [
          ["P1 — kritik", "Sistem işləmir"],
          ["P2 — yüksək", "Əsas axın pozulur"],
          ["P3 — orta", "Workaround var"],
        ],
      }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
    {
      type: "IMAGE",
      title: null,
      order: 6,
      content: JSON.stringify({
        url: demoImageUrl,
        caption: "Vahid şəkil kartı stili (demo fonda)",
        alt: "Mavi demo banner",
        alignment: "center",
      }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
    {
      type: "TASK",
      title: "Qısa tapşırıq",
      order: 7,
      content: JSON.stringify({
        instructions:
          "Özünüz üçün 3 addımlıq sadə test ssenarisi yazın (Given / When / Then ilə).",
        placeholder: "1. …\n2. …\n3. …",
        required: true,
      }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
    {
      type: "QUIZ",
      title: "Mini test",
      order: 8,
      content: JSON.stringify({
        questions: [
          {
            id: "q-demo-1",
            text: "Manual QA-da regression testinin məqsədi nədir?",
            options: [
              "Yeni funksiyanı sürətlə yoxlamaq",
              "Dəyişikliklərdən sonra köhnə funksionallığın qorunmasını təsdiqləmək",
              "Yalnız UI rənglərini yoxlamaq",
              "Kod review aparmaq",
            ],
            correctIndex: 1,
            explanation:
              "Regression dəyişikliklərdən sonra mövcud davranışın pozulmadığını yoxlayır.",
            imageUrl: null,
          },
        ],
      }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
  ];

  for (const b of blocks1) {
    await prisma.lessonBlock.create({
      data: { ...b, lessonId: lesson1.id },
    });
  }

  const lesson2 = await prisma.lesson.create({
    data: {
      title: "İkinci nümunə dərsi",
      slug: "ikinci-numune-ders",
      shortDescription: "Sadə mətn bloku ilə boş dərs şablonu.",
      moduleId: mod.id,
      order: 1,
      estimatedMinutes: 10,
      published: true,
      quizEnabled: false,
      minQuizScore: null,
    },
  });

  await prisma.lessonBlock.create({
    data: {
      lessonId: lesson2.id,
      type: "TEXT",
      title: "Boş şablon",
      order: 0,
      content: JSON.stringify({
        body: "Bu dərsi silə, redaktə edə və ya çoxaldı bilərsiniz. Yeni bloklar əlavə etmək üçün dərs redaktorundan istifadə edin.",
        highlight: "normal",
      }),
      settings: JSON.stringify({}),
      imageUrl: null,
    },
  });

  await prisma.progress.create({
    data: {
      userId: student.id,
      lessonId: lesson2.id,
      completed: true,
      completedAt: new Date(),
    },
  });

  console.log("Seed tamamlandı.");
  console.log("Müəllim:", teacher.email, "/ Teacher123!");
  console.log("Tələbə:", student.email, "/ Student123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
