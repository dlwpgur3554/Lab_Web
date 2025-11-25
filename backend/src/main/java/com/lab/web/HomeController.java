package com.lab.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {
    
    @GetMapping("/")
    public String home() {
        return "실감 멀티미디어 연구실 API 서버가 실행 중입니다!<br>" +
               "<a href='/swagger-ui/index.html'>API 문서 보기</a><br>" +
               "<a href='http://localhost:5173'>프론트엔드로 이동</a>";
    }
}

