package com.lab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notices")
@Getter
@Setter
@NoArgsConstructor
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @ManyToOne(optional = true)
    @JoinColumn(name = "author_id", nullable = true)
    private Member author;

    @CreationTimestamp
    private Instant createdAt;

    // NOTICE / NEWS / RESOURCE
    @Column(length = 20)
    private String category = "NOTICE";

    @Column(nullable = false)
    private boolean pinned = false;
}

// 공지사항 엔티티입니다. 제목/내용/작성자/작성시각을 포함합니다.

