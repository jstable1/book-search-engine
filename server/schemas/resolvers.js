const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const user = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('savedBooks')

        return user;
      }

      throw new AuthenticationError('Not logged in');
    },
  //   users: async () => {
  //     return User.find()
  //       .select('-__v -password')
  //       .populate('savedBooks')
  //   },
  //   user: async (parent, { username }) => {
  //     return User.findOne({ username })
  //       .select('-__v -password')
  //       .populate('savedBooks')
  //   },
  //   books: async (parent, { username }) => {
  //     const params = username ? { username } : {};
  //     return Book.find(params);
  //   },
  //   book: async (parent, { _id }) => {
  //     return Book.findOne({ _id });
  //   }
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { input }, context) => {
      if (context.user) {
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: input } },
          { new: true }
        );

        return user;
      }

      throw new AuthenticationError('You need to be logged in!');
    },
    removeBook: async (parent, args, context) => {
        if (context.user) {
          const book = await Book.findOneAndRemove({ _id: args.id });

            const user = await User.findByIdAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: args._id } },
            { new: true }
            );

            return user;
        }
  
        throw new AuthenticationError('You need to be logged in!');
      },
  }
};

module.exports = resolvers;