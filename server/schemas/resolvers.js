const { User, Book } = require("../models");
const { AuthenticationError, ApolloError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
          if (context.user) {
            return User.findOne({ _id: context.user._id }).populate(
              'bookCount',
              'savedBooks'
            );
          }
        },
    },
    Mutation: {
        createUser: async (parent, { username, email, password}) => {
            const newUser = await User.create({ username, email, password});
            const token = signToken(user);
            return { token, user };
        },
        // deleteUser: async (parent, args, context) => {
        //     if (context.user) {
        //       const user = await User.findByIdAndDelete({ _id: context.user._id });
        //       return user;
        //     }
        // },
        login: async(parent, { email, password }) => {
            const existingUser = await User.findOne({ email });

            if(!user) {
                throw new AuthenticationError('No user with that email was found');
            }

            const passwordMatch = await existingUser.isCorrectPassword(password);

            if(!passwordMatch) {
                throw new AuthenticationError('incorrect password')
            }

            const token = signToken(existingUser);

            return { token, existingUser };
        },
        saveBook: async (parent, { authors, description, title, image, link }, context) => {
            if(context.user) {
                const book = await Book.create({ authors, description, title, image, link });
            };    
            
            await User.findOneAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: book._id } }, { $inc: { [`bookCount`]: 1 } }, { new: true });
                
            return context.user;
        },
        deleteBook: async (parent, { bookId }, context) => {
            if(context.user) {
                const book = await Book.findOneAndDelete({
                    _id: bookId,
                    person: context.user.username
                })
            };

            await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: book._id } },
                { $dec: { [`bookCount`]: 1 } },
                { new: true }
            );
        },
    },
};

module.exports = resolvers;