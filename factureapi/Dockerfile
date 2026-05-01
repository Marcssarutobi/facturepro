FROM php:8.2-fpm-alpine

# Dépendances système + extensions PHP
RUN apk add --no-cache nginx curl zip unzip git \
    libpng-dev libjpeg-turbo-dev freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copier les fichiers
COPY . .

# Installer les dépendances
RUN composer install --optimize-autoloader --no-dev

# Permissions storage
RUN mkdir -p storage/framework/sessions \
    storage/framework/cache \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Config Nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["sh", "-c", "\
    mkdir -p /tmp/factureapi-storage/framework/sessions \
    /tmp/factureapi-storage/framework/cache \
    /tmp/factureapi-storage/framework/views \
    /tmp/factureapi-storage/logs \
    /tmp/factureapi-storage/app/temp/invoices \
    && chmod -R 777 /tmp/factureapi-storage \
    && ln -sfn /tmp/factureapi-storage storage \
    && php artisan config:clear \
    && php artisan config:cache \
    && php artisan migrate --force \
    && php artisan db:seed --force \
    && php-fpm -D \
    && nginx -g 'daemon off;'"]
