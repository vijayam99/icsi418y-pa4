
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
- Show success and error messages
- Confirm before deleting a user story

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

Example `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
```

The backend runs on `http://localhost:5000`.

### Frontend

1. Open the `client` folder.
2. Install dependencies using `npm install`.
3. Start the frontend using `npm run dev`.

On Windows PowerShell, you can use `npm.cmd run dev` if `npm` is blocked by the execution policy.

The frontend runs on `http://localhost:5173`.

Make sure both the backend and frontend are running at the same time.

## User Stories

Each user story includes:

- Title
- Description
- Priority (High, Medium, Low)
- Status (To Do, In Progress, Done)
- Assigned project member (optional)

The description can follow this format:

`As a user, I want to ... so that ...`

New user stories start with the status `To Do`.

Stories can be edited or deleted, and each project has its own backlog.

## Validation

The application checks for invalid inputs and displays error messages when needed.

- Story title and description are required.
- Priority and status must have valid values.
- A story can only be assigned to a member of its project.
- A member cannot be removed while they are assigned to a story.
- Invalid project, user, and story IDs are handled by the backend.
- A confirmation popup appears before deleting a story.

## Test Data Setup

To test the application, prepare at least:

- 3 registered users
- 2 projects
- 5 user stories
- Different priorities, statuses, and assignees

### Step 1: Create Users

Register at least three users using the signup page.

Example usernames:

- `testuser1`
- `testuser2`
- `testuser3`

These are example usernames. You can use different usernames if they already exist in your database.

### Step 2: Create Projects

Create at least two projects.

Example:

**Project 1: Task Manager**

Description: A project for managing daily tasks.

**Project 2: Student Portal**

Description: A project for managing student information.

### Step 3: Add Project Members

Add registered users to the projects using the project member section.

For example:

- Add `testuser2` to Task Manager.
- Add `testuser3` to Task Manager.
- Add `testuser2` to Student Portal.

### Step 4: Create User Stories

Create at least five user stories across the two projects.

Example test stories:

| Project | Story Title | Priority | Status | Assignee |
|---|---|---|---|---|
| Task Manager | Create Task | High | To Do | testuser2 |
| Task Manager | Edit Task | Medium | In Progress | testuser3 |
| Task Manager | Delete Task | Low | Done | Unassigned |
| Student Portal | View Profile | High | In Progress | testuser2 |
| Student Portal | Update Profile | Medium | To Do | Unassigned |

Example description:

`As a user, I want to create a task so that I can organize my work.`

You can create different stories as long as there are at least five with different priorities, statuses, and assignees.

## How to Test

### Create a Story

1. Select a project.
2. Enter the story title and description.
3. Select a priority.
4. Select an assigned project member or Unassigned.
5. Click the button to create the story.
6. Check that the story appears in the backlog.

### Edit a Story

1. Select a story from the backlog.
2. Click Edit.
3. Change its title, description, priority, status, or assignee.
4. Save the changes.
5. Check that the updated information appears.

### Delete a Story

1. Click Delete on a story.
2. Check that the confirmation popup appears.
3. Click Cancel to keep the story.
4. Click Delete again and confirm.
5. Check that the story is removed.

### Test Project Isolation

1. Select the first project and check its stories.
2. Switch to the second project.
3. Check that only the second project's stories appear.

### Test Member Validation

1. Assign a story to a project member.
2. Try to remove that member from the project.
3. Check that an error message appears.
4. Unassign or reassign the story.
5. Try removing the member again.

### Test Invalid Inputs

1. Try creating a story without a title.
2. Try creating a story without a description.
3. Check that the application shows an error and does not save the invalid story.

## Database

MongoDB is used to store users, projects, project memberships, and user stories.

User stories are saved in the `UserStories` collection.

Each story is connected to its project using a project ID. Assigned users are also stored using their user IDs.

## GitHub

The project source code is available at:

https://github.com/vijayam99/icsi418y-pa4
