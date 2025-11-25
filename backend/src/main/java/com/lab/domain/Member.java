package com.lab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // 로그인용 아이디 및 비밀번호 (MVP 용도)
    @Column(unique = true)
    private String loginId;

    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.MEMBER;

    // 관리자 권한(역할과 별개로 부여)
    @Column(nullable = false)
    private boolean admin = false;

    private String email;
    private String phone;
    private String studentId;
    private String researchArea;
    private String bio;
    // 추가 프로필 정보
    private String degree;     // 학위
    private String photoUrl;   // 프로필 사진 URL (base64 또는 외부 경로)

    // 멤버 표시 순서 (작을수록 위)
    @Column(nullable = false)
    private Integer sortOrder = 1000;
}

// 연구실 구성원 엔티티입니다. 이름/역할을 저장합니다.

