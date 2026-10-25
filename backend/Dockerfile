# Backend Dockerfile for Medicure Multi-Modal Health Assistant
FROM python:3.11-slim

# Install system dependencies for audio signal processing (Librosa / SoundFile)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source and trained model weights
COPY app/ ./app/
COPY models/ ./models/

# Create runtime directory for SQLite database storage (to be mounted as a volume)
RUN mkdir -p /app/database

# Expose FastAPI service port
EXPOSE 8000

# Environment variables must be injected at container runtime (never baked into image)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
