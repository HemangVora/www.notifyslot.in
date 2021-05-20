const MongoClient = require( 'mongodb' ).MongoClient;
const url = "mongodb+srv://todoAppUser:3yR2kU6KiKzjufb@cluster0.cx25r.mongodb.net/notify?retryWrites=true&w=majority";

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( url,  { useNewUrlParser: true }, function( err, client ) {
      _db  = client.db('notify');
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};