# 🚀 Journey AI

> Navigate your career journey with AI — Transform any goal into a precision-engineered roadmap.

![Journey AI](https://img.shields.io/badge/Built%20with-Claude%20AI-blue) ![Status](https://img.shields.io/badge/Status-Live-brightgreen) ![Challenge](https://img.shields.io/badge/DDS-AI%20Challenge%202026-orange)

## 🌐 Live App

**[https://journey-ai.replit.app](https://journey-ai.replit.app)**

## 🌟 What is Journey AI?

Journey AI is an AI-powered web application that transforms any learning or career goal into a personalized, step-by-step roadmap with phases, milestones, tasks, and an AI coach that evolves with you.

**Stop staring at a blank page. Start your journey.**

## ✨ Features

- 🎯 **Goal-to-Roadmap** — Type any goal, get a full structured learning path instantly
- 📋 **Rich Task Details** — Each task includes: Why it matters, Practical exercise, Expected outcome, Resources, Tools, Expert tips, Common mistakes
- 📺 **YouTube Thumbnail Previews** — Resources display as clickable thumbnails with play buttons
- 🔽 **Collapsible Details** — Clean UI with expandable task details
- 📊 **Progress Dashboard** — Track your journey card by card
- 🔐 **Authentication** — Sign in with Google, Apple, LinkedIn, or Email
- 🔥 **Streak System** — Stay motivated with daily learning streaks
- 💾 **Persistent Storage** — Your journeys are always saved

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| AI | Claude API (Anthropic) / OpenAI |
| Database | PostgreSQL |
| Auth | Clerk |
| Deployment | Replit |

## 🚀 Live Demo

🔗 **[Try Journey AI →](https://journey-ai.replit.app)**

## 🏃 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/muntherh/journey-ai.git
cd journey-ai

# Install dependencies
npm install

# Set up environment variables
# Add your API keys to Replit Secrets or .env file:
# ANTHROPIC_API_KEY=your_key
# DATABASE_URL=your_postgres_url
# CLERK_SECRET_KEY=your_clerk_key

# Run the app
npm run dev
```

## 🔐 Environment Variables

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
DATABASE_URL=your_postgres_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

> ⚠️ Never commit your API keys. Use Replit Secrets or .env files.

## 📈 Key Improvements Made

- ✅ Raised LLM token limit to 16,000 for richer roadmap generation
- ✅ Fixed JSON truncation bug with `finish_reason` check
- ✅ YouTube thumbnails computed from video ID (no external API)
- ✅ Collapsible task details for clean UX
- ✅ Multi-provider authentication (Google, Apple, LinkedIn, Email)
- ✅ Input validation and error handling

## 🏆 Built For

**[DDS AI Application Challenge — 12th Edition](https://nas.com/artificialintelligence/challenges/building-ai-application-jun)**

**Challenge Path:** LLM/API Integration
**Builder:** Al-Munther Al-Harrasi
**University:** UTAS, Muscat
**Timeline:** June 21–28, 2026

## 📬 Connect

- LinkedIn: [Al-Munther Al-Harrasi](https://www.linkedin.com/in/al-munther-al-harrasi-726318402/)
- Twitter/X: [@munxmx](https://x.com/munxmx)

---

*Built with ❤️ during the DDS AI Application Challenge 2026*
