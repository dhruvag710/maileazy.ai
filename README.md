<h1 align="center">📬 maileazy.ai – The Smart Mail Productivity Assistant</h1>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-blue.svg?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/LLM%20Integration-Enabled-purple.svg?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Productivity-Booster-orange.svg?style=for-the-badge"/>
</p>

> ✨ Automate, Organize & Prioritize Your Emails with Ease ✨  
> Built with LLMs, Gmail API, and custom-designed logic for productivity.

---

## 🚀 Overview

**maileazy.ai** is an AI-powered smart mail assistant designed to simplify the email experience. It automatically classifies new emails, assigns priority levels, extracts actionable to-dos, detects deadlines, and even integrates calendar logic for setting up meetings — all powered by a custom LLM-based backend.

---

## 🧠 Key Features

### 📂 Email Categorization
Emails are sorted into specific, real-world folders:
- **Meeting Invitations & Scheduling**
- **Academic & Administrative Notices**
- **Research, Collaborations & Grants**
- **Internship & Job Opportunities**
- **Payments, Banking & Transactions**
- **Order Confirmations & Deliveries**
- **Spam & Promotions**
- **General / Others**

### 🔥 Priority Tagging
Each mail is automatically tagged with:
- `HIGH` – Urgent and time-sensitive  
- `MEDIUM` – Important but not immediate  
- `LOW` – Can be handled later

### ✅ To-Do Extraction
Detects actionable tasks from email content and presents them in a dynamic to-do list.

### ⏰ Deadline Detection
Parses and highlights upcoming deadlines or submission dates from mail content.

### 📅 Calendar Meeting Suggestion
Detects meeting intent and suggests scheduling options — one step closer to smart calendar integration.

---

## 🧠 LLM Prompt Design Philosophy

I built a **custom LLM-based architecture** using OpenRouter’s Claude 3 Sonnet API. Instead of relying on generic chat-like behavior, I engineered a **prompt structure tailored to academic, research, and student-professional scenarios**.

### Design Highlights:
- Granular categories based on real-world academic/research emails
- Context-aware classification using natural language understanding
- Action-oriented parsing: extracts tasks and associated deadlines
- Lightweight and explainable design, optimized for speed and clarity

This prompt design acts as the intelligent core of `maileazy.ai`.

---

## 🧑‍💻 Author & Project Owner

**👨‍💻 Dhruv Agarwal**  
- B.Tech CSE @ IIIT Nagpur (2023–2027)  
- Machine Learning Intern @ IIT Bombay  
- Passionate about productivity, AI, and solving real-world workflow problems  
- 📫 agarwaldhruv71@gmail.com  
- 🌐 [LinkedIn](https://linkedin.com/in/dhruvag710) | [GitHub](https://github.com/dhruvag710)

---



## 🛠️ How to Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-username/maileazy.ai.git
cd maileazy.ai

# 2. Install dependencies
npm install

# 3. Create a .env file and add:
# - GMAIL_CLIENT_ID
# - GMAIL_CLIENT_SECRET
# - REDIRECT_URI
# - OPENROUTER_API_KEY

# 4. Run the server
node index.js

# 5. Frontend can be accessed at localhost:<your-port>
