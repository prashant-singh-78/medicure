# 🏥 Medicure — AI-Powered Smart Healthcare Assistant

<p align="center">
  <b>Intelligent Healthcare • Machine Learning • Deep Learning • Smart Health Management</b>
</p>

<p align="center">
  An AI-powered healthcare platform combining disease prediction, medical image analysis, voice processing, and healthcare management in one application.
</p>

<p align="center">
  <a href="https://medicure-2oj3.onrender.com">🚀 Live Backend API</a> •
  <a href="https://github.com/prashant-singh-78/medicure">💻 GitHub Repository</a>
</p>

---

## 📌 About Medicure

**Medicure** is a full-stack AI-powered healthcare assistance platform designed to bring intelligent healthcare tools into one accessible web application.

It integrates Machine Learning, Deep Learning, medical information services, and AI-powered analysis workflows to help users explore health-related information, analyze supported inputs, and manage selected healthcare activities.

Built with **React, FastAPI, Python, TensorFlow, and Scikit-learn**, Medicure is deployed on Render and designed to be accessible through modern web browsers on mobile phones, laptops, and desktops.

> 🎯 **Our Mission:** To make AI-assisted healthcare information and digital health tools more accessible through a unified platform.

## ✨ Key Features

### 🧠 AI & Machine Learning
- **Disease Prediction:** Symptom-based disease prediction using a trained machine learning pipeline.
- **Skin Disease Classification:** Deep learning-based image classification for supported skin image categories.
- **Voice Analysis:** Voice-processing and prediction workflows for supported audio inputs.
- **Medical Image Analysis:** Image-based analysis features for supported medical use cases.
- **Medical Report Analysis:** AI-assisted analysis of uploaded medical reports.
- **AI Integration:** Google Gemini API integration for supported AI-powered features.

### 💊 Healthcare Management
- Medicine search and information.
- Medicine suggestions based on supported inputs.
- Medicine reminders.
- Medical history management.
- Doctor information and registration workflows.
- Ambulance information and related workflows.
- User registration, login, and authentication.
- Health-related information and disease details.

### 🌿 Wellness & Additional Tools
- Ayurveda information.
- Meditation techniques and wellness resources.
- Emergency assistance interface.
- Visual health-check workflows.
- BMI calculator.
- Friend chat interface.

*Feature availability depends on the configured backend services, API credentials, database, and successfully loaded models.*

## 🤖 AI & Machine Learning Models

Medicure combines traditional machine learning, deep learning, and AI-assisted processing.

| Model / Component | Technology | Purpose |
|---|---|---|
| Disease Prediction | Scikit-learn | Predicts potential diseases from supported symptom inputs |
| Skin Classification | TensorFlow / CNN | Classifies supported skin images |
| Voice Analysis | Python, Librosa, ML model | Processes supported audio inputs |
| Medical Image Analysis | Computer vision / image-processing workflows | Supports image-based analysis |
| Report Analysis | Google Gemini API integration | Assists with supported medical report analysis |

### 📦 Trained Model Artifacts

The repository includes the following model files:

| File | Description |
|---|---|
| `disease_model_v2.pkl` | Serialized disease prediction model |
| `disease_metadata_v2.pkl` | Associated disease model metadata |
| `skin_model_v2.h5` | Trained skin image classification model |
| `skin_model_v2_classes.json` | Skin model class metadata |

The backend also contains a voice model loading workflow. Its compatibility and successful loading must be verified in the deployed environment.

**Important:** Actual model accuracy, supported classes, training dataset details, and clinical validation results should be documented only when verified.

## 🛠️ Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic

### AI / Machine Learning
- Scikit-learn
- TensorFlow
- NumPy
- Pandas
- Librosa
- Pillow
- Pytesseract

### Database & Authentication
- SQLite / SQLAlchemy
- JWT-based authentication components
- Passlib for password-hashing workflows

### External Services & Deployment
- Google Gemini API
- Docker
- Docker Compose
- Git and GitHub
- Render

## 🏗️ System Architecture

```text
                 ┌──────────────────────┐
                 │       User           │
                 │  Mobile / Desktop    │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   React + Vite UI    │
                 │      Frontend        │
                 └──────────┬───────────┘
                            │ HTTPS / REST
                            ▼
                 ┌──────────────────────┐
                 │   FastAPI Backend    │
                 │ Authentication & APIs│
                 └──────────┬───────────┘
                            │
               ┌────────────┼─────────────┐
               ▼            ▼             ▼
        ┌────────────┐ ┌────────────┐ ┌────────────┐
        │ ML Models  │ │  Database  │ │ Gemini API │
        │ Prediction │ │ Health Data│ │ AI Features│
        └────────────┘ └────────────┘ └────────────┘
```

## 📁 Project Structure

```text
medicure/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   └── routes/
│   ├── database/
│   ├── models/
│   │   ├── disease_model_v2.pkl
│   │   ├── disease_metadata_v2.pkl
│   │   ├── skin_model_v2.h5
│   │   └── skin_model_v2_classes.json
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docs/
│   └── diagnostics/
├── ml_workspace/
├── docker-compose.yml
└── README.md
```

*This is a simplified overview; the repository contains additional modules, tests, and documentation.*

## 🚀 Live Deployment

| Component | Platform | URL |
|---|---|---|
| Backend API | Render | https://medicure-2oj3.onrender.com |
| Frontend | Render Static Site | Add your frontend URL here |

The backend's root endpoint responds with a running-status message.

### API Documentation

Once the backend is running, try these URLs:

- **API root:** https://medicure-2oj3.onrender.com/
- **Swagger UI:** https://medicure-2oj3.onrender.com/docs
- **ReDoc:** https://medicure-2oj3.onrender.com/redoc

Swagger UI and ReDoc are available if the corresponding FastAPI documentation routes have not been disabled.

## ⚙️ Local Installation & Setup

### Prerequisites

Install the following tools before running the project:

- Python 3.11
- Node.js and npm
- Git
- Required system dependencies for image and audio processing, if needed

### 1. Clone the Repository

```bash
git clone https://github.com/prashant-singh-78/medicure.git
cd medicure
```

### 2. Configure the Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a local environment file from the provided template:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables in `backend/.env`:

```env
JWT_SECRET_KEY=replace_with_a_secure_random_secret
GEMINI_API_KEY=your_gemini_api_key
```

Use secure, unique secrets and never commit the real `.env` file.

### 3. Start the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend URL:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

### 4. Configure the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

**Note:** Ensure that the backend's CORS configuration permits the frontend development origin. Additional configuration may be required for Tesseract OCR, model files, database initialization, or external APIs.

## 🔐 Environment Variables

| Variable | Purpose |
|---|---|
| `JWT_SECRET_KEY` | Secret used for JWT signing |
| `GEMINI_API_KEY` | API key for supported Gemini integrations |
| `VITE_API_BASE_URL` | Backend base URL used by the frontend |
| `DATABASE_URL` | Optional database connection override, if supported by the configured backend |

Keep secret keys in the backend environment settings. Frontend variables prefixed with `VITE_` are exposed to browser code and must never contain private secrets.

## 🐳 Docker Deployment

The repository includes Dockerfiles for the backend and frontend, along with a Docker Compose configuration.

From the repository root:

```bash
docker compose up --build
```

Check the Docker Compose configuration for the actual exposed ports, service names, environment variables, volume mappings, and startup commands before running it.

## 🧪 Testing & Quality

The repository includes test and audit scripts covering areas such as:

- Backend integration.
- Authentication and security workflows.
- Vision and Gemini integrations.
- Administrative session security.
- Live API behavior and deployment readiness.

Run tests according to each script's requirements and configured test environment. Some tests may need API credentials, database setup, model files, or a running server.

## 📸 Screenshots

*Screenshots will be added here.*

## 🔒 Security & Privacy

- Never commit API keys, passwords, JWT secrets, or production credentials.
- Keep `.env` files out of version control.
- Validate uploaded files and user inputs.
- Use HTTPS for deployed API communication.
- Restrict CORS to trusted origins in production.
- Review authentication, authorization, rate limits, and sensitive health-data handling before production use.
- Avoid storing or logging sensitive medical information unnecessarily.

## ⚠️ Medical Disclaimer

Medicure is an educational and informational software project. Its AI-generated outputs and machine learning predictions may be incomplete or incorrect and are **not a substitute for professional medical diagnosis, treatment, or advice**.

Do not use the platform alone to make emergency or treatment decisions. Consult a qualified healthcare professional for medical concerns.

## 🗺️ Future Improvements

Potential areas for continued development include:

- Model versioning and reproducible training pipelines.
- Automated model evaluation and performance reporting.
- Improved error handling and API monitoring.
- Persistent production database configuration.
- Expanded accessibility and responsive UI testing.
- Stronger data protection and security testing.
- Verified model accuracy and documented evaluation datasets.

## 🤝 Contributing

Contributions, bug reports, and improvement suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test them.
4. Commit your changes with a clear message.
5. Open a pull request describing the changes.

## 👨‍💻 Developer

**Prashant Singh**

AI/ML and full-stack development project.

- GitHub: [@prashant-singh-78](https://github.com/prashant-singh-78)
- Repository: [Medicure](https://github.com/prashant-singh-78/medicure)

## 📄 License

No license has been specified here. Add a `LICENSE` file to define how others may use, modify, and distribute the project.

---

<p align="center">
  <b>Medicure — Exploring the Future of AI-Assisted Healthcare.</b>
</p>

<p align="center">
  Built with ❤️ using React, FastAPI, Python, and Machine Learning.
</p>

