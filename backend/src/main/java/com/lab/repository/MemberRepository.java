package com.lab.repository;

import com.lab.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByName(String name);
    Optional<Member> findByEmail(String email);
    Optional<Member> findByLoginId(String loginId);
    Optional<Member> findByStudentId(String studentId);

    java.util.List<Member> findAllByOrderBySortOrderAscNameAsc();
}

// 구성원 조회 리포지토리입니다.

