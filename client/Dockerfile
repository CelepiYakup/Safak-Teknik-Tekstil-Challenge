FROM node:18


WORKDIR /app


COPY package*.json ./


RUN npm ci


COPY . .


ARG VITE_API_URL
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env


EXPOSE 5173


HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1


CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]