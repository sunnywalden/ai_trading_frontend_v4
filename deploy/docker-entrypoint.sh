#!/bin/sh
# AI Trading Dashboard - Docker Entrypoint Script
# 用于在容器启动时注入环境变量

set -e

# 兼容运行时变量命名：优先 VITE_BACKEND_URL，其次 BACKEND_URL。
BACKEND_URL=${VITE_BACKEND_URL:-${BACKEND_URL:-}}
WS_BASE_URL=${VITE_WS_BASE_URL:-}

echo "==================================="
echo "AI Trading Dashboard Starting..."
echo "Backend URL: ${BACKEND_URL}"
echo "WS Base URL: ${WS_BASE_URL}"
echo "==================================="

cat >/usr/share/nginx/html/runtime-config.js <<EOF
window.__APP_CONFIG__ = {
	VITE_BACKEND_URL: "${BACKEND_URL}",
	BACKEND_URL: "${BACKEND_URL}",
	VITE_WS_BASE_URL: "${WS_BASE_URL}"
};
EOF

# 替换 nginx 配置中的环境变量
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

# 执行传入的命令
exec "$@"
