const connection = require('../config/connection');
const { User, Thought } = require('../models');
const { getRandomUsers, getRandomThoughts, getFriends } = require('./data');

connection.on('error', (err) => err);

connection.once('open', async () => {
  console.log('connected');
  await Thought.deleteMany({});
  await User.deleteMany({});

  const users = getRandomUsers(10);

  await User.collection.insertMany(users);
  
  const usersList = users.map(a => a.username)
  const userIds = (await User.find({}).distinct('_id')).map((id) => id.toString())

  const thoughts = getRandomThoughts(usersList, userIds, 10);

  await Thought.collection.insertMany(thoughts)

  const thoughtsArray = [];
  for await (const doc of Thought.find()) {
    thoughtsArray.push({
      userId: doc.username,
      thoughtId: doc._id.toString(),
    });
  }

  for await (const doc of User.find()) {
    const friendsObj = [...getFriends(userIds, Math.random() * 5)];
    friendsArray = friendsObj.map(item => item.username);
    friendsArray = friendsArray.filter(e => e !== doc._id.toString());
    doc.friends = friendsArray;
    let userThoughts = [];
    for (let i = 0; i < thoughtsArray.length; i++) {
      if (thoughtsArray[i].userId == doc._id.toString()) {
        userThoughts.push(thoughtsArray[i].thoughtId);
      };
    };
    doc.thoughts = userThoughts;
    await doc.save();
  }

  // loop through the saved thoughts, for each thought we need to generate a thought response and insert the thought responses
  console.table(users);
  console.table(thoughts);
  console.info('Seeding complete! 🌱');
  process.exit(0);
});
