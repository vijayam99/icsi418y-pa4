# ICSI 418Y - Programming Assignment 4

Full-stack project management application built using React, Node.js, Express, and MongoDB.

## Features

- User signup and login
- Create and manage projects
- Add and remove project members
- Create, edit, and delete user stories
- Assign user stories to project members
- Set story priority (High, Medium, Low)
- Track story status (To Do, In Progress, Done)
- Manage a separate backlog for each project

## Technologies Used

- React and Vite
- Node.js and Express
- MongoDB and Mongoose
- CSS

## How to Run

### Backend

1. Open the `server` folder.
2. Install dependencies using `npm install`.
3. Create a `.env` file with your MongoDB connection string.
4. Start the server using `node server.js`.

The backend runs on `http://localhost:5000`.

### Frontend

1. Open the `client` folder.
2. Install dependencies using `npm install`.
3. Start the frontend using `npm run dev`.

The frontend runs on `http://localhost:5173`.

## User Stories

Each user story includes a title, description, priority, status, and optional assigned project member.

New user stories start with the status `To Do`. Stories can be edited or deleted, and each project has its own backlog.