FROM python:3.11-slim

# Install ffmpeg, curl, unzip (for Deno install)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (required by yt-dlp for YouTube JS challenge solving since late 2025)
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh
ENV DENO_DIR=/tmp/deno

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data /app/downloads

EXPOSE 5000

CMD ["python", "app.py"]
