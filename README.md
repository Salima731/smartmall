# Smart Mall System for Real-Time Services

A full-stack MERN application designed to enhance mall experiences through real-time services like smart parking, virtual queues, and global product search.

## Tech Stack
- **Frontend:** React + Vite, Redux Toolkit, RTK Query, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express.js, MongoDB, JWT
- **Icons:** Lucide React

## Features
1. **User Authentication:** Role-based access (Super Admin, Mall Admin, Shop Owner, Staff, User).
2. **Mall Management:** Search malls by name/district and detect nearby malls using geolocation.
3. **Global Search:** Find products, shops, and offers across multiple malls instantly.
4. **Smart Parking:** Real-time slot availability and entry/exit tracking.
5. **Queue Management:** Join virtual queues for food courts and billing to save time.
6. **Smart Restroom:** Real-time cleanliness and availability status updates.
7. **Role Dashboards:** Tailored interfaces for different user roles.

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally (default: `mongodb://localhost:27017/smartmall`)

### Backend Setup
1. Open a terminal in the `backend` folder.
2. Install dependencies: `npm install`
3. Seed the database (optional): `npm run seed`
4. Start the server: `npm run dev`

### Frontend Setup
1. Open a terminal in the `frontend` folder.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Demo Accounts
- **Super Admin:** `admin@example.com` / `password123`
- **Mall Admin:** `mall@example.com` / `password123`
- **Shop Owner:** `shop@example.com` / `password123`
- **Staff:** `staff@example.com` / `password123`
- **Regular User:** `user@example.com` / `password123`
