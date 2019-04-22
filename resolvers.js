const {AuthenticationError, PubSub} = require('apollo-server');
const Pin = require('./models/Pin');
const pubsub = new PubSub();
const PIN_ADDED = "PIN_ADDED";
const PIN_DELETED = "PIN_DELETED";
const PIN_UPDATED = "PIN_UPDATED";

const authenticated = next => (root, arguments, context, info) => {
    if (!context.currentUser) {
        throw new AuthenticationError('You must be logged in!')
    }

    return next(root, arguments, context, info)
};

module.exports = {
    Query: {
        me: authenticated((root, arguments, context) => context.currentUser),
        getPins: async (root, arguments, context) => {
            const pins = await Pin.find({}).populate('author').populate('comments.author');

            return pins;
        }
    },
    Mutation: {
        createPin: authenticated(async (root, arguments, context) => {
            const newPin = await new Pin({
                ...arguments.input,
                author: context.currentUser._id
            }).save();
            const pinAdded = await Pin.populate(newPin, "author");
            pubsub.publish(PIN_ADDED, {pinAdded});

            return pinAdded;
        }),
        deletePin: authenticated(async (root, arguments, context) => {
            const pinDeleted = await Pin.findOneAndDelete({_id: arguments.pinId}).exec();
            pubsub.publish(PIN_DELETED, {pinDeleted});

            return pinDeleted;
        }),
        createComment: authenticated(async (root, arguments, context) => {
            const newComment = {
                text: arguments.text,
                author: context.currentUser._id
            };
            const pinUpdated = await Pin.findOneAndUpdate(
                {_id: arguments.pinId},
                {$push: {comments: newComment}},
                {new: true}
            ).populate('author').populate('comments.author');
            pubsub.publish(PIN_UPDATED, {pinUpdated});

            return pinUpdated;
        })
    },
    Subscription: {
        pinAdded: {
            subscribe: () => pubsub.asyncIterator(PIN_ADDED)
        },
        pinDeleted: {
            subscribe: () => pubsub.asyncIterator(PIN_DELETED)
        },
        pinUpdated: {
            subscribe: () => pubsub.asyncIterator(PIN_UPDATED)
        }
    }
};