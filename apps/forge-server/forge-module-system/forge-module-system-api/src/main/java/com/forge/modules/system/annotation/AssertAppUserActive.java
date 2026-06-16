package com.forge.modules.system.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * App 用户状态校验注解
 * 用于拦截已注销、已禁用的 App 用户访问
 *
 * @author standadmin
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AssertAppUserActive {
}