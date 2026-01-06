#!/bin/sh
# AI Trading Dashboard - Docker Entrypoint Script
# 用于在容器启动时注入环境变量

set -e

# 默认后端 URL
BACKEND_URL=${BACKEND_URL:-http://localhost:8088}

echo "==================================="
echo "AI Trading Dashboard Starting..."
echo "Backend URL: ${BACKEND_URL}"
echo "==================================="

# 替换 nginx 配置中的环境变量
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

# 执行传入的命令
exec "$@"
