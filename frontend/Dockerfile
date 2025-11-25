# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm i

# 소스 코드 복사
COPY . .

# 프론트에서 백엔드 접근은 동일 오리진 /api 프록시 사용
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 빌드 실행 (Node.js로 직접 실행, 심볼릭 링크 우회)
RUN node node_modules/typescript/bin/tsc -b && \
    node node_modules/vite/bin/vite.js build

# ---- Run stage ----
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]


