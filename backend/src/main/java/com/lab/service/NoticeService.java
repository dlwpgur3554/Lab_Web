package com.lab.service;

import com.lab.domain.Member;
import com.lab.domain.Notice;
import com.lab.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
 

@Service
@RequiredArgsConstructor
public class NoticeService {
    private final NoticeRepository noticeRepository;

    public Notice create(Member requester, Notice notice) {
        // 누구나 작성 가능
        notice.setAuthor(requester);
        if (notice.getCategory() == null || notice.getCategory().isBlank()) {
            notice.setCategory("NOTICE");
        }
        return noticeRepository.save(notice);
    }

    public List<Notice> list() {
        return noticeRepository.findAll();
    }

    public List<Notice> listByCategory(String category) {
        return noticeRepository.findByCategoryOrderByCreatedAtDesc(category);
    }

    public java.util.Optional<Notice> findById(Long id) { return noticeRepository.findById(id); }

    public Notice update(Member requester, Long id, Notice changes) {
        Notice existing = noticeRepository.findById(id).orElseThrow();
        if (!existing.getAuthor().getId().equals(requester.getId())) {
            throw new SecurityException("작성자만 수정할 수 있습니다.");
        }
        existing.setTitle(changes.getTitle());
        existing.setContent(changes.getContent());
        return noticeRepository.save(existing);
    }

    public void delete(Member requester, Long id) {
        Notice existing = noticeRepository.findById(id).orElseThrow();
        if (!existing.getAuthor().getId().equals(requester.getId())) {
            throw new SecurityException("작성자만 삭제할 수 있습니다.");
        }
        noticeRepository.delete(existing);
    }
}

// 공지사항 생성/목록 서비스입니다.

