import { redirect } from "next/navigation";
import { Bar, primaryButtonClass } from "@/components/ui";
import { faNum } from "@/lib/fa";
import { requireUser } from "@/lib/guards";
import { PATHS } from "@/lib/flow";
import { readQuestions, type Question } from "@/lib/personas";
import { answerQuestionAction } from "@/lib/actions/onboarding";
import { parseAnswers } from "@/lib/stats";

export const metadata = { title: "آنبوردینگ | برنامه‌ریز" };

/**
 * یک گزینهٔ انتخابی. عمداً input واقعی است نه دکمه: با دکمه، صفحه‌کلید و
 * screen reader نمی‌توانند بین گزینه‌ها جابه‌جا شوند و فرم هم با Enter
 * کار نمی‌کرد.
 */
function Option({
  index,
  label,
  checked,
}: {
  index: number;
  label: string;
  checked: boolean;
}) {
  return (
    <label
      className={`mb-2.5 flex cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-3 text-[13.5px] transition ${
        checked
          ? "border-accent bg-surface-soft text-text"
          : "border-line bg-surface text-text hover:bg-raised"
      }`}
    >
      <input
        type="radio"
        name="optionIndex"
        value={index}
        defaultChecked={checked}
        className="size-4 shrink-0 accent-[var(--accent)]"
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * فرم یک سؤال. کلاینتی است چون انتخاب گزینه باید بلافاصله استایل گزینهٔ
 * انتخاب‌شده را عوض کند (حاشیهٔ accent در مرجع طراحی) و این وضعیت سمت
 * سرور نیست.
 */
function QuestionStep({
  question,
  index,
  total,
}: {
  question: Question;
  index: number;
  total: number;
}) {
  return (
    <form action={answerQuestionAction} className="flex flex-1 flex-col">
      <input type="hidden" name="questionId" value={question.id} />

      {/* آواتار لیلا، همان‌طور که در مرجع طراحی بالای حباب سؤال است. */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-ink">
          ل
        </span>
        <span className="text-[13px] text-text">
          لیلا
          <small className="block text-[11px] text-muted">مشاور برنامه‌ریزی</small>
        </span>
      </div>

      {/* حباب سؤال؛ گوشهٔ بالا-راست صاف است مثل مرجع. */}
      <p className="mb-4 rounded-[4px_16px_16px_16px] border border-line bg-surface px-3.5 py-3 text-[15px]">
        {question.prompt}
      </p>

      <div className="flex-1">
        {question.options.map((option, optionIndex) => (
          <Option
            key={option.label}
            index={optionIndex}
            label={option.label}
            checked={false}
          />
        ))}
      </div>

      <button type="submit" className={primaryButtonClass}>
        بعدی
      </button>

      {index === total - 1 ? (
        <p className="mt-2 text-center text-[11px] text-muted">
          آخرین سؤال؛ بعدش نتیجه‌ات را می‌بینی.
        </p>
      ) : null}
    </form>
  );
}

export default async function OnboardingPage() {
  const user = await requireUser();

  // کسی که پرسونا دارد دیگر سؤال‌ها را نمی‌بیند.
  if (user.personaId) redirect(PATHS.persona);

  const questions = await readQuestions();
  const answers = parseAnswers(user.onboardingAnswers);

  // سؤال جاری از روی تعداد پاسخ‌های ثبت‌شده تعیین می‌شود، نه از query string.
  // دلیلش این است که اگر کاربر صفحه را refresh کند یا لینک را باز کند، مرحلهٔ
  // درست نمایش داده می‌شود؛ با query string یک refresh ساده همه‌چیز را به
  // سؤال اول برمی‌گرداند.
  const answered = new Set(answers.map((answer) => answer.questionId));
  const current = questions.find((q) => !answered.has(q.id));

  // پاسخ‌هایی که به سؤالی در فایل فعلی نیستند (سؤال حذف‌شده) در شمارش
  // نمی‌آیند، وگرنه نوار پیشرفت از ۱۰۰٪ رد می‌کرد.
  const doneCount = questions.filter((q) => answered.has(q.id)).length;
  const total = questions.length;

  // اگر فایل پیکربندی خالی باشد یا همهٔ سؤال‌ها جواب داده شده باشند، اینجا
  // تمام می‌شود. نگهبان خالی بودن لازم است چون پایین‌تر length را در
  // تقسیم استفاده می‌کنیم.
  if (total === 0 || !current) redirect(PATHS.persona);

  const stepNumber = doneCount + 1;
  const percent = Math.round((doneCount / total) * 100);

  return (
    <main className="flex min-h-dvh flex-col bg-bg px-4 py-6 text-text">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        {/* نوار پیشرفت: عدد «۳ از ۸» در سمت راست، نوار پر شده در بقیهٔ عرض. */}
        <div className="mb-5 flex items-center gap-2.5 text-[12px] text-muted">
          <span className="shrink-0">
            {faNum(stepNumber)} از {faNum(questions.length)}
          </span>
          <Bar percent={percent} />
        </div>

        <QuestionStep question={current} index={doneCount} total={total} />
      </div>
    </main>
  );
}
