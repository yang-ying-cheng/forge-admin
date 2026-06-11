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

    void updateLastLoginTime(Long userId);
}
