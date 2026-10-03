# Graph Report - planner  (2026-10-03)

## Corpus Check
- 74 files · ~25,160 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .prisma 2, (none) 1, .toml 1)

## Summary
- 474 nodes · 1074 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ac7e209`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tasks-page-client.tsx
- track
- actions/auth.ts
- package.json
- ui.tsx
- personas.ts
- react
- cn
- components.json
- compilerOptions
- dependencies
- 9router
- devDependencies
- بریف کامل پروژه - اپ مشاور هوشمند کارهای روزانه
- auth.spec.ts
- goal-tasks.tsx
- lib/goals.ts
- README.md
- AGENTS.md
- postcss.config.mjs
- { GET, POST }

## God Nodes (most connected - your core abstractions)
1. `track()` - 30 edges
2. `currentUserId()` - 27 edges
3. `next` - 26 edges
4. `TasksPageClient()` - 23 edges
5. `prisma` - 23 edges
6. `PATHS` - 20 edges
7. `scripts` - 16 edges
8. `AppShell()` - 16 edges
9. `requirePersona()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `RegisterForm()` --indirect_call--> `registerAction()`  [INFERRED]
  src/app/register/register-form.tsx → src/lib/actions/auth.ts
- `TimeHint()` --calls--> `toFa()`  [EXTRACTED]
  src/components/ui.tsx → src/lib/fa.ts
- `GoalDetailPage()` --calls--> `AddLogForm()`  [EXTRACTED]
  src/app/goals/[id]/page.tsx → src/app/goals/[id]/add-log-form.tsx
- `GoalDetailPage()` --calls--> `GoalTasks()`  [EXTRACTED]
  src/app/goals/[id]/page.tsx → src/app/goals/[id]/goal-tasks.tsx
- `GoalDetailPage()` --calls--> `StatTile()`  [EXTRACTED]
  src/app/goals/[id]/page.tsx → src/components/ui.tsx

## Import Cycles
- None detected.

## Communities (22 total, 4 thin omitted)

### Community 0 - "tasks-page-client.tsx"
Cohesion: 0.08
Nodes (54): class-variance-authority, AdvisorChat(), GoalAdvisorPage(), GoalDetailPage(), metadata, NewGoalPage(), GoalsListPage(), metadata (+46 more)

### Community 1 - "track"
Cohesion: 0.10
Nodes (44): nextConfig, next, @prisma/client, zod, metadata, metadata, metadata, addFreeGoalLogAction() (+36 more)

### Community 2 - "actions/auth.ts"
Cohesion: 0.08
Nodes (40): bcryptjs, next-auth, DashboardPage(), metadata, LoginForm(), LoginPage(), metadata, HomePage() (+32 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, name, private, scripts, build, db:deploy, db:generate, db:migrate (+29 more)

### Community 4 - "ui.tsx"
Cohesion: 0.11
Nodes (31): FALLBACK, geist, geistMono, metadata, resolveTheme(), RootLayout(), vazirmatn, getProfileStats() (+23 more)

### Community 5 - "personas.ts"
Cohesion: 0.11
Nodes (24): metadata, OnboardingPage(), Option(), QuestionStep(), Bar(), answerQuestionAction(), requireUser(), findPersona() (+16 more)

### Community 6 - "react"
Cohesion: 0.11
Nodes (19): react, react-dom, AddLogForm(), Submit(), GoalForm(), Submit(), SubmitButton(), RegisterForm() (+11 more)

### Community 7 - "cn"
Cohesion: 0.08
Nodes (5): @base-ui/react, cn, Progress(), ProgressIndicator(), ProgressTrack()

### Community 8 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 10 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, framer-motion, lucide-react, next (+9 more)

### Community 11 - "9router"
Cohesion: 0.14
Nodes (13): models, name, npm, options, oc/muse-spark-1.2-contributor-free, oc/muse-spark-1.3-contributor-free, name, name (+5 more)

### Community 12 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, babel-plugin-react-compiler, dotenv, eslint, eslint-config-next, @playwright/test, prisma, tailwindcss (+5 more)

### Community 13 - "بریف کامل پروژه - اپ مشاور هوشمند کارهای روزانه"
Cohesion: 0.17
Nodes (11): استک فنی (قطعی), بریف کامل پروژه - اپ مشاور هوشمند کارهای روزانه, تم قابل‌تغییر توسط کاربر, ثبت رویداد (الزامی برای هر اکشن کاربر), سیستم رنگ (CSS Variables - این ساختار باید دقیقاً حفظ شود), طراحی - مرجع‌ها, فایل‌های پیوست, مسیر کاربر (به ترتیب بساز، هر مرحله یک برش کامل با API + UI) (+3 more)

### Community 14 - "auth.spec.ts"
Cohesion: 0.27
Nodes (7): @playwright/test, emailField(), emailOf(), passwordField(), prisma, register(), uniq()

### Community 15 - "goal-tasks.tsx"
Cohesion: 0.33
Nodes (8): buildTree(), GoalTasks(), handleCheck(), renderTask(), Task, TreeTask, createGoalTaskAction(), toggleGoalTaskAction()

### Community 16 - "lib/goals.ts"
Cohesion: 0.57
Nodes (6): countDistinctDays(), GoalProgress, progressOf(), startOfWeek(), weeklyProgress(), weeklyTotals()

### Community 17 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **178 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+173 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `track` to `tasks-page-client.tsx`, `actions/auth.ts`, `package.json`, `ui.tsx`, `personas.ts`, `react`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `tasks-page-client.tsx`, `package.json`, `ui.tsx`, `cn`, `goal-tasks.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _178 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tasks-page-client.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07834101382488479 - nodes in this community are weakly interconnected._
- **Should `track` be split into smaller, more focused modules?**
  _Cohesion score 0.0994535519125683 - nodes in this community are weakly interconnected._
- **Should `actions/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0783673469387755 - nodes in this community are weakly interconnected._