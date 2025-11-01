// src/main/java/com/videocall/controller/HomeController.java
package com.example.Videocall.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}