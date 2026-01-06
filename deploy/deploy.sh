#!/bin/bash
# AI Trading Frontend - 快速构建和部署脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
REGISTRY=${REGISTRY:-""}
IMAGE_NAME=${IMAGE_NAME:-"ai-trading-frontend"}
VERSION=${VERSION:-"latest"}
NAMESPACE=${NAMESPACE:-"ai-trading"}

# 函数：打印信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 函数：构建镜像
build_image() {
    info "开始构建 Docker 镜像..."
    
    if [ -n "$REGISTRY" ]; then
        FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
    else
        FULL_IMAGE="${IMAGE_NAME}:${VERSION}"
    fi
    
    info "镜像名称: ${FULL_IMAGE}"
    
    docker build -f deploy/Dockerfile -t "${FULL_IMAGE}" . || error "镜像构建失败"
    
    info "镜像构建成功: ${FULL_IMAGE}"
}

# 函数：推送镜像
push_image() {
    if [ -z "$REGISTRY" ]; then
        warn "未指定镜像仓库，跳过推送"
        return
    fi
    
    info "推送镜像到仓库..."
    
    FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
    
    docker push "${FULL_IMAGE}" || error "镜像推送失败"
    
    info "镜像推送成功"
}

# 函数：部署到 Kubernetes
deploy_k8s() {
    info "开始部署到 Kubernetes..."
    
    # 检查 kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl 未安装"
    fi
    
    # 创建命名空间
    info "创建命名空间..."
    kubectl apply -f deploy/k8s/namespace.yaml || warn "命名空间可能已存在"
    
    # 更新镜像
    if [ -n "$REGISTRY" ]; then
        FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
        info "更新 Deployment 镜像为: ${FULL_IMAGE}"
        
        # 临时更新 deployment.yaml 中的镜像
        sed -i.bak "s|image:.*|image: ${FULL_IMAGE}|g" deploy/k8s/deployment.yaml
    fi
    
    # 应用配置
    info "应用 Kubernetes 配置..."
    kubectl apply -f deploy/k8s/rbac.yaml
    kubectl apply -f deploy/k8s/configmap.yaml
    kubectl apply -f deploy/k8s/deployment.yaml
    kubectl apply -f deploy/k8s/service.yaml
    kubectl apply -f deploy/k8s/hpa.yaml
    
    # 恢复 deployment.yaml
    if [ -f deploy/k8s/deployment.yaml.bak ]; then
        mv deploy/k8s/deployment.yaml.bak deploy/k8s/deployment.yaml
    fi
    
    # 等待部署完成
    info "等待 Pods 就绪..."
    kubectl rollout status deployment/ai-trading-frontend -n ${NAMESPACE} --timeout=5m || error "部署超时"
    
    info "部署成功！"
    
    # 显示部署状态
    echo ""
    info "部署状态:"
    kubectl get pods -n ${NAMESPACE} -l app=ai-trading-frontend
    echo ""
    kubectl get svc -n ${NAMESPACE} ai-trading-frontend-service
}

# 函数：本地测试
test_local() {
    info "启动本地测试容器..."
    
    FULL_IMAGE="${IMAGE_NAME}:${VERSION}"
    
    docker run -d \
        --name ai-trading-frontend-test \
        -p 8080:80 \
        -e BACKEND_URL=http://host.docker.internal:8088 \
        "${FULL_IMAGE}" || error "容器启动失败"
    
    info "等待容器启动..."
    sleep 5
    
    info "测试健康检查..."
    curl -f http://localhost:8080/health || error "健康检查失败"
    
    info "本地测试成功！"
    info "访问地址: http://localhost:8080"
    info "停止测试容器: docker stop ai-trading-frontend-test && docker rm ai-trading-frontend-test"
}

# 函数：清理
cleanup() {
    info "清理测试资源..."
    docker stop ai-trading-frontend-test 2>/dev/null || true
    docker rm ai-trading-frontend-test 2>/dev/null || true
    info "清理完成"
}

# 主菜单
show_menu() {
    echo ""
    echo "=========================================="
    echo "  AI Trading Frontend 部署工具"
    echo "=========================================="
    echo "1. 构建镜像"
    echo "2. 推送镜像"
    echo "3. 部署到 Kubernetes"
    echo "4. 本地测试"
    echo "5. 完整流程 (构建 + 推送 + 部署)"
    echo "6. 清理测试资源"
    echo "0. 退出"
    echo "=========================================="
    echo ""
}

# 主逻辑
main() {
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -d "deploy" ]; then
        error "请在项目根目录运行此脚本"
    fi
    
    if [ $# -eq 0 ]; then
        # 交互模式
        while true; do
            show_menu
            read -p "请选择操作 [0-6]: " choice
            
            case $choice in
                1) build_image ;;
                2) push_image ;;
                3) deploy_k8s ;;
                4) test_local ;;
                5)
                    build_image
                    push_image
                    deploy_k8s
                    ;;
                6) cleanup ;;
                0) info "退出"; exit 0 ;;
                *) error "无效选择" ;;
            esac
            
            echo ""
            read -p "按 Enter 继续..."
        done
    else
        # 命令行模式
        case $1 in
            build) build_image ;;
            push) push_image ;;
            deploy) deploy_k8s ;;
            test) test_local ;;
            all)
                build_image
                push_image
                deploy_k8s
                ;;
            clean) cleanup ;;
            *) 
                echo "用法: $0 [build|push|deploy|test|all|clean]"
                echo "或直接运行进入交互模式"
                exit 1
                ;;
        esac
    fi
}

# 运行主程序
main "$@"
