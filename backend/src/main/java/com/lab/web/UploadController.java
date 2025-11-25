package com.lab.web;

import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestPart("file") MultipartFile file) throws IOException {
        String filename = System.currentTimeMillis() + "-" + StringUtils.cleanPath(file.getOriginalFilename());
        Path uploadDir = Paths.get("uploads");
        Files.createDirectories(uploadDir);
        Path dest = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), dest);
        // 정적 제공: /uploads/** 를 정적 경로로 노출(로컬 개발)
        String base = System.getenv().getOrDefault("APP_BASE_URL", "http://localhost:8080");
        String url = base.replaceAll("/$", "") + "/uploads/" + filename;
        return Map.of("url", url);
    }
}


