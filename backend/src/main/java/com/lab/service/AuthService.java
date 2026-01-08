package com.lab.service;

import com.lab.domain.Member;
import com.lab.domain.Role;
import com.lab.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;

    public Member getRequester(String requesterIdentifier) {
        // JWT 인증 우선 (Spring Security Context에서 가져오기)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String) {
            String loginId = (String) auth.getPrincipal();
            return memberRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new IllegalArgumentException("로그인 후 이용해주세요."));
        }
        
        // 하위 호환성: X-USER 헤더 지원
        String id = requesterIdentifier == null ? "" : requesterIdentifier.trim();
        if (id.isEmpty()) {
            throw new IllegalArgumentException("로그인 후 이용해주세요.");
        }
        return memberRepository.findByLoginId(id)
                .or(() -> memberRepository.findByStudentId(id))
                .or(() -> memberRepository.findByEmail(id))
                .or(() -> memberRepository.findByName(id))
                .orElseThrow(() -> new IllegalArgumentException("로그인 후 이용해주세요."));
    }

    public void requireAnyRole(Member requester, Set<Role> allowed) {
        // 관리자 권한이면 역할과 무관하게 통과
        if (requester.isAdmin()) return;
        if (!allowed.contains(requester.getRole())) {
            throw new SecurityException("권한이 없습니다.");
        }
    }

    public void requireAdmin(Member requester) {
        if (!requester.isAdmin()) throw new SecurityException("관리자 권한이 필요합니다.");
    }
}

// 매우 단순한 헤더 기반 권한 확인 서비스입니다. MVP 용도입니다.

