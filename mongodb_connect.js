var mongoose = require('mongoose');

var mongoDB = "mongodb+srv://123456database:123456database@payement-app-cluster.luwqb.mongodb.net/stellarDB?wretryWrites=true&w=majority"
    ;
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useCreateIndex: false,
    useUnifiedTopology: true,
    useFindAndModify: false
});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

