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

/**
 * App 用户状态校验切面
 * 拦截标注了 @AssertAppUserActive 的方法，校验用户状态
 *
 * @author standadmin
 */
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
        if (user.getStatus() != 1) {
            throw new BusinessException(ResultCode.USER_DISABLED);
        }

        return pjp.proceed();
    }
}