# ⏳ Deadline OS

> Turn confusing notices into a clear action plan before the deadline passes.

## 🎯 The problem

Students and busy people receive deadlines in PDFs, screenshots, emails, and messages.

- 😵 Important dates are easy to miss
- 📄 Required documents are forgotten
- 🗓️ Planning starts too late

## ✨ The solution

**Deadline OS** reads a notice, finds its deadline and required documents, then creates a simple plan with reminders and risk tracking.

## 🚀 Hackathon features

| Icon | Feature                                                   |
| ---- | --------------------------------------------------------- |
| 📸   | Upload a screenshot or PDF                                |
| 📝   | Paste a notice or share text from another Android app     |
| 🤖   | Gemini extracts deadlines, documents, and instructions    |
| 🧭   | Personalized onboarding adjusts the planning style        |
| 📅   | Smart task timeline, calendar, and deadline view          |
| 🔔   | Review and approve reminder suggestions                   |
| ✅   | Mark tasks **Done**, **Later**, or **Blocked**            |
| 🛟   | Blocked assistant suggests recovery steps                 |
| 📊   | Risk score and completion insights update as work changes |
| 📴   | Demo Mode keeps the core demo usable offline              |

## 🔒 Privacy first

- Private notice files stay in Supabase Storage
- Every user sees only their own data
- Gemini API key stays on the server, never inside the app

## 🛠️ Built with

`Expo SDK 57` · `React Native` · `TypeScript` · `Supabase` · `Gemini` · `Zustand` · `Expo Notifications`

## ▶️ Run locally

```bash
npm install
npx expo start
```

For an Android development build:

```bash
npm run android
```

## 🎬 Demo flow

1. 👋 Complete onboarding
2. ➕ Add a pasted notice, screenshot, or PDF
3. 🔎 Extract details with Gemini or choose Demo Mode
4. ✏️ Review the deadline and documents
5. ✅ Create the plan and approve reminders
6. 📈 Track tasks and reduce deadline risk

---

Built for a hackathon to make deadline management calm, clear, and actionable. 🌟
