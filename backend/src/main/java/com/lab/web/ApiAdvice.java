package com.lab.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException;
import org.springframework.web.bind.MissingRequestHeaderException;

import java.util.Map;

@RestControllerAdvice
public class ApiAdvice {
    private static final Logger logger = LoggerFactory.getLogger(ApiAdvice.class);

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurity(SecurityException e) {
        // 보안 예외는 메시지를 그대로 반환 (일반적인 권한 메시지)
        String message = sanitizeMessage(e.getMessage(), "권한이 없습니다.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        String msg = sanitizeMessage(e.getMessage(), "잘못된 요청입니다.");
        
        // 로그인 관련 메시지는 그대로 반환 (일반적인 메시지)
        if (msg != null && msg.contains("로그인 후 이용해주세요")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인 후 이용해주세요."));
        }
        
        // IP 주소 등 민감한 정보 제거
        if (msg != null && msg.contains("현재 IP:")) {
            msg = msg.substring(0, msg.indexOf("현재 IP:")).trim();
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", msg));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleState(IllegalStateException e) {
        String message = sanitizeMessage(e.getMessage(), "요청을 처리할 수 없습니다.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", message));
    }

    @ExceptionHandler({ MaxUploadSizeExceededException.class, FileSizeLimitExceededException.class })
    public ResponseEntity<Map<String, String>> handleUploadLimit(Exception e) {
        // 파일 업로드 제한은 일반 메시지만 반환
        logger.warn("파일 업로드 제한 초과", e);
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("message", "업로드 용량 제한을 초과했습니다. 파일을 줄이거나 개수를 나눠 업로드하세요."));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, String>> handleMissingHeader(MissingRequestHeaderException e) {
        // X-USER 미포함 시 표준 메시지 반환
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "로그인 후 이용해주세요."));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDataAccess(DataAccessException e) {
        // 데이터베이스 예외는 민감한 정보를 숨기고 일반 메시지만 반환
        logger.error("데이터베이스 오류 발생", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        // 모든 예외는 서버 로그에만 상세 정보 기록
        logger.error("예상치 못한 오류 발생", e);
        
        // 클라이언트에는 일반적인 메시지만 반환 (민감한 정보 제거)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    }

    /**
     * 에러 메시지에서 민감한 정보를 제거하고 안전한 메시지만 반환
     * @param message 원본 메시지
     * @param defaultMessage 기본 메시지 (null이거나 민감한 정보가 포함된 경우)
     * @return 안전한 메시지
     */
    private String sanitizeMessage(String message, String defaultMessage) {
        if (message == null || message.trim().isEmpty()) {
            return defaultMessage;
        }
        
        // 민감한 정보 패턴 검사
        String lowerMessage = message.toLowerCase();
        
        // 파일 경로, SQL 쿼리, 스택 트레이스 등 민감한 정보가 포함된 경우
        if (lowerMessage.contains("exception") ||
            lowerMessage.contains("stacktrace") ||
            lowerMessage.contains("at ") ||
            lowerMessage.contains("sql") ||
            lowerMessage.contains("database") ||
            lowerMessage.contains("connection") ||
            message.contains("C:") ||
            message.contains("/") && (message.contains("uploads") || message.contains("tmp")) ||
            message.contains("\\") ||
            message.contains("localhost") ||
            message.contains("127.0.0.1") ||
            message.matches(".*\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}.*")) {
            logger.warn("민감한 정보가 포함된 에러 메시지 감지: {}", message);
            return defaultMessage;
        }
        
        return message;
    }
}

// 공통 예외 응답 형식 처리용 어드바이스입니다.

