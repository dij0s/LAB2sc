FROM python:3.9-slim

WORKDIR /app

RUN pip install --no-cache-dir spade==3.3.3 aiofiles==23.2.1

RUN mkdir -p /app/received_photos

COPY . .

ENTRYPOINT ["python", "src/runner.py"]
