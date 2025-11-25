package com.lab.web;

import com.lab.domain.Member;
import org.springframework.transaction.annotation.Transactional;
import com.lab.repository.MemberRepository;
import com.lab.repository.NoticeRepository;
import com.lab.repository.ProjectRepository;
import com.lab.repository.EventRepository;
import java.util.List;
import com.lab.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {
    private final MemberRepository memberRepository;
    private final NoticeRepository noticeRepository;
    private final ProjectRepository projectRepository;
    private final EventRepository eventRepository;
    private final AuthService authService;

    @GetMapping
    public List<Member> list() {
        return memberRepository.findAllByOrderBySortOrderAscNameAsc();
    }
    // 순서 저장: 전달된 ID 배열의 순서대로 sortOrder를 10씩 부여
    @PutMapping("/admin/order")
    @org.springframework.transaction.annotation.Transactional
    public void saveOrder(@RequestHeader("X-USER") String requester, @RequestBody java.util.List<Long> orderedIds) {
        Member admin = authService.getRequester(requester);
        authService.requireAdmin(admin);
        int order = 10;
        for (Long id : orderedIds) {
            var opt = memberRepository.findById(id);
            if (opt.isPresent()) {
                Member m = opt.get();
                m.setSortOrder(order);
                memberRepository.save(m);
            }
            order += 10;
        }
    }

    @GetMapping("/me")
    public Member me(@RequestHeader("X-USER") String requester) {
        return authService.getRequester(requester);
    }

    @PutMapping("/me")
    public Member updateProfile(@RequestHeader("X-USER") String requester, @RequestBody Member payload) {
        Member me = authService.getRequester(requester);
        me.setEmail(payload.getEmail());
        me.setPhone(payload.getPhone());
        me.setDegree(payload.getDegree());
        me.setPhotoUrl(payload.getPhotoUrl());
        return memberRepository.save(me);
    }

    public record PwChange(String oldPassword, String newPassword) {}

    @PutMapping("/me/password")
    public void changePassword(@RequestHeader("X-USER") String requester, @RequestBody PwChange body) {
        Member me = authService.getRequester(requester);
        if (!me.getPassword().equals(body.oldPassword())) {
            throw new IllegalArgumentException("기존 비밀번호가 일치하지 않습니다.");
        }
        me.setPassword(body.newPassword());
        memberRepository.save(me);
    }

    // 관리자 전용 API
    @PostMapping("/admin")
    public Member createMember(@RequestHeader("X-USER") String requester, @RequestBody CreateMemberRequest req) {
        Member admin = authService.getRequester(requester);
        authService.requireAdmin(admin);
        
        if (memberRepository.findByLoginId(req.loginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }
        
        Member member = new Member();
        member.setName(req.name());
        member.setLoginId(req.loginId());
        member.setPassword(req.password());
        member.setRole(req.role());
        if (req.admin() != null) member.setAdmin(req.admin());
        member.setEmail(req.email());
        member.setPhone(req.phone());
        member.setDegree(req.degree());
        member.setStudentId(req.studentId());
        return memberRepository.save(member);
    }

    @PutMapping("/admin/{id:\\d+}")
    public Member updateMember(@RequestHeader("X-USER") String requester, @PathVariable("id") Long id, @RequestBody UpdateMemberRequest req) {
        Member admin = authService.getRequester(requester);
        authService.requireAdmin(admin);
        
        Member member = memberRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("멤버를 찾을 수 없습니다."));
        if (req.name() != null && !req.name().trim().isEmpty()) {
            member.setName(req.name().trim());
        }
        if (req.degree() != null) {
            String deg = req.degree().trim();
            member.setDegree(deg.isEmpty() ? null : deg);
        } else {
            member.setDegree(null);
        }
        if (req.role() != null) {
            member.setRole(req.role());
        }
        if (req.admin() != null) {
            member.setAdmin(req.admin());
        }
        if (req.email() != null) {
            String em = req.email().trim();
            member.setEmail(em.isEmpty() ? null : em);
        } else {
            member.setEmail(null);
        }
        if (req.phone() != null) {
            String ph = req.phone().trim();
            member.setPhone(ph.isEmpty() ? null : ph);
        } else {
            member.setPhone(null);
        }
        if (req.password() != null && !req.password().trim().isEmpty()) {
            member.setPassword(req.password().trim());
        }
        return memberRepository.save(member);
    }

    @PutMapping("/admin/{id:\\d+}/password")
    public void changeMemberPassword(@RequestHeader("X-USER") String requester, @PathVariable("id") Long id, @RequestBody PasswordChangeRequest req) {
        Member admin = authService.getRequester(requester);
        authService.requireAdmin(admin);
        
        Member member = memberRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("멤버를 찾을 수 없습니다."));
        member.setPassword(req.newPassword());
        memberRepository.save(member);
    }

    @DeleteMapping("/admin/{id:\\d+}")
    @Transactional
    public void deleteMember(@RequestHeader("X-USER") String requester, @PathVariable("id") Long id) {
        Member admin = authService.getRequester(requester);
        authService.requireAdmin(admin);
        
        Member member = memberRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("멤버를 찾을 수 없습니다."));
        if (member.isAdmin()) {
            throw new IllegalArgumentException("관리자는 삭제할 수 없습니다.");
        }
        // 참조 정리: 개인 일정 삭제, 그 외 일정은 작성자 null 처리 → 공지/프로젝트도 작성자 null 처리 후 삭제
        eventRepository.deletePersonalByMemberId(id);
        eventRepository.clearCreatedBy(id);
        noticeRepository.clearAuthorByAuthorId(id);
        projectRepository.clearCreatedBy(id);
        memberRepository.delete(member);
    }

    public record CreateMemberRequest(String name, String loginId, String password, com.lab.domain.Role role, Boolean admin, String email, String phone, String degree, String studentId) {}
    public record UpdateMemberRequest(String name, String degree, com.lab.domain.Role role, Boolean admin, String email, String phone, String password) {}
    public record PasswordChangeRequest(String newPassword) {}
}

