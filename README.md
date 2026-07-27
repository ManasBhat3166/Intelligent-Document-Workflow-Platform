# Intelligent Document Workflow Platform

Enterprise AI-powered Document Processing Platform built using Java, Spring Boot, React, MongoDB, Kafka, OCR, Vector Search, and Large Language Models.

---

## Overview

The Intelligent Document Workflow Platform automates document processing for enterprises.

Users upload documents such as:

- Contracts
- Invoices
- Resumes
- Reports
- Legal Documents

The system automatically:

✔ Uploads files

✔ Extracts text

✔ Detects document type

✔ Extracts entities

✔ Generates AI summaries

✔ Creates embeddings

✔ Performs semantic search

✔ Routes documents through approval workflow

✔ Sends notifications

✔ Tracks processing in real-time

---

## Architecture

Frontend

React

↓

API Gateway

↓

Authentication Service

↓

Document Service

↓

Kafka

↓

OCR Service

↓

AI Service

↓

Vector Database

↓

MongoDB

↓

Notification Service

---

## Tech Stack

Backend

- Java 21
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data MongoDB
- Spring Cloud Gateway
- Spring Validation
- Spring WebSocket

Frontend

- React
- Material UI
- Axios
- React Router

Database

- MongoDB

Messaging

- Apache Kafka

Storage

- Azure Blob Storage
- Local Storage

AI

- OpenAI
- Ollama

OCR

- Tesseract OCR

Vector Search

- Qdrant

DevOps

- Docker
- Docker Compose
- GitHub Actions

Testing

- JUnit
- Mockito
- Testcontainers

---

## Features

- User Authentication
- JWT
- RBAC
- Upload PDFs
- OCR
- AI Summary
- Entity Extraction
- Resume Parser
- Invoice Parser
- Contract Analyzer
- Semantic Search
- Real-time Processing
- Approval Workflow
- Notifications
- Analytics Dashboard

---

## Folder Structure

backend/

frontend/

docker/

docs/

architecture/

screenshots/

---

## API Modules

Authentication

User Management

Document Upload

OCR

AI

Workflow

Notifications

Search

Analytics

---

## Event Driven Pipeline

Upload Document

↓

Kafka Producer

↓

OCR Consumer

↓

AI Consumer

↓

Embedding Generator

↓

Vector Database

↓

Notification Service

---

## Screenshots

Login

Dashboard

Upload

Workflow

Analytics

Search

---

## Installation

Clone Repository

Run Docker

Start MongoDB

Start Kafka

Run Backend

Run Frontend

---

## Future Improvements

- Kubernetes Deployment

- AWS Deployment

- Azure Deployment

- CI/CD

- Multi-tenancy

- AI Agent Integration

---

## System Design

Microservices

Event Driven Architecture

CQRS Ready

Clean Architecture

SOLID Principles

REST APIs

JWT Authentication

RBAC

---

## License

MIT
