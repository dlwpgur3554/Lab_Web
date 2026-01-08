package com.lab.web.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);
    
    // IP별 버킷 저장소
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    
    // 일반 API Rate Limiting 설정
    @Value("${rate-limit.general.requests:100}")
    private int generalRequests;
    
    @Value("${rate-limit.general.window-minutes:1}")
    private int generalWindowMinutes;
    
    // 로그인 API Rate Limiting 설정 (더 엄격)
    @Value("${rate-limit.login.requests:5}")
    private int loginRequests;
    
    @Value("${rate-limit.login.window-minutes:15}")
    private int loginWindowMinutes;
    
    // 파일 업로드 Rate Limiting 설정
    @Value("${rate-limit.upload.requests:10}")
    private int uploadRequests;
    
    @Value("${rate-limit.upload.window-minutes:1}")
    private int uploadWindowMinutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String uri = request.getRequestURI();
        String clientIp = getClientIp(request);
        
        // Rate Limiting 적용 대상 확인
        Bucket bucket = getBucket(clientIp, uri);
        
        if (bucket != null) {
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
            
            if (!probe.isConsumed()) {
                // Rate limit 초과
                long waitTime = probe.getNanosToWaitForRefill() / 1_000_000_000; // 초 단위
                
                logger.warn("Rate limit 초과 - IP: {}, URI: {}, 대기 시간: {}초", clientIp, uri, waitTime);
                
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json;charset=UTF-8");
                response.setHeader("X-RateLimit-Limit", String.valueOf(getLimitForUri(uri)));
                response.setHeader("X-RateLimit-Retry-After", String.valueOf(waitTime));
                response.getWriter().write("{\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\"}");
                return;
            }
            
            // 남은 요청 수 헤더에 추가
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            response.setHeader("X-RateLimit-Limit", String.valueOf(getLimitForUri(uri)));
        }
        
        filterChain.doFilter(request, response);
    }
    
    private Bucket getBucket(String clientIp, String uri) {
        // 로그인 API는 더 엄격한 제한
        if (uri.startsWith("/api/auth/login")) {
            return buckets.computeIfAbsent("login:" + clientIp, key -> 
                createBucket(loginRequests, loginWindowMinutes));
        }
        
        // 파일 업로드는 별도 제한
        if (uri.startsWith("/api/upload")) {
            return buckets.computeIfAbsent("upload:" + clientIp, key -> 
                createBucket(uploadRequests, uploadWindowMinutes));
        }
        
        // 일반 API는 기본 제한
        if (uri.startsWith("/api/")) {
            return buckets.computeIfAbsent("general:" + clientIp, key -> 
                createBucket(generalRequests, generalWindowMinutes));
        }
        
        // 나머지는 Rate Limiting 적용 안 함
        return null;
    }
    
    private Bucket createBucket(int requests, int windowMinutes) {
        Bandwidth limit = Bandwidth.classic(
            requests, 
            Refill.intervally(requests, java.time.Duration.ofMinutes(windowMinutes))
        );
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    
    private int getLimitForUri(String uri) {
        if (uri.startsWith("/api/auth/login")) {
            return loginRequests;
        }
        if (uri.startsWith("/api/upload")) {
            return uploadRequests;
        }
        if (uri.startsWith("/api/")) {
            return generalRequests;
        }
        return 0;
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For는 여러 IP가 콤마로 구분될 수 있음 (첫 번째가 실제 클라이언트 IP)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }
}

// Rate Limiting 필터입니다. IP 기반으로 요청 수를 제한하여 무차별 대입 공격을 방지합니다.

