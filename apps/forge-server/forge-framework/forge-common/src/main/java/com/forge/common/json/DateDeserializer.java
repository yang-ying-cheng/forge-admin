package com.forge.common.json;

import cn.hutool.core.date.DateUtil;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JacksonStdImpl;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * LocalDate 反序列化器
 */
@JacksonStdImpl
public class DateDeserializer extends JsonDeserializer<Date> {

    public static final DateDeserializer INSTANCE = new DateDeserializer();

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Date deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String dateStr = parser.getValueAsString();
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        return DateUtil.parse(dateStr, FORMATTER);
    }
}
