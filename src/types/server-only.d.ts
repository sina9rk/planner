/**
 * پکیج server-only در node_modules نصب نیست ولی Next در باندلر آن را
 * alias می‌کند (next/dist/build/create-compiler-aliases). این اعلان فقط برای
 * TypeScript است تا importهای src/services/* معتبر باشند؛ در زمان اجرا
 * خودِ Next ماژول را resolve می‌کند.
 */
declare module "server-only";
