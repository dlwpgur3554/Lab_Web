package com.lab.service;

import com.lab.domain.Attendance;
import com.lab.domain.Member;
import com.lab.repository.AttendanceRepository;
import com.lab.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final MemberRepository memberRepository;

    public Attendance checkIn(Member member) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        Attendance attendance = attendanceRepository.findByMemberAndWorkDate(member, today)
                .orElseGet(() -> {
                    Attendance a = new Attendance();
                    a.setMember(member);
                    a.setWorkDate(today);
                    return a;
                });
        if (attendance.getCheckInAt() == null) {
            attendance.setCheckInAt(Instant.now());
        }
        return attendanceRepository.save(attendance);
    }

    public Attendance checkOut(Member member) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        Attendance attendance = attendanceRepository.findByMemberAndWorkDate(member, today)
                .orElseThrow(() -> new IllegalStateException("출근 기록이 없습니다."));
        attendance.setCheckOutAt(Instant.now());
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getRecordsBetween(LocalDate start, LocalDate end) {
        return attendanceRepository.findByWorkDateBetween(start, end);
    }
}

// 출퇴근 서비스입니다. 오늘 날짜 기준으로 출근/퇴근 시각을 기록합니다.

