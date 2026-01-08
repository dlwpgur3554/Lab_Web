package com.lab.config;

import com.lab.util.JwtUtil;
import com.lab.web.filter.JwtAuthenticationFilter;
import com.lab.web.filter.RateLimitingFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final JwtUtil jwtUtil;
    private final RateLimitingFilter rateLimitingFilter;
    
    public SecurityConfig(JwtUtil jwtUtil, RateLimitingFilter rateLimitingFilter) {
        this.jwtUtil = jwtUtil;
        this.rateLimitingFilter = rateLimitingFilter;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtUtil);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationFilter jwtFilter = jwtAuthenticationFilter();
        
        http
            .csrf(csrf -> csrf.disable()) // JWT 사용 시 CSRF 비활성화
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class) // Rate Limiting을 가장 먼저 적용
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/upload").authenticated() // 파일 업로드는 인증 필요
                .requestMatchers("/api/**/admin/**").authenticated() // 관리자 API는 인증 필요
                .requestMatchers("/api/**/me/**").authenticated() // 개인 정보 API는 인증 필요
                .requestMatchers("/api/attendance/**").authenticated() // 출퇴근은 인증 필요
                .requestMatchers("/uploads/**").permitAll() // 정적 파일은 공개
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").denyAll() // Swagger UI 비활성화 (보안)
                .anyRequest().permitAll() // 나머지는 공개
            );
        
        return http.build();
    }
}

// Spring Security 설정입니다. JWT 인증을 위한 기본 설정을 제공합니다.

