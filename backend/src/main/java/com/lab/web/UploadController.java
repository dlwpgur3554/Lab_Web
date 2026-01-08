package com.lab.web;

import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    // 허용된 파일 확장자
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        "jpg", "jpeg", "png", "gif", "webp", // 이미지
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", // 문서
        "zip", "rar", "7z", // 압축
        "txt", "md" // 텍스트
    );
    
    // 최대 파일 크기 (50MB)
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestPart("file") MultipartFile file) throws IOException {
        // 파일 검증
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기가 너무 큽니다. (최대 50MB)");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("파일명이 올바르지 않습니다.");
        }
        
        // 확장자 검증
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("허용되지 않은 파일 형식입니다. 허용 형식: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
        
        // 파일명 정리 (경로 탐색 공격 방지)
        String filename = System.currentTimeMillis() + "-" + StringUtils.cleanPath(originalFilename);
        Path uploadDir = Paths.get("uploads");
        Files.createDirectories(uploadDir);
        Path dest = uploadDir.resolve(filename);
        
        // 파일 저장
        Files.copy(file.getInputStream(), dest);
        
        // URL 생성
        String base = System.getenv().getOrDefault("APP_BASE_URL", "http://localhost:8080");
        String url = base.replaceAll("/$", "") + "/uploads/" + filename;
        return Map.of("url", url);
    }
    
    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1 || lastDot == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDot + 1);
    }
}

// 파일 업로드 컨트롤러입니다. 파일 타입, 크기, 확장자를 검증합니다.
