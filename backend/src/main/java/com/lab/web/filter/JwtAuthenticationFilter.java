package com.lab.web.filter;

import com.lab.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtUtil jwtUtil;
    
    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
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
        return ip;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // JWT 토큰 확인
        String token = getTokenFromRequest(request);
        String uri = request.getRequestURI();
        
        if (token != null) {
            if (jwtUtil.validateToken(token)) {
                String loginId = jwtUtil.getLoginIdFromToken(token);
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(loginId, null, null);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // 토큰 검증 실패 (만료 또는 잘못된 토큰) - 보안: 경고 레벨만 로그
                logger.warn("JWT 토큰 검증 실패 - 경로: {}", uri);
            }
        } else {
            // 토큰이 없는 경우 (인증이 필요한 엔드포인트에서만 로그)
            if (uri.startsWith("/api/attendance") || uri.contains("/admin") || uri.contains("/me")) {
                logger.debug("JWT 토큰 없음 - 경로: {}", uri);
            }
        }
        // 보안 강화: X-USER 헤더만으로는 인증하지 않음 (JWT 토큰 필수)
        // X-USER 헤더는 하위 호환성을 위해 AuthService에서만 사용 (보안 검증 없음)
        // 보안 강화: X-USER 헤더만으로는 인증하지 않음 (JWT 토큰 필수)
        
        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

// JWT 토큰을 검증하고 SecurityContext에 인증 정보를 설정하는 필터입니다.

