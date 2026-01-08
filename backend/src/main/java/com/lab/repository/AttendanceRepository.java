package com.lab.repository;

import com.lab.domain.Attendance;
import com.lab.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByMemberAndWorkDate(Member member, LocalDate workDate);
    List<Attendance> findByWorkDateBetween(LocalDate start, LocalDate end);
    void deleteByMemberId(Long memberId);
}

// 출퇴근 리포지토리입니다.

