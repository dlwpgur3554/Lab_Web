package com.lab.service;

import com.lab.domain.Project;
import com.lab.domain.Member;
import com.lab.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final com.lab.repository.MemberRepository memberRepository;

    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    public org.springframework.data.domain.Page<Project> getAllProjectsPaged(int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(Math.max(page,0), Math.max(size,1), org.springframework.data.domain.Sort.by("createdAt").descending());
        return projectRepository.findAll(pageable);
    }

    public List<Project> getProjectsByStatus(Project.ProjectStatus status) {
        return projectRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public Project getById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다: " + id));
    }

    @Transactional
    public Project createProject(Member createdBy, String title, String summary, String description, Project.ProjectStatus status, String members) {
        Project project = new Project();
        project.setTitle(title);
        project.setSummary(summary);
        project.setDescription(description);
        project.setStatus(status);
        project.setMembers(members);
        project.setCreatedBy(createdBy);

        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProjectStatus(Long projectId, Project.ProjectStatus status) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다: " + projectId));
        
        project.setStatus(status);
        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Member requester, Long projectId, String title, String summary, String description, Project.ProjectStatus status, String members) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다: " + projectId));
        boolean isAdmin = requester.isAdmin();
        if (!isAdmin) {
            if (project.getCreatedBy() != null && !project.getCreatedBy().getId().equals(requester.getId())) {
                throw new SecurityException("작성자만 수정할 수 있습니다.");
            }
        }
        project.setTitle(title);
        project.setSummary(summary);
        project.setDescription(description);
        project.setStatus(status);
        project.setMembers(members);
        return projectRepository.save(project);
    }

    @Transactional
    public void deleteProject(Member requester, Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다: " + id));
        boolean isAdmin2 = requester.isAdmin();
        if (!isAdmin2) {
            if (project.getCreatedBy() != null && !project.getCreatedBy().getId().equals(requester.getId())) {
                throw new SecurityException("작성자만 삭제할 수 있습니다.");
            }
        }
        
        // description에서 파일 URL 추출 및 삭제
        String description = project.getDescription();
        if (description != null && !description.isBlank()) {
            // 이미지 마크다운: ![alt](url)
            Pattern imagePattern = Pattern.compile("!\\[[^\\]]*\\]\\(([^)]+)\\)");
            // 파일 링크: [파일](url)
            Pattern filePattern = Pattern.compile("\\[파일\\]\\(([^)]+)\\)");
            // 일반 이미지 URL: http://.../uploads/...
            Pattern urlPattern = Pattern.compile("(https?://[^\\s)]+/uploads/[^\\s)]+)");
            
            deleteFilesFromDescription(description, imagePattern);
            deleteFilesFromDescription(description, filePattern);
            deleteFilesFromDescription(description, urlPattern);
        }
        
        projectRepository.delete(project);
    }
    
    private void deleteFilesFromDescription(String description, Pattern pattern) {
        Matcher matcher = pattern.matcher(description);
        while (matcher.find()) {
            String url = matcher.group(1);
            try {
                // URL에서 파일명 추출
                // 예: http://localhost:8080/uploads/1234567890-filename.jpg -> 1234567890-filename.jpg
                String filename = extractFilenameFromUrl(url);
                if (filename != null && !filename.isBlank()) {
                    java.nio.file.Path filePath = Paths.get("uploads").resolve(filename);
                    Files.deleteIfExists(filePath);
                }
            } catch (IOException ignored) {
                // 파일 삭제 실패는 무시 (이미 삭제되었거나 존재하지 않을 수 있음)
            }
        }
    }
    
    private String extractFilenameFromUrl(String url) {
        try {
            // URL에서 /uploads/ 이후 부분 추출
            int uploadsIndex = url.indexOf("/uploads/");
            if (uploadsIndex != -1) {
                String pathPart = url.substring(uploadsIndex + "/uploads/".length());
                // 쿼리 파라미터나 앵커 제거
                int queryIndex = pathPart.indexOf('?');
                if (queryIndex != -1) {
                    pathPart = pathPart.substring(0, queryIndex);
                }
                int anchorIndex = pathPart.indexOf('#');
                if (anchorIndex != -1) {
                    pathPart = pathPart.substring(0, anchorIndex);
                }
                return pathPart;
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}

