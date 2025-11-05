// src/main/resources/static/app.js
let localStream;
let remoteStream;
let peerConnection;
let websocket;
let currentUserId;
let currentRoomId;
let remoteUserId;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusDiv = document.getElementById('statusDiv');
const videoSection = document.getElementById('videoSection');
const usersListDiv = document.getElementById('usersList');
const usersContainer = document.getElementById('usersContainer');

// Cấu hình STUN server (Google's public STUN server)
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

// Hàm tham gia phòng
async function joinRoom() {
    const username = document.getElementById('usernameInput').value.trim();
    const roomId = document.getElementById('roomInput').value.trim();
    
    if (!username || !roomId) {
        alert('Vui lòng nhập tên và ID phòng!');
        return;
    }
    
    currentUserId = username + '_' + Date.now();
    currentRoomId = roomId;
    
    try {
        // Khởi tạo local stream
        await initLocalStream();
        
        // Kết nối WebSocket
        connectWebSocket();
        
        // Hiển thị video section
        videoSection.classList.add('active');
        document.querySelector('.signup-card').style.display = 'none';
        
        updateStatus('Đang kết nối...', 'waiting');
    } catch (error) {
        console.error('Lỗi khi tham gia phòng:', error);
        alert('Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền truy cập.');
    }
}

// Khởi tạo local stream (camera + microphone)
async function initLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        
        localVideo.srcObject = localStream;
        console.log('Local stream initialized');
    } catch (error) {
        console.error('Error accessing media devices:', error);
        throw error;
    }
}

// Kết nối WebSocket tới signaling server
function connectWebSocket() {
    const wsUrl =`wss://overwrought-quyen-postureteric.ngrok-free.dev/signaling`; //`ws://localhost:8080/signaling`;
    websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
        console.log('WebSocket connected');
        
        // Gửi message join room
        sendMessage({
            type: 'join',
            from: currentUserId,
            roomId: currentRoomId
        });
    };
    
    websocket.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        
        await handleSignalingMessage(message);
    };
    
    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('Lỗi kết nối WebSocket', 'waiting');
    };
    
    websocket.onclose = () => {
        console.log('WebSocket disconnected');
        updateStatus('Mất kết nối với server', 'waiting');
    };
}

// Xử lý signaling messages
async function handleSignalingMessage(message) {
    switch (message.type) {
        case 'joined':
            console.log('Joined room successfully');
            updateStatus('Đã vào phòng. Đang chờ người khác...', 'waiting');
            
            // Hiển thị danh sách users
            if (message.data.users) {
                displayUsers(message.data.users);
            }
            break;
            
        case 'user-joined':
            console.log('New user joined:', message.data.userId);
            remoteUserId = message.data.userId;
            updateStatus('Người dùng mới đã tham gia. Đang thiết lập kết nối...', 'waiting');
            
            // Bắt đầu tạo offer
            await createOffer(remoteUserId);
            break;
            
        case 'offer':
            console.log('Received offer from:', message.from);
            remoteUserId = message.from;
            await handleOffer(message);
            break;
            
        case 'answer':
            console.log('Received answer from:', message.from);
            await handleAnswer(message);
            break;
            
        case 'ice-candidate':
            console.log('Received ICE candidate');
            await handleIceCandidate(message);
            break;
            
        case 'user-left':
            console.log('User left:', message.data.userId);
            handleUserLeft();
            break;
    }
}

// Tạo PeerConnection
function createPeerConnection(remoteId) {
    peerConnection = new RTCPeerConnection(configuration);
    
    // Thêm local stream tracks vào peer connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Xử lý remote stream
    peerConnection.ontrack = (event) => {
        console.log('Received remote track');
        if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideo.srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };
    
    // Xử lý ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate');
            sendMessage({
                type: 'ice-candidate',
                from: currentUserId,
                to: remoteId,
                data: { candidate: event.candidate }
            });
        }
    };
    
    // Theo dõi connection state
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
            updateStatus('Đã kết nối!', 'connected');
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
            updateStatus('Mất kết nối với người dùng khác', 'waiting');
        }
    };
    
    // Theo dõi ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
    };
    
    return peerConnection;
}

// Tạo offer
async function createOffer(remoteId) {
    try {
        createPeerConnection(remoteId);
        
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        
        await peerConnection.setLocalDescription(offer);
        
        console.log('Sending offer');
        sendMessage({
            type: 'offer',
            from: currentUserId,
            to: remoteId,
            data: { sdp: offer }
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Xử lý offer
async function handleOffer(message) {
    try {
        createPeerConnection(message.from);
        
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.data.sdp));
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log('Sending answer');
        sendMessage({
            type: 'answer',
            from: currentUserId,
            to: message.from,
            data: { sdp: answer }
        });
    } catch (error) {
        console.error('Error handling offer:', error);
    }
}

// Xử lý answer
async function handleAnswer(message) {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.data.sdp));
        console.log('Remote description set successfully');
    } catch (error) {
        console.error('Error handling answer:', error);
    }
}

// Xử lý ICE candidate
async function handleIceCandidate(message) {
    try {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.data.candidate));
            console.log('ICE candidate added successfully');
        }
    } catch (error) {
        console.error('Error adding ICE candidate:', error);
    }
}

// Xử lý user rời phòng
function handleUserLeft() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
        remoteVideo.srcObject = null;
    }
    remoteUserId = null;
    updateStatus('Người dùng khác đã rời phòng. Đang chờ...', 'waiting');
}

// Gửi message qua WebSocket
function sendMessage(message) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
    }
}

// Hiển thị danh sách users
function displayUsers(users) {
    usersContainer.innerHTML = '';
    
    if (users && users.length > 0) {
        usersListDiv.style.display = 'block';
        users.forEach(userId => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <span>${userId === currentUserId ? userId + ' (Bạn)' : userId}</span>
                ${userId !== currentUserId ? '<span style="color: #28a745;">●</span>' : ''}
            `;
            usersContainer.appendChild(userItem);
        });
    } else {
        usersListDiv.style.display = 'none';
    }
}

// Cập nhật status
function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
}

// Toggle video
function toggleVideo() {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const btn = document.getElementById('toggleVideoBtn');
        btn.textContent = videoTrack.enabled ? 'Tắt Camera' : 'Bật Camera';
        btn.style.background = videoTrack.enabled ? '#ffc107' : '#28a745';
    }
}

// Toggle audio
function toggleAudio() {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const btn = document.getElementById('toggleAudioBtn');
        btn.textContent = audioTrack.enabled ? 'Tắt Mic' : 'Bật Mic';
        btn.style.background = audioTrack.enabled ? '#ffc107' : '#28a745';
    }
}

// Rời phòng
function leaveRoom() {
    if (confirm('Bạn có chắc muốn rời phòng?')) {
        // Gửi message leave
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            sendMessage({
                type: 'leave',
                from: currentUserId,
                roomId: currentRoomId
            });
        }
        
        // Dừng tất cả tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
        }
        
        // Đóng peer connection
        if (peerConnection) {
            peerConnection.close();
        }
        
        // Đóng WebSocket
        if (websocket) {
            websocket.close();
        }
        
        // Reset UI
        videoSection.classList.remove('active');
        document.querySelector('.join-section').style.display = 'block';
        remoteVideo.srcObject = null;
        localVideo.srcObject = null;
        
        // Reset variables
        localStream = null;
        remoteStream = null;
        peerConnection = null;
        websocket = null;
        currentUserId = null;
        currentRoomId = null;
        remoteUserId = null;
    }
}

// Xử lý khi đóng trang
window.addEventListener('beforeunload', () => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        sendMessage({
            type: 'leave',
            from: currentUserId,
            roomId: currentRoomId
        });
    }
});