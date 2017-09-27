require('dotenv').load();

var dialog =  require('./dialog_simple.json');

if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

if (!process.env.app_secret) {
    console.log('Error: Specify app_secret in environment');
    process.exit(1);
}


var apiai = require('botkit-middleware-apiai')({
    token: process.env.api_token,
    skip_bot: true // or false. If true, the middleware don't send the bot reply/says to api.ai
});

var uuidv1 = require('uuid/v1');
var node_search = require('./lib/node_search.js');
var fb_send = require('./lib/fb_send.js');
var Session = require('./lib/Session.js');
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var commandLineArgs = require('command-line-args');
var localtunnel = require('localtunnel');

const ops = commandLineArgs([
      {name: 'lt', alias: 'l', args: 1, description: 'Use localtunnel.me to make your bot available on the web.',
      type: Boolean, defaultValue: false},
      {name: 'ltsubdomain', alias: 's', args: 1,
      description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
      type: String, defaultValue: null},
   ]);

if(ops.lt === false && ops.ltsubdomain !== null) {
    console.log("error: --ltsubdomain can only be used together with --lt.");
    process.exit();
}

if (ops.lt === true && ops.ltsubdomain !== null) {
  var ltsubdomain = ops.ltsubdomain;
}
else if (ops.lt === true && ops.ltsubdomain === null) {
  if (!process.env.ltsubdomain) {
    console.log('Error: Specify ltsubdomain in environment');
    process.exit(1);
  }
  else {
    var ltsubdomain = process.env.ltsubdomain;
  }
}

var controller = Botkit.facebookbot({
    debug: false,
    log: false,
	json_file_store: './lib/storage',
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
    app_secret: process.env.app_secret,
	require_delivery: true,
    validate_requests: true, // Refuse any requests that don't come from FB on your receive webhook, must provide FB_APP_SECRET in environment variables
});

controller.middleware.receive.use(apiai.receive);
console.log('API.AI ONLINE!');

controller.setupWebserver(process.env.port || 5000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if(ops.lt) {
            var tunnel = localtunnel(process.env.port || 5000, {subdomain: ltsubdomain}, function(err, tunnel) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/facebook/receive');
            });

            tunnel.on('close', function() {
                console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
                process.exit();
            });
        }
    });
});


controller.api.messenger_profile.greeting('Hello {{user_first_name}} {{user_last_name}} How are you?');
//controller.api.messenger_profile.delete_greeting()

controller.api.messenger_profile.get_started('Get Started');
//controller.api.messenger_profile.delete_get_started()


controller.api.messenger_profile.menu([{
    "locale":"default",
    "composer_input_disabled":false,
    "call_to_actions":[
        {
            "title":"My Skills",
            "type":"nested",
            "call_to_actions":[
                {
                    "title":"Test",
                    "type":"postback",
                    "payload":"Test"
                },
                {
                    "title":"Hi",
                    "type":"postback",
                    "payload":"Hi"
                }
            ]
        },
        {
            "type":"web_url",
            "title":"Botkit Docs",
            "url":"https://github.com/howdyai/botkit/blob/master/readme-facebook.md",
            "webview_height_ratio":"full"
        }
    ]
},
    {
        "locale":"zh_CN",
        "composer_input_disabled":true
    }
]);

var bot = controller.spawn({
});


// controller.api.messenger_profile.account_linking('https://www.yourAwesomSite.com/oauth?response_type=code&client_id=1234567890&scope=basic');
// controller.api.messenger_profile.get_account_linking(function (err, accountLinkingUrl)  {
//     console.log('****** Account linkink URL :', accountLinkingUrl);
// });
// controller.api.messenger_profile.delete_account_linking();
// controller.api.messenger_profile.domain_whitelist('https://localhost');
// controller.api.messenger_profile.domain_whitelist(['https://127.0.0.1', 'https://0.0.0.0']);
// controller.api.messenger_profile.delete_domain_whitelist('https://localhost');
// controller.api.messenger_profile.delete_domain_whitelist(['https://127.0.0.1', 'https://0.0.0.0']);
// controller.api.messenger_profile.get_domain_whitelist(function (err, data)  {
//     console.log('****** Whitelisted domains :', data);
// });


// returns the bot's messenger code image


/* Action if user click on something
controller.on('facebook_postback', function(bot, message) {
    // console.log(bot, message);
   bot.replyWithTyping(message, 'Great Choice!!!! (' + message.payload + ')');
});
*/

//Action if a message is received
controller.on('message_received', function(bot, message) {

	var FB_user_id = message.user;
	var time_stamp = new Date(message.timestamp);

	//console.log('intent :');
	console.log(message.text);

	controller.storage.users.get(message.user, function(err, user_data) {
		if (!user_data) {

      var user_uuid = 'usr-'+uuidv1();
      console.log('New user : '+user_uuid);
      var sess = Session.get(user_data, time_stamp, null);

      bot.getUserInfo(FB_user_id, function(err,body) {
        var user_data_to_save = JSON.parse(body);
        user_data_to_save.user_uuid = user_uuid;
        user_data_to_save.last_session = sess.uuid;
        controller.storage.users.save(message.user, user_data_to_save, function(){});
      });

			var current_node = "null";			// Convert current_node string to Int
			var current_node_childs = null;		// Get current node childs
      var current_node_fallback = null;		// Get current node fallback

			Promise.resolve(node_search(dialog, current_node, current_node_childs, current_node_fallback, message))
			.then(function(found_node) {
				Promise.resolve(fb_send(bot, message, found_node.output)).then(function(sent_at){
          var message_to_store = [{
  										mess_uuid: message.mid,
  										content: message.text,
  										received_at: time_stamp,
  										intent: message.intent,
  										entity: message.entities,
  										resp_uuid: found_node.id,
                      sent_at: sent_at
  										}];
  				controller.storage.sessions.save(sess.uuid, {start_time: time_stamp, timeout: sess.timeout, userid: user_uuid, last_context: found_node.input_context, messages: message_to_store});
        });
				console.log('input context : '+ found_node.input_context);
			})
			.catch(function(err){
				console.log(err);
			});
		} else {
			controller.storage.sessions.get(user_data.last_session, function(err, session_data) {
				if (err) {console.log(err);}
				else {
					var sess = Session.get(user_data, time_stamp, session_data);
					// If user is still in the same session
					if (user_data.last_session === sess.uuid) {
						var input_context = session_data.last_context;					//GET context from current session from DB
            console.log('input context : '+ input_context);

						// If input context is a root node
						if (input_context[input_context.length -1] === 'r') {

							var current_node = input_context;			// Convert current_node string to Int
							var current_node_childs = dialog.root_nodes[parseInt(input_context)].childs;	// Get current node childs
              var current_node_fallback = dialog.root_nodes[parseInt(input_context)].fallback;		// Get current node fallback

							Promise.resolve(node_search(dialog, current_node, current_node_childs, current_node_fallback, message))
							.then(function(found_node){
                console.log('new context : '+ found_node.input_context);
								Promise.resolve(fb_send(bot, message, found_node.output)).then(function(sent_at){
                  var message_to_store = [{
  														mess_uuid: message.mid,
  														content: message.text,
  														received_at: time_stamp,
  														intent: message.intent,
  														entity: message.entities,
  														resp_uuid: found_node.id,
                              sent_at: sent_at
  														}];
  								controller.storage.sessions.save(sess.uuid, {timeout: sess.timeout, last_context: found_node.input_context, messages: message_to_store});
                });
							})
							.catch(function(err){
								console.log(err);
							});
						}
						// If input context is a child node
						else if ( input_context[input_context.length -1] === 'c' ){

							var current_node = input_context;			// Convert current_node string to Int
							var current_node_childs = dialog.child_nodes[parseInt(input_context)].childs		// Get current node childs
              var current_node_fallback = dialog.child_nodes[parseInt(input_context)].fallback;		// Get current node fallback

							Promise.resolve(node_search(dialog, current_node, current_node_childs, current_node_fallback, message))
							.then(function(found_node){
								console.log('new context : '+ found_node.input_context);
								Promise.resolve(fb_send(bot, message, found_node.output)).then(function(sent_at){
                  var message_to_store = [{
  														mess_uuid: message.mid,
  														content: message.text,
  														received_at: time_stamp,
  														intent: message.intent,
  														entity: message.entities,
  														resp_uuid: found_node.id,
                              sent_at: sent_at
  														}];
  								controller.storage.sessions.save(sess.uuid, {timeout: sess.timeout, last_context: found_node.input_context, messages: message_to_store});
                });
                })
  							.catch(function(err){
  								console.log(err);
  							});

						}
						// If there is NO input context from last message in the session.
						else {

							var current_node = "null";			// Convert current_node string to Int
							var current_node_childs = null;		// Get current node childs
              var current_node_fallback = null;		// Get current node fallback

							Promise.resolve(node_search(dialog, current_node, current_node_childs, current_node_fallback, message))
							.then( function(found_node) {
								console.log('new context : '+ found_node.input_context);
								Promise.resolve(fb_send(bot, message, found_node.output)).then(function(sent_at){
                  var message_to_store = [{
  														mess_uuid: message.mid,
  														content: message.text,
  														received_at: time_stamp,
  														intent: message.intent,
  														entity: message.entities,
  														resp_uuid: found_node.id,
                              sent_at: sent_at
  														}];
                  controller.storage.sessions.save(sess.uuid, {timeout: sess.timeout, last_context: found_node.input_context, messages: message_to_store});
                });
							})
							.catch(function(err){
								console.log(err);
							});

						};
					}

					// If new session started
					else {

						controller.storage.users.save(message.user, {last_session : sess.uuid}, function(){});

						var userid = user_data.user_uuid;
						var current_node = "null";			// Convert current_node string to Int
						var current_node_childs = null;		// Get current node childs
            var current_node_fallback = null;		// Get current node fallback

						Promise.resolve(node_search(dialog, current_node, current_node_childs, current_node_fallback, message)).then(function(found_node){
							console.log('new context : '+ found_node.input_context);
							Promise.resolve(fb_send(bot, message, found_node.output)).then(function(sent_at){

                var message_to_store = [{
                            mess_uuid: message.mid,
                            content: message.text,
                            received_at: time_stamp,
                            intent: message.intent,
                            entity: message.entities,
                            resp_uuid: found_node.id,
                            sent_at: sent_at
                            }];
                            controller.storage.sessions.save(sess.uuid, {start_time: time_stamp, timeout: sess.timeout, userid: userid, last_context: found_node.input_context, messages: message_to_store});

              });
						}).catch(function(err){
							console.log(err);
						});
					}
				}
			});
		}
	});
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
