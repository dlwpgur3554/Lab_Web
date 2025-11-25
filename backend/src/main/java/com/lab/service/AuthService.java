package com.lab.service;

import com.lab.domain.Member;
import com.lab.domain.Role;
import com.lab.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;

    public Member getRequester(String requesterIdentifier) {
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

