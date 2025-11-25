package com.lab.repository;

import com.lab.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStatusOrderByCreatedAtDesc(Project.ProjectStatus status);
    List<Project> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Query("update Project p set p.createdBy = null where p.createdBy.id = :memberId")
    void clearCreatedBy(@Param("memberId") Long memberId);
}

