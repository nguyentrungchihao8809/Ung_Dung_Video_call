// src/main/java/com/videocall/model/User.java
package com.example.Videocall.model;

import org.springframework.web.socket.WebSocketSession;

public class User {
    private String userId;
    private String roomId;
    private WebSocketSession session;
    
    public User(String userId, WebSocketSession session) {
        this.userId = userId;
        this.session = session;
    }
    
    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    
    public WebSocketSession getSession() { return session; }
    public void setSession(WebSocketSession session) { this.session = session; }
}