package com.lab.web;

import com.lab.domain.Attendance;
import com.lab.domain.Member;
import com.lab.service.AttendanceService;
import com.lab.repository.MemberRepository;
import com.lab.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;
    private final AuthService authService;
    private final MemberRepository memberRepository;

    @PostMapping("/check-in")
    public Attendance checkIn(@RequestHeader("X-USER") String requester) {
        Member requesterMember = authService.getRequester(requester);
        return attendanceService.checkIn(requesterMember);
    }

    @PostMapping("/check-out")
    public Attendance checkOut(@RequestHeader("X-USER") String requester) {
        Member requesterMember = authService.getRequester(requester);
        return attendanceService.checkOut(requesterMember);
    }

    // 관리자 전용 통계 API
    @GetMapping({"/stats", "/stats/"})
    public Map<String, Object> stats(@RequestHeader(value = "X-USER", required = false) String requester,
                                     @RequestParam(value = "month", required = false) String month) {
        Member admin = authService.getRequester(requester);
        authService.requireAdmin(admin);

        LocalDate now = LocalDate.now();
        int y, m;
        if (month != null && month.matches("\\d{4}-\\d{2}")) {
            y = Integer.parseInt(month.substring(0,4));
            m = Integer.parseInt(month.substring(5,7));
        } else {
            y = now.getYear();
            m = now.getMonthValue();
        }
        LocalDate start = LocalDate.of(y, m, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        // 멤버 목록: 현재 구성원만(ROLE=MEMBER), 교수/관리자 제외
        List<com.lab.domain.Member> members = memberRepository.findAllByOrderBySortOrderAscNameAsc()
                .stream()
                .filter(it -> it.getRole() == com.lab.domain.Role.MEMBER)
                .toList();

        // 레코드: 해당 월 전체
        List<com.lab.domain.Attendance> records = attendanceService.getRecordsBetween(start, end);

        return Map.of(
                "start", start.toString(),
                "end", end.toString(),
                "members", members,
                "records", records
        );
    }
}

// 출퇴근 API 컨트롤러입니다. 오늘 날짜로 출퇴근을 기록합니다.

