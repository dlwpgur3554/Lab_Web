package com.lab.repository;

import com.lab.domain.LabInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LabInfoRepository extends JpaRepository<LabInfo, Long> {
    Optional<LabInfo> findFirstByOrderByUpdatedAtDesc();
}

