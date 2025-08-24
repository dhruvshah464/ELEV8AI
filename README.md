[![View My Profile](https://img.shields.io/badge/View-My_Profile-green?logo=LinkedIn)](https://www.linkedin.com/in/shah-dhruv-/)
[![View My Resume](https://img.shields.io/badge/View-My_Resume-0A66C2?logo=LinkedIn&logoColor=white)](https://www.linkedin.com/in/shah-dhruv-/)

<h1 align="center">💼 JobGeniusAI – AI Career Coach 🤖</h1>

![Demo App](https://github.com/DevGoyalG/JobGeniusAI/blob/main/JobGeniusAI.png)

## 🌟 Highlights:

- 🚀 Tech stack: Next.js, Vite, Tailwind CSS & Shadcn UI  
- 🧠 LLM Integration (Gemini AI) for smart recommendations  
- 📄 AI Resume & Cover Letter Builder  
- 🎯 Personalized Interview Preparation  
- 📊 Industry Insights Module  
- 🔒 Authentication & Authorization (Clerk)  
- 💾 Database Management (Neon PostgreSQL)  
- 💻 Modern, Responsive UI Design  
- 🎭 Client & Server Components with seamless integration  
- 🌐 Deployed for high performance on Vercel  

## ✨ Features

- **AI-Powered Resume Builder**: Generate tailored resumes based on your skills and experience.
- **Cover Letter Generator**: Create personalized cover letters for job applications.
- **Interview Preparation**: Access common interview questions and tips.
- **Industry Insights**: Stay updated with the latest trends in your desired field.
- **User Authentication**: Secure sign-in/sign-up using Clerk.
- **Responsive Design**: Seamless experience across devices.

## Setup .env file

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database
DATABASE_URL=

# Gemini API
GEMINI_API_KEY=
```

## 🧩 Getting Started

1. Clone the repository

```shell
git clone https://github.com/DevGoyalG/ShrinkURLs.git
cd ShrinkURLs
```

2. Install dependencies:

```shell
npm install
```

3. Set up your environment variables as shown above
4. Run the development server:

```shell
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application can be easily deployed to Vercel:

```shell
npm run build
npm run start
```

Or connect your GitHub repository to Vercel for automatic deployments.

## 🚀 Technologies Used

- **Next.js & Vite**: Fast, modern frameworks for frontend and full-stack development  
- **Tailwind CSS & Shadcn UI**: Utility-first styling and pre-built UI components  
- **Clerk**: Secure authentication and user management system  
- **Neon**: Scalable PostgreSQL database solution with serverless support  
- **Gemini AI**: Google’s LLM for generating smart, context-aware career guidance  
- **Vercel**: Deployment platform ensuring high performance and global scalability  

## 📚 Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/docs)
- [Gemini API Documentation](https://ai.google.dev/gemini-api)
- [Neon Documentation](https://neon.tech/docs)

## 🤝 Connect with Me

<a href="https://www.linkedin.com/in/shah-dhruv-/" target="_blank">
  <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
</a>

---

<p align="center">
  <b>Thank you for visiting! Happy Learning 🚀</b>
</p>
