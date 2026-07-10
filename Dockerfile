# Backend image for Render.
#
# The video renderer shells out to ffmpeg and reads the scene images from
# frontend/public/scenes, so this image needs BOTH the backend and those images
# (plus the bundled Amiri fonts used to burn Arabic subtitles).
FROM node:22-slim

# ffmpeg (with libass for the karaoke subtitles) + CA certs for the audio fetches
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# install backend deps first so this layer caches across code changes
COPY backend/package*.json ./backend/
RUN npm --prefix backend install --omit=dev --no-audit --no-fund

# backend code, data and the Amiri fonts
COPY backend ./backend
# the renderer resolves scenes at ../frontend/public/scenes relative to backend/
COPY frontend/public/scenes ./frontend/public/scenes

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "backend/server.js"]
