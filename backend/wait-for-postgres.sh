#!/bin/sh
set -e

host="$1"
port="$2"
shift 2

echo "Waiting for Postgres at $host:$port..."

while ! nc -z "$host" "$port"; do
  echo "Postgres is unavailable - waiting..."
  sleep 1
done

echo "Postgres is up!"
exec "$@"
