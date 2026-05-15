# Narix Academy 🎓

**Manual QA üzrə professional təhsil platforması**

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL (NeonDB)
- **ORM:** Prisma
- **Auth:** JWT (jose) + bcrypt
- **Styling:** Tailwind CSS + Plus Jakarta Sans
- **Language:** TypeScript

## Xüsusiyyətlər

### Tələbə tərəfi
- 📚 Modullar və dərslər (blok əsaslı)
- ✅ Quiz sistemi (min keçid balı)
- 📝 Şəxsi qeydlər (hər dərs üçün)
- 💬 Sual-cavab sistemi (Q&A)
- 📋 Ev tapşırıqları
- 🏆 Liderboard
- 📅 Təqvim (dərslər, imtahanlar, deadlinelər)
- 🎓 Sertifikat sistemi
- 🌐 Dil seçimi (AZ / EN)
- 👤 Profil idarəetməsi

### Müəllim tərəfi (Admin Panel)
- 📖 Modul və dərs idarəetməsi
- 🧱 Dərs blok redaktoru
- 👥 Tələbə idarəetməsi
- 📋 Tapşırıqları qiymətləndirmə
- 💬 Sualları cavablandırma
- 📅 Təqvim hadisələri yaratmaq
- 📊 Ümumi statistika

## Qurulum

### 1. Klonlayın

```bash
git clone https://github.com/YOUR_USERNAME/narix-academy.git
cd narix-academy
```

### 2. Asılılıqları quraşdırın

```bash
npm install
```

### 3. Mühit dəyişənlərini konfiqurasiya edin

```bash
cp .env.example .env
```

`.env` faylını doldurun:

```env
DATABASE_URL="postgresql://..."   # NeonDB connection string
JWT_SECRET="min-32-char-secret"
```

### 4. Database-i yaradın

```bash
npm run db:push
```

### 5. İlk müəllim hesabını əlavə edin

Neon dashboard-da SQL Editor-da icra edin:

```sql
INSERT INTO "User" (id, email, "passwordHash", name, role, language, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'teacher@qaacademy.local',
  '$2b$12$tASblnG4PIpoqOOdnlSUIuCq0hBCv.RKVnAie3LX/je7zjGP7G8Lq', -- Teacher123!
  'Müəllim',
  'TEACHER',
  'az',
  NOW(),
  NOW()
);
```

> Və ya mövcud `User.json`-dan import edin.

### 6. İşə salın

```bash
npm run dev
```

Açın: [http://localhost:3000](http://localhost:3000)

## Dərs Blok Növləri

| Növ | Təsvir |
|-----|--------|
| `HEADING` | Başlıq (H2/H3/H4) |
| `TEXT` | Mətn (normal/info/warning/success) |
| `NOTE` | Qeyd (important/tip/warning/remember) |
| `EXAMPLE` | Nümunə bloku |
| `TABLE` | Cədvəl |
| `IMAGE` | Şəkil |
| `QUIZ` | Test sualları |
| `TASK` | Tapşırıq (tələbə cavab yazır) |
| `DIVIDER` | Ayırıcı xətt |

## Deployment (Vercel)

1. GitHub-a push edin
2. [vercel.com](https://vercel.com)-da yeni proje yaradın
3. Environment variables əlavə edin:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Deploy edin

## Mövcud Məlumatları İdxal Etmək

Köhnə platformadan JSON ixrac etmisinizsə, Neon Dashboard → SQL Editor-dan import edə bilərsiniz.

---

Narix Academy © 2026
