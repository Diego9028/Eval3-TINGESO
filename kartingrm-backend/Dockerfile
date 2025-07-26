FROM openjdk:17
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} kartingrm-backend.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/kartingrm-backend.jar"]