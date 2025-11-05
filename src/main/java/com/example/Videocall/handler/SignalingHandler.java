// src/main/java/com/example/Videocall/handler/SignalingHandler.java
package com.example.Videocall.handler;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.example.Videocall.model.SignalMessage;
import com.example.Videocall.model.User;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SignalingHandler extends TextWebSocketHandler {
    
    private final Gson gson = new Gson();
    
    // Lưu trữ các user đang online
    private final Map<String, User> users = new ConcurrentHashMap<>();
    
    // Lưu trữ các room và users trong room
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("New connection: " + session.getId());
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            SignalMessage signalMessage = gson.fromJson(payload, SignalMessage.class);
            
            System.out.println("Received message type: " + signalMessage.getType());
            
            switch (signalMessage.getType()) {
                case "join":
                    handleJoin(session, signalMessage);
                    break;
                case "offer":
                    handleOffer(signalMessage);
                    break;
                case "answer":
                    handleAnswer(signalMessage);
                    break;
                case "ice-candidate":
                    handleIceCandidate(signalMessage);
                    break;
                case "leave":
                    handleLeave(session, signalMessage);
                    break;
                default:
                    System.out.println("Unknown message type: " + signalMessage.getType());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private void handleJoin(WebSocketSession session, SignalMessage message) throws IOException {
        String userId = message.getFrom();
        String roomId = message.getRoomId();
        
        // Tạo user mới
        User user = new User(userId, session);
        user.setRoomId(roomId);
        users.put(userId, user);
        
        // LẤY DANH SÁCH USER HIỆN TẠI TRONG PHÒNG TRƯỚC KHI THÊM USER MỚI
        Set<String> existingUsers = rooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet());
        List<String> existingUsersList = new ArrayList<>(existingUsers);
        
        // THÊM USER MỚI VÀO ROOM
        existingUsers.add(userId);
        
        // GỬI DANH SÁCH USER CŨ CHO USER MỚI (KHÔNG BAO GỒM CHÍNH NÓ)
        JsonObject data = new JsonObject();
        data.add("users", gson.toJsonTree(existingUsersList)); // Chỉ gửi user cũ
        
        SignalMessage response = new SignalMessage("joined", "server", userId, data);
        sendMessage(session, response);
        
        // THÔNG BÁO CHO TẤT CẢ USER CŨ VÀ USER MỚI BIẾT CÓ NGƯỜI MỚI JOIN
        if (!existingUsersList.isEmpty()) {
            notifyRoomUsers(roomId, userId, "user-joined");
        }
        
        System.out.println("User " + userId + " joined room " + roomId + ". Existing users: " + existingUsersList);
    }
    
    private void handleOffer(SignalMessage message) throws IOException {
        String targetUserId = message.getTo();
        User targetUser = users.get(targetUserId);
        
        if (targetUser != null) {
            sendMessage(targetUser.getSession(), message);
            System.out.println("Forwarded offer from " + message.getFrom() + " to " + targetUserId);
        } else {
            System.out.println("Target user not found: " + targetUserId);
        }
    }
    
    private void handleAnswer(SignalMessage message) throws IOException {
        String targetUserId = message.getTo();
        User targetUser = users.get(targetUserId);
        
        if (targetUser != null) {
            sendMessage(targetUser.getSession(), message);
            System.out.println("Forwarded answer from " + message.getFrom() + " to " + targetUserId);
        } else {
            System.out.println("Target user not found: " + targetUserId);
        }
    }
    
    private void handleIceCandidate(SignalMessage message) throws IOException {
        String targetUserId = message.getTo();
        User targetUser = users.get(targetUserId);
        
        if (targetUser != null) {
            sendMessage(targetUser.getSession(), message);
            System.out.println("Forwarded ICE candidate from " + message.getFrom() + " to " + targetUserId);
        } else {
            System.out.println("Target user not found: " + targetUserId);
        }
    }
    
    private void handleLeave(WebSocketSession session, SignalMessage message) {
        String userId = message.getFrom();
        removeUser(userId);
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // Tìm và xóa user
        users.values().stream()
            .filter(user -> user.getSession().getId().equals(session.getId()))
            .findFirst()
            .ifPresent(user -> removeUser(user.getUserId()));
        
        System.out.println("Connection closed: " + session.getId());
    }
    
    private void removeUser(String userId) {
        User user = users.remove(userId);
        if (user != null && user.getRoomId() != null) {
            String roomId = user.getRoomId();
            Set<String> roomUsers = rooms.get(roomId);
            if (roomUsers != null) {
                roomUsers.remove(userId);
                if (roomUsers.isEmpty()) {
                    rooms.remove(roomId);
                } else {
                    notifyRoomUsers(roomId, userId, "user-left");
                }
            }
            System.out.println("User " + userId + " left room " + roomId);
        }
    }
    
    private void notifyRoomUsers(String roomId, String excludeUserId, String eventType) {
        Set<String> roomUsers = rooms.get(roomId);
        if (roomUsers != null) {
            JsonObject data = new JsonObject();
            data.addProperty("userId", excludeUserId);
            
            SignalMessage notification = new SignalMessage(eventType, "server", null, data);
            
            roomUsers.stream()
                .filter(id -> !id.equals(excludeUserId))
                .forEach(id -> {
                    User user = users.get(id);
                    if (user != null) {
                        try {
                            sendMessage(user.getSession(), notification);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                });
        }
    }
    
    private void sendMessage(WebSocketSession session, SignalMessage message) throws IOException {
        if (session.isOpen()) {
            String json = gson.toJson(message);
            session.sendMessage(new TextMessage(json));
            System.out.println("Sent message: " + json);
        }
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        System.err.println("Transport error: " + exception.getMessage());
    }
}