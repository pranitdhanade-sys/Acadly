# 🤝 Contributing to Acadly

First off, thank you for considering contributing to **Acadly**! Your help makes this academic management tool better for students and professors everywhere.

By participating in this project, you agree to abide by our **Code of Conduct**.

---

## 🏗️ Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **Docker & Docker Compose** (for automated environment setup)
- **Git**
- **PostgreSQL / MongoDB** (if running services natively)

---

### 2. Local Setup

1. **Fork** the repository on GitHub.

2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Acadly.git
   cd Acadly
   ```

3. **Install Dependencies:**
   ```bash
   # Root & Backend dependencies
   npm install

   # Frontend dependencies
   cd client && npm install
   cd ..
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`.

5. **Launch Environment:**
   ```bash
   # Using Docker (Recommended)
   docker-compose up --build
   ```

---

## 🛠️ Development Workflow

### Branching Strategy

We use a feature-branch workflow:

- `main` → Stable, production-ready code  
- `dev` → Integration branch for upcoming releases  
- `feat/feature-name` or `fix/issue-name` → Your working branch  

---

### Coding Standards

- **Frameworks:** React / Next.js for UI, Express.js for backend  
- **Styling:** Tailwind CSS utility classes  
- **Database:**  
  - MongoDB → Mongoose  
  - PostgreSQL → node-postgres  
- **Commits:** Follow Conventional Commits  
  - Example:  
    - `feat: add attendance scanning`  
    - `fix: resolve jwt expiration`

---

## 🧪 Testing & Linting

Before submitting a PR:

```bash
npm run lint
```

- Ensure no sensitive credentials (keys/secrets) are committed.

---

## 🚀 Submitting a Pull Request (PR)

1. Commit your changes with a descriptive message  
2. Push to your fork:
   ```bash
   git push origin feat/your-feature
   ```
3. Open a PR against the `dev` branch of the original repository  
4. Describe your changes clearly  
   - Explain *what* you changed and *why*  
   - Reference issues (e.g., `Closes #42`)  
5. Address review feedback from maintainers  

---

## 📞 Support

If you have questions or get stuck:

- Open a GitHub Discussion  
- Check existing Issues for similar problems  

---

Happy Coding! 🎓


