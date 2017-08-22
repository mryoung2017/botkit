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
						if (session_data.start_time) {
							db_data.start_time = session_data.start_time;
						};
						if (session_data.timeout) {
							db_data.timeout = session_data.timeout;
						};
						if (session_data.end_time) {
							db_data.end_time = session_data.end_time;
						};
						if (session_data.userid) {
							db_data.userid = session_data.userid;
						};
						if (session_data.last_context) {
							db_data.last_context = session_data.last_context;
						};
						if (session_data.messages) {
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
				users_db.get(user_id, function(err, data) {
					if (data != undefined) {
						if (user_data.firstname) {
							data.firstname = user_data.firstname;
						};
						if (user_data.lastname) {
							data.lastname = user_data.lastname;
						};
						if (user_data.age) {
							data.age = user_data.age;
						};
						if (user_data.sex) {
							data.sex = user_data.sex;
						};
						if (user_data.last_session) {
							data.last_session = user_data.last_session;
						};
						users_db.save(user_id, data, cb);

					}
					else {
						users_db.save(user_id, user_data, cb);
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
