
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Project = require("./models/Project");
const ProjectMembership = require("./models/ProjectMembership");
const UserStory = require("./models/UserStory");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// CONNECT TO MONGODB

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });

// CHECK SERVER

app.get("/", (req, res) => {
  res.send("Server is working");
});

// SIGNUP

app.post("/signup", async (req, res) => {
  try {
    const { f_name, l_name, username, password } = req.body;

    if (!f_name || !l_name || !username || !password) {
      return res.status(400).json({
        message: "Please fill in all fields"
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    const newUser = new User({
      f_name,
      l_name,
      username,
      password
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// LOGIN

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Please fill in all fields"
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "Username does not exist"
      });
    }

    if (user.password !== password) {
      return res.status(400).json({
        message: "Incorrect password"
      });
    }

    res.status(200).json({
      message: "Login successful"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// GET USERS

app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select(
      "_id f_name l_name username"
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users"
    });
  }
});

// CREATE PROJECT

app.post("/projects", async (req, res) => {
  try {
    const { name, description, status, project_lead_id } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !["Planning", "Active", "Completed"].includes(status) ||
      !project_lead_id
    ) {
      return res.status(400).json({
        message: "Please provide all required project information"
      });
    }

    if (!mongoose.isValidObjectId(project_lead_id)) {
      return res.status(400).json({
        message: "Invalid Project Lead ID"
      });
    }

    const lead = await User.findById(project_lead_id);

    if (!lead) {
      return res.status(404).json({
        message: "Project Lead not found"
      });
    }

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      status,
      project_lead_id: lead._id
    });

    await project.save();

    try {
      await ProjectMembership.create({
        project_id: project._id,
        user_id: lead._id
      });
    } catch (error) {
      await Project.findByIdAndDelete(project._id);
      throw error;
    }

    res.status(201).json({
      message: "Project created successfully",
      project
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error creating project"
    });
  }
});

// VIEW PROJECTS

app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().populate(
      "project_lead_id",
      "f_name l_name username"
    );

    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching projects"
    });
  }
});

// VIEW PROJECT MEMBERS

app.get("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const members = await ProjectMembership.find({
      project_id: projectId
    }).populate("user_id", "f_name l_name username");

    res.json(members);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching project members"
    });
  }
});

// ADD PROJECT MEMBER

app.post("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { user_id } = req.body;

    if (
      !mongoose.isValidObjectId(projectId) ||
      !mongoose.isValidObjectId(user_id)
    ) {
      return res.status(400).json({
        message: "Invalid project or user ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const existingMembership = await ProjectMembership.findOne({
      project_id: projectId,
      user_id
    });

    if (existingMembership) {
      return res.status(400).json({
        message: "User is already a member of this project"
      });
    }

    const membership = new ProjectMembership({
      project_id: projectId,
      user_id
    });

    await membership.save();

    res.status(201).json({
      message: "Member added successfully",
      membership
    });
  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "User is already a member of this project"
      });
    }

    res.status(500).json({
      message: "Error adding member"
    });
  }
});

// REMOVE PROJECT MEMBER

app.delete("/projects/:projectId/members/:userId", async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    if (
      !mongoose.isValidObjectId(projectId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({
        message: "Invalid project or user ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (String(project.project_lead_id) === String(userId)) {
      return res.status(400).json({
        message: "Project Lead cannot be removed"
      });
    }

    // PA4: Do not remove members with assigned stories
    const assignedStory = await UserStory.findOne({
      project_id: projectId,
      assigned_user_id: userId
    });

    if (assignedStory) {
      return res.status(400).json({
        message: "Cannot remove member with assigned user stories"
      });
    }

    const membership = await ProjectMembership.findOneAndDelete({
      project_id: projectId,
      user_id: userId
    });

    if (!membership) {
      return res.status(404).json({
        message: "User is not a member of this project"
      });
    }

    res.json({
      message: "Member removed successfully"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error removing member"
    });
  }
});

// CREATE USER STORY - PA4

app.post("/projects/:projectId/stories", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, assigned_user_id } = req.body;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        message: "Title and description are required"
      });
    }

    if (!["High", "Medium", "Low"].includes(priority)) {
      return res.status(400).json({
        message: "Priority must be High, Medium, or Low"
      });
    }

    let assignedUserId = null;

    if (
      assigned_user_id !== undefined &&
      assigned_user_id !== null &&
      assigned_user_id !== ""
    ) {
      if (!mongoose.isValidObjectId(assigned_user_id)) {
        return res.status(400).json({
          message: "Invalid assigned user ID"
        });
      }

      const membership = await ProjectMembership.findOne({
        project_id: projectId,
        user_id: assigned_user_id
      });

      const isLead =
        String(project.project_lead_id) === String(assigned_user_id);

      if (!membership && !isLead) {
        return res.status(400).json({
          message: "Assigned user must belong to this project"
        });
      }

      assignedUserId = assigned_user_id;
    }

    // Every new story starts with To Do
    const story = await UserStory.create({
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "To Do",
      assigned_user_id: assignedUserId
    });

    res.status(201).json({
      message: "User story created successfully",
      story
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error creating user story"
    });
  }
});

 // GET USER STORIES FOR A PROJECT

app.get("/projects/:projectId/stories", async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const stories = await UserStory.find({
      project_id: projectId
    })
      .populate("assigned_user_id", "f_name l_name username")
      .sort({ _id: -1 });

    res.json(stories);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching user stories"
    });
  }
});

 // UPDATE USER STORY - PA4

app.put("/projects/:projectId/stories/:storyId", async (req, res) => {
  try {
    const { projectId, storyId } = req.params;

    if (
      !mongoose.isValidObjectId(projectId) ||
      !mongoose.isValidObjectId(storyId)
    ) {
      return res.status(400).json({
        message: "Invalid project or story ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const story = await UserStory.findOne({
      _id: storyId,
      project_id: projectId
    });

    if (!story) {
      return res.status(404).json({
        message: "User story not found in this project"
      });
    }

    const allowedFields = [
      "title",
      "description",
      "priority",
      "status",
      "assigned_user_id"
    ];

    // Do not allow changing the project or other fields
    for (const field of Object.keys(req.body)) {
      if (!allowedFields.includes(field)) {
        return res.status(400).json({
          message: `Cannot update field: ${field}`
        });
      }
    }

    const { title, description, priority, status, assigned_user_id } =
      req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Title cannot be empty"
        });
      }
      story.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          message: "Description cannot be empty"
        });
      }
      story.description = description.trim();
    }

    if (priority !== undefined) {
      if (!["High", "Medium", "Low"].includes(priority)) {
        return res.status(400).json({
          message: "Invalid priority"
        });
      }
      story.priority = priority;
    }

    if (status !== undefined) {
      if (!["To Do", "In Progress", "Done"].includes(status)) {
        return res.status(400).json({
          message: "Invalid status"
        });
      }
      story.status = status;
    }

    if (assigned_user_id !== undefined) {
      if (assigned_user_id === null || assigned_user_id === "") {
        story.assigned_user_id = null;
      } else {
        if (!mongoose.isValidObjectId(assigned_user_id)) {
          return res.status(400).json({
            message: "Invalid assigned user ID"
          });
        }

        const membership = await ProjectMembership.findOne({
          project_id: projectId,
          user_id: assigned_user_id
        });

        const isLead =
          String(project.project_lead_id) === String(assigned_user_id);

        if (!membership && !isLead) {
          return res.status(400).json({
            message: "Assigned user must belong to this project"
          });
        }

        story.assigned_user_id = assigned_user_id;
      }
    }

    await story.save();

    await story.populate(
      "assigned_user_id",
      "f_name l_name username"
    );

    res.json({
      message: "User story updated successfully",
      story
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error updating user story"
    });
  }
});


// START SERVER

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


 // DELETE USER STORY - PA4

app.delete("/projects/:projectId/stories/:storyId", async (req, res) => {
  try {
    const { projectId, storyId } = req.params;

    if (
      !mongoose.isValidObjectId(projectId) ||
      !mongoose.isValidObjectId(storyId)
    ) {
      return res.status(400).json({
        message: "Invalid project or story ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const deletedStory = await UserStory.findOneAndDelete({
      _id: storyId,
      project_id: projectId
    });

    if (!deletedStory) {
      return res.status(404).json({
        message: "User story not found in this project"
      });
    }

    res.json({
      message: "User story deleted successfully"
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error deleting user story"
    });
  }
});
