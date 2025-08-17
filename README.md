# product-selection-oversea

示例项目，包含前端 (Node.js)、后端 (Flask) 与 PostgreSQL 数据库。提供 Dockerfile 与 docker-compose 编排，GitHub Actions 自动执行 lint、测试与构建流程，并附带 Nginx 反向代理及 SSL 证书配置脚本。

## 开发运行

```bash
docker-compose up --build
```

## 生产部署

```bash
./deploy/deploy.sh
```

如需申请 SSL 证书，可执行:

```bash
./deploy/setup_ssl.sh <your-domain> <your-email>
```
