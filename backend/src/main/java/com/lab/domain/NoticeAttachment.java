package com.lab.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notice_attachments")
@Getter
@Setter
@NoArgsConstructor
public class NoticeAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Notice notice;

    @Column(nullable = false)
    private String storedPath; // e.g. /uploads/abc123.png

    @Column(nullable = false)
    private String originalName; // original filename

    @Column(nullable = false)
    private String contentType; // mime type

    @Column(nullable = false)
    private long sizeBytes;

    @Column(unique = true, length = 64)
    private String fileKey; // download key for /api/files/download?fileKey=

    @CreationTimestamp
    private Instant createdAt;
}


