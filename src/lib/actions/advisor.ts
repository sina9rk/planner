"use server";

/**
 * فقط UI برای چت مشاور. بدون اتصال واقعی به AI.
 * ساختار طوری است که بعداً با جایگزینی این تابع با فراخوان واقعی API
 * بقیه صفحه دست‌نخورده بماند.
 */
export type AdvisorMessage = {
  role: "ai" | "user";
  content: string;
  chips?: string[];
};

export async function getAdvisorReply(userMessage: string): Promise<AdvisorMessage> {
  void userMessage;
  return {
    role: "ai",
    content:
      "پیشنهاد می‌کنم این هفته روی هدفت یه قدم کوچک ولی ثابت برداری. همین الان یه لاگ کوتاه ثبت کن تا ریتم ادامه داشته باشه.",
    chips: ["ثبت لاگ سریع", "برنامه این هفته"],
  };
}
