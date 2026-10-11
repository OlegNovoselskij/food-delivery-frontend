# 00. Overview

## Product

**Atrium** is an online education platform. Teachers build courses (modules, video lessons, materials, quizzes). Students browse a catalog, enroll, pay, learn along a progress path, take quizzes, leave reviews and receive verifiable certificates. Admins see platform analytics. Everyone gets real-time notifications.

This is a university course project (variant 12, "Online education system") that is built and presented as a production system: real authentication, real file uploads, real-time updates, analytics, documented architecture.

## Roles

| Role | Can do |
|---|---|
| Visitor (no account) | Browse catalog, open course pages and public reviews, verify a certificate by number, register, sign in |
| Student | Everything a visitor can, plus enroll, pay, learn, take quizzes, review, download certificates, get notifications |
| Teacher | Everything a student can, plus create and edit own courses, modules, lessons, videos, materials, quizzes; see analytics of own courses; grade pending free-text answers |
| Admin | Everything, plus platform analytics, categories management, all courses |

A user has exactly one role (`student`, `teacher`, `admin`). Self-registration creates students. Teachers and admins are created in the backend admin panel (`/admin`) or by the seed script; the frontend does not create them.

## What the frontend is

A single-page application (SPA) served as static files. It talks only to the backend REST API under `/api/v1` and one WebSocket. It stores nothing important itself: the backend is the source of truth.

## Out of scope

Server-side rendering, mobile apps, i18n beyond English, payment provider pages (payment is a simulated gateway behind `POST /enrollments/{id}/pay`), anything that needs a backend feature that does not exist (propose it per `09-backend-change-rules.md` only if it is small).

## Quality bar

Treat it as a portfolio piece reviewed by a senior engineer: consistent design, typed end to end, tested, accessible, no leftovers. See `07-quality.md`.
