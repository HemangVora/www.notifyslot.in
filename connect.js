const MongoClient = require( 'mongodb' ).MongoClient;
const url = "mongodb://RootAdmin:12345@localhost/admin?retryWrites=true&w=majority";

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( url,  { useNewUrlParser: true,useUnifiedTopology:true }, function( err, client ) {
      _db  = client.db('notify');
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};
