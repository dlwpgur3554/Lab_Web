package com.lab.service;

import com.lab.domain.Event;
import com.lab.domain.Member;
import com.lab.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;

    public Event create(Member requester, Event event) {
        event.setCreatedBy(requester);
        // 카테고리 정규화: 'Personal' -> '개인'
        if ("Personal".equalsIgnoreCase(String.valueOf(event.getCategory()))) {
            event.setCategory("개인");
        }
        return eventRepository.save(event);
    }

    public List<Event> list() {
        return eventRepository.findAll();
    }

    public Optional<Event> findById(Long id) { return eventRepository.findById(id); }

    public List<Event> listFor(Member requester) {
        return eventRepository.findAll().stream()
                .filter(e -> {
                    String cat = String.valueOf(e.getCategory());
                    boolean isPersonal = "개인".equals(cat) || "personal".equalsIgnoreCase(cat) || "Personal".equalsIgnoreCase(cat);
                    if (!isPersonal) return true;
                    return e.getCreatedBy() != null && e.getCreatedBy().getId().equals(requester.getId());
                })
                .toList();
    }

    public List<Event> listPublic() {
        return eventRepository.findAll().stream()
                .filter(e -> {
                    String cat = String.valueOf(e.getCategory());
                    return !("개인".equals(cat) || "personal".equalsIgnoreCase(cat) || "Personal".equalsIgnoreCase(cat));
                })
                .toList();
    }

    public Event update(Member requester, Long id, Event changes) {
        Event existing = eventRepository.findById(id).orElseThrow();
        // 개인 카테고리면 작성자 본인만 수정
        String cat = String.valueOf(existing.getCategory());
        boolean isPersonal = "개인".equals(cat) || "Personal".equalsIgnoreCase(cat);
        if (isPersonal && !existing.getCreatedBy().getId().equals(requester.getId())) {
            throw new SecurityException("본인 일정만 수정할 수 있습니다.");
        }
        existing.setTitle(changes.getTitle());
        existing.setStartAt(changes.getStartAt());
        existing.setEndAt(changes.getEndAt());
        String newCat = String.valueOf(changes.getCategory());
        if ("Personal".equalsIgnoreCase(newCat)) newCat = "개인";
        existing.setCategory(newCat);
        return eventRepository.save(existing);
    }

    public void delete(Member requester, Long id) {
        Event existing = eventRepository.findById(id).orElseThrow();
        String cat = String.valueOf(existing.getCategory());
        boolean isPersonal = "개인".equals(cat) || "Personal".equalsIgnoreCase(cat);
        if (isPersonal && !existing.getCreatedBy().getId().equals(requester.getId())) {
            throw new SecurityException("본인 일정만 삭제할 수 있습니다.");
        }
        eventRepository.delete(existing);
    }
}

// 일정 생성/목록 서비스입니다. MVP에서는 구성원 모두 작성 가능하도록 둡니다.

