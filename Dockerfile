# Dùng JDK 21 làm môi trường build
FROM eclipse-temurin:21-jdk AS build

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy toàn bộ source code vào container
COPY . .

# Build file JAR (sử dụng Maven Wrapper hoặc Maven)
RUN ./mvnw clean package -DskipTests || mvn clean package -DskipTests

# Giai đoạn chạy ứng dụng
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copy file JAR từ stage build sang
COPY --from=build /app/target/*.jar app.jar

# Mở cổng 8089 (trùng với docker-compose)
EXPOSE 8089

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]
