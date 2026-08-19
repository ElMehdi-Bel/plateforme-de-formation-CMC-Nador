package com.cmc.app.controller;

import com.cmc.app.dto.request.NotificationRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.PageResponse;
import com.cmc.app.entity.Notification;
import com.cmc.app.entity.User;
import com.cmc.app.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Notification>> send(
            @Valid @RequestBody NotificationRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.envoyerParRequest(request, admin)));
    }

    @GetMapping("/mes-notifications")
    public ResponseEntity<ApiResponse<PageResponse<Notification>>> mesNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Notification> result = notificationService.findForUser(user.getId(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.<Notification>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build()));
    }

    @GetMapping("/non-lues/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countNonLues(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("count", notificationService.countNonLues(user.getId()))));
    }

    @PatchMapping("/{id}/lire")
    public ResponseEntity<ApiResponse<Void>> marquerLue(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        notificationService.marquerLue(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marquée comme lue", null));
    }

    @PatchMapping("/tout-lire")
    public ResponseEntity<ApiResponse<Void>> toutLire(@AuthenticationPrincipal User user) {
        notificationService.marquerToutesLues(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Toutes les notifications marquées comme lues", null));
    }
}
