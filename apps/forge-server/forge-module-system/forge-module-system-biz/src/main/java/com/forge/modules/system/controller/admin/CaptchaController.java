package com.forge.modules.system.controller.admin;

import com.forge.common.response.Result;
import com.forge.modules.system.auth.dto.CaptchaResponse;
import com.forge.modules.system.auth.service.CaptchaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 验证码控制器
 *
 * @author standadmin
 */
@Tag(name = "验证码")
@RestController
@RequestMapping("/auth/captcha")
@RequiredArgsConstructor
public class CaptchaController {

    private final CaptchaService captchaService;

    @Operation(summary = "获取验证码")
    @GetMapping
    public Result<CaptchaResponse> getCaptcha() {
        CaptchaResponse response = captchaService.generate();
        return Result.success(response);
    }
}