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
