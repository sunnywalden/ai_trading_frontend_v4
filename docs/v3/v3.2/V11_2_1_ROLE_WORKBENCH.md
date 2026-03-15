# V11.2.1 Role Workbench Frontend Notes

## 目标

前端在 V11.2.1 中不再把“是否登录”当成唯一访问规则，而是根据角色把首页、导航、页面入口和关键动作裁剪到不同用户的工作流中。

## 角色首页

- Researcher → `/research`
- Trader → `/trading`
- Supervisor → `/executive`
- Administrator → `/admin`

登录成功后会根据 `auth` store 中的 `homePath` 自动跳转。

## 统一访问规则

`src/router/index.ts` 中维护 `resolveRouteAccess(path)`：

- 路由守卫用它做进入校验
- `App.vue` 用它做菜单过滤
- `PermissionGuard` / `PermissionButton` 用 `auth` store 做组件级控制

这样前台不会再出现“菜单看不到，但手输 URL 还能进”的体验撕裂。

补充说明：

- `auth` store 现在优先消费后端 `/api/v1/auth/me` 返回的 `feature_flags`，因此 `ROLE_HOME_V1121_ENABLED`、`ROLE_NAV_GATING_V1121_ENABLED`、`ROLE_ACTION_GATING_V1121_ENABLED`、`EXECUTIVE_REPORTS_V1121_ENABLED`、`ADMIN_CONSOLE_V1121_ENABLED` 都会直接影响前台行为。
- 当 `ROLE_NAV_GATING_V1121_ENABLED=false` 时，角色路由裁剪会回退到旧导航体验；当 `ROLE_ACTION_GATING_V1121_ENABLED=false` 时，按钮级权限组件会停止前台裁剪，但后端授权仍然是最终真源。

## 新页面

- `ResearchHomePage.vue`
- `TradingHomePage.vue`
- `ExecutiveHomePage.vue`
- `AdminHomePage.vue`
- `ExecutiveReportsPage.vue`
- `AdminUsersPage.vue`
- `AdminRolesPage.vue`
- `AdminAuditPage.vue`
- `AdminPermissionsPage.vue`
- `ChangePasswordPage.vue`
- `ForbiddenPage.vue`

## 兼容策略

- 旧的单管理员 JWT 若没有 `role` 字段，会在前端回退为 `ADMINISTRATOR`。
- 若后端 `/auth/me` 临时不可用，`auth` store 会先从 token payload 恢复基本角色态，避免刷新后白屏。

## 验收关注点

1. 登录后是否进入对应角色首页
2. 左侧导航是否随角色裁剪
3. 无权限页面是否跳到 `/forbidden`
4. 管理员是否能完成用户/角色/审计基础操作
5. 管理员是否能查看完整权限目录，并与后端 `/api/v1/admin/permissions` 字段口径一致
6. 首次登录或密码被重置的账号是否会被引导到改密页，修改后再返回角色工作台
7. 主管是否只能看到摘要与报表，不进入系统治理页
