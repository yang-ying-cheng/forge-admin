# Admin/App API 双端点分离实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 forge-admin 的 API 拆分为 `/admin-api`（后台管理）和 `/app-api`（移动端微信小程序）两套独立端点，各自拥有独立的用户表、认证 Filter 和 Redis 会话。

**Architecture:** 通过 `WebMvcConfigurer.configurePathMatch()` 根据 Controller 包名（`**.controller.admin.**` / `**.controller.app.**`）自动注入路径前缀。安全层使用独立的 `SecurityFilterChain` + 独立的 `JwtAuthenticationFilter` 分别处理 admin 和 app 请求。移动端使用独立的 `app_user` 表，微信 openid 自动注册。

**Tech Stack:** Spring Boot 3.2, Spring Security, JWT (jjwt 0.12.x), Redis (StringRedisTemplate), MyBatis Plus 3.5, MySQL, Vue 3 + Axios

**设计文档：** `docs/superpowers/specs/2026-06-11-admin-app-api-split-design.md`

---

## 文件结构

### 新增文件
| 文件 | 职责 |
|------|------|
| `forge-spring-boot-starter-web/.../config/WebProperties.java` | admin/app API 前缀和包匹配配置 |
| `forge-spring-boot-starter-security/.../config/AppJwtAuthenticationFilter.java` | 移动端 JWT 认证过滤器 |
| `forge-module-system-api/.../entity/AppUser.java` | 移动端用户实体 |
| `forge-module-system-api/.../dto/app/WxLoginRequest.java` | 微信登录请求 DTO |
| `forge-module-system-api/.../dto/app/AppLoginResponse.java` | 移动端登录响应 DTO |
| `forge-module-system-api/.../dto/app/AppUserProfileResponse.java` | 移动端用户信息响应 DTO |
| `forge-module-system-api/.../dto/app/AppUserProfileUpdateRequest.java` | 移动端用户信息更新请求 DTO |
| `forge-module-system-biz/.../mapper/AppUserMapper.java` | 移动端用户 Mapper |
| `forge-module-system-biz/.../service/app/AppUserService.java` | 移动端用户 Service 接口 |
| `forge-module-system-biz/.../service/app/AppUserServiceImpl.java` | 移动端用户 Service 实现 |
| `forge-module-system-biz/.../service/app/AppAuthService.java` | 移动端认证 Service 接口 |
| `forge-module-system-biz/.../service/app/AppAuthServiceImpl.java` | 移动端认证 Service 实现 |
| `forge-module-system-biz/.../controller/app/AppAuthController.java` | 移动端认证 Controller |
| `forge-module-system-biz/.../controller/app/AppUserController.java` | 移动端用户 Controller |
| `forge-server/.../resources/db/migration/V2026061101__app_user.sql` | 数据库迁移脚本 |

### 修改文件
| 文件 | 改动 |
|------|------|
| `forge-spring-boot-starter-web/.../resources/META-INF/.../AutoConfiguration.imports` | 注册 WebProperties |
| `forge-module-system-biz/.../common/config/WebMvcConfig.java` | 添加 configurePathMatch |
| `forge-module-system-biz/.../common/config/SecurityConfig.java` | 拆分为双 SecurityFilterChain |
| `forge-module-system-biz/.../auth/security/JwtTokenProvider.java` | 支持 token type claim |
| `forge-server/.../resources/application.yml` | 去 context-path、加 forge.web 和 wx 配置 |
| `forge-web/src/utils/request.ts` | baseURL 改为 /admin-api |
| `forge-web/vite.config.ts` | 代理配置更新 |

### 移动文件（32 个 Controller → admin/ 子包）
所有现有 Controller 从 `controller/` 移入 `controller/admin/`，包名变更触发框架自动注入 `/admin-api` 前缀。

---

### Task 1: 新增 WebProperties 配置类

**Files:**
- Create: `apps/forge-server/forge-framework/forge-spring-boot-starter-web/src/main/java/com/forge/framework/web/config/WebProperties.java`
- Modify: `apps/forge-server/forge-framework/forge-spring-boot-starter-web/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

- [ ] **Step 1: 创建 WebProperties.java**

```java
package com.forge.framework.web.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "forge.web")
public class WebProperties {

    private Api adminApi = new Api("/admin-api", "**.controller.admin.**");
    private Api appApi = new Api("/app-api", "**.controller.app.**");

    @Data
    public static class Api {
        private String prefix;
        private String controller;

        public Api() {}

        public Api(String prefix, String controller) {
            this.prefix = prefix;
            this.controller = controller;
        }
    }
}
```

- [ ] **Step 2: 注册到 AutoConfiguration.imports**

在文件末尾追加：
```
com.forge.framework.web.config.WebProperties
```

- [ ] **Step 3: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -pl forge-framework/forge-spring-boot-starter-web -q`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
git add apps/forge-server/forge-framework/forge-spring-boot-starter-web/
git commit -m "feat(web): 新增 WebProperties 配置类，定义 admin/app API 前缀和包匹配规则"
```

---

### Task 2: 修改 WebMvcConfig 添加自动前缀注入

**Files:**
- Modify: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/common/config/WebMvcConfig.java`

- [ ] **Step 1: 重写 WebMvcConfig.java**

```java
package com.forge.common.config;

import com.forge.framework.web.config.WebProperties;
import com.forge.modules.system.entity.SysFileConfig;
import com.forge.modules.system.service.SysFileConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final SysFileConfigService sysFileConfigService;
    private final WebProperties webProperties;

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        AntPathMatcher antPathMatcher = new AntPathMatcher(".");
        configurer.addPathPrefix(webProperties.getAdminApi().getPrefix(), clazz ->
                clazz.isAnnotationPresent(org.springframework.web.bind.annotation.RestController.class)
                && antPathMatcher.match(webProperties.getAdminApi().getController(), clazz.getPackage().getName()));
        configurer.addPathPrefix(webProperties.getAppApi().getPrefix(), clazz ->
                clazz.isAnnotationPresent(org.springframework.web.bind.annotation.RestController.class)
                && antPathMatcher.match(webProperties.getAppApi().getController(), clazz.getPackage().getName()));
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        SysFileConfig config = sysFileConfigService.getDefaultConfig();
        String uploadPath = "./uploads";
        if (config != null && "local".equals(config.getStorageType()) && config.getBasePath() != null) {
            uploadPath = config.getBasePath();
        }

        String absolutePath = new java.io.File(uploadPath).getAbsolutePath();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }
}
```

注意：去掉了 `context-path: /api` 后不再需要 `/api/uploads/**` 的资源处理器。

- [ ] **Step 2: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 3: 提交**

```bash
git add apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/common/config/WebMvcConfig.java
git commit -m "feat(web): WebMvcConfig 添加 configurePathMatch 自动注入 admin/app 路径前缀"
```

---

### Task 3: 修改 application.yml 去掉 context-path 并添加配置

**Files:**
- Modify: `apps/forge-server/forge-server/src/main/resources/application.yml`

- [ ] **Step 1: 修改 application.yml**

将 `server.servlet.context-path: /api` 删除，在 `forge:` 节点下添加 `web` 和 `wx` 配置：

```yaml
server:
  port: ${SERVER_PORT:8181}
  # context-path 已去掉，由框架自动注入 /admin-api 和 /app-api 前缀

spring:
  # ... 保持不变 ...

forge:
  info:
    base-package: com.forge
  web:
    admin-api:
      prefix: /admin-api
      controller: "**.controller.admin.**"
    app-api:
      prefix: /app-api
      controller: "**.controller.app.**"
  wx:
    mini-app-id: ${WX_MINI_APP_ID:}
    mini-app-secret: ${WX_MINI_APP_SECRET:}
```

同时修改 `file.base-url`：
```yaml
file:
  upload-path: ${FILE_UPLOAD_PATH:./uploads}
  base-url: ${FILE_BASE_URL:http://localhost:8181/uploads}
```

- [ ] **Step 2: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 3: 提交**

```bash
git add apps/forge-server/forge-server/src/main/resources/application.yml
git commit -m "chore(config): 去掉 context-path /api，新增 forge.web 和 forge.wx 配置"
```

---

### Task 4: 新增 AppUser 实体和 DTO

**Files:**
- Create: `apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/entity/AppUser.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/dto/app/WxLoginRequest.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/dto/app/AppLoginResponse.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/dto/app/AppUserProfileResponse.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/dto/app/AppUserProfileUpdateRequest.java`

- [ ] **Step 1: 创建 AppUser.java**

```java
package com.forge.modules.system.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("app_user")
public class AppUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String openId;

    private String unionId;

    private String nickname;

    private String avatar;

    private String phone;

    private Integer status;

    private LocalDateTime lastLoginTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
```

- [ ] **Step 2: 创建 WxLoginRequest.java**

```java
package com.forge.modules.system.dto.app;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WxLoginRequest {

    @NotBlank(message = "微信登录code不能为空")
    private String code;
}
```

- [ ] **Step 3: 创建 AppLoginResponse.java**

```java
package com.forge.modules.system.dto.app;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppLoginResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private Long refreshExpiresIn;
    private AppUserProfileResponse userInfo;
}
```

- [ ] **Step 4: 创建 AppUserProfileResponse.java**

```java
package com.forge.modules.system.dto.app;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppUserProfileResponse {

    private Long id;
    private String nickname;
    private String avatar;
    private String phone;
}
```

- [ ] **Step 5: 创建 AppUserProfileUpdateRequest.java**

```java
package com.forge.modules.system.dto.app;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AppUserProfileUpdateRequest {

    @Size(max = 64, message = "昵称最长64个字符")
    private String nickname;

    private String avatar;
}
```

- [ ] **Step 6: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -pl forge-module-system/forge-module-system-api -q`
Expected: BUILD SUCCESS

- [ ] **Step 7: 提交**

```bash
git add apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/entity/AppUser.java
git add apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/dto/app/
git commit -m "feat(system): 新增 AppUser 实体和移动端 DTO"
```

---

### Task 5: 数据库迁移脚本

**Files:**
- Create: `apps/forge-server/forge-server/src/main/resources/db/migration/V2026061101__app_user.sql`

- [ ] **Step 1: 创建迁移脚本**

```sql
CREATE TABLE app_user (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    open_id         VARCHAR(64)  NOT NULL COMMENT '微信openid',
    union_id        VARCHAR(64)  DEFAULT NULL COMMENT '微信unionid',
    nickname        VARCHAR(64)  DEFAULT NULL COMMENT '昵称',
    avatar          VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
    phone           VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
    status          TINYINT      NOT NULL DEFAULT 0 COMMENT '状态（0正常 1禁用）',
    last_login_time DATETIME     DEFAULT NULL COMMENT '最后登录时间',
    create_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted         TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除',
    UNIQUE KEY uk_open_id (open_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='移动端用户表';
```

- [ ] **Step 2: 在 MySQL 中执行该脚本（或等应用启动时 flyway 执行）**

- [ ] **Step 3: 提交**

```bash
git add apps/forge-server/forge-server/src/main/resources/db/migration/V2026061101__app_user.sql
git commit -m "feat(db): 新增 app_user 表迁移脚本"
```

---

### Task 6: 新增 AppUserMapper

**Files:**
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/mapper/AppUserMapper.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/resources/mapper/system/AppUserMapper.xml`

- [ ] **Step 1: 创建 AppUserMapper.java**

```java
package com.forge.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.forge.modules.system.entity.AppUser;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AppUserMapper extends BaseMapper<AppUser> {
}
```

- [ ] **Step 2: 创建 AppUserMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.forge.modules.system.mapper.AppUserMapper">
</mapper>
```

- [ ] **Step 3: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -pl forge-module-system/forge-module-system-biz -q`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
git add apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/mapper/AppUserMapper.java
git add apps/forge-server/forge-module-system/forge-module-system-biz/src/main/resources/mapper/system/AppUserMapper.xml
git commit -m "feat(system): 新增 AppUserMapper"
```

---

### Task 7: 新增 AppUserService 和 AppAuthService

**Files:**
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/AppUserService.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/AppUserServiceImpl.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/AppAuthService.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/AppAuthServiceImpl.java`

- [ ] **Step 1: 创建 AppUserService.java**

```java
package com.forge.modules.system.service.app;

import com.forge.modules.system.dto.app.AppUserProfileResponse;
import com.forge.modules.system.dto.app.AppUserProfileUpdateRequest;
import com.forge.modules.system.entity.AppUser;

public interface AppUserService {

    AppUser getByOpenId(String openId);

    AppUser getById(Long id);

    AppUser createAppUser(AppUser appUser);

    AppUserProfileResponse getProfile(Long userId);

    void updateProfile(Long userId, AppUserProfileUpdateRequest request);
}
```

- [ ] **Step 2: 创建 AppUserServiceImpl.java**

```java
package com.forge.modules.system.service.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.forge.modules.system.dto.app.AppUserProfileResponse;
import com.forge.modules.system.dto.app.AppUserProfileUpdateRequest;
import com.forge.modules.system.entity.AppUser;
import com.forge.modules.system.mapper.AppUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserServiceImpl implements AppUserService {

    private final AppUserMapper appUserMapper;

    @Override
    public AppUser getByOpenId(String openId) {
        return appUserMapper.selectOne(
                new LambdaQueryWrapper<AppUser>().eq(AppUser::getOpenId, openId));
    }

    @Override
    public AppUser getById(Long id) {
        return appUserMapper.selectById(id);
    }

    @Override
    public AppUser createAppUser(AppUser appUser) {
        appUserMapper.insert(appUser);
        return appUser;
    }

    @Override
    public AppUserProfileResponse getProfile(Long userId) {
        AppUser user = appUserMapper.selectById(userId);
        if (user == null) {
            return null;
        }
        return AppUserProfileResponse.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .phone(user.getPhone())
                .build();
    }

    @Override
    public void updateProfile(Long userId, AppUserProfileUpdateRequest request) {
        AppUser user = new AppUser();
        user.setId(userId);
        user.setNickname(request.getNickname());
        user.setAvatar(request.getAvatar());
        appUserMapper.updateById(user);
    }
}
```

- [ ] **Step 3: 创建 AppAuthService.java**

```java
package com.forge.modules.system.service.app;

import com.forge.modules.system.dto.app.AppLoginResponse;

public interface AppAuthService {

    AppLoginResponse wxLogin(String code);

    AppLoginResponse refreshToken(String refreshToken);

    void logout(String accessToken, String refreshToken);
}
```

- [ ] **Step 4: 创建 AppAuthServiceImpl.java**

```java
package com.forge.modules.system.service.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forge.framework.security.config.JwtProperties;
import com.forge.modules.system.dto.app.AppLoginResponse;
import com.forge.modules.system.dto.app.AppUserProfileResponse;
import com.forge.modules.system.entity.AppUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppAuthServiceImpl implements AppAuthService {

    private final AppUserService appUserService;
    private final JwtProperties jwtProperties;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${forge.wx.mini-app-id:}")
    private String appId;

    @Value("${forge.wx.mini-app-secret:}")
    private String appSecret;

    private static final String REFRESH_TOKEN_PREFIX = "app_refresh_token:";
    private static final String SESSION_PREFIX = "app_session:";
    private static final String WX_CODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code";

    @Override
    public AppLoginResponse wxLogin(String code) {
        // 1. 调用微信接口获取 openid
        String openId = getWxOpenId(code);
        if (openId == null) {
            throw new RuntimeException("微信登录失败，无法获取用户标识");
        }

        // 2. 查询或创建用户
        AppUser user = appUserService.getByOpenId(openId);
        boolean isNewUser = false;
        if (user == null) {
            user = AppUser.builder()
                    .openId(openId)
                    .status(0)
                    .lastLoginTime(LocalDateTime.now())
                    .build();
            appUserService.createAppUser(user);
            isNewUser = true;
        } else {
            user.setLastLoginTime(LocalDateTime.now());
            appUserService.updateLastLoginTime(user.getId());
        }

        // 3. 生成 token（tokenId 使用 UUID）
        String tokenId = UUID.randomUUID().toString().replace("-", "");

        // 使用 admin 相同的 JWT 密钥但 claim 中带 type=app
        String accessToken = generateAppToken(user.getId().toString(), tokenId);
        String refreshToken = generateRefreshToken(user.getId().toString());

        // 4. 保存会话到 Redis
        saveAppSession(tokenId, user.getId(), user.getOpenId());

        // 5. 构建响应
        AppUserProfileResponse profile = appUserService.getProfile(user.getId());
        return AppLoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getExpiration())
                .refreshExpiresIn(jwtProperties.getRefreshExpiration())
                .userInfo(profile)
                .build();
    }

    @Override
    public AppLoginResponse refreshToken(String refreshToken) {
        // 验证 refresh token
        String redisKey = REFRESH_TOKEN_PREFIX + refreshToken;
        String userIdStr = stringRedisTemplate.opsForValue().get(redisKey);
        if (userIdStr == null) {
            throw new RuntimeException("刷新令牌无效或已过期");
        }

        // 删除旧 refresh token
        stringRedisTemplate.delete(redisKey);

        Long userId = Long.parseLong(userIdStr);
        AppUser user = appUserService.getById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 生成新 token
        String tokenId = UUID.randomUUID().toString().replace("-", "");
        String accessToken = generateAppToken(userId.toString(), tokenId);
        String newRefreshToken = generateRefreshToken(userId.toString());

        // 保存新会话
        saveAppSession(tokenId, userId, user.getOpenId());

        AppUserProfileResponse profile = appUserService.getProfile(userId);
        return AppLoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getExpiration())
                .refreshExpiresIn(jwtProperties.getRefreshExpiration())
                .userInfo(profile)
                .build();
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        // 删除 refresh token
        if (refreshToken != null) {
            stringRedisTemplate.delete(REFRESH_TOKEN_PREFIX + refreshToken);
        }
        // 注意：access token 本身无法撤销（JWT 无状态），依赖其自然过期
    }

    private String getWxOpenId(String code) {
        try {
            String url = String.format(WX_CODE2SESSION_URL, appId, appSecret, code);
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(url, String.class);
            JsonNode json = objectMapper.readTree(response);
            if (json.has("openid")) {
                return json.get("openid").asText();
            }
            log.error("微信登录失败: {}", response);
            return null;
        } catch (Exception e) {
            log.error("调用微信接口异常", e);
            return null;
        }
    }

    private String generateAppToken(String subject, String tokenId) {
        // 复用 admin 的 JWT 密钥，但 claim 带 type=app
        javax.crypto.SecretKey key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                jwtProperties.getSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8));
        java.util.Date now = new java.util.Date();
        java.util.Date expiry = new java.util.Date(now.getTime() + jwtProperties.getExpiration());
        return io.jsonwebtoken.Jwts.builder()
                .subject(subject)
                .claim("tokenId", tokenId)
                .claim("type", "app")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    private String generateRefreshToken(String userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        stringRedisTemplate.opsForValue().set(
                REFRESH_TOKEN_PREFIX + token,
                userId,
                jwtProperties.getRefreshExpiration(),
                TimeUnit.MILLISECONDS);
        return token;
    }

    private void saveAppSession(String tokenId, Long userId, String openId) {
        stringRedisTemplate.opsForValue().set(
                SESSION_PREFIX + tokenId,
                userId + ":" + openId,
                jwtProperties.getRefreshExpiration(),
                TimeUnit.MILLISECONDS);
    }
}
```

**注意：** `AppUserServiceImpl` 需要添加 `updateLastLoginTime` 方法：

```java
public void updateLastLoginTime(Long userId) {
    AppUser user = new AppUser();
    user.setId(userId);
    user.setLastLoginTime(LocalDateTime.now());
    appUserMapper.updateById(user);
}
```

同时 `AppUserService` 接口需添加：
```java
void updateLastLoginTime(Long userId);
```

- [ ] **Step 5: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -pl forge-module-system/forge-module-system-biz -q`
Expected: BUILD SUCCESS

- [ ] **Step 6: 提交**

```bash
git add apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/
git commit -m "feat(system): 新增 AppUserService 和 AppAuthService，实现微信登录和 token 管理"
```

---

### Task 8: 新增 AppJwtAuthenticationFilter

**Files:**
- Create: `apps/forge-server/forge-framework/forge-spring-boot-starter-security/src/main/java/com/forge/framework/security/config/AppJwtAuthenticationFilter.java`

- [ ] **Step 1: 创建 AppJwtAuthenticationFilter.java**

```java
package com.forge.framework.security.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Slf4j
@Component
public class AppJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProperties jwtProperties;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String SESSION_PREFIX = "app_session:";

    public AppJwtAuthenticationFilter(JwtProperties jwtProperties,
                                       StringRedisTemplate stringRedisTemplate) {
        this.jwtProperties = jwtProperties;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = resolveToken(request);
            if (StringUtils.hasText(token) && validateAppToken(token)) {
                SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
                Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();

                // 校验 token type 必须是 app
                String type = claims.get("type", String.class);
                if (!"app".equals(type)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                String tokenId = claims.get("tokenId", String.class);
                String userIdStr = claims.getSubject();

                // 检查会话是否存在
                String session = stringRedisTemplate.opsForValue().get(SESSION_PREFIX + tokenId);
                if (session == null) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // 设置认证信息（无权限列表，app 用户不做细粒度权限控制）
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userIdStr, null, Collections.emptyList());
                authentication.setDetails(new org.springframework.security.web.authentication.WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                // 将 userId 存入 request attribute，供 Controller 使用
                request.setAttribute("appUserId", Long.parseLong(userIdStr));
            }
        } catch (Exception e) {
            log.error("App JWT认证失败", e);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private boolean validateAppToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -pl forge-framework/forge-spring-boot-starter-security -q`
Expected: BUILD SUCCESS

- [ ] **Step 3: 提交**

```bash
git add apps/forge-server/forge-framework/forge-spring-boot-starter-security/src/main/java/com/forge/framework/security/config/AppJwtAuthenticationFilter.java
git commit -m "feat(security): 新增 AppJwtAuthenticationFilter，独立处理移动端 JWT 认证"
```

---

### Task 9: 修改 SecurityConfig 支持双 SecurityFilterChain

**Files:**
- Modify: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/common/config/SecurityConfig.java`

- [ ] **Step 1: 重写 SecurityConfig.java**

关键改动：
- 原有 `securityFilterChain` 加 `@Order(1)` 并限定 `/admin-api/**`
- 新增 `appSecurityFilterChain` 加 `@Order(2)` 限定 `/app-api/**`
- 白名单路径加上 admin-api 前缀
- 新增 app-api 白名单

```java
package com.forge.common.config;

import com.forge.framework.security.config.AppJwtAuthenticationFilter;
import com.forge.modules.system.auth.security.JwtAuthenticationEntryPoint;
import com.forge.modules.system.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
                          @Lazy UserDetailsService userDetailsService) {
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.userDetailsService = userDetailsService;
    }

    // Admin API 白名单（不含前缀，由 security matcher 匹配后的相对路径）
    private static final String[] ADMIN_WHITE_LIST = {
            "/auth/login",
            "/auth/register",
            "/auth/captcha",
            "/auth/refresh",
            "/auth/social/authorize/**",
            "/auth/social/callback/**",
            "/oauth2/token",
            "/oauth2/jwks",
            "/oauth2/authorization-server",
            "/.well-known/**",
            "/userinfo",
            "/connect/logout",
    };

    // 全局白名单（不受 SecurityFilterChain 约束的路径）
    private static final String[] GLOBAL_WHITE_LIST = {
            "/ws/**",
            "/app/**",
            "/doc.html",
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/webjars/**",
            "/favicon.ico",
            "/file/**",
            "/uploads/**",
            "/ws/info/**",
            "/topic/**",
            "/error"
    };

    // App API 白名单
    private static final String[] APP_WHITE_LIST = {
            "/auth/wx-login",
            "/auth/refresh",
    };

    @Bean
    @Order(1)
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http,
                                                         @Lazy JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .securityMatcher("/admin-api/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(ADMIN_WHITE_LIST).permitAll()
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain appSecurityFilterChain(HttpSecurity http,
                                                       @Lazy AppJwtAuthenticationFilter appJwtAuthenticationFilter) throws Exception {
        http
                .securityMatcher("/app-api/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(APP_WHITE_LIST).permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(appJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    @Order(3)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        // 处理非 admin-api/app-api 的请求（swagger、ws、uploads 等）
        http
                .securityMatcher("/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(GLOBAL_WHITE_LIST).permitAll()
                        .anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthorityPrefix("SCOPE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 3: 提交**

```bash
git add apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/common/config/SecurityConfig.java
git commit -m "refactor(security): 拆分为 admin/app 双 SecurityFilterChain"
```

---

### Task 10: 新增 App Controller

**Files:**
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/controller/app/AppAuthController.java`
- Create: `apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/controller/app/AppUserController.java`

- [ ] **Step 1: 创建 AppAuthController.java**

```java
package com.forge.modules.system.controller.app;

import com.forge.common.response.Result;
import com.forge.modules.system.dto.app.AppLoginResponse;
import com.forge.modules.system.dto.app.WxLoginRequest;
import com.forge.modules.system.service.app.AppAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "移动端 - 认证")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AppAuthController {

    private final AppAuthService appAuthService;

    @Operation(summary = "微信登录")
    @PostMapping("/wx-login")
    public Result<AppLoginResponse> wxLogin(@Valid @RequestBody WxLoginRequest request) {
        return Result.success(appAuthService.wxLogin(request.getCode()));
    }

    @Operation(summary = "刷新Token")
    @PostMapping("/refresh")
    public Result<AppLoginResponse> refresh(@RequestBody java.util.Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return Result.failed("refreshToken不能为空");
        }
        return Result.success(appAuthService.refreshToken(refreshToken));
    }

    @Operation(summary = "登出")
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        String refreshToken = request.getHeader("X-Refresh-Token");
        appAuthService.logout(accessToken, refreshToken);
        return Result.success();
    }
}
```

- [ ] **Step 2: 创建 AppUserController.java**

```java
package com.forge.modules.system.controller.app;

import com.forge.common.response.Result;
import com.forge.modules.system.dto.app.AppUserProfileResponse;
import com.forge.modules.system.dto.app.AppUserProfileUpdateRequest;
import com.forge.modules.system.service.app.AppUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "移动端 - 用户")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class AppUserController {

    private final AppUserService appUserService;

    @Operation(summary = "获取个人信息")
    @GetMapping("/profile")
    public Result<AppUserProfileResponse> getProfile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("appUserId");
        if (userId == null) {
            return Result.failed("未登录");
        }
        return Result.success(appUserService.getProfile(userId));
    }

    @Operation(summary = "更新个人信息")
    @PutMapping("/profile")
    public Result<Void> updateProfile(HttpServletRequest request,
                                       @Valid @RequestBody AppUserProfileUpdateRequest updateRequest) {
        Long userId = (Long) request.getAttribute("appUserId");
        if (userId == null) {
            return Result.failed("未登录");
        }
        appUserService.updateProfile(userId, updateRequest);
        return Result.success();
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
git add apps/forge-server/forge-module-system/forge-module-system-biz/src/main/java/com/forge/modules/system/controller/app/
git commit -m "feat(system): 新增 AppAuthController 和 AppUserController"
```

---

### Task 11: 迁移现有 Controller 到 admin/ 子包

**Files:**
- Move: 32 个 Controller 文件（见下方完整列表）

**重要：** 这是纯文件移动操作，不改代码内容，只改包声明（package 行）。

System 模块 Controller（17 个）：
```
controller/SysAttachmentController.java      → controller/admin/SysAttachmentController.java
controller/SysConfigController.java          → controller/admin/SysConfigController.java
controller/SysDeptController.java            → controller/admin/SysDeptController.java
controller/SysDictDataController.java        → controller/admin/SysDictDataController.java
controller/SysDictTypeController.java        → controller/admin/SysDictTypeController.java
controller/SysFileConfigController.java      → controller/admin/SysFileConfigController.java
controller/SysJobController.java             → controller/admin/SysJobController.java
controller/SysLoginLogController.java        → controller/admin/SysLoginLogController.java
controller/SysMenuController.java            → controller/admin/SysMenuController.java
controller/SysNoticeController.java          → controller/admin/SysNoticeController.java
controller/SysOnlineUserController.java      → controller/admin/SysOnlineUserController.java
controller/SysOperationLogController.java    → controller/admin/SysOperationLogController.java
controller/SysPositionController.java        → controller/admin/SysPositionController.java
controller/SysRoleController.java            → controller/admin/SysRoleController.java
controller/SysUserController.java            → controller/admin/SysUserController.java
controller/DashboardController.java          → controller/admin/DashboardController.java
controller/KeySequenceController.java        → controller/admin/KeySequenceController.java
```

Auth 模块 Controller（4 个）：
```
auth/controller/AuthController.java          → controller/admin/AuthController.java
auth/controller/SocialAuthController.java    → controller/admin/SocialAuthController.java
auth/controller/OAuth2ClientController.java  → controller/admin/OAuth2ClientController.java
auth/controller/OAuth2UserInfoController.java → controller/admin/OAuth2UserInfoController.java
```

Quartz 模块 Controller（1 个）：
```
quartz/controller/SysJobLogController.java   → controller/admin/SysJobLogController.java
```

Workflow 模块 Controller（10 个）：
```
controller/WfCandidateStrategyController.java       → controller/admin/WfCandidateStrategyController.java
controller/WfCategoryController.java                → controller/admin/WfCategoryController.java
controller/WfFormController.java                    → controller/admin/WfFormController.java
controller/WfModelController.java                   → controller/admin/WfModelController.java
controller/WfProcessDefinitionController.java       → controller/admin/WfProcessDefinitionController.java
controller/WfProcessExpressionController.java       → controller/admin/WfProcessExpressionController.java
controller/WfProcessInstanceController.java         → controller/admin/WfProcessInstanceController.java
controller/WfProcessInstanceCopyController.java     → controller/admin/WfProcessInstanceCopyController.java
controller/WfProcessListenerController.java         → controller/admin/WfProcessListenerController.java
controller/WfTaskController.java                    → controller/admin/WfTaskController.java
```

- [ ] **Step 1: 创建 admin 目录并移动文件**

对每个文件执行：
1. `mkdir -p controller/admin/`
2. `git mv XxxController.java controller/admin/XxxController.java`
3. 修改文件内 `package` 声明：`package com.forge.modules.system.controller;` → `package com.forge.modules.system.controller.admin;`

auth 模块的 Controller 移入 `system/controller/admin/` 并修改 package 为 `com.forge.modules.system.controller.admin`（统一归到 admin 子包，不再保留 auth/controller 子结构）。

quartz 模块的 SysJobLogController 同理移入 `system/controller/admin/`。

**每个移动后的文件只需改一行：** `package` 声明。

- [ ] **Step 2: 编译验证**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn clean compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: 迁移所有现有 Controller 到 admin/ 子包，启用自动前缀注入"
```

---

### Task 12: 前端适配

**Files:**
- Modify: `apps/forge-web/src/utils/request.ts`
- Modify: `apps/forge-web/vite.config.ts`

- [ ] **Step 1: 修改 request.ts**

将 `baseURL` 从 `'/api'` 改为 `'/admin-api'`：

```typescript
const service: AxiosInstance = axios.create({
  baseURL: '/admin-api',
  timeout: 30000
})
```

同时修改 refresh 接口路径（第 93 行附近）：
```typescript
// 原：axios.post<Result<any>>('/api/auth/refresh', { refreshToken: refreshTokenValue })
// 改：
refreshPromise = axios
    .post<Result<any>>('/admin-api/auth/refresh', { refreshToken: refreshTokenValue })
```

- [ ] **Step 2: 修改 vite.config.ts 代理配置**

```typescript
proxy: {
  '/admin-api': {
    target: 'http://localhost:8181',
    changeOrigin: true
  },
  '/app-api': {
    target: 'http://localhost:8181',
    changeOrigin: true
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add apps/forge-web/src/utils/request.ts apps/forge-web/vite.config.ts
git commit -m "feat(web): 前端适配 admin-api 前缀，去掉 /api context-path"
```

---

### Task 13: 启动验证

- [ ] **Step 1: 后端启动**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-server && mvn spring-boot:run -pl forge-server`

验证点：
- 启动无报错
- 访问 `http://localhost:8181/doc.html` 能打开 API 文档
- API 文档中 Controller 路径已自动加上 `/admin-api` 前缀

- [ ] **Step 2: 前端启动**

Run: `cd /Users/huangjian/workspace/cursor/forge-admin/apps/forge-web && pnpm dev`

验证点：
- 前端访问 `http://localhost:3003` 正常
- 登录功能正常（API 调用路径为 `/admin-api/auth/login`）
- 登录后各页面数据加载正常

- [ ] **Step 3: 验证 app-api 端点**

使用 curl 测试：
```bash
# 测试微信登录端点（预期返回微信配置错误，因为未配置 appId）
curl -X POST http://localhost:8181/app-api/auth/wx-login \
  -H "Content-Type: application/json" \
  -d '{"code": "test"}'
```

- [ ] **Step 4: 最终提交**

如有任何修复，提交后结束。

---

## 自检结果

**1. Spec 覆盖：**
- 框架层 WebProperties + configurePathMatch → Task 1, 2
- 去掉 context-path + 新增配置 → Task 3
- AppUser 实体 + DTO → Task 4
- 数据库迁移 → Task 5
- AppUserMapper → Task 6
- AppUserService + AppAuthService → Task 7
- AppJwtAuthenticationFilter → Task 8
- SecurityConfig 双 FilterChain → Task 9
- AppAuthController + AppUserController → Task 10
- Controller 迁移 → Task 11
- 前端适配 → Task 12
- 启动验证 → Task 13
- **无遗漏**

**2. 占位符扫描：** 无 TBD/TODO

**3. 类型一致性：**
- `AppUser` 实体字段与 `app_user` 表列一致
- `AppUserProfileResponse` 在 `AppAuthService` 和 `AppUserController` 中使用一致
- Redis key 前缀 `app_session:`、`app_refresh_token:` 在 Filter 和 Service 中一致
- JWT claim `type: "app"` 在生成（`AppAuthServiceImpl`）和验证（`AppJwtAuthenticationFilter`）中一致
- `request.getAttribute("appUserId")` 在 Filter 设置和 Controller 读取中一致
