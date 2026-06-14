# 🏢 SteelMart - B2B Steel Manufacturing & Distribution Platform

A comprehensive full-stack B2B platform designed to streamline steel manufacturing and distribution processes. SteelMart provides a modern solution for managing bids, proposals, and vendor relationships with comprehensive reporting and analytics capabilities.

The platform features separate interfaces for employees and vendors, enabling seamless collaboration and efficient project management in the steel industry.

---

## ✨ Key Features

- **Bid Management** - Create, track, and manage comprehensive bids with detailed cost breakdowns
- **User Roles** - Separate portals for employees and vendors with role-based access control
- **Project Gallery** - Organized project documentation with file management capabilities
- **RFI & Submittals** - Request for Information and submittal tracking systems
- **Analytics & Reports** - Comprehensive reporting and financial analytics dashboard
- **Secure Authentication** - JWT-based authentication with role-based access control

---

## 🛠️ Technology Stack

### Frontend
- **React** 19.2.6 - UI library
- **Vite** 8.0.10 - Build tool
- **React Router** 7.14.1 - Navigation
- **FullCalendar** 6.1.20 - Calendar functionality
- **Lucide React** 1.16.0 - Icons
- **React Quill** 3.7.0 - Rich text editor

### Backend
- **Node.js** - Runtime environment
- **Express.js** 5.2.1 - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** 3.0.3 - Password encryption
- **Nodemon** - Development hot reload

### Development
- **npm Workspaces** - Monorepo management
- **Concurrently** 10.0.3 - Run multiple processes
- **Express Validator** 7.3.2 - Input validation
- **Express Rate Limit** 8.3.2 - Rate limiting

---

## 📦 Prerequisites

Before you start, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (v6 or higher) - Comes with Node.js
- **MySQL** (v5.7 or higher) - [Download](https://www.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/harshad912004/SteelMart.git
cd SteelMart
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for both frontend and backend using npm workspaces.

### Step 3: Environment Configuration

#### Backend .env Setup

Create a `.env` file in the `Backend` folder:

```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=steelmart
PORT=5000
APP_HOST=0.0.0.0
JWT_SECRET_KEY=your_jwt_secret_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend .env Setup

Create a `.env` file in the `Frontend` folder:

```env
VITE_API_URL=http://localhost:5000
APP_HOST=0.0.0.0
```

### Step 4: Database Setup

Create MySQL database and import the schema:

```bash
mysql -u root -p steelmart < Backend/config/steelmart_create.sql
```

### Step 5: Run the Application

From the root directory, start both backend and frontend:

```bash
npm run dev
```

**What this does:**
- Starts the Backend server on `http://localhost:5000`
- Starts the Frontend application on `http://localhost:5173`
- Access the Employee portal at `http://localhost:5173/employee/login`
- Access the Vendor portal at `http://localhost:5173/vendor/login`

### Alternative: Run Frontend & Backend Separately

```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

---

## 📁 Project Structure

```
SteelMart/
├── Frontend/                    # React + Vite application
│   ├── src/
│   │   ├── common/             # Shared components & utilities
│   │   ├── employees/          # Employee portal
│   │   ├── vendors/            # Vendor portal
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Backend/                     # Node.js + Express API
│   ├── employee/               # Employee routes & controllers
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── services/
│   ├── vendor/                 # Vendor routes & controllers
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── services/
│   ├── common/                 # Shared utilities
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── utils/
│   ├── config/                 # Database configuration
│   ├── uploads/                # File uploads directory
│   ├── app.js                  # Express app setup
│   └── package.json
├── package.json                # Root package with workspaces
├── README.md                   # Project documentation
└── index.html                  # GitHub Pages entry point
```

---

## 🔌 API Endpoints Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh-token` | Refresh JWT token |

### Bids Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bids` | List all bids |
| GET | `/api/bids/:id` | Get bid details |
| POST | `/api/bids/create` | Create new bid |
| PUT | `/api/bids/:id/update` | Update bid |
| DELETE | `/api/bids/:id` | Delete bid |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | List all vendors |
| GET | `/api/vendors/:id` | Get vendor details |
| POST | `/api/vendors` | Add vendor |

### RFI (Request for Information)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rfi` | List all RFIs |
| POST | `/api/rfi/create` | Create RFI |
| PUT | `/api/rfi/:id` | Update RFI |

### Submittals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submittals` | List submittals |
| POST | `/api/submittals/create` | Create submittal |
| PUT | `/api/submittals/:id` | Update submittal |

### Reports & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/financial` | Financial reports |
| GET | `/api/reports/projects` | Project reports |
| GET | `/api/analytics/dashboard` | Dashboard analytics |

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run frontend` | Start frontend development server only |
| `npm run backend` | Start backend development server only |
| `npm run install-all` | Install dependencies for all workspaces |
| `npm --workspace Frontend run build` | Build frontend for production |
| `npm --workspace Backend run start` | Start backend server |

---

## 🔧 Troubleshooting

### Port Already in Use

If port 5000 or 5173 is already in use:

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

Or change the port in backend `.env` file and update frontend's API URL.

### Database Connection Error

- Verify MySQL is running
- Check credentials in `.env` file
- Ensure database `steelmart` is created
- Run the SQL import script again

### Dependencies Not Installed

Clear cache and reinstall:

```bash
npm cache clean --force
npm install
```

### Module Not Found Errors

Ensure all dependencies are installed:

```bash
npm run install-all
```

### CORS Issues

Update `CORS_ALLOWED_ORIGINS` in Backend `.env` to include your frontend URL:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License & Contact

- **License:** ISC
- **Author:** Harshad
- **Repository:** [github.com/harshad912004/SteelMart](https://github.com/harshad912004/SteelMart)
- **Issues:** [GitHub Issues](https://github.com/harshad912004/SteelMart/issues)

---

## 🌐 Live Access

Once the application is running locally, you can access it at:

- **Employee Portal:** [http://localhost:5173/employee/login](http://localhost:5173/employee/login)
- **Vendor Portal:** [http://localhost:5173/vendor/login](http://localhost:5173/vendor/login)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 📞 Support & Feedback

For issues, questions, or suggestions, please:

- Open an [Issue](https://github.com/harshad912004/SteelMart/issues) on GitHub
- Check [Discussions](https://github.com/harshad912004/SteelMart/discussions)
- Contact the maintainer

---

**Built By Harshad with ❤️ using React, Node.js, and MySQL**

*© 2026 SteelMart. All rights reserved.*
