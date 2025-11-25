package com.lab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Instant startAt;

    @Column(nullable = false)
    private Instant endAt;

    @ManyToOne(optional = true)
    @JoinColumn(name = "created_by_id", nullable = true)
    private Member createdBy;

    // Laboratory or 개인
    @Column(length = 32)
    private String category;
}

// 캘린더 일정 엔티티입니다. 제목/시작/종료/작성자를 포함합니다.

