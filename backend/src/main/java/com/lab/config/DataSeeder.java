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

        // admin 계정 생성
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
        // 교수 역할의 멤버를 찾아서 director로 설정 (없으면 null)
        Member director = memberRepository.findAll().stream()
                .filter(m -> m.getRole() == Role.PROFESSOR)
                .findFirst()
                .orElse(null);
        labInfo.setDirector(director);
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

