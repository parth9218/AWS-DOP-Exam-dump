# AWS DOP-C02 Mock Exam Simulator — React Edition

A modern, highly performant, and interactive Single Page Application (SPA) designed to help candidates prepare for the **AWS Certified DevOps Engineer - Professional (DOP-C02)** exam.

Built with React 18 and Vite, this simulator cleanly separates a comprehensive reading hub from a state-aware mock testing engine, enabling both passive browsing and active assessment. 

## ✨ Features

- **📚 Global Question Bank Browser (Browse Mode)**
  - Quickly search through hundreds of AWS DOP-C02 questions.
  - Locally tracks which questions you have already attempted.
  - "Show Answer" toggle for immediate validation.
- **🎓 Interactive Mock Test Simulator (Exam Mode)**
  - Fully timed examination environment with active state tracking.
  - **Review & Flagging System:** Flag complex questions to review at the end of the session before submitting.
  - Keyboard navigation enabled (arrow keys to move, `F` to flag).
- **🤖 Deep AI Integration** 
  - Every single question includes a **1-Click "Copy for AI"** feature. This beautifully formats the entire raw question, its multiple-choice options, and the correct validation answer onto your clipboard—explicitly designed for pasting into ChatGPT or Claude for immediate, in-depth architectural explanations.
- **🌗 3-Way System-Aware Theming** 
  - Fully supports Light Mode, Dark Mode, and a reactive System Mode that ties directly into your macOS/Windows environment settings under the hood. 

---

## 🚀 How to Access

### 1. Online Application (GitHub Pages)
The application is pre-built and configured heavily around a native static `<HashRouter>`. It can be run entirely in your browser without any external backend servers.

🌐 **Access the Live Simulator here:**
[**https://parth9218.github.io/AWS-DOP-Exam-dump/**](https://parth9218.github.io/AWS-DOP-Exam-dump/)

*(Note: Data is saved to your local browser storage. Refreshing the active webpage will not break your routing path!)*

### 2. Running Locally (Development)
If you wish to augment the question bank logic or tweak UI components:

```bash
# 1. Clone the repository
git clone https://github.com/parth9218/AWS-DOP-Exam-dump.git

# 2. Navigate to the React application directory
cd AWS-DOP-Exam-dump/exam-app

# 3. Install NPM dependencies
npm install

# 4. Start the Vite Development Server
npm run dev
```

The application will launch hot-reloaded at `http://localhost:5173/`.

---

## 🛠️ Architecture & Deployment 

This repository handles an interesting deployment pattern specifically optimized for automated GitHub Pages hosting directly from the `main` branch.

- **`/exam-app/`** — Houses the standard Vite/React source application (`src/`, `components/`, etc).
- **`/ (Project Root)`** — Acts strictly as the static distribution folder. It contains the generated `index.html` and `/assets/` directory which are directly served by GitHub Pages.

**Deployment Automation Hooks:**
The transition of the built assets from the sub-folder directly into the repository root is fully automated via Git Hooks. When developers trigger a `$ git commit` on the `main` branch, a local background task automatically triggers `npm run build`, scrubs the root directory of outdated assets, populates it with the fresh UI payload, and attaches them natively into your ongoing commit payload. Therefore, standard pushes immediately blast live changes to the SPA!
