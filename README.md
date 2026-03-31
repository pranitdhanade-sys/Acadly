# Acadly# Acadly 🎓

### Modern Academic Management System

**Acadly** is a high-performance, full-stack academic management solution designed to streamline institutional workflows, enhance collaboration between educators and students, and centralize all academic operations into a unified digital platform. It minimizes administrative overhead while maximizing productivity, transparency, and accessibility across the entire education lifecycle.

---

## 🌟 Key Features

### 📊 Smart Attendance

Automated attendance tracking with one-click marking, real-time syncing, and detailed monthly analytics reports for both faculty and administration.

### 📂 Dynamic Resource Hub

A centralized cloud-based repository for lecture notes, syllabus documents, recorded lectures, and multimedia resources, accessible anytime.

### 📝 Assignment Pipeline

Complete lifecycle management for assignments including creation, submission, deadline tracking, evaluation, and optional automated grading systems.

### 📈 Unified Dashboard

Role-based dashboards providing personalized insights:

* **Students:** GPA tracking, attendance stats, schedules, assignments
* **Faculty:** Class performance analytics, attendance summaries, workload overview

### 🛠️ Admin Control Panel

Full institutional control including student enrollment, faculty assignment, course structuring, and academic scheduling.

---

## 💻 Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| **Frontend**   | React, Next.js, Tailwind CSS     |
| **Backend**    | Node.js, Express.js              |
| **Database**   | MongoDB (Mongoose ODM)           |
| **Auth**       | JSON Web Tokens (JWT) / NextAuth |
| **Deployment** | Vercel / Docker                  |

---

## 🚀 Getting Started

### 🔧 Prerequisites

* **Node.js** (v18.0.0 or higher)
* **MongoDB** (Local instance or Atlas Cluster)
* **npm** or **yarn**

---

### ⚙️ Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/pranitdhanade-sys/Acadly.git
cd Acadly
```

#### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# If using client-server structure
cd client && npm install
cd ../server && npm install
```

#### 3. Configure Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

#### 4. Run the Application

```bash
# From root directory
npm run dev
```

---

## 🏗️ Project Structure

```text
Acadly/
├── client/              # Next.js frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Application routes
│   └── public/          # Static assets
│
├── server/              # Node.js backend
│   ├── models/          # Database schemas (Mongoose)
│   ├── controllers/     # Business logic layer
│   ├── routes/          # API endpoints
│   └── middleware/      # Auth & request processing
│
├── .env                 # Environment variables
├── package.json         # Project dependencies
└── README.md            # Documentation
```

---

## 🔐 Authentication Flow

* User registers/logs in
* Backend validates credentials
* JWT token is issued
* Token is used for protected API access
* Role-based authorization applied

---

## ⚡ Performance & Scalability

* Optimized API structure using Express middleware
* Efficient MongoDB queries via indexing
* Lazy loading and SSR with Next.js
* Containerized deployment support with Docker

---

## 🤝 Contributing

Contributions are welcome and encouraged.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes

```bash
git commit -m "Add NewFeature"
```

4. Push to your branch

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Pranit Dhanade**

* GitHub: https://github.com/pranitdhanade-sys
* Focus: Full-Stack Engineering | Robotics | Cybersecurity

---

## ❤️ Vision

Acadly aims to transform traditional education systems into intelligent, automated, and scalable digital ecosystems that empower both educators and learners with modern tools and seamless experiences.
