# RideFlow - Full Stack Ride Booking Platform
A full-stack ride-booking platform with customer, driver and admin portals.
## Run
```
npm install
npm start          # http://localhost:3000
```
## Features
- REST APIs built with Node.js + Express.js for auth, booking and ride management
- Secure role-based authentication (customer / driver / admin) with hashed passwords and token sessions
- Ride lifecycle: request -> driver accepts -> tracked in the system
- Admin dashboard API: total users, rides and revenue
- Data layer structured as document collections (users, rides) - production version connects to MongoDB Atlas via Mongoose
## Tech
Node.js, Express.js, REST APIs, JavaScript, JSON, HTML/CSS
