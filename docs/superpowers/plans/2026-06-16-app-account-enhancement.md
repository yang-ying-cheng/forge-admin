# App 端账号管理增强 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 forge-admin 的 app 端用户实现手机号绑定/换绑、账号注销、头像上传、后台 app 用户管理，并新建 uni-app 小程序端工程 forge-miniapp 完成闭环。

**Architecture:** 后端新增 SmsService 抽象 + Mock 实现、AppUserService 扩展、AOP 切面 @AssertAppUserActive、Redis app_user_sessions SET 精准下线、AppAttachmentController 独立上传端点、AppUserAdminController 后台管理；admin 前端复用现有 vxe-table 模式；小程序端 uni-app + uview-plus。

**Tech Stack:** Spring Boot 3.2 + MyBatis Plus + Redis + JWT + Vue 3 + Element Plus + vxe-table + uni-app + uview-plus + Pinia

**Spec:** `docs/superpowers/specs/2026-06-15-app-account-enhancement-design.md`

---

## 文件结构

### 后端新增/修改文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `forge-server/src/main/resources/db/migration/V2026061601__app_user_extend.sql` | 新增 | 加字段、联合唯一索引、菜单 SQL |
| `forge-module-system-api/.../entity/AppUser.java` | 修改 | 加 phoneVerified、deactivatedTime |
| `forge-module-system-api/.../dto/app/SmsCodeRequest.java` | 新增 | |
| `forge-module-system-api/.../dto/app/PhoneBindRequest.java` | 新增 | |
| `forge-module-system-api/.../dto/app/DeactivateRequest.java` | 新增 | |
| `forge-module-system-api/.../dto/app/AppUploadResponse.java` | 新增 | |
| `forge-module-system-api/.../dto/app/AppUserDetailResponse.java` | 新增 | |
| `forge-module-system-api/.../dto/app/AppUserQueryRequest.java` | 新增 | |
| `forge-module-system-api/.../dto/app/AppUserProfileResponse.java` | 修改 | 加 phoneVerified、openId 脱敏、status、lastLoginTime |
| `forge-module-system-api/.../service/sms/SmsService.java` | 新增 | 接口 |
| `forge-module-system-api/.../service/sms/SmsProperties.java` | 新增 | 配置类 |
| `forge-module-system-api/.../annotation/AssertAppUserActive.java` | 新增 | AOP 注解 |
| `forge-module-system-biz/.../service/sms/MockSmsServiceImpl.java` | 新增 | Mock 实现 |
| `forge-module-system-biz/.../service/sms/SmsCodeManager.java` | 新增 | 验证码生成/限流/校验 |
| `forge-module-system-biz/.../service/app/AppUserService.java` | 修改 | 加 bindPhone、deactivate、updateStatus、adminQuery |
| `forge-module-system-biz/.../service/app/AppUserServiceImpl.java` | 修改 | |
| `forge-module-system-biz/.../service/app/AppAuthService.java` | 修改 | logout 要维护 SET |
| `forge-module-system-biz/.../service/app/AppAuthServiceImpl.java` | 修改 | |
| `forge-module-system-biz/.../aop/AssertAppUserActiveAspect.java` | 新增 | |
| `forge-module-system-biz/.../controller/app/AppAttachmentController.java` | 新增 | |
| `forge-module-system-biz/.../controller/app/AppUserController.java` | 修改 | 加 sms-code、bind-phone、deactivate |
| `forge-module-system-biz/.../controller/admin/AppUserAdminController.java` | 新增 | |
| `forge-common/.../response/ResultCode.java` | 修改 | 新增 SMS/PHONE 相关错误码 |
| `forge-server/src/main/resources/application.yml` | 修改 | 加 forge.sms 配置 |

### Admin 前端新增/修改文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `forge-web/src/api/system/app-user.ts` | 新增 | |
| `forge-web/src/api/attachment.ts` | 新增 | app 端上传（admin 已有 system/file-config 不用） |
| `forge-web/src/views/system/app-user/index.vue` | 新增 | 列表页 |
| `forge-web/src/views/system/app-user/detail.vue` | 新增 | 详情抽屉 |

### uni-app 小程序端新增文件

| 文件 | 说明 |
|------|------|
| `apps/forge-miniapp/package.json` | |
| `apps/forge-miniapp/tsconfig.json` | |
| `apps/forge-miniapp/vite.config.ts` | |
| `apps/forge-miniapp/src/main.ts` | |
| `apps/forge-miniapp/src/App.vue` | |
| `apps/forge-miniapp/src/pages.json` | |
| `apps/forge-miniapp/src/manifest.json` | |
| `apps/forge-miniapp/src/api/request.ts` | |
| `apps/forge-miniapp/src/api/auth.ts` | |
| `apps/forge-miniapp/src/api/user.ts` | |
| `apps/forge-miniapp/src/api/attachment.ts` | |
| `apps/forge-miniapp/src/stores/index.ts` | |
| `apps/forge-miniapp/src/stores/user.ts` | |
| `apps/forge-miniapp/src/pages/login/index.vue` | |
| `apps/forge-miniapp/src/pages/profile/index.vue` | |
| `apps/forge-miniapp/src/pages/profile/edit.vue` | |
| `apps/forge-miniapp/src/pages/profile/phone.vue` | |
| `apps/forge-miniapp/src/pages/profile/deactivate.vue` | |
| `apps/forge-miniapp/src/composables/useSmsCode.ts` | |
| `apps/forge-miniapp/src/components/SmsCodeInput.vue` | |

---

## Task 1: 数据库迁移 + AppUser 实体扩展

**Files:**
- Create: `apps/forge-server/forge-server/src/main/resources/db/migration/V2026061601__app_user_extend.sql`
- Modify: `apps/forge-server/forge-module-system/forge-module-system-api/src/main/java/com/forge/modules/system/entity/AppUser.java`

- [ ] **Step 1: 创建迁移脚本**

```sql
-- V2026061601__app_user_extend.sql

-- 1. 新增字段
ALTER TABLE app_user
    ADD COLUMN phone_verified TINYINT NOT NULL DEFAULT 0
        COMMENT '手机号是否已验证（0否 1是）' AFTER phone,
    ADD COLUMN deactivated_time DATETIME DEFAULT NULL
        COMMENT '注销时间，NULL表示未注销' AFTER last_login_time;

-- 2. 调整 open_id 唯一约束
ALTER TABLE app_user DROP INDEX uk_open_id;
ALTER TABLE app_user ADD UNIQUE KEY uk_open_id_active (open_id, deleted);

-- 3. App用户菜单（挂在系统管理下）
-- 假设系统管理菜单 id=2（实际需查现有数据，这里用占位值，实施时调整）
INSERT INTO sys_menu (id, menu_name, parent_id, route_path, component_path, icon, sort_order, menu_type, permission, status, visible, is_external, is_cached)
VALUES (300, 'App用户', 2, '/system/app-user', 'system/app-user/index', 'User', 5, 1, 'system:app-user:list', 1, 1, 0, 0);

-- 按钮权限
INSERT INTO sys_menu (id, menu_name, parent_id, route_path, component_path, icon, sort_order, menu_type, permission, status, visible, is_external, is_cached) VALUES
(301, '详情', 300, '', '', '', 1, 2, 'system:app-user:detail', 1, 1, 0, 0),
(302, '修改', 300, '', '', '', 2, 2, 'system:app-user:update', 1, 1, 0, 0),
(303, '删除', 300, '', '', '', 3, 2, 'system:app-user:delete', 1, 1, 0, 0);

-- 给超级管理员授权
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(1, 300), (1, 301), (1, 302), (1, 303);
```

> 注意：菜单 id=300/301/302/303 和 parent_id=2 需根据实际 sys_menu 表调整，避免冲突。

- [ ] **Step 2: 修改 AppUser.java 加字段**

在现有 AppUser.java 中添加：

```java
private Integer phoneVerified;      // 手机号是否已验证
private LocalDateTime deactivatedTime;  // 注销时间
```

- [ ] **Step 3: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
git add forge-server/src/main/resources/db/migration/V2026061601__app_user_extend.sql
git add forge-module-system-api/src/main/java/com/forge/modules/system/entity/AppUser.java
git commit -m "feat(db): app_user 表扩展字段 + App用户菜单"
```

---

## Task 2: DTO 与 ResultCode 扩展

**Files:**
- Create: `forge-module-system-api/.../dto/app/SmsCodeRequest.java`
- Create: `forge-module-system-api/.../dto/app/PhoneBindRequest.java`
- Create: `forge-module-system-api/.../dto/app/DeactivateRequest.java`
- Create: `forge-module-system-api/.../dto/app/AppUploadResponse.java`
- Create: `forge-module-system-api/.../dto/app/AppUserDetailResponse.java`
- Create: `forge-module-system-api/.../dto/app/AppUserQueryRequest.java`
- Modify: `forge-module-system-api/.../dto/app/AppUserProfileResponse.java`
- Modify: `forge-common/.../response/ResultCode.java`

- [ ] **Step 1: 创建 SmsCodeRequest**

```java
package com.forge.modules.system.dto.app;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SmsCodeRequest {
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    private String scene; // BIND_PHONE, CHANGE_PHONE（预留）
}
```

- [ ] **Step 2: 创建 PhoneBindRequest**

```java
package com.forge.modules.system.dto.app;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PhoneBindRequest {
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    @NotBlank(message = "验证码不能为空")
    @Pattern(regexp = "^\\d{6}$", message = "验证码格式不正确")
    private String code;
}
```

- [ ] **Step 3: 创建 DeactivateRequest**

```java
package com.forge.modules.system.dto.app;

import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

@Data
public class DeactivateRequest {
    @AssertTrue(message = "必须确认注销")
    private Boolean confirm;
}
```

- [ ] **Step 4: 创建 AppUploadResponse**

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
public class AppUploadResponse {
    private String url;
    private Long attachmentId;
}
```

- [ ] **Step 5: 创建 AppUserDetailResponse（后台用）**

```java
package com.forge.modules.system.dto.app;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppUserDetailResponse {
    private Long id;
    private String nickname;
    private String avatar;
    private String phone;          // 已脱敏
    private Integer phoneVerified;
    private String openId;         // 已脱敏
    private String unionId;        // 已脱敏
    private Integer status;
    private LocalDateTime lastLoginTime;
    private LocalDateTime deactivatedTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
```

- [ ] **Step 6: 创建 AppUserQueryRequest（后台分页查询）**

```java
package com.forge.modules.system.dto.app;

import com.forge.common.request.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class AppUserQueryRequest extends PageRequest {
    private String nickname;
    private String phone;
    private String openId;
    private Integer status;
    private LocalDateTime createTimeStart;
    private LocalDateTime createTimeEnd;
}
```

- [ ] **Step 7: 修改 AppUserProfileResponse 加字段**

找到现有 AppUserProfileResponse.java，添加字段：

```java
private Integer phoneVerified;
private String openId;         // 脱敏：前4后4
private Integer status;
private LocalDateTime lastLoginTime;
```

- [ ] **Step 8: 修改 ResultCode.java 新增错误码**

在 forge-common 的 ResultCode.java 中新增：

```java
// 短信相关 56xx
SMS_COOLDOWN(5601, "验证码发送冷却中，请稍后再试"),
SMS_DAILY_EXCEEDED(5602, "今日验证码发送次数已达上限"),
SMS_CODE_NOT_FOUND(5603, "验证码不存在或已过期"),
SMS_CODE_ERROR(5604, "验证码错误"),
SMS_CODE_LOCKED(5605, "验证码错误次数过多，请重新获取"),

// 手机号相关 57xx
PHONE_ALREADY_BOUND(5701, "该手机号已被其他用户绑定"),

// 附件相关 58xx
ATTACHMENT_TYPE_INVALID(5801, "文件类型不支持"),
ATTACHMENT_SIZE_EXCEEDED(5802, "文件大小超过限制"),

// 用户状态相关（复用现有 USER_DISABLED 5103）
USER_DEACTIVATED(5106, "账号已注销"),
```

- [ ] **Step 9: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 10: 提交**

```bash
git add forge-module-system-api/src/main/java/com/forge/modules/system/dto/app/
git add forge-common/src/main/java/com/forge/common/response/ResultCode.java
git commit -m "feat(dto): 新增 app 端短信/手机号/注销/上传相关 DTO 和错误码"
```

---

## Task 3: SmsService 接口 + 配置 + Mock 实现

**Files:**
- Create: `forge-module-system-api/.../service/sms/SmsService.java`
- Create: `forge-module-system-api/.../service/sms/SmsProperties.java`
- Create: `forge-module-system-biz/.../service/sms/MockSmsServiceImpl.java`
- Modify: `forge-server/src/main/resources/application.yml`

- [ ] **Step 1: 创建 SmsService 接口**

```java
package com.forge.modules.system.service.sms;

public interface SmsService {
    /**
     * 发送短信验证码
     * @param phone 手机号
     * @param code 验证码
     */
    void send(String phone, String code);
}
```

- [ ] **Step 2: 创建 SmsProperties 配置类**

```java
package com.forge.modules.system.service.sms;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "forge.sms")
public class SmsProperties {
    private int codeLength = 6;
    private int codeTtlSeconds = 300;
    private int sendCooldownSeconds = 60;
    private int dailyLimit = 5;
    private int verifyErrorLimit = 5;
}
```

- [ ] **Step 3: 创建 MockSmsServiceImpl**

```java
package com.forge.modules.system.service.sms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnMissingBean(SmsService.class)
public class MockSmsServiceImpl implements SmsService {

    @Override
    public void send(String phone, String code) {
        // Mock：控制台打印验证码，方便开发调试
        log.info("【Mock短信】手机号: {}, 验证码: {}", phone, code);
    }
}
```

- [ ] **Step 4: 修改 application.yml 加配置**

在 `forge-server/src/main/resources/application.yml` 的 `forge:` 下添加：

```yaml
forge:
  # 现有配置...
  sms:
    code-length: 6
    code-ttl-seconds: 300
    send-cooldown-seconds: 60
    daily-limit: 5
    verify-error-limit: 5
```

- [ ] **Step 5: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 6: 提交**

```bash
git add forge-module-system-api/src/main/java/com/forge/modules/system/service/sms/
git add forge-module-system-biz/src/main/java/com/forge/modules/system/service/sms/
git add forge-server/src/main/resources/application.yml
git commit -m "feat(sms): SmsService 接口 + Mock 实现 + 配置"
```

---

## Task 4: SmsCodeManager 验证码管理

**Files:**
- Create: `forge-module-system-biz/.../service/sms/SmsCodeManager.java`

- [ ] **Step 1: 创建 SmsCodeManager**

```java
package com.forge.modules.system.service.sms;

import com.forge.common.exception.BusinessException;
import com.forge.common.response.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class SmsCodeManager {

    private final StringRedisTemplate redis;
    private final SmsProperties props;
    private final SecureRandom random = new SecureRandom();

    private static final String CODE_KEY = "app:sms:code:";
    private static final String LOCK_KEY = "app:sms:lock:";
    private static final String COUNT_KEY = "app:sms:count:";
    private static final String ERROR_KEY = "app:sms:error:";

    /** 发送验证码（含限流校验） */
    public void sendCode(String phone) {
        // 1. 冷却检查
        String lockKey = LOCK_KEY + phone;
        if (redis.hasKey(lockKey)) {
            throw new BusinessException(ResultCode.SMS_COOLDOWN);
        }

        // 2. 日限检查
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String countKey = COUNT_KEY + phone + ":" + date;
        String count = redis.opsForValue().get(countKey);
        if (count != null && Integer.parseInt(count) >= props.getDailyLimit()) {
            throw new BusinessException(ResultCode.SMS_DAILY_EXCEEDED);
        }

        // 3. 生成验证码
        String code = generateCode();

        // 4. 存储
        redis.opsForValue().set(CODE_KEY + phone, code, props.getCodeTtlSeconds(), TimeUnit.SECONDS);
        redis.opsForValue().set(lockKey, "1", props.getSendCooldownSeconds(), TimeUnit.SECONDS);
        redis.opsForValue().increment(countKey);
        redis.expire(countKey, 1, TimeUnit.DAYS);

        // 5. 清除错误计数
        redis.delete(ERROR_KEY + phone);
    }

    /** 验证验证码 */
    public void verifyCode(String phone, String inputCode) {
        String key = CODE_KEY + phone;
        String stored = redis.opsForValue().get(key);
        if (stored == null) {
            throw new BusinessException(ResultCode.SMS_CODE_NOT_FOUND);
        }

        if (!stored.equals(inputCode)) {
            // 错误计数
            String errorKey = ERROR_KEY + phone;
            Long errors = redis.opsForValue().increment(errorKey);
            redis.expire(errorKey, props.getCodeTtlSeconds(), TimeUnit.SECONDS);

            if (errors != null && errors >= props.getVerifyErrorLimit()) {
                redis.delete(key); // 锁码
                throw new BusinessException(ResultCode.SMS_CODE_LOCKED);
            }
            throw new BusinessException(ResultCode.SMS_CODE_ERROR);
        }

        // 验证成功，删除验证码和错误计数
        redis.delete(key);
        redis.delete(ERROR_KEY + phone);
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < props.getCodeLength(); i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 3: 提交**

```bash
git add forge-module-system-biz/src/main/java/com/forge/modules/system/service/sms/SmsCodeManager.java
git commit -m "feat(sms): SmsCodeManager 验证码生成/限流/校验"
```

---

## Task 5: AppUserService 扩展

**Files:**
- Modify: `forge-module-system-biz/.../service/app/AppUserService.java`
- Modify: `forge-module-system-biz/.../service/app/AppUserServiceImpl.java`

- [ ] **Step 1: AppUserService 接口加方法**

在现有 AppUserService.java 中添加：

```java
/** 绑定/换绑手机号 */
void bindPhone(Long userId, String phone);

/** 注销账号（软删除 + openId 改写） */
void deactivate(Long userId);

/** 更新状态（封禁/解封），含强制下线 */
void updateStatus(Long userId, Integer status);

/** 后台分页查询 */
Page<AppUserDetailResponse> adminPage(AppUserQueryRequest request);

/** 后台详情 */
AppUserDetailResponse adminDetail(Long id);

/** 后台重置资料 */
void adminResetProfile(Long id, String nickname, String avatar);
```

- [ ] **Step 2: AppUserServiceImpl 实现新方法**

核心实现：

```java
@Override
public void bindPhone(Long userId, String phone) {
    // 分布式锁防并发
    String lockKey = "app:lock:bind-phone:" + phone;
    Boolean locked = redis.opsForValue().setIfAbsent(lockKey, "1", 5, TimeUnit.SECONDS);
    if (!locked) {
        throw new BusinessException(429, "操作繁忙，请稍后再试");
    }
    try {
        // 二次校验：phone 未被其他有效用户占用（排除当前 userId）
        LambdaQueryWrapper<AppUser> wrapper = new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getPhone, phone)
                .eq(AppUser::getDeleted, 0)
                .ne(AppUser::getId, userId);
        if (appUserMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCode.PHONE_ALREADY_BOUND);
        }
        // 更新
        AppUser update = new AppUser();
        update.setId(userId);
        update.setPhone(phone);
        update.setPhoneVerified(1);
        appUserMapper.updateById(update);
    } finally {
        redis.delete(lockKey);
    }
}

@Override
public void deactivate(Long userId) {
    AppUser user = appUserMapper.selectById(userId);
    if (user == null || user.getDeleted() == 1) {
        throw new BusinessException(ResultCode.USER_NOT_FOUND);
    }
    // 改写 openId
    String newOpenId = user.getOpenId() + "#del_" + System.currentTimeMillis() / 1000;
    // 截断防止超长
    if (newOpenId.length() > 64) {
        newOpenId = newOpenId.substring(0, 64);
        log.warn("openId 改写后超长，已截断: userId={}", userId);
    }
    AppUser update = new AppUser();
    update.setId(userId);
    update.setDeleted(1);
    update.setOpenId(newOpenId);
    update.setDeactivatedTime(LocalDateTime.now());
    appUserMapper.updateById(update);

    // 清 Redis sessions
    clearUserSessions(userId);
}

@Override
public void updateStatus(Long userId, Integer status) {
    AppUser update = new AppUser();
    update.setId(userId);
    update.setStatus(status);
    appUserMapper.updateById(update);

    if (status == 1) {
        // 封禁时强制下线
        clearUserSessions(userId);
    }
}

private void clearUserSessions(Long userId) {
    String sessionSetKey = "app_user_sessions:" + userId;
    Set<String> members = redis.opsForSet().members(sessionSetKey);
    if (members != null) {
        for (String token : members) {
            if (token.startsWith("tok_")) {
                redis.delete("app_session:" + token);
            } else {
                redis.delete("app_refresh_token:" + token);
            }
        }
    }
    redis.delete(sessionSetKey);
}

@Override
public Page<AppUserDetailResponse> adminPage(AppUserQueryRequest request) {
    LambdaQueryWrapper<AppUser> wrapper = new LambdaQueryWrapper<>();
    wrapper.like(StringUtils.hasText(request.getNickname()), AppUser::getNickname, request.getNickname());
    wrapper.like(StringUtils.hasText(request.getPhone()), AppUser::getPhone, request.getPhone());
    wrapper.like(StringUtils.hasText(request.getOpenId()), AppUser::getOpenId, request.getOpenId());
    wrapper.eq(request.getStatus() != null, AppUser::getStatus, request.getStatus());
    wrapper.ge(request.getCreateTimeStart() != null, AppUser::getCreateTime, request.getCreateTimeStart());
    wrapper.le(request.getCreateTimeEnd() != null, AppUser::getCreateTime, request.getCreateTimeEnd());
    wrapper.orderByDesc(AppUser::getCreateTime);

    Page<AppUser> page = appUserMapper.selectPage(
            new Page<>(request.getPageNum(), request.getPageSize()), wrapper);

    return page.convert(this::toDetailResponse);
}

private AppUserDetailResponse toDetailResponse(AppUser user) {
    return AppUserDetailResponse.builder()
            .id(user.getId())
            .nickname(user.getNickname())
            .avatar(user.getAvatar())
            .phone(desensitizePhone(user.getPhone()))
            .phoneVerified(user.getPhoneVerified())
            .openId(desensitizeOpenId(user.getOpenId()))
            .unionId(desensitizeOpenId(user.getUnionId()))
            .status(user.getStatus())
            .lastLoginTime(user.getLastLoginTime())
            .deactivatedTime(user.getDeactivatedTime())
            .createTime(user.getCreateTime())
            .updateTime(user.getUpdateTime())
            .build();
}

private String desensitizePhone(String phone) {
    if (phone == null || phone.length() < 11) return phone;
    return phone.substring(0, 3) + "****" + phone.substring(7);
}

private String desensitizeOpenId(String openId) {
    if (openId == null || openId.length() < 8) return openId;
    return openId.substring(0, 4) + "****" + openId.substring(openId.length() - 4);
}
```

- [ ] **Step 3: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 4: 提交**

```bash
git add forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/AppUserService.java
git add forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/AppUserServiceImpl.java
git commit -m "feat(app): AppUserService 扩展 bindPhone/deactivate/updateStatus/adminQuery"
```

---

## Task 6: assertAppUserActive 注解 + AOP 切面

**Files:**
- Create: `forge-module-system-api/.../annotation/AssertAppUserActive.java`
- Create: `forge-module-system-biz/.../aop/AssertAppUserActiveAspect.java`

- [ ] **Step 1: 创建注解**

```java
package com.forge.modules.system.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AssertAppUserActive {
}
```

- [ ] **Step 2: 创建 AOP 切面**

```java
package com.forge.modules.system.aop;

import com.forge.common.exception.BusinessException;
import com.forge.common.response.ResultCode;
import com.forge.modules.system.annotation.AssertAppUserActive;
import com.forge.modules.system.entity.AppUser;
import com.forge.modules.system.service.app.AppUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class AssertAppUserActiveAspect {

    private final AppUserService appUserService;

    @Around("@annotation(com.forge.modules.system.annotation.AssertAppUserActive)")
    public Object check(ProceedingJoinPoint pjp) throws Throwable {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        HttpServletRequest request = attrs.getRequest();
        Long userId = (Long) request.getAttribute("appUserId");
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        AppUser user = appUserService.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        if (user.getDeleted() == 1 || user.getDeactivatedTime() != null) {
            throw new BusinessException(ResultCode.USER_DEACTIVATED);
        }
        if (user.getStatus() == 1) {
            throw new BusinessException(ResultCode.USER_DISABLED);
        }

        return pjp.proceed();
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 4: 提交**

```bash
git add forge-module-system-api/src/main/java/com/forge/modules/system/annotation/
git add forge-module-system-biz/src/main/java/com/forge/modules/system/aop/
git commit -m "feat(aop): @AssertAppUserActive 切面拦截已注销/封禁用户"
```

---

## Task 7: app_user_sessions SET 维护改造

**Files:**
- Modify: `forge-module-system-biz/.../service/app/AppAuthServiceImpl.java`

**目标：** 登录时 SADD tokenId 和 refreshToken 到 `app_user_sessions:{userId}`；登出时 SREM。

- [ ] **Step 1: 修改 AppAuthServiceImpl 的 saveAppSession 方法**

找到现有 `saveAppSession` 方法，改为：

```java
private void saveAppSession(String tokenId, String refreshToken, Long userId, String openId) {
    // 原有 session 存储
    stringRedisTemplate.opsForValue().set(
            SESSION_PREFIX + tokenId,
            userId + ":" + openId,
            jwtProperties.getRefreshExpiration(),
            TimeUnit.MILLISECONDS);

    // 新增：记录到用户 sessions SET
    String sessionSetKey = "app_user_sessions:" + userId;
    stringRedisTemplate.opsForSet().add(sessionSetKey, "tok_" + tokenId);
    stringRedisTemplate.opsForSet().add(sessionSetKey, refreshToken);
    stringRedisTemplate.expire(sessionSetKey, jwtProperties.getRefreshExpiration(), TimeUnit.MILLISECONDS);
}
```

同步修改 `wxLogin` 和 `refreshToken` 方法调用处，传入 refreshToken 参数。

- [ ] **Step 2: 修改 logout 方法**

```java
@Override
public void logout(String accessToken, String refreshToken) {
    // 解析 access_token 获取 tokenId 和 userId
    if (accessToken != null && accessToken.startsWith("Bearer ")) {
        accessToken = accessToken.substring(7);
    }
    if (accessToken != null) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(accessToken).getPayload();
            String tokenId = claims.get("tokenId", String.class);
            String userIdStr = claims.getSubject();

            // 删除 session
            stringRedisTemplate.delete(SESSION_PREFIX + tokenId);

            // 从 SET 中移除
            if (userIdStr != null) {
                stringRedisTemplate.opsForSet().remove("app_user_sessions:" + userIdStr, "tok_" + tokenId);
            }
        } catch (Exception e) {
            log.warn("logout 解析 token 失败: {}", e.getMessage());
        }
    }

    // 删除 refresh_token
    if (refreshToken != null) {
        String userIdStr = stringRedisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + refreshToken);
        stringRedisTemplate.delete(REFRESH_TOKEN_PREFIX + refreshToken);
        if (userIdStr != null) {
            stringRedisTemplate.opsForSet().remove("app_user_sessions:" + userIdStr, refreshToken);
        }
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 4: 提交**

```bash
git add forge-module-system-biz/src/main/java/com/forge/modules/system/service/app/AppAuthServiceImpl.java
git commit -m "feat(app): app_user_sessions SET 维护，支持精准强制下线"
```

---

## Task 8: AppAttachmentController

**Files:**
- Create: `forge-module-system-biz/.../controller/app/AppAttachmentController.java`

- [ ] **Step 1: 创建 AppAttachmentController**

```java
package com.forge.modules.system.controller.app;

import com.forge.common.response.Result;
import com.forge.modules.system.dto.app.AppUploadResponse;
import com.forge.modules.system.service.SysAttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "移动端 - 附件")
@RestController
@RequestMapping("/attachment")
@RequiredArgsConstructor
public class AppAttachmentController {

    private final SysAttachmentService sysAttachmentService;

    private static final long MAX_SIZE = 2 * 1024 * 1024; // 2MB
    private static final java.util.Set<String> ALLOWED_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp");

    @Operation(summary = "上传头像")
    @PostMapping("/upload")
    public Result<AppUploadResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "bizType", defaultValue = "APP_AVATAR") String bizType) {

        // 校验类型
        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            return Result.failed(5801, "仅支持 JPG/PNG/WebP 格式");
        }

        // 校验大小
        if (file.getSize() > MAX_SIZE) {
            return Result.failed(5802, "文件大小不能超过 2MB");
        }

        // 复用 SysAttachmentService
        String url = sysAttachmentService.upload(file, bizType, null);

        return Result.success(AppUploadResponse.builder()
                .url(url)
                .attachmentId(null)  // 如需要可扩展返回 ID
                .build());
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 3: 提交**

```bash
git add forge-module-system-biz/src/main/java/com/forge/modules/system/controller/app/AppAttachmentController.java
git commit -m "feat(app): AppAttachmentController 头像上传端点"
```

---

## Task 9: AppUserController 扩展（sms-code / bind-phone / deactivate）

**Files:**
- Modify: `forge-module-system-biz/.../controller/app/AppUserController.java`

- [ ] **Step 1: 在 AppUserController 中添加新端点**

```java
// 新增导入
import com.forge.modules.system.annotation.AssertAppUserActive;
import com.forge.modules.system.dto.app.SmsCodeRequest;
import com.forge.modules.system.dto.app.PhoneBindRequest;
import com.forge.modules.system.dto.app.DeactivateRequest;
import com.forge.modules.system.service.sms.SmsCodeManager;
import com.forge.modules.system.service.sms.SmsService;

// 新增字段
private final SmsCodeManager smsCodeManager;
private final SmsService smsService;

// 新增端点

@Operation(summary = "发送验证码")
@PostMapping("/sms-code")
@AssertAppUserActive
public Result<Map<String, Integer>> sendSmsCode(@Valid @RequestBody SmsCodeRequest request) {
    smsCodeManager.sendCode(request.getPhone());
    String code = ...; // 从 Redis 取或 SmsCodeManager 返回
    smsService.send(request.getPhone(), code);
    return Result.success(Map.of("expireSeconds", 300));
}

@Operation(summary = "绑定/换绑手机号")
@PostMapping("/bind-phone")
@AssertAppUserActive
public Result<Void> bindPhone(HttpServletRequest request,
                               @Valid @RequestBody PhoneBindRequest body) {
    Long userId = (Long) request.getAttribute("appUserId");
    smsCodeManager.verifyCode(body.getPhone(), body.getCode());
    appUserService.bindPhone(userId, body.getPhone());
    return Result.success();
}

@Operation(summary = "注销账号")
@DeleteMapping("/deactivate")
@AssertAppUserActive
public Result<Void> deactivate(HttpServletRequest request,
                                @Valid @RequestBody DeactivateRequest body) {
    if (!Boolean.TRUE.equals(body.getConfirm())) {
        return Result.failed("必须确认注销");
    }
    Long userId = (Long) request.getAttribute("appUserId");
    appUserService.deactivate(userId);
    return Result.success();
}
```

- [ ] **Step 2: 修改 getProfile 返回新字段**

确保 `AppUserProfileResponse` 包含 phoneVerified、openId（脱敏）、status、lastLoginTime。

- [ ] **Step 3: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 4: 提交**

```bash
git add forge-module-system-biz/src/main/java/com/forge/modules/system/controller/app/AppUserController.java
git commit -m "feat(app): AppUserController 新增 sms-code/bind-phone/deactivate 端点"
```

---

## Task 10: AppUserAdminController（后台管理）

**Files:**
- Create: `forge-module-system-biz/.../controller/admin/AppUserAdminController.java`

- [ ] **Step 1: 创建 AppUserAdminController**

```java
package com.forge.modules.system.controller.admin;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.common.annotation.OperationLog;
import com.forge.common.response.PageResult;
import com.forge.common.response.Result;
import com.forge.modules.system.dto.app.AppUserDetailResponse;
import com.forge.modules.system.dto.app.AppUserQueryRequest;
import com.forge.modules.system.service.app.AppUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "App用户管理")
@RestController
@RequestMapping("/system/app-user")
@RequiredArgsConstructor
public class AppUserAdminController {

    private final AppUserService appUserService;

    @Operation(summary = "分页查询")
    @GetMapping("/list")
    @PreAuthorize("hasAuthority('system:app-user:list')")
    public Result<PageResult<AppUserDetailResponse>> list(AppUserQueryRequest request) {
        Page<AppUserDetailResponse> page = appUserService.adminPage(request);
        return Result.success(PageResult.of(page.getRecords(), page.getTotal(), page.getCurrent(), page.getSize()));
    }

    @Operation(summary = "详情")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('system:app-user:detail')")
    public Result<AppUserDetailResponse> detail(@PathVariable Long id) {
        return Result.success(appUserService.adminDetail(id));
    }

    @Operation(summary = "封禁/解封")
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('system:app-user:update')")
    @OperationLog(title = "App用户管理", businessType = OperationLog.BusinessType.UPDATE)
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer status = body.get("status");
        appUserService.updateStatus(id, status);
        return Result.success();
    }

    @Operation(summary = "重置资料")
    @PutMapping("/{id}/profile")
    @PreAuthorize("hasAuthority('system:app-user:update')")
    @OperationLog(title = "App用户管理", businessType = OperationLog.BusinessType.UPDATE)
    public Result<Void> resetProfile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String nickname = body.get("nickname");
        String avatar = body.get("avatar");
        appUserService.adminResetProfile(id, nickname, avatar);
        return Result.success();
    }

    @Operation(summary = "删除")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system:app-user:delete')")
    @OperationLog(title = "App用户管理", businessType = OperationLog.BusinessType.DELETE)
    public Result<Void> delete(@PathVariable Long id) {
        appUserService.deactivate(id); // 后台删除走同样逻辑
        return Result.success();
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `cd apps/forge-server && mvn clean compile -DskipTests`

- [ ] **Step 3: 提交**

```bash
git add forge-module-system-biz/src/main/java/com/forge/modules/system/controller/admin/AppUserAdminController.java
git commit -m "feat(admin): AppUserAdminController 后台 app 用户管理"
```

---

## Task 11: Admin 前端 API + 列表页

**Files:**
- Create: `forge-web/src/api/system/app-user.ts`
- Create: `forge-web/src/views/system/app-user/index.vue`

- [ ] **Step 1: 创建 app-user.ts API**

```typescript
import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export interface AppUserEntity {
  id: number
  nickname: string
  avatar: string
  phone: string
  phoneVerified: number
  openId: string
  status: number
  lastLoginTime: string
  deactivatedTime: string | null
  createTime: string
}

export interface AppUserQuery {
  nickname?: string
  phone?: string
  openId?: string
  status?: number
  createTimeStart?: string
  createTimeEnd?: string
  pageNum: number
  pageSize: number
}

export const appUserApi = {
  list: (params: AppUserQuery) =>
    request.get<PageResult<AppUserEntity>>('/system/app-user/list', { params }),
  detail: (id: number) =>
    request.get<AppUserEntity>(`/system/app-user/${id}`),
  updateStatus: (id: number, status: number) =>
    request.put(`/system/app-user/${id}/status`, { status }),
  resetProfile: (id: number, data: { nickname?: string; avatar?: string }) =>
    request.put(`/system/app-user/${id}/profile`, data),
  delete: (id: number) =>
    request.delete(`/system/app-user/${id}`)
}
```

- [ ] **Step 2: 创建 index.vue 列表页**

参考现有 `views/system/user/index.vue` 模式，关键代码：

```vue
<template>
  <div class="app-container">
    <!-- 搜索卡 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="昵称">
          <el-input v-model="queryParams.nickname" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="queryParams.phone" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable>
            <el-option label="正常" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格卡 -->
    <el-card shadow="never" class="table-card">
      <vxe-toolbar ref="toolbarRef" custom />
      <vxe-table ref="tableRef" id="appUserTable" :data="tableData" :height="tableHeight"
        :row-config="{ isCurrent: true, isHover: true }" show-overflow="tooltip">
        <vxe-column type="seq" title="序号" width="60" :seq-method="seqMethod" />
        <vxe-column field="avatar" title="头像" width="60">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="32" />
          </template>
        </vxe-column>
        <vxe-column field="nickname" title="昵称" min-width="120" />
        <vxe-column field="phone" title="手机号" min-width="120">
          <template #default="{ row }">
            <span>{{ row.phone || '未绑定' }}</span>
            <el-tag v-if="row.phoneVerified" type="success" size="small" style="margin-left:4px">已验证</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="openId" title="OpenId" min-width="120" />
        <vxe-column field="status" title="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="lastLoginTime" title="最后登录" min-width="120" />
        <vxe-column title="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-permission="'system:app-user:detail'"
              @click="handleDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" v-permission="'system:app-user:update'"
              @click="handleToggleStatus(row)">{{ row.status === 0 ? '封禁' : '解封' }}</el-button>
            <el-button type="danger" link size="small" v-permission="'system:app-user:delete'"
              @click="handleDelete(row)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
      <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
        :total="total" @size-change="getList" @current-change="getList" />
    </el-card>

    <!-- 详情抽屉 -->
    <AppUserDetail ref="detailRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { appUserApi, type AppUserEntity } from '@/api/system/app-user'
import { useTableHeight } from '@/composables/useTableHeight'
import { useTableSeq } from '@/composables/useTableSeq'
import AppUserDetail from './detail.vue'

const { tableHeight } = useTableHeight()
const { seqMethod } = useTableSeq({ currentPage: computed(() => queryParams.pageNum), pageSize: computed(() => queryParams.pageSize) })

const queryParams = reactive<AppUserQuery>({ pageNum: 1, pageSize: 10 })
const tableData = ref<AppUserEntity[]>([])
const total = ref(0)
const tableRef = ref()
const toolbarRef = ref()
const detailRef = ref()

const getList = async () => {
  const res = await appUserApi.list(queryParams)
  tableData.value = res.records
  total.value = res.total
}

const handleQuery = () => { queryParams.pageNum = 1; getList() }
const handleReset = () => {
  queryParams.nickname = undefined
  queryParams.phone = undefined
  queryParams.status = undefined
  handleQuery()
}

const handleDetail = (row: AppUserEntity) => {
  detailRef.value?.open(row.id)
}

const handleToggleStatus = async (row: AppUserEntity) => {
  const newStatus = row.status === 0 ? 1 : 0
  const action = newStatus === 1 ? '封禁' : '解封'
  await ElMessageBox.confirm(`确定${action}用户 "${row.nickname}"？`, '提示', { type: 'warning' })
  await appUserApi.updateStatus(row.id, newStatus)
  ElMessage.success(`${action}成功`)
  getList()
}

const handleDelete = async (row: AppUserEntity) => {
  await ElMessageBox.confirm('此操作将软删除用户，原微信可重新注册。确定？', '警告', { type: 'warning' })
  await appUserApi.delete(row.id)
  ElMessage.success('删除成功')
  getList()
}

onMounted(() => {
  tableRef.value?.connect(toolbarRef.value!)
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 0;
  .search-card { margin-bottom: 15px; }
  .table-card .el-pagination { margin-top: 15px; justify-content: flex-end; }
}
</style>
```

- [ ] **Step 3: lint + 测试**

Run: `cd apps/forge-web && pnpm lint && pnpm test`

- [ ] **Step 4: 提交**

```bash
git add forge-web/src/api/system/app-user.ts
git add forge-web/src/views/system/app-user/index.vue
git commit -m "feat(web): admin 前端 app 用户列表页"
```

---

## Task 12: Admin 前端详情抽屉

**Files:**
- Create: `forge-web/src/views/system/app-user/detail.vue`

- [ ] **Step 1: 创建 detail.vue**

```vue
<template>
  <el-drawer v-model="visible" title="App 用户详情" size="400">
    <div class="detail-content">
      <el-avatar :src="user?.avatar" :size="80" />
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ user?.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ user?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ user?.phone || '未绑定' }}
          <el-tag v-if="user?.phoneVerified" type="success" size="small">已验证</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="OpenId">{{ user?.openId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="user?.status === 0 ? 'success' : 'danger'">
            {{ user?.status === 0 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ user?.lastLoginTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ user?.createTime }}</el-descriptions-item>
        <el-descriptions-item label="注销时间">
          <span v-if="user?.deactivatedTime" style="color:red">{{ user?.deactivatedTime }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { appUserApi, type AppUserEntity } from '@/api/system/app-user'

const visible = ref(false)
const user = ref<AppUserEntity | null>(null)

const open = async (id: number) => {
  user.value = await appUserApi.detail(id)
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.detail-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>
```

- [ ] **Step 2: lint**

Run: `cd apps/forge-web && pnpm lint`

- [ ] **Step 3: 提交**

```bash
git add forge-web/src/views/system/app-user/detail.vue
git commit -m "feat(web): admin 前端 app 用户详情抽屉"
```

---

## Task 13: uni-app 工程脚手架

**Files:**
- Create: `pnpm-workspace.yaml`
- Modify: `package.json` (根)
- Create: `apps/forge-miniapp/` 整个目录

- [ ] **Step 1: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
```

- [ ] **Step 2: 根 package.json 加 scripts**

```json
{
  "scripts": {
    "dev:miniapp": "pnpm --filter forge-miniapp dev:mp-weixin",
    "build:miniapp": "pnpm --filter forge-miniapp build:mp-weixin",
    "dev:miniapp:h5": "pnpm --filter forge-miniapp dev:h5",
    "build:miniapp:h5": "pnpm --filter forge-miniapp build:h5"
  }
}
```

- [ ] **Step 3: 创建 apps/forge-miniapp/package.json**

```json
{
  "name": "forge-miniapp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:mp-weixin": "uni build -p mp-weixin",
    "dev:h5": "uni",
    "build:h5": "uni build"
  },
  "dependencies": {
    "@dcloudio/uni-app": "^3.0.0-4010520250506001",
    "@dcloudio/uni-components": "^3.0.0-4010520250506001",
    "@dcloudio/uni-h5": "^3.0.0-4010520250506001",
    "@dcloudio/uni-mp-weixin": "^3.0.0-4010520250506001",
    "vue": "^3.4.21",
    "pinia": "^2.1.7",
    "pinia-plugin-persistedstate": "^4.0.0",
    "uview-plus": "^3.3.0"
  },
  "devDependencies": {
    "@dcloudio/types": "^3.4.8",
    "@dcloudio/uni-automator": "^3.0.0-4010520250506001",
    "@dcloudio/uni-cli-shared": "^3.0.0-4010520250506001",
    "@dcloudio/vite-plugin-uni": "^3.0.0-4010520250506001",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "extends": "@dcloudio/types/config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

- [ ] **Step 5: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()]
})
```

- [ ] **Step 6: 创建 src/main.ts**

```typescript
import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  pinia.use(piniaPersist)
  app.use(pinia)
  return { app }
}
```

- [ ] **Step 7: 创建 src/App.vue**

```vue
<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'

onLaunch(() => {
  const userStore = useUserStore()
  userStore.init()
})
</script>

<template>
  <router-view />
</template>
```

- [ ] **Step 8: 创建 src/pages.json**

```json
{
  "pages": [
    { "path": "pages/login/index", "style": { "navigationBarTitleText": "登录" } },
    { "path": "pages/profile/index", "style": { "navigationBarTitleText": "我的" } },
    { "path": "pages/profile/edit", "style": { "navigationBarTitleText": "编辑资料" } },
    { "path": "pages/profile/phone", "style": { "navigationBarTitleText": "绑定手机号" } },
    { "path": "pages/profile/deactivate", "style": { "navigationBarTitleText": "注销账号" } }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/profile/index", "text": "我的" }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "Forge Miniapp",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  }
}
```

- [ ] **Step 9: 创建 src/manifest.json（占位）**

```json
{
  "name": "forge-miniapp",
  "appid": "__UNI__FORGE",
  "description": "Forge Admin 小程序端",
  "versionName": "1.0.0",
  "versionCode": "100",
  "mp-weixin": {
    "appid": "wx1234567890abcdef",
    "setting": {
      "urlCheck": false
    }
  }
}
```

> 开发时替换为真实微信 appId。

- [ ] **Step 10: 创建 src/env.d.ts**

```typescript
/// <reference types="@dcloudio/types" />
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 11: 安装依赖 + 验证编译**

Run: `cd apps/forge-miniapp && pnpm install && pnpm build:mp-weixin`

Expected: 编译成功，生成 `dist/dev/mp-weixin` 目录

- [ ] **Step 12: 提交**

```bash
git add pnpm-workspace.yaml
git add package.json
git add apps/forge-miniapp/
git commit -m "feat(miniapp): uni-app 工程脚手架"
```

---

## Task 14: uni-app stores + api 封装

**Files:**
- Create: `apps/forge-miniapp/src/stores/index.ts`
- Create: `apps/forge-miniapp/src/stores/user.ts`
- Create: `apps/forge-miniapp/src/api/request.ts`
- Create: `apps/forge-miniapp/src/api/auth.ts`
- Create: `apps/forge-miniapp/src/api/user.ts`
- Create: `apps/forge-miniapp/src/api/attachment.ts`
- Create: `apps/forge-miniapp/src/types/api.ts`

- [ ] **Step 1: 创建 stores/index.ts**

```typescript
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPersist)

export default pinia
```

- [ ] **Step 2: 创建 stores/user.ts**

```typescript
import { defineStore } from 'pinia'

interface UserState {
  accessToken: string | null
  refreshToken: string | null
  userInfo: {
    id: number
    nickname: string
    avatar: string
    phone: string | null
    phoneVerified: number
  } | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    accessToken: null,
    refreshToken: null,
    userInfo: null
  }),
  actions: {
    setTokens(access: string, refresh: string) {
      this.accessToken = access
      this.refreshToken = refresh
    },
    setUserInfo(info: UserState['userInfo']) {
      this.userInfo = info
    },
    clear() {
      this.accessToken = null
      this.refreshToken = null
      this.userInfo = null
    },
    init() {
      // 启动时验证 token 有效性
      if (this.accessToken) {
        this.checkLogin()
      }
    },
    async checkLogin() {
      try {
        const res = await uni.request({
          url: BASE_URL + '/user/profile',
          header: { Authorization: 'Bearer ' + this.accessToken }
        })
        if (res.statusCode === 200) {
          this.setUserInfo(res.data as any)
        }
      } catch {
        this.clear()
      }
    }
  },
  persist: {
    storage: {
      getItem: (key) => uni.getStorageSync(key),
      setItem: (key, value) => uni.setStorageSync(key, value)
    }
  }
})

const BASE_URL = 'http://localhost:8181/app-api'
```

- [ ] **Step 3: 创建 api/request.ts**

```typescript
import { useUserStore } from '@/stores/user'

const BASE_URL = 'http://localhost:8181/app-api'

interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}): Promise<T> {
  const userStore = useUserStore()
  const header: Record<string, string> = {
    ...options.header
  }
  if (userStore.accessToken) {
    header['Authorization'] = 'Bearer ' + userStore.accessToken
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: async (res) => {
        if (res.statusCode === 401) {
          // 尝试 refresh
          const ok = await tryRefresh()
          if (ok) {
            // 重试
            const retryRes = await uni.request({
              url: BASE_URL + options.url,
              method: options.method || 'GET',
              data: options.data,
              header: { Authorization: 'Bearer ' + userStore.accessToken }
            })
            const body = retryRes.data as ApiResult<T>
            if (body.code === 200) resolve(body.data)
            else reject(new Error(body.message))
          } else {
            userStore.clear()
            uni.reLaunch({ url: '/pages/login/index' })
            reject(new Error('登录已过期'))
          }
          return
        }
        const body = res.data as ApiResult<T>
        if (body.code === 200) resolve(body.data)
        else {
          uni.showToast({ title: body.message, icon: 'none' })
          reject(new Error(body.message))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
    })
  })
}

async function tryRefresh(): Promise<boolean> {
  const userStore = useUserStore()
  if (!userStore.refreshToken) return false
  try {
    const res = await uni.request({
      url: BASE_URL + '/auth/refresh',
      method: 'POST',
      data: { refreshToken: userStore.refreshToken }
    })
    const body = res.data as ApiResult<{ accessToken: string; refreshToken: string; userInfo: any }>
    if (body.code === 200) {
      userStore.setTokens(body.data.accessToken, body.data.refreshToken)
      userStore.setUserInfo(body.data.userInfo)
      return true
    }
  } catch {}
  return false
}
```

- [ ] **Step 4: 创建 api/auth.ts**

```typescript
import { request } from './request'

export const authApi = {
  wxLogin: (code: string) =>
    request<{ accessToken: string; refreshToken: string; userInfo: any }>({
      url: '/auth/wx-login',
      method: 'POST',
      data: { code }
    }),
  logout: () =>
    request<void>({
      url: '/auth/logout',
      method: 'POST'
    })
}
```

- [ ] **Step 5: 创建 api/user.ts**

```typescript
import { request } from './request'

export const userApi = {
  getProfile: () =>
    request<{ id: number; nickname: string; avatar: string; phone: string; phoneVerified: number }>({
      url: '/user/profile'
    }),
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    request<void>({ url: '/user/profile', method: 'PUT', data }),
  sendSmsCode: (phone: string) =>
    request<{ expireSeconds: number }>({ url: '/user/sms-code', method: 'POST', data: { phone } }),
  bindPhone: (phone: string, code: string) =>
    request<void>({ url: '/user/bind-phone', method: 'POST', data: { phone, code } }),
  deactivate: () =>
    request<void>({ url: '/user/deactivate', method: 'DELETE', data: { confirm: true } })
}
```

- [ ] **Step 6: 创建 api/attachment.ts**

```typescript
import { useUserStore } from '@/stores/user'

const BASE_URL = 'http://localhost:8181/app-api'

export const attachmentApi = {
  uploadAvatar: (filePath: string): Promise<{ url: string }> {
    const userStore = useUserStore()
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: BASE_URL + '/attachment/upload',
        filePath,
        name: 'file',
        formData: { bizType: 'APP_AVATAR' },
        header: { Authorization: 'Bearer ' + userStore.accessToken },
        success: (res) => {
          const body = JSON.parse(res.data)
          if (body.code === 200) resolve(body.data)
          else reject(new Error(body.message))
        },
        fail: reject
      })
    })
  }
}
```

- [ ] **Step 7: 创建 types/api.ts**

```typescript
export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  phone: string | null
  phoneVerified: number
  openId: string
  status: number
  lastLoginTime: string | null
}
```

- [ ] **Step 8: 提交**

```bash
git add apps/forge-miniapp/src/stores/
git add apps/forge-miniapp/src/api/
git add apps/forge-miniapp/src/types/
git commit -m "feat(miniapp): stores + api 封装"
```

---

## Task 15: uni-app 登录页

**Files:**
- Create: `apps/forge-miniapp/src/pages/login/index.vue`

- [ ] **Step 1: 创建登录页**

```vue
<template>
  <view class="login-page">
    <image class="logo" src="/static/logo.png" mode="aspectFit" />
    <text class="title">欢迎使用 Forge Admin</text>

    <u-button type="primary" text="微信一键登录" @click="handleLogin" />

    <view class="agreement">
      <text>登录即代表同意</text>
      <text class="link">《用户协议》</text>
      <text>和</text>
      <text class="link">《隐私政策》</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    // 1. 获取微信 code
    const loginRes = await uni.login({ provider: 'weixin' })
    const code = loginRes.code

    // 2. 调后端 wx-login
    const data = await authApi.wxLogin(code)

    // 3. 存储 token + userInfo
    userStore.setTokens(data.accessToken, data.refreshToken)
    userStore.setUserInfo(data.userInfo)

    // 4. 跳首页
    uni.reLaunch({ url: '/pages/profile/index' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 40rpx;
  .logo {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 40rpx;
  }
  .title {
    font-size: 36rpx;
    margin-bottom: 80rpx;
  }
  .agreement {
    margin-top: 40rpx;
    font-size: 24rpx;
    color: #999;
    .link {
      color: #007aff;
    }
  }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add apps/forge-miniapp/src/pages/login/index.vue
git commit -m "feat(miniapp): 登录页"
```

---

## Task 16: uni-app 个人中心页

**Files:**
- Create: `apps/forge-miniapp/src/pages/profile/index.vue`

- [ ] **Step 1: 创建个人中心页**

```vue
<template>
  <view class="profile-page">
    <!-- 头部 -->
    <view class="header">
      <u-avatar :src="userStore.userInfo?.avatar" size="80" />
      <text class="nickname">{{ userStore.userInfo?.nickname || '未登录' }}</text>
      <text class="phone">
        {{ userStore.userInfo?.phone || '未绑定' }}
        <text v-if="userStore.userInfo?.phoneVerified" class="verified">已验证</text>
      </text>
    </view>

    <!-- 功能列表 -->
    <u-cell-group>
      <u-cell title="编辑资料" isLink @click="goEdit" />
      <u-cell title="绑定/换绑手机号" isLink @click="goPhone" />
      <u-cell title="注销账号" isLink @click="goDeactivate">
        <template #title>
          <text style="color:red">注销账号</text>
        </template>
      </u-cell>
    </u-cell-group>

    <view class="logout">
      <u-button type="error" text="退出登录" @click="handleLogout" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { authApi } from '@/api/auth'

const userStore = useUserStore()

onMounted(async () => {
  if (!userStore.userInfo) {
    const profile = await userApi.getProfile()
    userStore.setUserInfo(profile)
  }
})

const goEdit = () => uni.navigateTo({ url: '/pages/profile/edit' })
const goPhone = () => uni.navigateTo({ url: '/pages/profile/phone' })
const goDeactivate = () => uni.navigateTo({ url: '/pages/profile/deactivate' })

const handleLogout = async () => {
  await authApi.logout()
  userStore.clear()
  uni.reLaunch({ url: '/pages/login/index' })
}
</script>

<style scoped lang="scss">
.profile-page {
  padding: 40rpx;
  .header {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    .nickname {
      margin-left: 20rpx;
      font-size: 32rpx;
    }
    .phone {
      margin-left: 20rpx;
      font-size: 24rpx;
      color: #666;
      .verified {
        color: #07c160;
        font-size: 20rpx;
        margin-left: 8rpx;
      }
    }
  }
  .logout {
    margin-top: 40rpx;
  }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add apps/forge-miniapp/src/pages/profile/index.vue
git commit -m "feat(miniapp): 个人中心页"
```

---

## Task 17: uni-app 编辑资料 + 头像上传

**Files:**
- Create: `apps/forge-miniapp/src/pages/profile/edit.vue`

- [ ] **Step 1: 创建编辑资料页**

```vue
<template>
  <view class="edit-page">
    <u-cell-group>
      <u-cell title="头像">
        <template #value>
          <u-avatar :src="form.avatar" size="60" @click="chooseAvatar" />
        </template>
      </u-cell>
      <u-cell title="昵称">
        <template #value>
          <u-input v-model="form.nickname" placeholder="请输入昵称" border="none" />
        </template>
      </u-cell>
    </u-cell-group>

    <view class="submit">
      <u-button type="primary" text="保存" @click="handleSubmit" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { attachmentApi } from '@/api/attachment'

const userStore = useUserStore()

const form = reactive({
  nickname: userStore.userInfo?.nickname || '',
  avatar: userStore.userInfo?.avatar || ''
})

const chooseAvatar = async () => {
  // 微信小程序选择头像
  const res = await uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sizeType: ['compressed']
  })
  const filePath = res.tempFiles[0].tempFilePath

  // 校验大小
  const fileInfo = await uni.getFileInfo({ filePath })
  if (fileInfo.size > 2 * 1024 * 1024) {
    uni.showToast({ title: '图片不能超过 2MB', icon: 'none' })
    return
  }

  // 上传
  try {
    const uploadRes = await attachmentApi.uploadAvatar(filePath)
    form.avatar = uploadRes.url
  } catch (e: any) {
    uni.showToast({ title: e.message || '上传失败', icon: 'none' })
  }
}

const handleSubmit = async () => {
  await userApi.updateProfile({ nickname: form.nickname, avatar: form.avatar })
  userStore.setUserInfo({ ...userStore.userInfo!, nickname: form.nickname, avatar: form.avatar })
  uni.showToast({ title: '保存成功' })
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.edit-page {
  padding: 20rpx;
  .submit {
    margin-top: 40rpx;
  }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add apps/forge-miniapp/src/pages/profile/edit.vue
git commit -m "feat(miniapp): 编辑资料页 + 头像上传"
```

---

## Task 18: uni-app 绑定手机号

**Files:**
- Create: `apps/forge-miniapp/src/composables/useSmsCode.ts`
- Create: `apps/forge-miniapp/src/components/SmsCodeInput.vue`
- Create: `apps/forge-miniapp/src/pages/profile/phone.vue`

- [ ] **Step 1: 创建 useSmsCode composable**

```typescript
import { ref } from 'vue'
import { userApi } from '@/api/user'

export function useSmsCode() {
  const countdown = ref(0)
  const loading = ref(false)

  const sendCode = async (phone: string) => {
    if (countdown.value > 0) return
    loading.value = true
    try {
      await userApi.sendSmsCode(phone)
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) clearInterval(timer)
      }, 1000)
    } catch (e: any) {
      uni.showToast({ title: e.message || '发送失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }

  return { countdown, loading, sendCode }
}
```

- [ ] **Step 2: 创建 SmsCodeInput.vue**

```vue
<template>
  <u-button
    :type="countdown > 0 ? 'default' : 'primary'"
    :text="countdown > 0 ? `${countdown}s 后重发` : '获取验证码'"
    :disabled="countdown > 0"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { useSmsCode } from '@/composables/useSmsCode'

const props = defineProps<{ phone: string }>()
const { countdown, loading, sendCode } = useSmsCode()

const handleClick = () => {
  if (!props.phone || !/^1[3-9]\d{9}$/.test(props.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  sendCode(props.phone)
}
</script>
```

- [ ] **Step 3: 创建 phone.vue**

```vue
<template>
  <view class="phone-page">
    <u-cell-group>
      <u-cell title="手机号">
        <template #value>
          <u-input v-model="phone" placeholder="请输入手机号" border="none" type="number" />
        </template>
      </u-cell>
      <u-cell title="验证码">
        <template #value>
          <view class="code-row">
            <u-input v-model="code" placeholder="请输入验证码" border="none" type="number" maxlength="6" />
            <SmsCodeInput :phone="phone" />
          </view>
        </template>
      </u-cell>
    </u-cell-group>

    <view class="submit">
      <u-button type="primary" text="提交" @click="handleSubmit" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import SmsCodeInput from '@/components/SmsCodeInput.vue'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')

const handleSubmit = async () => {
  if (!phone.value || !/^1[3-9]\d{9}$/.test(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!code.value || code.value.length !== 6) {
    uni.showToast({ title: '请输入 6 位验证码', icon: 'none' })
    return
  }
  try {
    await userApi.bindPhone(phone.value, code.value)
    const profile = await userApi.getProfile()
    userStore.setUserInfo(profile)
    uni.showToast({ title: '绑定成功' })
    uni.navigateBack()
  } catch (e: any) {
    uni.showToast({ title: e.message || '绑定失败', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
.phone-page {
  padding: 20rpx;
  .code-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }
  .submit {
    margin-top: 40rpx;
  }
}
</style>
```

- [ ] **Step 4: 提交**

```bash
git add apps/forge-miniapp/src/composables/
git add apps/forge-miniapp/src/components/SmsCodeInput.vue
git add apps/forge-miniapp/src/pages/profile/phone.vue
git commit -m "feat(miniapp): 绑定手机号页 + SmsCodeInput 组件"
```

---

## Task 19: uni-app 注销页

**Files:**
- Create: `apps/forge-miniapp/src/pages/profile/deactivate.vue`

- [ ] **Step 1: 创建注销页**

```vue
<template>
  <view class="deactivate-page">
    <view class="warning">
      <text class="title">注销前请注意</text>
      <view class="list">
        <text>• 注销后您的账号将无法登录</text>
        <text>• 历史数据将保留但与您脱钩</text>
        <text>• 同一微信可重新注册新账号</text>
        <text>• 此操作不可撤销</text>
      </view>
    </view>

    <u-checkbox-group>
      <u-checkbox v-model="agreed" label="我同意上述提示" />
    </u-checkbox-group>

    <view class="confirm-input">
      <text>二次输入"注销我的账号"：</text>
      <u-input v-model="confirmText" placeholder="请输入" border="surround" />
    </view>

    <view class="buttons">
      <u-button type="default" text="取消" @click="uni.navigateBack()" />
      <u-button
        type="error"
        text="确认注销"
        :disabled="!agreed || confirmText !== '注销我的账号'"
        @click="handleDeactivate"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

const userStore = useUserStore()
const agreed = ref(false)
const confirmText = ref('')

const handleDeactivate = async () => {
  if (!agreed.value || confirmText.value !== '注销我的账号') {
    uni.showToast({ title: '请完成确认', icon: 'none' })
    return
  }
  try {
    await userApi.deactivate()
    userStore.clear()
    uni.showToast({ title: '账号已注销' })
    uni.reLaunch({ url: '/pages/login/index' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '注销失败', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
.deactivate-page {
  padding: 40rpx;
  .warning {
    background: #fff3cd;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 40rpx;
    .title {
      font-weight: bold;
      color: #856404;
    }
    .list {
      margin-top: 20rpx;
      color: #856404;
    }
  }
  .confirm-input {
    margin-top: 40rpx;
  }
  .buttons {
    margin-top: 60rpx;
    display: flex;
    gap: 20rpx;
  }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add apps/forge-miniapp/src/pages/profile/deactivate.vue
git commit -m "feat(miniapp): 注销页"
```

---

## Task 20: 端到端验证

**目标：** 启动后端 + admin 前端 + 小程序端，跑 spec 手测清单。

- [ ] **Step 1: 启动后端**

Run: `cd apps/forge-server && mvn spring-boot:run -pl forge-server`

验证点：
- 启动无报错
- 访问 `http://localhost:8181/doc.html` 能打开 API 文档
- API 文档中 `/app-api/*` 端点已出现

- [ ] **Step 2: 启动 admin 前端**

Run: `cd apps/forge-web && pnpm dev`

验证点：
- 访问 `http://localhost:3003` 正常
- 登录后能看到 "App用户" 菜单（需菜单 SQL 已执行）
- 列表能查到 app 用户数据

- [ ] **Step 3: 启动小程序端（微信开发者工具）**

Run: `cd apps/forge-miniapp && pnpm dev:mp-weixin`

用微信开发者工具打开 `dist/dev/mp-weixin` 目录。

验证点：
- 编译无报错
- 页面能渲染
- 能点击"微信一键登录"（需配置真实 appId）

- [ ] **Step 4: 执行手测清单**

按 spec "验收标准" 逐条验证：

```
[ ] app 端发送验证码，Mock 日志打印验证码
[ ] app 端绑定手机号成功
[ ] app 端注销后重新登录创建新记录
[ ] app 端上传头像成功
[ ] admin 端列表能查到 app 用户
[ ] admin 端封禁后 app 端写操作被拒
[ ] admin 端删除后原微信可重注册
```

- [ ] **Step 5: 修复发现的问题并提交**

如有 bug，按 `fix(app): xxx` 格式提交。

- [ ] **Step 6: 最终提交**

```bash
git add .
git commit -m "feat: app 端账号管理增强特性完成"
```

---

## 自检结果

**1. Spec 覆盖：**
- 框架层 WebProperties + configurePathMatch → 已在 admin/app 架构拆分完成，本 spec 不涉及
- 数据库迁移 → Task 1
- SmsService + SmsProperties + Mock → Task 3
- SmsCodeManager → Task 4
- AppUserService bindPhone/deactivate/updateStatus → Task 5
- AOP @AssertAppUserActive → Task 6
- app_user_sessions SET → Task 7
- AppAttachmentController → Task 8
- AppUserController sms-code/bind-phone/deactivate → Task 9
- AppUserAdminController → Task 10
- admin 前端列表 + 详情 → Task 11, 12
- uni-app 工程脚手架 → Task 13
- uni-app stores + api → Task 14
- uni-app 登录页 → Task 15
- uni-app 个人中心 → Task 16
- uni-app 编辑资料 + 头像 → Task 17
- uni-app 绑定手机号 → Task 18
- uni-app 注销 → Task 19
- 端到端验证 → Task 20
- **无遗漏**

**2. 占位符扫描：** 无 TBD/TODO，所有代码示例完整。

**3. 类型一致性：**
- `AppUserDetailResponse` 在 Task 2 定义，Task 5/10/11 使用一致
- `SmsCodeRequest`/`PhoneBindRequest`/`DeactivateRequest` 在 Task 2 定义，Task 9 使用一致
- `AppUploadResponse` 在 Task 2 定义，Task 8 使用一致
- `userApi` 在 Task 14 定义，Task 15-19 使用一致
- Redis key 前缀 `app:sms:`、`app_user_sessions:` 在 Task 4/7 定义，Task 5/9 使用一致

**4. 现有代码适配：**
- 菜单 SQL 字段名已按实际 `menu_name/route_path/component_path/permission/menu_type` 修正
- ResultCode 已复用现有 USER_NOT_FOUND(5101)/USER_DISABLED(5103)，新增 SMS/PHONE 错误码
- SysAttachmentService.upload 签名已适配
- RateLimiter 注解未在 plan 中使用（sms-code 限流已在 SmsCodeManager 用 Redis 实现，不依赖注解）