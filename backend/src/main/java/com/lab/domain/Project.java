package com.lab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String description;

    // 한줄 소개
    @Column(length = 255)
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status = ProjectStatus.ONGOING;

    // 참여 인원(간단 텍스트)
    @Column(length = 200)
    private String members;

    @ManyToOne(optional = true)
    private Member createdBy;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum ProjectStatus {
        PLANNING, ONGOING, COMPLETED, SUSPENDED
    }
}

// 연구 프로젝트 엔티티입니다. 제목/설명/상태/리더/생성일/수정일을 포함합니다.

