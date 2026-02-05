# 部署文档（已合并并精简）

> 部署要点已合并到 `docs/CONSOLIDATED_DOCS.md` 的“部署要点（精简）”节。
> 完整历史版本已迁移到 `docs/archived/deploy_README.md`。

如需查看完整部署步骤、Dockerfile、Kubernetes manifests，请查阅归档文件。

---

## 🚀 快速开始

### 前置要求

**本地开发**：
- Node.js 18+
- npm 或 yarn

**Docker 部署**：
- Docker 20.10+
- Docker Compose 1.29+ (可选)

**Kubernetes 部署**：
- Kubernetes 1.24+
- kubectl
- Helm 3.0+ (可选)

---

## 🐳 Docker 部署

### 1. 构建镜像

```bash
# 进入项目根目录
cd /path/to/ai_trading_frontend_v4

# 构建 Docker 镜像
docker build -f deploy/Dockerfile -t sunnywalden/ai-trading-frontend:latest .

docker tag sunnywalden/ai-trading-frontend:latest sunnywalden/ai-trading-frontend:v1.0.0

# 或使用特定版本标签
docker build -f deploy/Dockerfile -t sunnywalden/ai-trading-frontend:v1.0.0 .
```

### 2. 运行容器

#### 方式一：直接运行

```bash
docker run -d \
  --name ai-trading-frontend \
  -p 8080:80 \
  -e BACKEND_URL=http://backend-service:8088 \
  sunnywalden/ai-trading-frontend:latest
```

#### 方式二：使用 Docker Compose

创建.env 文件：

```bash
cp .env.example ._env
# 编辑 .frontend_env，按需修改 BACKEND_URL 等配置
```


创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  frontend:
    image: sunnywalden/ai-trading-frontend:latest
    container_name: ai-trading-frontend
    ports:
      - "8080:80"
    env_file:
      - ./.env
    environment:
      - BACKEND_URL=http://backend:8088
    restart: unless-stopped
    networks:
      - ai-trading-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  ai-trading-network:
    driver: bridge
```

启动服务：

```bash
docker-compose up -d
```

### 3. 验证部署

```bash
# 检查容器状态
docker ps | grep ai-trading-frontend

# 查看容器日志
docker logs ai-trading-frontend

# 健康检查
curl http://localhost:8080/health

# 访问应用
open http://localhost:8080
```

### 4. 推送镜像到镜像仓库

```bash
# Docker Hub
docker tag sunnywalden/ai-trading-frontend:latest sunnywalden/ai-trading-frontend:latest
docker push sunnywalden/ai-trading-frontend:latest
```

---

## 🌐 线上环境部署 (SSL/Traefik v3)

针对最新的分体式部署方案，我们使用 **Traefik v3** 作为反向代理，并通过 Let's Encrypt (DNS Challenge via Google Cloud DNS) 自动管理 SSL 证书。

### 1. 配置 Traefik 标签

在统一的 `docker-compose.yml` 中，前端服务应配置如下标签以接入 Traefik：

```yaml
  frontend:
    image: sunnywalden/ai-trading-frontend:latest
    container_name: frontend-app
    restart: unless-stopped
    networks:
      - ai-trading-network
    environment:
      - BACKEND_URL=http://backend:8088
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`${FRONTEND_DOMAIN:-sunnywalden.com}`) || Host(`www.${FRONTEND_DOMAIN:-sunnywalden.com}`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=myresolver"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
```

### 2. Nginx 代理配置优化

前端镜像内部的 Nginx 已配置为信任并透传 `X-Forwarded-*` 请求头。这意味着后端 API 能够正确识别真实的客户端 IP 及 HTTPS 协议。

### 3. 部署执行

请参考后端项目中的统一部署入口：
[ai-trading-backend/deploy/README.md](../../ai_trading_backend_v8/deploy/README.md)

---

## ☸️ Kubernetes 部署

### 1. 准备工作

#### 创建命名空间

```bash
kubectl apply -f deploy/k8s/namespace.yaml
```

#### 创建 Docker Registry Secret（如果使用私有镜像）

```bash
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email@example.com \
  -n ai-trading
```

### 2. 部署步骤

#### 方式一：逐个应用 YAML 文件

```bash
# 1. 创建 RBAC
kubectl apply -f deploy/k8s/rbac.yaml

# 2. 创建 ConfigMap
kubectl apply -f deploy/k8s/configmap.yaml

# 3. 创建 Deployment
kubectl apply -f deploy/k8s/deployment.yaml

# 4. 创建 Service
kubectl apply -f deploy/k8s/service.yaml

# 5. 创建 HPA（可选）
kubectl apply -f deploy/k8s/hpa.yaml

# 6. 创建 Ingress（如果需要）
kubectl apply -f deploy/k8s/ingress.yaml
```

#### 方式二：一键部署

```bash
kubectl apply -f deploy/k8s/
```

### 3. 验证部署

```bash
# 查看 Pod 状态
kubectl get pods -n ai-trading -l app=ai-trading-frontend

# 查看 Pod 详情
kubectl describe pod -n ai-trading -l app=ai-trading-frontend

# 查看 Service
kubectl get svc -n ai-trading ai-trading-frontend-service

# 查看 Ingress
kubectl get ingress -n ai-trading

# 查看日志
kubectl logs -n ai-trading -l app=ai-trading-frontend --tail=100 -f

# 查看 HPA 状态
kubectl get hpa -n ai-trading
```

### 4. 访问应用

#### 通过 NodePort 访问

```bash
# 获取 NodePort
kubectl get svc -n ai-trading ai-trading-frontend-nodeport

# 访问
curl http://<node-ip>:30080/health
```

#### 通过 Ingress 访问

```bash
# 配置 hosts（如果使用域名）
echo "<ingress-ip> ai-trading.example.com" | sudo tee -a /etc/hosts

# 访问
curl http://ai-trading.example.com/health
open https://ai-trading.example.com
```

#### 通过 Port Forward 访问（测试用）

```bash
kubectl port-forward -n ai-trading svc/ai-trading-frontend-service 8080:80

# 访问
open http://localhost:8080
```

### 5. 更新部署

#### 更新镜像

```bash
# 更新镜像版本
kubectl set image deployment/ai-trading-frontend \
  frontend=sunnywalden/ai-trading-frontend:v1.0.1 \
  -n ai-trading

# 或者编辑 Deployment
kubectl edit deployment ai-trading-frontend -n ai-trading
```

#### 滚动重启

```bash
kubectl rollout restart deployment/ai-trading-frontend -n ai-trading
```

#### 回滚

```bash
# 查看历史版本
kubectl rollout history deployment/ai-trading-frontend -n ai-trading

# 回滚到上一个版本
kubectl rollout undo deployment/ai-trading-frontend -n ai-trading

# 回滚到指定版本
kubectl rollout undo deployment/ai-trading-frontend --to-revision=2 -n ai-trading
```

### 6. 扩缩容

#### 手动扩缩容

```bash
# 扩展到 5 个副本
kubectl scale deployment/ai-trading-frontend --replicas=5 -n ai-trading

# 缩减到 2 个副本
kubectl scale deployment/ai-trading-frontend --replicas=2 -n ai-trading
```

#### 自动扩缩容（HPA）

HPA 已配置，会根据 CPU 和内存使用率自动调整副本数（2-10个）。

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `BACKEND_URL` | 后端服务地址 | `http://localhost:8088` | `http://ai-trading-backend:8088` |
| `NODE_ENV` | 运行环境 | `production` | `production` / `development` |

### ConfigMap 配置

编辑 `deploy/k8s/configmap.yaml` 修改配置：

```yaml
data:
  BACKEND_URL: "http://your-backend-service:8088"
```

应用更改：

```bash
kubectl apply -f deploy/k8s/configmap.yaml
kubectl rollout restart deployment/ai-trading-frontend -n ai-trading
```

### Ingress 配置

编辑 `deploy/k8s/ingress.yaml` 修改域名和 SSL 配置：

```yaml
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: your-tls-secret
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-trading-frontend-service
            port:
              number: 80
```

### 资源限制调整

编辑 `deploy/k8s/deployment.yaml`：

```yaml
resources:
  requests:
    cpu: 200m      # 根据实际需求调整
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 512Mi
```

---

## 📊 监控和日志

### 日志查看

#### Docker

```bash
# 查看实时日志
docker logs -f ai-trading-frontend

# 查看最近 100 行日志
docker logs --tail 100 ai-trading-frontend

# 导出日志到文件
docker logs ai-trading-frontend > frontend.log 2>&1
```

#### Kubernetes

```bash
# 查看实时日志（所有 Pod）
kubectl logs -n ai-trading -l app=ai-trading-frontend -f

# 查看特定 Pod 日志
kubectl logs -n ai-trading <pod-name> -f

# 查看前一个容器的日志（如果容器重启了）
kubectl logs -n ai-trading <pod-name> --previous

# 导出日志
kubectl logs -n ai-trading -l app=ai-trading-frontend --tail=-1 > frontend.log
```

### 监控指标

#### Prometheus 监控

如果启用了 Prometheus，可以通过以下指标监控：

- `nginx_http_requests_total` - HTTP 请求总数
- `nginx_http_request_duration_seconds` - 请求延迟
- `container_cpu_usage_seconds_total` - CPU 使用率
- `container_memory_working_set_bytes` - 内存使用

#### Grafana Dashboard

可以导入 Nginx 和 Kubernetes 相关的 Grafana Dashboard。

### 健康检查

```bash
# 检查应用健康
curl http://localhost:8080/health

# Kubernetes 健康检查
kubectl get pods -n ai-trading -l app=ai-trading-frontend
```

---

## 🔧 故障排查

### 常见问题

#### 1. 容器无法启动

```bash
# 查看容器日志
docker logs ai-trading-frontend

# Kubernetes 查看事件
kubectl describe pod -n ai-trading <pod-name>
kubectl get events -n ai-trading --sort-by='.lastTimestamp'
```

**可能原因**：
- 镜像拉取失败
- 配置错误
- 资源不足

#### 2. 后端 API 连接失败

检查后端服务地址配置：

```bash
# Docker
docker exec ai-trading-frontend env | grep BACKEND_URL

# Kubernetes
kubectl exec -n ai-trading <pod-name> -- env | grep BACKEND_URL
```

**解决方案**：
- 确认后端服务地址正确
- 检查网络连通性
- 查看后端服务日志

#### 3. 页面加载缓慢

**可能原因**：
- 静态资源未缓存
- Gzip 压缩未启用
- 后端 API 响应慢

**优化方案**：
- 检查 Nginx 配置
- 启用 CDN
- 优化后端 API

#### 4. 502 Bad Gateway

**可能原因**：
- 后端服务不可用
- 超时设置过短
- 网络问题

**排查步骤**：

```bash
# 检查后端服务
kubectl get pods -n ai-trading -l app=ai-trading-backend

# 测试后端连通性
kubectl exec -n ai-trading <frontend-pod> -- curl http://ai-trading-backend-service:8088/health

# 查看 Nginx 日志
kubectl logs -n ai-trading <pod-name> | grep "502\|upstream"
```

#### 5. Pod 频繁重启

```bash
# 查看 Pod 状态
kubectl get pods -n ai-trading -l app=ai-trading-frontend

# 查看重启原因
kubectl describe pod -n ai-trading <pod-name>
```

**可能原因**：
- OOM（内存不足）
- 健康检查失败
- 应用崩溃

**解决方案**：
- 增加资源限制
- 调整健康检查参数
- 检查应用日志

### 调试命令

```bash
# 进入容器 Shell
docker exec -it ai-trading-frontend sh
kubectl exec -it -n ai-trading <pod-name> -- sh

# 检查 Nginx 配置
docker exec ai-trading-frontend nginx -t
kubectl exec -n ai-trading <pod-name> -- nginx -t

# 查看端口监听
docker exec ai-trading-frontend netstat -tlnp
kubectl exec -n ai-trading <pod-name> -- netstat -tlnp

# 测试 DNS 解析（Kubernetes）
kubectl exec -n ai-trading <pod-name> -- nslookup ai-trading-backend-service

# 测试网络连通性
kubectl exec -n ai-trading <pod-name> -- wget -O- http://ai-trading-backend-service:8088/health
```

---

## 📝 维护操作

### 备份

```bash
# 备份 Kubernetes 配置
kubectl get all -n ai-trading -o yaml > backup-$(date +%Y%m%d).yaml

# 备份 ConfigMap
kubectl get configmap -n ai-trading ai-trading-frontend-config -o yaml > configmap-backup.yaml
```

### 清理

```bash
# Docker 清理
docker stop ai-trading-frontend
docker rm ai-trading-frontend
docker rmi ai-trading-frontend:latest

# Kubernetes 清理
kubectl delete -f deploy/k8s/
kubectl delete namespace ai-trading

# 清理未使用的 Docker 镜像
docker system prune -a
```

---

## 🔐 安全建议

1. **使用非 root 用户运行**（已配置）
2. **启用只读根文件系统**（已配置）
3. **定期更新基础镜像**
4. **启用 SSL/TLS**（通过 Ingress 配置）
5. **限制网络访问**（通过 NetworkPolicy）
6. **扫描镜像漏洞**

```bash
# 使用 Trivy 扫描镜像
trivy image ai-trading-frontend:latest
```

---

## 📚 参考资料

- [Vue.js 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Docker 官方文档](https://docs.docker.com/)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)

---

## 📞 支持

如有问题，请联系：
- 项目 GitHub: [AI Trading Frontend](https://github.com/your-org/ai-trading-frontend)
- 技术支持: support@example.com

---

*最后更新: 2026-01-06*
