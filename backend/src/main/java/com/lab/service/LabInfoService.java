package com.lab.service;

import com.lab.domain.LabInfo;
import com.lab.domain.Member;
import com.lab.repository.LabInfoRepository;
import com.lab.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LabInfoService {
    private final LabInfoRepository labInfoRepository;
    private final MemberRepository memberRepository;

    public Optional<LabInfo> getLabInfo() {
        return labInfoRepository.findFirstByOrderByUpdatedAtDesc();
    }

    @Transactional
    public LabInfo createOrUpdateLabInfo(String labName, String description, String researchAreas,
                                        String facilities, String location, String contactEmail,
                                        String contactPhone, String directorName) {
        Member director = null;
        if (directorName != null && !directorName.trim().isEmpty()) {
            director = memberRepository.findByName(directorName)
                    .orElseThrow(() -> new IllegalArgumentException("실험실장을 찾을 수 없습니다: " + directorName));
        }

        LabInfo labInfo = labInfoRepository.findFirstByOrderByUpdatedAtDesc()
                .orElse(new LabInfo());

        labInfo.setLabName(labName);
        labInfo.setDescription(description);
        labInfo.setResearchAreas(researchAreas);
        labInfo.setFacilities(facilities);
        labInfo.setLocation(location);
        labInfo.setContactEmail(contactEmail);
        labInfo.setContactPhone(contactPhone);
        labInfo.setDirector(director);

        return labInfoRepository.save(labInfo);
    }
}

