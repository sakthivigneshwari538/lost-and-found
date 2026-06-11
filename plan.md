Lost and Found Portal for Colleges

Problem: Lost items are announced in random groups.

Features:

Post lost item
Post found item
Image upload
Search by category
Claim verification

## Main Features Needed

### 1. Authentication

Students/staff should login.

Features:

* Register
* Login
* JWT authentication
* College email verification
* Role: student, admin

---

### 2. Post Lost Item

User can post an item they lost.

Fields:

* Item name
* Category
* Description
* Lost location
* Lost date
* Image
* Contact option

Example:

> Lost: Black wallet near library

---

### 3. Post Found Item

User can post an item they found.

Fields:

* Item name
* Category
* Description
* Found location
* Found date
* Image
* Where the item is kept

Example:

> Found: ID card near canteen

---

### 4. Image Upload

Users can upload item images.

You can store images using:

* Local folder for beginner version
* Cloudinary for better resume version

---

### 5. Search and Filter

Users can search items easily.

Filters:

* Lost / Found
* Category
* Location
* Date
* Keyword search

Categories:

* ID Card
* Phone
* Bag
* Books
* Keys
* Wallet
* Electronics
* Others

---

### 6. Claim Verification

Very important feature.

When someone claims a found item, ask verification questions.

Example:

* What color is the item?
* What is written on it?
* Where did you lose it?
* Upload proof image if needed

Then:

* Finder/admin can approve or reject claim.

---

## Project Phases

## Phase 1 — Basic Setup

Goal: Create project structure.

Frontend:

* React
* React Router
* Tailwind CSS

Backend:

* FastAPI
* PostgreSQL
* SQLAlchemy
* JWT Auth

Pages:

* Home
* Login
* Register
* Lost Items
* Found Items

---

## Phase 2 — Authentication

Goal: User login system.

Build:

* Register API
* Login API
* Password hashing
* JWT token
* Protected routes

---

## Phase 3 — Lost and Found Posts

Goal: Users can create posts.

Build:

* Add lost item form
* Add found item form
* Store item data in database
* Display all items

---

## Phase 4 — Image Upload

Goal: Upload item image.

Build:

* Upload image from form
* Save image URL
* Display image in item card

---

## Phase 5 — Search and Filter

Goal: Easy item finding.

Build:

* Search bar
* Category filter
* Lost/found filter
* Location filter

---

## Phase 6 — Claim System

Goal: Owner can claim item.

Build:

* Claim button
* Claim form
* Verification answer
* Claim status: pending, approved, rejected

---

## Phase 7 — Admin Panel

Goal: Admin control.

Build:

* Admin dashboard
* View claims
* Approve/reject claims
* Delete posts
* Mark returned

---

## Best Resume Version Feature

Add this:

### Smart Match Suggestion

When a lost item and found item are similar, show possible matches.

Example:

> Lost: Black wallet near library
> Found: Black wallet near library

System suggests:

> Possible match found.

This will make your project stand out.

## Final Tech Stack

Frontend:

* React.js
* Tailwind CSS
* React Router
* Axios

Backend:

* FastAPI
* PostgreSQL
* SQLAlchemy
* JWT Authentication

Extra:

* Cloudinary for images
* Email notification using SMTP
