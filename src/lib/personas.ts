import personasJson from "@/data/personas.json";
import linesJson from "@/data/motivational-lines.json";

/**
 * خواننده‌های فایل‌های پیکربندی. بریف می‌گوید پرسوناها و جمله‌های لیلا در فایل
 * باشند نه در دیتابیس، چون محتوایشان بعد از تحلیل رفتار واقعی عوض می‌شود و
 * نباید هر بار نیاز به migration داشته باشند.
 *
 * JSON با resolveJsonModule مستقیم import می‌شود تا در bundle نهایی هم برود
 * (احتمالاً Vercel فایل را جدا نمی‌دهد). اگر بعداً فایل‌ها بزرگ شدند و خواندن
 * هر بار از دیسک لازم شد، همین توابع محل خوبی برای cache کردن هستند.
 */

export type ToneStyle = "gentle" | "commander";

export type Persona = {
  id: string;
  name: string;
  toneStyle: ToneStyle;
  tagline: string;
  plan: string;
  toneNote: string;
  missedDayPolicy: string;
  suggestedBlockMinutes: number;
  suggestedReminderTime: string;
  traitAxis: { focus: number; structure: number; pressureDriven: number };
};

export type PersonaOption = {
  label: string;
  weights: Record<string, number>;
};

export type Question = {
  id: string;
  order: number;
  prompt: string;
  options: PersonaOption[];
};

export type MotivationalEvent =
  | "before_task"
  | "after_missed_day"
  | "streak"
  | "goal_reminder";

// JSON در تایپ‌های ما نمی‌ریزد، پس این as یک ادعای تایپی است که باید درست
// باشد. برای اطمینان، shape فایل در validateConfig چک می‌شود.
const personasData = personasJson as unknown as {
  personas: Persona[];
  questions: Question[];
};

const linesData = linesJson as unknown as {
  lines: Record<ToneStyle, Record<MotivationalEvent, string[]>>;
};

export async function readPersonas(): Promise<Persona[]> {
  return personasData.personas;
}

export async function readQuestions(): Promise<Question[]> {
  // به ترتیب order مرتب می‌شوند تا ترتیب نمایش به ترتیب آرایه در فایل وابسته
  // نباشد؛ وگرنه یک ویرایش بی‌خطر در فایل، ترتیب سؤال‌ها را عوض می‌کند.
  return [...personasData.questions].sort((a, b) => a.order - b.order);
}

export async function readLines(): Promise<
  Record<ToneStyle, Record<MotivationalEvent, string[]>>
> {
  return linesData.lines;
}

/**
 * انتخاب یک جمله. تصادفی است تا پیام‌ها پشت سر هم تکرار نشوند. اگر برای یک
 * ترکیب tone/event جمله‌ای نبود (مثلاً بعد از افزودن پرسونای جدید)، به gentle
 * برمی‌گردد تا نوتیف هیچ‌وقت متن خالی نداشته باشد.
 */
export async function pickLine(
  toneStyle: ToneStyle,
  event: MotivationalEvent,
): Promise<string> {
  const lines = linesData.lines;
  const pool = lines[toneStyle]?.[event] ?? lines.gentle[event];

  if (!pool || pool.length === 0) return "";
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function findPersona(
  id: string | null | undefined,
): Promise<Persona | null> {
  if (!id) return null;
  return (await readPersonas()).find((persona) => persona.id === id) ?? null;
}

export async function toneOf(
  personaId: string | null | undefined,
): Promise<ToneStyle> {
  const persona = await findPersona(personaId);
  return persona?.toneStyle ?? "gentle";
}

export const PERSONA_IDS = () =>
  personasData.personas.map((persona) => persona.id);

/* --------------------------------------------------------------- اسکورینگ */

/**
 * یک پاسخ آنبوردینگ. همین شکل در User.onboardingAnswers ذخیره می‌شود، پس
 * تغییرش یعنی تغییر داده‌های ذخیره‌شدهٔ قبلی — عمداً ساده و پایدار نگه داشته شده.
 */
export type OnboardingAnswer = {
  questionId: string;
  optionIndex: number;
};

/**
 * محاسبهٔ پرسونا به‌صورت rule-based. بریف صریحاً ML را برای فاز بعد گذاشته،
 * پس اینجا فقط جمع سادهٔ وزن‌هاست.
 *
 * اگر پاسخی برای یک سؤال نباشد (مثلاً کاربر وسط پرسشنامه برگشته و فقط ۳ سؤال
 * را جواب داده) آن سؤال در امتیاز نمی‌آید. اگر هیچ پاسخ معتبری نباشد null
 * برمی‌گردد و نباید به‌عنوان «پرسونای پیش‌فرض» چیزی ذخیره شود، چون آن‌وقت
 * User.personaId مقداری می‌گیرد که از رفتار کاربر نیامده.
 */
export async function scorePersona(
  answers: OnboardingAnswer[],
): Promise<Persona | null> {
  const personas = await readPersonas();
  const questions = await readQuestions();
  const byId = new Map(questions.map((q) => [q.id, q]));

  const scores = new Map<string, number>(personas.map((p) => [p.id, 0]));
  let counted = 0;

  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;
    const option = question.options[answer.optionIndex];
    if (!option) continue;

    counted += 1;
    for (const [personaId, weight] of Object.entries(option.weights)) {
      // وزن برای پرسونایی که در فایل نیست نادیده گرفته می‌شود، نه این‌که خطا
      // بدهد: اگر بعداً پرسونایی از فایل حذف شود، داده‌های قدیمی نباید کل
      // محاسبه را خراب کنند.
      if (scores.has(personaId)) {
        scores.set(personaId, (scores.get(personaId) ?? 0) + weight);
      }
    }
  }

  if (counted === 0) return null;

  // ترتیب فایل personas.json معیار تساوی است، پس نتیجه بین دو اجرا یکسان و
  // قابل پیش‌بینی می‌ماند. Object.entries روی Map نیز همین ترتیب را دارد.
  let winner = personas[0];
  let best = -1;
  for (const [personaId, score] of scores) {
    if (score > best) {
      best = score;
      winner = personas.find((p) => p.id === personaId) ?? winner;
    }
  }

  return best > 0 ? winner : null;
}

/**
 * پرسونای برنده به‌همراه امتیاز نرمال‌شدهٔ هر گزینه. برای نمایش نوارهای
 * محور ویژگی در پروفایل استفاده می‌شود.
 */
export async function scoreBreakdown(
  answers: OnboardingAnswer[],
): Promise<Record<string, number> | null> {
  const winner = await scorePersona(answers);
  if (!winner) return null;

  const personas = await readPersonas();
  const raw: Record<string, number> = {};
  for (const persona of personas) raw[persona.id] = 0;

  const questions = await readQuestions();
  const byId = new Map(questions.map((q) => [q.id, q]));
  for (const answer of answers) {
    const option = byId.get(answer.questionId)?.options[answer.optionIndex];
    if (!option) continue;
    for (const [personaId, weight] of Object.entries(option.weights)) {
      if (personaId in raw) raw[personaId] += weight;
    }
  }

  const max = Math.max(...Object.values(raw), 1);
  return Object.fromEntries(
    Object.entries(raw).map(([id, score]) => [id, score / max]),
  );
}
