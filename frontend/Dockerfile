FROM node:20-alpine

WORKDIR /usr/src/frontend

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

# Production build with NGINX

#FROM node:20-alpine as build
#
#WORKDIR /frontend
#
#COPY package.json package-lock.json ./
#
#RUN npm ci
#
#COPY . .
#
#RUN npm run build
#
#FROM nginx:alpine
#
#COPY --from=build /frontend/dist /usr/share/nginx/html
#
#COPY nginx.conf /etc/nginx/templates/default.conf.template
#
## Define a non-root user to run NGINX
#RUN chown -R webuser:webuser /usr/share/nginx/html && \
#    chmod -R 755 /usr/share/nginx/html && \
#    # Nginx needs to read and write to these directories
#    chown -R webuser:webuser /var/cache/nginx && \
#    chown -R webuser:webuser /var/log/nginx && \
#    chown -R webuser:webuser /etc/nginx/conf.d && \
#    touch /var/run/nginx.pid && \
#    chown -R webuser:webuser /var/run/nginx.pid && \
#    chmod -R 777 /etc/nginx/conf.d
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