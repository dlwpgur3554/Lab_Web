package com.lab.web;

import com.lab.domain.LabInfo;
import com.lab.service.LabInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/lab-info")
@RequiredArgsConstructor
public class LabInfoController {
    private final LabInfoService labInfoService;

    @GetMapping
    public Optional<LabInfo> getLabInfo() {
        return labInfoService.getLabInfo();
    }

    @PostMapping
    public LabInfo createOrUpdateLabInfo(@RequestBody CreateLabInfoRequest request) {
        return labInfoService.createOrUpdateLabInfo(
                request.labName(),
                request.description(),
                request.researchAreas(),
                request.facilities(),
                request.location(),
                request.contactEmail(),
                request.contactPhone(),
                request.directorName()
        );
    }

    public record CreateLabInfoRequest(
            String labName,
            String description,
            String researchAreas,
            String facilities,
            String location,
            String contactEmail,
            String contactPhone,
            String directorName
    ) {}
}

