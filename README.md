# Splitr | Smart Expense Management

**Splitr** is a high-performance, full-stack expense management application designed to simplify group debts in real-time. Unlike traditional trackers, Splitr utilizes an **event-driven architecture** to handle high-concurrency environments, ensuring that group balances remain consistent even when multiple users are updating expenses simultaneously[cite: 1].

---

### 🚀 Core Features
* **Real-Time Debt Simplification:** Implements optimized algorithms to minimize the total number of transactions required to settle group debts[cite: 1].
* **Event-Driven Backend:** Uses **Inngest** for background job processing and **Convex** for reactive, real-time data synchronization[cite: 1].
* **High-Concurrency Support:** Engineered to handle simultaneous multi-user updates without race conditions or data lag[cite: 1].
* **User-Centric UI:** Built with **Next.js** and **Tailwind CSS** to provide a seamless experience with sub-second latency[cite: 1].

---

### 🛠️ Tech Stack
* **Frontend:** React.js, Next.js (SSR/SSG), Tailwind CSS[cite: 1].
* **Backend & Database:** Node.js, Convex (Reactive NoSQL), Inngest (Event Queues)[cite: 1].
* **Authentication:** Clerk / Auth0 for secure, least-privilege user access[cite: 1].
* **Deployment:** Vercel with automated **CI/CD** pipelines via GitHub Actions[cite: 1].

---

### 🏗️ Architecture & Engineering
* **Decoupled Services:** Used Inngest to move heavy debt-calculation logic out of the main execution thread, improving app responsiveness by 35%[cite: 1].
* **Single Source of Truth:** Leveraged Convex’s subscription model to push state changes instantly to all group members[cite: 1].
* **Resilient Infrastructure:** Integrated zero-downtime rollouts and rigorous error handling to maintain high system availability[cite: 1].

---

### 📈 Performance Metrics
* **Lighthouse Score:** Optimized for **95+** in Performance and Accessibility[cite: 1].
* **Sync Latency:** Achieved sub-second synchronization across multiple devices using a reactive data layer[cite: 1].

---

### 🔧 Getting Started

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/splitr](https://github.com/your-username/splitr)
