package com.lab.web;

import com.lab.domain.Member;
import com.lab.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final MemberRepository memberRepository;

    public record LoginRequest(String loginId, String password) {}
    public record LoginResponse(String loginId, String name, String role) {}

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        String identifier = req.loginId() == null ? "" : req.loginId().trim();
        String password = req.password() == null ? "" : req.password();

        Member m = memberRepository.findByLoginId(identifier)
                .or(() -> memberRepository.findByName(identifier))
                .or(() -> memberRepository.findByEmail(identifier))
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (m.getPassword() == null || !m.getPassword().equals(password)) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        return new LoginResponse(m.getLoginId(), m.getName(), m.getRole().name());
    }
}


