// src/main/java/com/videocall/model/SignalMessage.java
package com.example.Videocall.model;

import com.google.gson.JsonObject;

public class SignalMessage {
    private String type;
    private String from;
    private String to;
    private JsonObject data;
    private String roomId;
    
    // Constructor
    public SignalMessage() {}
    
    public SignalMessage(String type, String from, String to, JsonObject data) {
        this.type = type;
        this.from = from;
        this.to = to;
        this.data = data;
    }
    
    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    
    public JsonObject getData() { return data; }
    public void setData(JsonObject data) { this.data = data; }
    
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
}