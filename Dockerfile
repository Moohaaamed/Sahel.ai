FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN mkdir -p /data /data/vector_stores /data/uploaded_documents /data/data

# Copy seed data to where DATA_ROOT expects it
COPY backend/data/ /data/data/

ENV DATA_ROOT=/data
ENV AUTO_CREATE_TABLES=true
ENV CORS_ORIGINS=https://sahel-ai.vercel.app,http://localhost:5173

EXPOSE 7860

CMD ["uvicorn", "backend_chatdoc:app", "--host", "0.0.0.0", "--port", "7860"]
