#!/usr/bin/env bash
set -e

# Scaffolds a production-ready 3D Video Editor Portfolio project
PROJECT_NAME=${1:-"video-editor-portfolio"}

echo "🚀 Creating 3D Video Editor Portfolio project: $PROJECT_NAME"

mkdir -p "$PROJECT_NAME"/src/{components,shaders,styles,media}
mkdir -p "$PROJECT_NAME"/public

cat << 'EOF' > "$PROJECT_NAME/package.json"
{
  "name": "threejs-video-editor-portfolio",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.170.0"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  }
}
EOF

cat << 'EOF' > "$PROJECT_NAME/vite.config.js"
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext'
  }
});
EOF

echo "✅ Project scaffolded! Run 'cd $PROJECT_NAME && npm install && npm run dev' to start."
