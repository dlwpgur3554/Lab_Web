package com.lab.repository;

import com.lab.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {

    @Modifying
    @Query("delete from Event e where e.createdBy.id = :memberId and (e.category = '개인' or lower(e.category) = 'personal')")
    void deletePersonalByMemberId(@Param("memberId") Long memberId);

    @Modifying
    @Query("update Event e set e.createdBy = null where e.createdBy.id = :memberId")
    void clearCreatedBy(@Param("memberId") Long memberId);
}

// 일정 리포지토리입니다.

