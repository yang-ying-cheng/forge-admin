package com.forge.modules.system.service.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.forge.modules.system.dto.app.AppUserProfileResponse;
import com.forge.modules.system.dto.app.AppUserProfileUpdateRequest;
import com.forge.modules.system.entity.AppUser;
import com.forge.modules.system.mapper.AppUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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

    @Override
    public void updateLastLoginTime(Long userId) {
        AppUser user = new AppUser();
        user.setId(userId);
        user.setLastLoginTime(LocalDateTime.now());
        appUserMapper.updateById(user);
    }
}
