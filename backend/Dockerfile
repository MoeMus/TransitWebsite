FROM python:3.12-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /usr/src/backend

EXPOSE 8000

CMD ["/bin/sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]

# Production build using Gunicorn

#FROM python:3.12-slim-bookworm AS build
#
#ENV PYTHONDONTWRITEBYTECODE=1
#ENV PYTHONUNBUFFERED=1
#
#WORKDIR /backend
#
#RUN apt-get update && apt-get install -y --no-install-recommends \
#    gcc \
#    libpq-dev \
#    && rm -rf /var/lib/apt/lists/*
#
#COPY requirements.txt .
#
#RUN pip wheel --no-cache-dir --no-deps --wheel-dir /backend/wheels -r requirements.txt
#
#
#FROM python:3.12-slim-bookworm
#
#ENV PYTHONDONTWRITEBYTECODE=1
#ENV PYTHONUNBUFFERED=1
#
#RUN useradd -m webuser
#
#RUN apt-get update && apt-get install -y --no-install-recommends \
#    libpq5 \
#    && rm -rf /var/lib/apt/lists/*
#
#WORKDIR /backend
#
#COPY --from=build /backend/wheels /wheels
#RUN pip install --no-cache-dir /wheels/*
#
#COPY --chown=webuser:webuser . /backend/
#
#USER webuser
#
#EXPOSE 8000
#
#CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]