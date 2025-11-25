package com.lab.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Realistic Multimedia Lab API")
                        .description("연구실 공지/일정/출퇴근 MVP API")
                        .version("0.0.1"));
    }
}

// Swagger UI 주소: /swagger-ui/index.html

