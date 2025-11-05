package com.example.Videocall.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/register")
    public String register() {
        return "redirect:/register.html";
    }

    // Chuyển hướng đến login
    @GetMapping("/goToLogin")
    public String redirectToLogin() {
        return "redirect:/login.html";
    }

    // Chuyển hướng đến register
    @GetMapping("/goToRegister")
    public String redirectToRegister() {
        return "redirect:/register.html";
    }
    
    @GetMapping("/index")
    public String index() {
        return "redirect:/index.html";
    }

     @GetMapping("/")
    public String home() {
        return "forward:/home.html";
    }
}