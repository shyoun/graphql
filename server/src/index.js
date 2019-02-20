const { ApolloServer } = require('apollo-server')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')

const { createStore } = require('./utils')

const LaunchAPI = require('./datasources/launch')
const UserAPI = require('./datasources/user')

const isEmail = require('isemail')

const store = createStore()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store })
  }),
  /* 
   context에서 오브젝트를 리턴하면.. context정보에 해당 오브젝트 정보가 등록된다.
   context정보는 아폴로서버에 등록된 모든 resolvers들은 context정보를 공유한다.
  */
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = (req.headers && req.headers.authorization) || ''
    const email = Buffer.from(auth, 'base64').toString('ascii')

    // if the email isn't formatted validly, return null for user
    if (!isEmail.validate(email)) return { user: null }
    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } })
    const user = users && users[0] ? users[0] : null

    return { user: { ...user.dataValues } }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
