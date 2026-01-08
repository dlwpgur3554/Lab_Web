package com.lab.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "springdoc.api-docs.enabled", havingValue = "true", matchIfMissing = false)
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

// Swagger UI는 프로덕션 환경에서 비활성화됩니다.
// 활성화하려면 application.yml에 springdoc.api-docs.enabled=true 설정

