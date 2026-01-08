package com.lab.web.dto;

import com.lab.domain.Member;
import com.lab.domain.Role;

public record MemberDto(
    Long id,
    String name,
    String loginId,
    Role role,
    boolean admin,
    String email,
    String phone,
    String studentId,
    String researchArea,
    String bio,
    String degree,
    String photoUrl,
    Integer graduationYear,
    Integer sortOrder
) {
    public static MemberDto from(Member member) {
        return new MemberDto(
            member.getId(),
            member.getName(),
            member.getLoginId(),
            member.getRole(),
            member.isAdmin(),
            member.getEmail(),
            member.getPhone(),
            member.getStudentId(),
            member.getResearchArea(),
            member.getBio(),
            member.getDegree(),
            member.getPhotoUrl(),
            member.getGraduationYear(),
            member.getSortOrder()
        );
    }
}

// Member 엔티티에서 비밀번호를 제외한 DTO입니다.

