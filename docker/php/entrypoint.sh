#!/bin/sh
set -e

/usr/local/bin/wait-for-it.sh mariadb:3306 -t 60 --
/usr/local/bin/wait-for-it.sh redis:6379 -t 60 --

exec docker-php-entrypoint "$@"
