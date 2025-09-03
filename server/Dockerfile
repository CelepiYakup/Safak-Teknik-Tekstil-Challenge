
FROM python:3.9-slim


WORKDIR /app


RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        gcc \
        python3-dev \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .


RUN pip install --no-cache-dir -r requirements.txt


COPY . .

COPY seeds/ /app/seeds/


RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app


EXPOSE 5000


HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/work-orders || exit 1

# Command to run the application
CMD ["python", "manage.py"]