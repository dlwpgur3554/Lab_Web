package com.lab.config;

import com.lab.domain.*;
import com.lab.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

 

@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {
    private final MemberRepository memberRepository;
    private final LabInfoRepository labInfoRepository;
    private final ProjectRepository projectRepository;

    @Override
    public void run(ApplicationArguments args) {

        // 사용자 제공 목록 기반 멤버 데이터 생성
        Member prof = getByLoginOrName("waver", "신광성");
        if (prof.getId() == null) {
            prof.setName("신광성");
            prof.setLoginId("waver");
            prof.setPassword("waver");
            prof.setRole(Role.PROFESSOR);
        } else if (prof.getLoginId() == null || prof.getLoginId().isBlank()) {
            prof.setLoginId("waver");
        }

        Member lead = getByLoginOrName("20204400", "전지환");
        if (lead.getId() == null) {
            lead.setName("전지환");
            lead.setLoginId("20204400");
            lead.setPassword("20204400");
            lead.setRole(Role.LAB_LEAD);
        } else if (lead.getLoginId() == null || lead.getLoginId().isBlank()) {
            lead.setLoginId("20204400");
        }

        memberRepository.save(prof);
        memberRepository.save(lead);

        String[][] students = new String[][]{
                {"배슬찬","20204414","20204414"},
                {"김수민","20224317","20224317"},
                {"김민석","20214301","20214301"},
                {"노경민","20214380","20214380"},
                {"이제혁","20214369","20214369"},
                {"김주형","20224313","20224313"},
                {"김연지","20244339","20244339"}
        };
        for (String[] s : students) {
            Member m = getByLoginOrName(s[1], s[0]);
            if (m.getId() == null) {
                m.setName(s[0]);
                m.setLoginId(s[1]);
                m.setPassword(s[2]);
                m.setRole(Role.MEMBER);
                memberRepository.save(m);
            } else if (m.getLoginId() == null || m.getLoginId().isBlank()) {
                m.setLoginId(s[1]);
                memberRepository.save(m);
            }
        }

        Member admin = getByLoginOrName("admin", "admin");
        if (admin.getId() == null) {
            admin.setName("admin");
            admin.setLoginId("admin");
            admin.setPassword("rm518403!");
            admin.setRole(Role.MEMBER);
            admin.setAdmin(true);
            memberRepository.save(admin);
        } else {
            boolean changed = false;
            if (admin.getLoginId() == null || admin.getLoginId().isBlank()) { admin.setLoginId("admin"); changed = true; }
            if (!admin.isAdmin()) { admin.setAdmin(true); changed = true; }
            if (changed) memberRepository.save(admin);
        }

        // 실험실 정보 생성
        LabInfo labInfo = new LabInfo();
        labInfo.setLabName("실감 멀티미디어 연구실");
        labInfo.setDescription("실감 멀티미디어 연구실은 VR/AR, 컴퓨터 그래픽스, 실시간 렌더링 등의 분야를 연구합니다.");
        labInfo.setResearchAreas("VR/AR, 컴퓨터 그래픽스, 실시간 렌더링, 3D 모델링, 가상현실");
        labInfo.setFacilities("VR 헤드셋, 모션 캡처 시스템, 고성능 워크스테이션, 3D 프린터");
        labInfo.setLocation("순천대학교 공과대학 3호관 403호");
        labInfo.setContactEmail("ksshin@knu.ac.kr");
        labInfo.setContactPhone("053-950-5555");
        labInfo.setDirector(prof);
        labInfoRepository.save(labInfo);

        // 프로젝트 자동 생성 제거(초기 데이터 강제 주입하지 않음)
    }

    private Member getByLoginOrName(String loginId, String name) {
        return memberRepository.findByLoginId(loginId)
                .or(() -> memberRepository.findByName(name))
                .orElseGet(Member::new);
    }
}

// 초기 멤버 시드 데이터입니다. 요청 헤더 X-USER 값과 일치해야 합니다.

