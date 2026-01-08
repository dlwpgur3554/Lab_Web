package com.lab.web;

import com.lab.domain.Member;
import com.lab.repository.MemberRepository;
import com.lab.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public record LoginRequest(String loginId, String password) {}
    public record LoginResponse(String token, String loginId, String name, String role) {}

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

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req, HttpServletRequest request) {
        String identifier = req.loginId() == null ? "" : req.loginId().trim();
        String password = req.password() == null ? "" : req.password();

        Member m = memberRepository.findByLoginId(identifier)
                .or(() -> memberRepository.findByName(identifier))
                .or(() -> memberRepository.findByEmail(identifier))
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        // 비밀번호 검증 (BCrypt 또는 평문 모두 지원 - 마이그레이션용)
        boolean passwordValid = false;
        if (m.getPassword() != null) {
            // BCrypt 해시로 시작하는지 확인
            if (m.getPassword().startsWith("$2a$") || m.getPassword().startsWith("$2b$")) {
                passwordValid = passwordEncoder.matches(password, m.getPassword());
            } else {
                // 평문 비밀번호 (기존 데이터 마이그레이션용)
                passwordValid = m.getPassword().equals(password);
                // 로그인 성공 시 자동으로 해싱하여 저장
                if (passwordValid) {
                    m.setPassword(passwordEncoder.encode(password));
                    memberRepository.save(m);
                }
            }
        }

        if (!passwordValid) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String clientIp = getClientIp(request);
        String token = jwtUtil.generateToken(m.getLoginId(), clientIp);
        return new LoginResponse(token, m.getLoginId(), m.getName(), m.getRole().name());
    }
}


