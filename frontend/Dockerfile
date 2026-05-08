FROM node:20-alpine

WORKDIR /frontend

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start", "--", "--host", "0.0.0.0"]

# Production build with NGINX

#FROM node:20-alpine AS build
#
#WORKDIR /frontend
#
#COPY package.json package-lock.json ./
#RUN npm ci
#
#COPY . .
#RUN npm run build
#
#
#FROM nginx:alpine
#
## Create a non-root user for security
#RUN adduser -D -H -u 1001 -s /sbin/nologin webuser
#
#COPY --from=build /frontend/build /usr/share/nginx/html
#
#COPY nginx.conf /etc/nginx/templates/default.conf.template
#
#RUN chown -R webuser:webuser /usr/share/nginx/html \
#    /var/cache/nginx \
#    /var/log/nginx \
#    /etc/nginx/conf.d && \
#    touch /var/run/nginx.pid && \
#    chown webuser:webuser /var/run/nginx.pid && \
#    chmod -R 755 /usr/share/nginx/html
#
#EXPOSE 8080
#
#ENV PORT=8080
#ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates
#ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template
#ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
#
#USER webuser
#
#CMD ["nginx", "-g", "daemon off;"]