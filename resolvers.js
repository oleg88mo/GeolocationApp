const {AuthenticationError} = require('apollo-server');

const user = {
    _id: "1",
    name: "Reedyyww",
    email: "test@gmail.com",
    picture: "sc"
};

const authenticated = next => (root, arguments, context, info) => {
    if (!context.currentUser) {
        throw new AuthenticationError('You must be logged in!')
    }

    return next(root, arguments, context, info)
};

module.exports = {
    Query: {
        me: authenticated((root, arguments, context) => context.currentUser)
    }
};