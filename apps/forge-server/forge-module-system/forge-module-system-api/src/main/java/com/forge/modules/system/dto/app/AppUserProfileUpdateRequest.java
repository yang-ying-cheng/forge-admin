package com.forge.modules.system.dto.app;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AppUserProfileUpdateRequest {

    @Size(max = 64, message = "昵称最长64个字符")
    private String nickname;

    private String avatar;
}
