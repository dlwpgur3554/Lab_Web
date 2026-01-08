package com.lab.web;

import com.lab.domain.Attendance;
import com.lab.domain.Member;
import com.lab.service.AttendanceService;
import com.lab.repository.MemberRepository;
import com.lab.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;
    private final AuthService authService;
    private final MemberRepository memberRepository;
    
    @Value("${attendance.allowed-ips:}")
    private String allowedIpsConfig;
    
    private Set<String> getAllowedIps() {
        if (allowedIpsConfig == null || allowedIpsConfig.trim().isEmpty()) {
            return Set.of();
        }
        return Arrays.stream(allowedIpsConfig.split(","))
                .map(String::trim)
                .filter(ip -> !ip.isEmpty())
                .collect(Collectors.toSet());
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For는 여러 IP가 콤마로 구분될 수 있음 (첫 번째가 실제 클라이언트 IP)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
    
    private void validateAttendanceIp(HttpServletRequest request) {
        String clientIp = getClientIp(request);
        Set<String> allowedIps = getAllowedIps();
        
        if (allowedIps.isEmpty()) {
            // 허용된 IP 목록이 없으면 검증하지 않음 (개발 환경)
            return;
        }
        
        if (!allowedIps.contains(clientIp)) {
            // IP 주소는 에러 메시지에 포함하지 않음 (보안)
            throw new IllegalArgumentException("출퇴근 체크는 연구실 네트워크에서만 가능합니다.");
        }
    }

    @PostMapping("/check-in")
    public Attendance checkIn(@RequestHeader(value = "X-USER", required = false) String requester,
                             HttpServletRequest request) {
        validateAttendanceIp(request);
        Member requesterMember = authService.getRequester(requester);
        return attendanceService.checkIn(requesterMember);
    }

    @PostMapping("/check-out")
    public Attendance checkOut(@RequestHeader(value = "X-USER", required = false) String requester,
                              HttpServletRequest request) {
        validateAttendanceIp(request);
        Member requesterMember = authService.getRequester(requester);
        return attendanceService.checkOut(requesterMember);
    }

    // 관리자 전용 통계 API
    @GetMapping({"/stats", "/stats/"})
    public Map<String, Object> stats(@RequestHeader(value = "X-USER", required = false) String requester,
                                     @RequestParam(value = "month", required = false) String month) {
        Member admin = authService.getRequester(requester);
        authService.requireAdmin(admin);

        LocalDate now = LocalDate.now(ZoneId.of("Asia/Seoul"));
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

