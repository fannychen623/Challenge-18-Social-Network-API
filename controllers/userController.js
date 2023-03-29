const { ObjectId } = require('mongoose').Types;
const { User, Thought } = require('../models');

// Combine the thoughts to users
const getThoughts = async (userId) =>
  User.aggregate([
    // only include the given student by using $match
    { $match: { _id: ObjectId(userId) } },
    { $lookup: { from: "thoughts", localField: "thoughts", foreignField: "_id", as: "thoughts" } },
    { $unwind: "$thoughts" },
    { $replaceRoot: { newRoot: "$thoughts" } },
    { $project: { "_id": 1, "username": 0, "email": 0, "__v": 0,  "friends": 0, } }
  ]);
  
// Combine the friends to users
const getFriends = async (userId) =>
  User.aggregate([
    // only include the given student by using $match
    { $match: { _id: ObjectId(userId) } },
    { $lookup: { from: "users", localField: "friends", foreignField: "_id", as: "friends" } },
    { $unwind: "$friends" },
    { $replaceRoot: { newRoot: "$friends" } },
    { $project: { "friends": 1 } }
  ]);

module.exports = {
  // Get all users
  getUsers(req, res) {
    User.find()
      .select( { '__v': 0, } )
      .then((users) => res.json(users))
      .catch((err) => res.status(500).json(err));
  },

  // Get a single user
  getSingleUser(req, res) {
    User.findOne({ _id: req.params.userId })
      .select( { '__v': 0, 'thoughts': 0, 'friends': 0 } )
      .then(async (user) =>
        !user
          ? res.status(404).json({ message: 'No user with that ID' })
          : res.json({
            user,
            thoughts: await getThoughts(req.params.userId),
            friends: await getFriends(req.params.userId),
          })
      )
      .catch((err) => res.status(500).json(err));
  },

  // Create a user
  createUser(req, res) {
    User.create(req.body)
      .then((user) => res.json(user))
      .catch((err) => {
        console.log(err);
        return res.status(500).json(err);
      });
  },

  // Delete a user
  deleteUser(req, res) {
    User.findOneAndDelete({ _id: req.params.userId })
      .then((user) =>
        !user
          ? res.status(404).json({ message: 'No user with that ID' })
          : Thought.deleteMany({ _id: { $in: user.thoughts } })
      )
      .then(() => res.json({ message: 'User and thoughts deleted!' }))
      .catch((err) => res.status(500).json(err));
  },

  // Update a user
  updateUser(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $set: req.body },
      { runValidators: true, new: true }
    )
      .then((user) =>
        !user
          ? res.status(404).json({ message: 'No user with this id!' })
          : res.json(user)
      )
      .catch((err) => res.status(500).json(err));
  },  

  // Add a friend to a user
  addFriend(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $addToSet: { friends: req.body } },
      { runValidators: true, new: true }
    )
      .then((user) =>
        !user
          ? res
              .status(404)
              .json({ message: 'No user found with that ID :(' })
          : res.json(user)
      )
      .catch((err) => res.status(500).json(err));
  },
  // Remove friend from a user
  removeFriend(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $pull: { friends: req.params.friendId } },
      { runValidators: true, new: true }
    )
      .then((user) =>
        !user
          ? res
              .status(404)
              .json({ message: 'No user found with that ID :(' })
          : res.json(user)
      )
      .catch((err) => res.status(500).json(err));
  },
};
