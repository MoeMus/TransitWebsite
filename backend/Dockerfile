FROM python:3.12-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /usr/src/backend

EXPOSE 8000

CMD ["/bin/sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]