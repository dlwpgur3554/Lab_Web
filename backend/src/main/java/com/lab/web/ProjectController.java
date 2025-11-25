package com.lab.web;

import com.lab.domain.Project;
import com.lab.domain.Member;
import com.lab.service.AuthService;
import com.lab.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;
    private final AuthService authService;

    @GetMapping
    public org.springframework.data.domain.Page<Project> getAllProjects(@RequestParam(value = "page", defaultValue = "0") int page,
                                                                       @RequestParam(value = "size", defaultValue = "10") int size) {
        return projectService.getAllProjectsPaged(page, size);
    }

    @GetMapping("/{id}")
    public Project getOne(@PathVariable("id") Long id) {
        return projectService.getById(id);
    }

    @GetMapping("/status/{status}")
    public List<Project> getProjectsByStatus(@PathVariable Project.ProjectStatus status) {
        return projectService.getProjectsByStatus(status);
    }

    @PostMapping
    public Project createProject(@RequestHeader(value = "X-USER", required = false) String requester,
                                 @RequestBody CreateProjectRequest request) {
        Member me = authService.getRequester(requester);
        return projectService.createProject(me, request.title(), request.summary(), request.description(), request.status(), request.members());
    }

    @PutMapping("/{id}/status")
    public Project updateProjectStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        return projectService.updateProjectStatus(id, request.status());
    }

    @PutMapping("/{id}")
    public Project updateProject(@RequestHeader(value = "X-USER", required = false) String requester,
                                 @PathVariable("id") Long id,
                                 @RequestBody CreateProjectRequest request) {
        Member me = authService.getRequester(requester);
        return projectService.updateProject(me, id, request.title(), request.summary(), request.description(), request.status(), request.members());
    }

    @DeleteMapping("/{id}")
    public void deleteProject(@RequestHeader(value = "X-USER", required = false) String requester,
                              @PathVariable("id") Long id) {
        Member me = authService.getRequester(requester);
        projectService.deleteProject(me, id);
    }

    public record CreateProjectRequest(
            String title,
            String summary,
            String description,
            Project.ProjectStatus status,
            String leaderName,
            String members
    ) {}

    public record UpdateStatusRequest(Project.ProjectStatus status) {}
}

