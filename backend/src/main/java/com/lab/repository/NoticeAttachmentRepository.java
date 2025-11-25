package com.lab.repository;

import com.lab.domain.Notice;
import com.lab.domain.NoticeAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeAttachmentRepository extends JpaRepository<NoticeAttachment, Long> {
    List<NoticeAttachment> findByNotice(Notice notice);
    void deleteByNotice(Notice notice);
}


