package com.lab.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.lab")
@EnableJpaRepositories(basePackages = "com.lab")
@EntityScan("com.lab.domain")
public class LabApplication {
    public static void main(String[] args) {
        SpringApplication.run(LabApplication.class, args);
    }
}

// 본 클래스는 Spring Boot 애플리케이션의 진입점입니다.

