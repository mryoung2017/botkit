/*
Storage module for bots.

Supports storage of data on a team-by-team, user-by-user, and chnnel-by-channel basis.

save can be used to store arbitrary object.
These objects must include an id by which they can be looked up.
It is recommended to use the team/user/channel id for this purpose.
Example usage of save:
controller.storage.teams.save({id: message.team, foo:"bar"}, function(err){
if (err)
console.log(err)
});

get looks up an object by id.
Example usage of get:
controller.storage.teams.get(message.team, function(err, team_data){
if (err)
console.log(err)
else
console.log(team_data)
});
*/

var Store = require('jfs');

var users_lists = new Store('../botkit/lib/storage');

function add_user_to_update(user_id) {
  users_lists.get('users_to_update', function(err, users_to_update) {
    if ( users_to_update != undefined ) {
      for (i=0; i < users_to_update.length; i++) {
        if ( users_to_update[i] == [user_id] ) {
          var add_it=false;
          break;
        }
        else {
          var add_it=true;
        }
      }
      if (add_it) {
        users_to_update.push(user_id);
        users_lists.save('users_to_update', users_to_update);
      }
    }
    else {
      users_lists.save('users_to_update', [user_id]);
    }
  });
}

function add_user_to_add(user_id) {
  users_lists.get('users_to_add', function(err, users_to_add) {
    if ( users_to_add != undefined ) {
        users_to_add.push(user_id);
        users_lists.save('users_to_add', users_to_add);
    }
    else {
      users_lists.save('users_to_add', [user_id]);
    }
  });
}


module.exports = function(config) {

  if (!config) {
    config = {
      path: './',
    };
  }

  var sessions_db = new Store(config.path + '/sessions', {pretty:true});
  var users_db = new Store(config.path + '/users', {saveId: 'id', pretty:true});

  var objectsToList = function(cb) {
    return function(err, data) {
      if (err) {
        cb(err, data);
      } else {
        cb(err, Object.keys(data).map(function(key) {
          return data[key];
        }));
      }
    };
  };

  var storage = {
    sessions: {
      get: function(session_id, cb) {
        sessions_db.get(session_id, cb);
      },
      save: function(session_id, session_data, cb) {
        sessions_db.get(session_id, function(err, db_data) {
          if (db_data != undefined) {
            if (session_data.start_time !== undefined) {
              db_data.start_time = session_data.start_time;
            };
            if (session_data.timeout !== undefined) {
              db_data.timeout = session_data.timeout;
            };
            if (session_data.end_time !== undefined) {
              db_data.end_time = session_data.end_time;
            };
            if (session_data.userid !== undefined) {
              db_data.userid = session_data.userid;
            };
            if (session_data.last_context !== undefined) {
              db_data.last_context = session_data.last_context;
            };
            if (session_data.messages !== undefined) {
              if (db_data.messages){
                var concated_messages = db_data.messages.concat(session_data.messages);
                db_data.messages = concated_messages;
              }
            };
            sessions_db.save(session_id, db_data, cb);

          }
          else {
            sessions_db.save(session_id, session_data, cb);
          }
        });
      },
      delete: function(session_id, cb) {
        sessions_db.delete(session_id, cb);
      },
      all: function(cb) {
        sessions_db.all(objectsToList(cb));
      }
    },
    users: {
      get: function(user_id, cb) {
        users_db.get(user_id, cb);
      },
      save: function(user_id, user_data, cb) {
        // Check if the user already have data on the db :
        users_db.get(user_id, function(err, data) {
          // if user exists in the db :
          if (data != undefined) {
            if (user_data.firstname) {
              data.firstname = user_data.firstname;
              add_user_to_update(user_id);
            };
            if (user_data.lastname) {
              data.lastname = user_data.lastname;
              add_user_to_update(user_id);
            };
            if (user_data.age) {
              data.age = user_data.age;
              add_user_to_update(user_id);
            };
            if (user_data.sex) {
              data.sex = user_data.sex;
              add_user_to_update(user_id);
            };
            if (user_data.last_session) {
              data.last_session = user_data.last_session;

              //TO remove
              add_user_to_update(user_id);
              //=========

            };
            users_db.save(user_id, data, cb);

          }
          // If user doesn't exist :
          else {
            users_db.save(user_id, user_data, cb);
            add_user_to_add(user_id);
          }
        });

      },
      delete: function(user_id, cb) {
        users_db.delete(user_id, cb);
      },
      all: function(cb) {
        users_db.all(objectsToList(cb));
      }
    }
  };

  return storage;
};
