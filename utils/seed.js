// import package and modules
const connection = require('../config/connection');
const { User, Thought } = require('../models');
const { getRandomUsers, getRandomThoughts, getFriends } = require('./data');

connection.on('error', (err) => err);

connection.once('open', async () => {
  console.log('connected');
  // Clear the database
  await Thought.deleteMany({});
  await User.deleteMany({});

  // Get 10 random users
  const users = getRandomUsers(10);

  // Insert users to database
  await User.collection.insertMany(users);
  
  // Get array of usernames and userIds of seeded data
  const usersList = users.map(a => a.username)
  const userIds = (await User.find({}).distinct('_id')).map((id) => id.toString())

  // Get 10 random thoughts. Pass in username and userId information
  const thoughts = getRandomThoughts(usersList, userIds, 10);

  // Insert thoughts to database
  await Thought.collection.insertMany(thoughts)

  // Get array of user and thought id's
  const thoughtsArray = [];
  for await (const doc of Thought.find()) {
    thoughtsArray.push({
      userId: doc.username,
      thoughtId: doc._id.toString(),
    });
  }

  // Add friends and thoughts to users
  for await (const doc of User.find()) {
    // Get anywhere from 0-5 friends for each user
    const friendsObj = [...getFriends(userIds, Math.random() * 5)];
    friendsArray = friendsObj.map(item => item.username);
    friendsArray = friendsArray.filter(e => e !== doc._id.toString());

    // Add friends to user
    doc.friends = friendsArray;
    let userThoughts = [];

    // Add thoughts to user if id matches
    for (let i = 0; i < thoughtsArray.length; i++) {
      if (thoughtsArray[i].userId == doc._id.toString()) {
        userThoughts.push(thoughtsArray[i].thoughtId);
      };
    };
    doc.thoughts = userThoughts;

    // Save user
    await doc.save();
  }

  // loop through the saved thoughts, for each thought we need to generate a thought response and insert the thought responses
  console.table(users);
  console.table(thoughts);
  console.info('Seeding complete! 🌱');
  process.exit(0);
});
