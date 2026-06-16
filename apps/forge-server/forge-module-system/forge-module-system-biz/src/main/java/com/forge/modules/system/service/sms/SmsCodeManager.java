package com.forge.modules.system.service.sms;

import com.forge.common.exception.BusinessException;
import com.forge.common.response.ResultCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

/**
 * 短信验证码管理器
 * <p>
 * 负责验证码的生成、发送、存储、校验及限流控制
 *
 * @author forge
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmsCodeManager {

    private final StringRedisTemplate redis;
    private final SmsProperties props;
    private final SecureRandom random = new SecureRandom();

    /**
     * 验证码存储 Key 前缀
     */
    private static final String CODE_KEY = "app:sms:code:";

    /**
     * 发送冷却锁 Key 前缀
     */
    private static final String LOCK_KEY = "app:sms:lock:";

    /**
     * 每日发送次数 Key 前缀
     */
    private static final String COUNT_KEY = "app:sms:count:";

    /**
     * 验证错误次数 Key 前缀
     */
    private static final String ERROR_KEY = "app:sms:error:";

    /**
     * 发送验证码（含限流校验）
     * <p>
     * 流程：
     * 1. 冷却检查：同一手机号在冷却时间内不能重复发送
     * 2. 日限检查：同一手机号每日发送次数不能超过配置上限（原子操作）
     * 3. 生成验证码：随机数字，长度由配置决定
     * 4. 存储：验证码存入 Redis，有效期由配置决定
     * 5. 清除错误计数：新发送验证码时清除之前的错误计数
     *
     * @param phone 手机号
     * @throws BusinessException SMS_COOLDOWN - 验证码发送冷却中
     * @throws BusinessException SMS_DAILY_EXCEEDED - 今日发送次数已达上限
     */
    public void sendCode(String phone) {
        // 1. 冷却检查
        String lockKey = LOCK_KEY + phone;
        if (redis.hasKey(lockKey)) {
            throw new BusinessException(ResultCode.SMS_COOLDOWN);
        }

        // 2. 日限检查（原子操作，避免竞态条件）
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String countKey = COUNT_KEY + phone + ":" + date;
        Long newCount = redis.opsForValue().increment(countKey);
        if (newCount != null && newCount == 1) {
            // 首次创建时设置过期时间
            redis.expire(countKey, 1, TimeUnit.DAYS);
        }
        if (newCount != null && newCount > props.getDailyLimit()) {
            // 超出限制，回滚计数
            redis.opsForValue().decrement(countKey);
            throw new BusinessException(ResultCode.SMS_DAILY_EXCEEDED);
        }

        // 3. 生成验证码
        String code = generateCode();
        log.debug("生成验证码: 手机号={}, 验证码长度={}", phone, code.length());

        // 4. 存储
        redis.opsForValue().set(CODE_KEY + phone, code, props.getCodeTtlSeconds(), TimeUnit.SECONDS);
        redis.opsForValue().set(lockKey, "1", props.getSendCooldownSeconds(), TimeUnit.SECONDS);

        // 5. 清除错误计数
        redis.delete(ERROR_KEY + phone);
    }

    /**
     * 验证验证码
     * <p>
     * 流程：
     * 1. 获取存储的验证码，不存在则抛出验证码不存在异常
     * 2. 比对验证码，不匹配则进行错误计数
     * 3. 错误次数超过限制则锁定验证码，需重新获取
     * 4. 验证成功则删除验证码和错误计数
     *
     * @param phone     手机号
     * @param inputCode 用户输入的验证码
     * @throws BusinessException SMS_CODE_NOT_FOUND - 验证码不存在或已过期
     * @throws BusinessException SMS_CODE_ERROR - 验证码错误
     * @throws BusinessException SMS_CODE_LOCKED - 验证码错误次数过多，被锁定
     */
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
            // 仅在首次创建时设置过期时间
            if (errors != null && errors == 1) {
                redis.expire(errorKey, props.getCodeTtlSeconds(), TimeUnit.SECONDS);
            }

            if (errors != null && errors >= props.getVerifyErrorLimit()) {
                redis.delete(key); // 锁码
                log.warn("验证码被锁定: 手机号={}, 错误次数={}", phone, errors);
                throw new BusinessException(ResultCode.SMS_CODE_LOCKED);
            }
            log.warn("验证码错误: 手机号={}, 错误次数={}", phone, errors);
            throw new BusinessException(ResultCode.SMS_CODE_ERROR);
        }

        // 验证成功，删除验证码和错误计数
        redis.delete(key);
        redis.delete(ERROR_KEY + phone);
        log.info("验证码验证成功: 手机号={}", phone);
    }

    /**
     * 生成随机验证码
     *
     * @return 验证码字符串
     */
    private String generateCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < props.getCodeLength(); i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}