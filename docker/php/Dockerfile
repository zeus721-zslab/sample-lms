# =============================================
# FrankenPHP — Laravel 백엔드
# Base: dunglas/frankenphp:1-php8.3-alpine
# =============================================
FROM dunglas/frankenphp:1-php8.4-alpine

# 시스템 패키지
RUN apk add --no-cache \
    curl \
    unzip \
    git \
    bash \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libxml2-dev \
    postgresql-dev

# PHP 확장
RUN install-php-extensions \
    pdo_mysql \
    pdo_pgsql \
    redis \
    intl \
    zip \
    bcmath \
    gd \
    opcache \
    pcntl \
    sockets \
    exif \
    mbstring \
    xml \
    calendar

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP 설정
COPY docker/php/php.ini $PHP_INI_DIR/conf.d/99-lms.ini

WORKDIR /app

# 의존성만 먼저 복사 (레이어 캐싱 최적화)
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-scripts

# 소스 전체 복사
COPY backend/ ./

# 권한 설정 (package:discover는 런타임 첫 부팅 시 자동 실행)
RUN chown -R www-data:www-data /app \
    && chmod -R 755 /app/storage \
    && chmod -R 755 /app/bootstrap/cache

# FrankenPHP worker 모드 실행 (CMD 오버라이드 없이 Caddyfile 사용)
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
