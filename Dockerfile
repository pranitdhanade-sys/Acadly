FROM node:20-bookworm

WORKDIR /app

# System dependencies for AI backend and media processing
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 \
       python3-pip \
       ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Node dependencies for backend service
COPY Backend/package*.json ./Backend/
RUN npm install --prefix Backend

# Install Python dependencies for AI backend
COPY "AI Backend/requirements.txt" "/app/AI Backend/requirements.txt"
RUN python3 -m pip install --no-cache-dir -r "/app/AI Backend/requirements.txt"

# Copy the full project
COPY . .

# Startup script to launch both servers
COPY docker/start-all.sh /usr/local/bin/start-all.sh
RUN chmod +x /usr/local/bin/start-all.sh

EXPOSE 3000 8001

CMD ["/usr/local/bin/start-all.sh"]
