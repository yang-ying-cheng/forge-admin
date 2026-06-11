package com.forge.modules.system.service.app;

import com.forge.modules.system.dto.app.AppLoginResponse;

public interface AppAuthService {

    AppLoginResponse wxLogin(String code);

    AppLoginResponse refreshToken(String refreshToken);

    void logout(String accessToken, String refreshToken);
}
