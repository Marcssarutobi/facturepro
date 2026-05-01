FROM php:8.2-fpm-alpine

# Dépendances système + GD
RUN apk add --no-cache nginx curl zip unzip git \
    libpng-dev libjpeg-turbo-dev freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --optimize-autoloader --no-dev

RUN chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["sh", "-c", "php artisan config:cache && php artisan migrate --force && nginx -g 'daemon off;' & php-fpm"]
