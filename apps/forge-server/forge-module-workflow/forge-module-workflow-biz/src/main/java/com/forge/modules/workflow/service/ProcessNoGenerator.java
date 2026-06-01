package com.forge.modules.workflow.service;

import com.forge.modules.system.service.KeySequenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProcessNoGenerator {

    private final KeySequenceService keySequenceService;

    public String generateNo() {
        return keySequenceService.getNextKey("process_no");
    }
}
