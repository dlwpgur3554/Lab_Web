package com.lab.web;

import com.lab.domain.Event;
import com.lab.domain.Member;
import com.lab.service.AuthService;
import com.lab.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;
    private final AuthService authService;

    @GetMapping
    public List<Event> list(@RequestHeader(value = "X-USER", required = false) String requester) {
        if (requester == null || requester.isBlank()) {
            return eventService.listPublic();
        }
        Member requesterMember = authService.getRequester(requester);
        return eventService.listFor(requesterMember);
    }

    @PostMapping
    public Event create(@RequestHeader("X-USER") String requester,
                        @Valid @RequestBody Event event) {
        Member requesterMember = authService.getRequester(requester);
        return eventService.create(requesterMember, event);
    }

    @PutMapping("/{id}")
    public Event update(@RequestHeader("X-USER") String requester,
                        @PathVariable("id") Long id,
                        @Valid @RequestBody Event event) {
        Member requesterMember = authService.getRequester(requester);
        return eventService.update(requesterMember, id, event);
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestHeader("X-USER") String requester,
                       @PathVariable("id") Long id) {
        Member requesterMember = authService.getRequester(requester);
        eventService.delete(requesterMember, id);
    }
}

// 일정 API 컨트롤러입니다. MVP에서는 모든 구성원이 작성 가능합니다.

