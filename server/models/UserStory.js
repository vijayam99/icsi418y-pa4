
const mongoose = require("mongoose");

const userStorySchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    immutable: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    required: true
  },

  status: {
    type: String,
    enum: ["To Do", "In Progress", "Done"],
    default: "To Do",
    required: true
  },

  assigned_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
});

module.exports = mongoose.model(
  "UserStory",
  userStorySchema,
  "UserStories"
);
