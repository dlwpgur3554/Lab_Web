package com.lab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "lab_info")
@Getter
@Setter
@NoArgsConstructor
public class LabInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String labName;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String description;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String researchAreas;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String facilities;

    @Column(nullable = false)
    private String location;

    private String contactEmail;
    private String contactPhone;

    @ManyToOne
    private Member director;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}

// 실험실 정보 엔티티입니다. 실험실명/설명/연구분야/시설/위치/연락처/실험실장/생성일/수정일을 포함합니다.

