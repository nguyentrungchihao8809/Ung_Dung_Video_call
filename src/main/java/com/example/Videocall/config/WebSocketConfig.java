// src/main/java/com/videocall/config/WebSocketConfig.java
package com.example.Videocall.config;

import com.example.Videocall.handler.SignalingHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    private final SignalingHandler signalingHandler;
    
    public WebSocketConfig(SignalingHandler signalingHandler) {
        this.signalingHandler = signalingHandler;
    }
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalingHandler, "/signaling")
                .setAllowedOrigins("*");
    }
}