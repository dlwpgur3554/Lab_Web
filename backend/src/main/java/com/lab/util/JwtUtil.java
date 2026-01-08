package com.lab.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    @Value("${jwt.secret:your-secret-key-change-this-in-production-minimum-256-bits}")
    private String secret;
    
    @Value("${jwt.expiration:86400000}") // 24시간
    private Long expiration;
    
    @PostConstruct
    public void validateSecret() {
        // 기본값 또는 안전하지 않은 키 검증
        String[] unsafeSecrets = {
            "your-secret-key-change-this-in-production-minimum-256-bits",
            "your-secret-key-change-this-in-production-minimum-256-bits-required-for-hmac-sha",
            "CHANGE-THIS-IN-PRODUCTION-MINIMUM-256-BITS-REQUIRED"
        };
        
        for (String unsafe : unsafeSecrets) {
            if (secret.equals(unsafe) || secret.length() < 32) {
                logger.error("================================================");
                logger.error("⚠️  보안 경고: JWT_SECRET이 기본값이거나 너무 짧습니다!");
                logger.error("⚠️  프로덕션 환경에서는 반드시 강력한 시크릿 키를 설정하세요!");
                logger.error("⚠️  .env 파일에 JWT_SECRET을 설정하거나 환경 변수로 설정하세요.");
                logger.error("⚠️  생성 방법: openssl rand -base64 32");
                logger.error("================================================");
                break;
            }
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String loginId, String clientIp) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(loginId)
                .claim("ip", clientIp != null ? clientIp : "")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getLoginIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public String getIpFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.get("ip", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            // 토큰 검증 실패 로그 (보안: 상세 정보는 로그에만 기록)
            logger.warn("JWT 토큰 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    public boolean validateTokenWithIp(String token, String requestIp) {
        if (!validateToken(token)) {
            return false;
        }
        
        String tokenIp = getIpFromToken(token);
        if (tokenIp == null || tokenIp.isEmpty()) {
            // 기존 토큰(IP 없음)은 허용 (하위 호환성)
            return true;
        }
        
        // IP 비교 (정확히 일치해야 함)
        return tokenIp.equals(requestIp);
    }
}

// JWT 토큰 생성 및 검증 유틸리티입니다.

