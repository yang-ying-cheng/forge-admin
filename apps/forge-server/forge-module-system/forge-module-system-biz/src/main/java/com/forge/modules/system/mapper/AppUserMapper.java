package com.forge.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.forge.modules.system.entity.AppUser;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AppUserMapper extends BaseMapper<AppUser> {
}
