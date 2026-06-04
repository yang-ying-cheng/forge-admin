package com.forge.modules.system.dto.dict;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * 字典数据批量保存请求（全量覆盖）
 */
@Data
public class DictDataBatchSaveRequest {

    @NotBlank(message = "字典类型不能为空")
    private String dictType;

    @Valid
    private List<DictDataRequest> dataList;
}
