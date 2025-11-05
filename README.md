Hướng dẫn run/public server videocall

Bước 1: Copy Your Authtoken: ngrok config add-authtoken $YOUR_AUTHTOKEN

Bước 2: Chạy ngrok config add-authtoken $YOUR_AUTHTOKEN

Bước 3: Run server

Bước 4: Run ngrok http your port

Bước 5: Thay port trong .js (để ngrok hỗ trợ socket) : ws://localhost:8080/signaling -> wss://overwrought-quyen-postureteric.ngrok-free.dev/signaling

Bước 6: Run spring boot

Bước 7: Truy cập link từ bước 4
