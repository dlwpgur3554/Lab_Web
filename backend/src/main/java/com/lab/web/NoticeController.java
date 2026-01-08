package com.lab.web;

import com.lab.domain.Member;
import com.lab.domain.Notice;
import com.lab.domain.NoticeAttachment;
import com.lab.repository.MemberRepository;
import com.lab.repository.NoticeAttachmentRepository;
import com.lab.repository.NoticeRepository;
import com.lab.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ContentDisposition;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {
    private final NoticeRepository noticeRepository;
    private final NoticeAttachmentRepository noticeAttachmentRepository;
    private final MemberRepository memberRepository;
    private final AuthService authService;

    record NoticeDto(Long id, String title, String content, String category, boolean pinned) {}
    record NoticeDetailDto(Long id, String title, String content, String category, String createdAt,
                           boolean pinned, AuthorDto author, List<AttachmentDto> attachments) {}
    record AttachmentDto(Long id, String url, String name, String contentType, long sizeBytes) {}
    record AuthorDto(Long id, String name, String loginId) {}

    @GetMapping
    public org.springframework.data.domain.Page<Notice> list(@RequestParam(value = "category", required = false) String category,
                                                             @RequestParam(value = "page", defaultValue = "0") int page,
                                                             @RequestParam(value = "size", defaultValue = "10") int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(Math.max(page,0), Math.max(size,1), org.springframework.data.domain.Sort.by("createdAt").descending());
        if (category == null || category.isBlank()) return noticeRepository.findAllByOrderByCreatedAtDesc(pageable);
        return noticeRepository.findByCategoryOrderByCreatedAtDesc(category, pageable);
    }

    @GetMapping("/{id}")
    public NoticeDetailDto get(@PathVariable("id") Long id) {
        Notice n = noticeRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        List<NoticeAttachment> atts = noticeAttachmentRepository.findByNotice(n);
        AuthorDto author = null;
        if (n.getAuthor() != null) {
            author = new AuthorDto(n.getAuthor().getId(), n.getAuthor().getName(), n.getAuthor().getLoginId());
        }
        return new NoticeDetailDto(
                n.getId(), n.getTitle(), n.getContent(), n.getCategory(),
                n.getCreatedAt().toString(), n.isPinned(),
                author,
                atts.stream().map(a -> new AttachmentDto(a.getId(), a.getStoredPath(), a.getOriginalName(), a.getContentType(), a.getSizeBytes())).toList()
        );
    }

    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NoticeDetailDto create(@RequestHeader(value = "X-USER", required = false) String requester,
                                 @RequestPart("title") String title,
                                 @RequestPart("content") String content,
                                 @RequestPart(value = "category", required = false) String category,
                                 @RequestPart(value = "pinned", required = false) Boolean pinned,
                                 @RequestPart(value = "files", required = false) List<MultipartFile> files) throws IOException {
        Member me = authService.getRequester(requester);
        Notice n = new Notice();
        n.setTitle(title);
        n.setContent(content);
        n.setCategory((category == null || category.isBlank()) ? "NOTICE" : category);
        n.setAuthor(me);
        if (pinned != null) n.setPinned(pinned);
        noticeRepository.save(n);

        saveFiles(n, files);
        return get(n.getId());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NoticeDetailDto update(@RequestHeader(value = "X-USER", required = false) String requester,
                                  @PathVariable("id") Long id,
                                  @RequestPart("title") String title,
                                  @RequestPart("content") String content,
                                  @RequestPart(value = "category", required = false) String category,
                                  @RequestPart(value = "pinned", required = false) Boolean pinned,
                                  @RequestPart(value = "files", required = false) List<MultipartFile> files,
                                  @RequestPart(value = "deleteAttachmentIds", required = false) List<Long> deleteAttachmentIds
    ) throws IOException {
        Member me = authService.getRequester(requester);
        Notice n = noticeRepository.findById(id).orElseThrow();
        boolean isAdmin = me.isAdmin();
        if (!isAdmin) {
            if (n.getAuthor() == null) {
                authService.requireAdmin(me);
            } else if (!n.getAuthor().getId().equals(me.getId())) {
                throw new IllegalArgumentException("작성자만 수정할 수 있습니다.");
            }
        }
        n.setTitle(title);
        n.setContent(content);
        if (category != null && !category.isBlank()) n.setCategory(category);
        if (pinned != null) n.setPinned(pinned);
        noticeRepository.save(n);

        if (deleteAttachmentIds != null) {
            for (Long aid : deleteAttachmentIds) {
                noticeAttachmentRepository.findById(aid).ifPresent(a -> {
                    String stored = a.getStoredPath();
                    String name = stored.startsWith("/uploads/") ? stored.substring("/uploads/".length()) : stored;
                    try {
                        Files.deleteIfExists(Paths.get("uploads").resolve(name));
                    } catch (IOException ignored) {}
                    noticeAttachmentRepository.delete(a);
                });
            }
        }
        saveFiles(n, files);
        return get(id);
    }

    // Some clients/browsers don't send multipart with PUT consistently.
    // Accept multipart update via POST as well.
    @PostMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NoticeDetailDto updateViaPost(@RequestHeader(value = "X-USER", required = false) String requester,
                                         @PathVariable("id") Long id,
                                         @RequestPart("title") String title,
                                         @RequestPart("content") String content,
                                         @RequestPart(value = "category", required = false) String category,
                                         @RequestPart(value = "pinned", required = false) Boolean pinned,
                                         @RequestPart(value = "files", required = false) List<MultipartFile> files,
                                         @RequestPart(value = "deleteAttachmentIds", required = false) List<Long> deleteAttachmentIds
    ) throws IOException {
        return update(requester, id, title, content, category, pinned, files, deleteAttachmentIds);
    }

    // 폼 전송 호환용(일부 환경에서 Content-Type 설정 문제로 415 발생 시 사용)
    @PostMapping(value = "/{id}/form")
    public NoticeDetailDto updateViaForm(@RequestHeader(value = "X-USER", required = false) String requester,
                                         @PathVariable("id") Long id,
                                         @RequestParam("title") String title,
                                         @RequestParam("content") String content,
                                         @RequestParam(value = "category", required = false) String category,
                                         @RequestParam(value = "pinned", required = false) Boolean pinned,
                                         @RequestParam(value = "files", required = false) List<MultipartFile> files,
                                         @RequestParam(value = "deleteAttachmentIds", required = false) List<Long> deleteAttachmentIds
    ) throws IOException {
        return update(requester, id, title, content, category, pinned, files, deleteAttachmentIds);
    }

    // JSON 방식도 허용 (호환성)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public Notice createJson(@RequestHeader(value = "X-USER", required = false) String requester,
                             @RequestBody Notice body) {
        Member me = authService.getRequester(requester);
        body.setAuthor(me);
        if (body.getCategory() == null || body.getCategory().isBlank()) body.setCategory("NOTICE");
        return noticeRepository.save(body);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Notice updateJson(@RequestHeader(value = "X-USER", required = false) String requester,
                             @PathVariable("id") Long id,
                             @RequestBody Notice body) {
        Member me = authService.getRequester(requester);
        Notice n = noticeRepository.findById(id).orElseThrow();
        boolean isAdmin2 = me.isAdmin();
        if (!isAdmin2) {
            if (n.getAuthor() == null) {
                authService.requireAdmin(me);
            } else if (!n.getAuthor().getId().equals(me.getId())) {
                throw new IllegalArgumentException("작성자만 수정할 수 있습니다.");
            }
        }
        n.setTitle(body.getTitle());
        n.setContent(body.getContent());
        if (body.getCategory() != null && !body.getCategory().isBlank()) n.setCategory(body.getCategory());
        return noticeRepository.save(n);
    }

    // 일부 환경에서 PUT+JSON이 415로 막히는 이슈 대응: POST+JSON도 허용
    @PostMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Notice updateJsonViaPost(@RequestHeader(value = "X-USER", required = false) String requester,
                                    @PathVariable("id") Long id,
                                    @RequestBody Notice body) {
        return updateJson(requester, id, body);
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestHeader(value = "X-USER", required = false) String requester,
                       @PathVariable("id") Long id) {
        Member me = authService.getRequester(requester);
        Notice n = noticeRepository.findById(id).orElseThrow();
        boolean isAdmin3 = me.isAdmin();
        if (!isAdmin3) {
            if (n.getAuthor() == null) {
                authService.requireAdmin(me);
            } else if (!n.getAuthor().getId().equals(me.getId())) {
                throw new IllegalArgumentException("작성자만 삭제할 수 있습니다.");
            }
        }
        // 첨부 먼저 삭제(파일 시스템 포함)
        List<NoticeAttachment> atts = noticeAttachmentRepository.findByNotice(n);
        for (NoticeAttachment a : atts) {
            String stored = a.getStoredPath();
            String name = stored.startsWith("/uploads/") ? stored.substring("/uploads/".length()) : stored;
            try {
                Files.deleteIfExists(Paths.get("uploads").resolve(name));
            } catch (IOException ignored) {}
            noticeAttachmentRepository.delete(a);
        }
        noticeRepository.delete(n);
    }

    // 상단 고정/해제
    @PutMapping("/{id}/pin")
    public void setPinned(@RequestHeader(value = "X-USER", required = false) String requester,
                          @PathVariable("id") Long id,
                          @RequestParam("pinned") boolean pinned) {
        Member me = authService.getRequester(requester);
        Notice n = noticeRepository.findById(id).orElseThrow();
        boolean isAdmin = me.isAdmin();
        if (!isAdmin) {
            if (n.getAuthor() == null) {
                authService.requireAdmin(me);
            } else if (!n.getAuthor().getId().equals(me.getId())) {
                throw new IllegalArgumentException("작성자만 변경할 수 있습니다.");
            }
        }
        n.setPinned(pinned);
        noticeRepository.save(n);
    }

    // 일부 환경에서 PUT 호출 제약 대응: POST 도 허용
    @PostMapping("/{id}/pin")
    public void setPinnedViaPost(@RequestHeader(value = "X-USER", required = false) String requester,
                                 @PathVariable("id") Long id,
                                 @RequestParam("pinned") boolean pinned) {
        setPinned(requester, id, pinned);
    }

    private void saveFiles(Notice notice, List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) return;
        Path root = Paths.get("uploads");
        if (!Files.exists(root)) Files.createDirectories(root);
        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            String clean = StringUtils.cleanPath(f.getOriginalFilename() == null ? "file" : f.getOriginalFilename());
            String filename = System.currentTimeMillis() + "_" + clean;
            Path target = root.resolve(filename);
            Files.copy(f.getInputStream(), target);

            NoticeAttachment a = new NoticeAttachment();
            a.setNotice(notice);
            a.setStoredPath("/uploads/" + filename);
            a.setOriginalName(clean);
            a.setContentType(f.getContentType() == null ? "application/octet-stream" : f.getContentType());
            a.setSizeBytes(f.getSize());
            a.setFileKey(UUID.randomUUID().toString().replace("-", ""));
            noticeAttachmentRepository.save(a);
        }
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable("attachmentId") Long attachmentId) throws IOException {
        NoticeAttachment a = noticeAttachmentRepository.findById(attachmentId).orElseThrow();
        String stored = a.getStoredPath(); // e.g. /uploads/filename.ext
        String filename = stored;
        if (stored.startsWith("/uploads/")) filename = stored.substring("/uploads/".length());
        Path file = Paths.get("uploads").resolve(filename);
        String contentType = a.getContentType() == null ? Files.probeContentType(file) : a.getContentType();
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        InputStreamResource body = new InputStreamResource(Files.newInputStream(file));
        ContentDisposition cd = ContentDisposition
                .attachment()
                .filename(a.getOriginalName(), java.nio.charset.StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .header("Content-Transfer-Encoding", "binary")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(Files.size(file))
                .body(body);
    }

    @GetMapping("/files/download")
    public ResponseEntity<InputStreamResource> downloadByKey(@RequestParam("fileKey") String fileKey) throws IOException {
        NoticeAttachment a = noticeAttachmentRepository.findAll().stream()
                .filter(x -> fileKey.equals(x.getFileKey())).findFirst().orElseThrow();
        String stored = a.getStoredPath();
        String filename = stored.startsWith("/uploads/") ? stored.substring("/uploads/".length()) : stored;
        Path file = Paths.get("uploads").resolve(filename);
        String contentType = a.getContentType() == null ? Files.probeContentType(file) : a.getContentType();
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        InputStreamResource body = new InputStreamResource(Files.newInputStream(file));
        ContentDisposition cd = ContentDisposition
                .attachment()
                .filename(a.getOriginalName(), java.nio.charset.StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .header("Content-Transfer-Encoding", "binary")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(Files.size(file))
                .body(body);
    }
}