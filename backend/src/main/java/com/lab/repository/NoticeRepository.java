package com.lab.repository;

import com.lab.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByCategoryOrderByCreatedAtDesc(String category);
    Page<Notice> findByCategoryOrderByCreatedAtDesc(String category, Pageable pageable);
    Page<Notice> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Notice> findTop5ByCategoryAndPinnedIsTrueOrderByCreatedAtDesc(String category);

    List<Notice> findByAuthor_Id(Long authorId);

    @Modifying
    @Query("update Notice n set n.author = null where n.author.id = :authorId")
    void clearAuthorByAuthorId(@Param("authorId") Long authorId);
}

// 공지사항 리포지토리입니다.

