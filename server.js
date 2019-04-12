const {ApolloServer} = require('apollo-server');
const mongoose = require('mongoose');
require('dotenv').config();

const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const {findOrCreateUser} = require('./controllers/userController');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true}).then(() => console.log('DB connected')).catch(err => console.error(err));

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({req}) => {
        let authToken = null;
        let currentUser = null;

        try {
            authToken = req.headers.authorization;

            if (authToken) {
                // find or create user
                currentUser = await findOrCreateUser(authToken);
            }
        } catch (e) {
            console.log('err_', authToken)
        }

        return { currentUser };
    }
});

server.listen().then(({url}) => {
    console.log('url', url);
});


//       serv        yarn dev
//       client        yarn start
// LESS 17

// http://localhost:4000/playground