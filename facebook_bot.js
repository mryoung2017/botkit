/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Facebook bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Facebook's Messenger APIs
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Follow the instructions here to set up your Facebook app and page:

    -> https://developers.facebook.com/docs/messenger-platform/implementation

  Run your bot from the command line:

    app_secret=<MY APP SECRET> page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node facebook_bot.js [--lt [--ltsubdomain LOCALTUNNEL_SUBDOMAIN]]

  Use the --lt option to make your bot available on the web through localtunnel.me.

# USE THE BOT:

  Find your bot inside Facebook to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

require('dotenv').load();
var dialog =  require('./dialog.json');
var Redshift = require('node-redshift');
var SQL = require('sql-template-strings');

var client = {
  user: process.env.Redshift_user,
  database: process.env.Redshift_database,
  password: process.env.Redshift_password,
  port: process.env.Redshift_port,
  host: process.env.Redshift_host
};
var redshift  = new Redshift(client);

					
if (!process.env.Redshift_user) {
    console.log('Error: Specify Redshift_user in environment');
    process.exit(1);
}

if (!process.env.Redshift_database) {
    console.log('Error: Specify Redshift_database in environment');
    process.exit(1);
}

if (!process.env.Redshift_password) {
    console.log('Error: Specify Redshift_password in environment');
    process.exit(1);
}

if (!process.env.Redshift_port) {
    console.log('Error: Specify Redshift_port in environment');
    process.exit(1);
}

if (!process.env.Redshift_host) {
    console.log('Error: Specify Redshift_host in environment');
    process.exit(1);
}
					
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
            var tunnel = localtunnel(process.env.port || 5000, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
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


controller.api.messenger_profile.greeting('Hello {{user_first_name}} How are you?');
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
        "composer_input_disabled":false
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




// Facebook sender To WORK ON


var fb_send = function (msg, fb_message, fb_bot) {
	
	if ( fb_message.length > 1) {
		fb_bot.startConversation(msg, function(err,convo) {
			//For each message
			for (var i=0; i < fb_message.length; i++) {
						convo.say(fb_message[i].content);
						convo.say(['íts working']);
						if (i < (fb_message.length - 1) ) { convo.next() };
						if (i === (fb_message.length - 1) ) { convo.stop() };
			};
		});
	}
	else {
		bot.reply(message, fb_message.content);
	}
}


//Action if a message is received
controller.on('message_received', function(bot, message) {
	var FB_user_id = message.user;
	var API_sess_uuid = message.nlpResponse.sessionId;
	var time_stamp = new Date(message.timestamp);

	//console.log('intent :');
	//console.log(message);	

	redshift.query(SQL`SELECT * FROM users WHERE user_uuid=${FB_user_id}`, {raw: true})
	.then(function(user) {
		// If users doesn't exist in DB
		if (!user[0]) {
			redshift.query(SQL`INSERT INTO users (user_uuid) VALUES (${FB_user_id})`, {raw: true})
			.then(function(){
				redshift.query(SQL`INSERT INTO sessions (sess_uuid, start_time) VALUES (${API_sess_uuid},${time_stamp})`, {raw: true})
				.then(function(){
					redshift.query(SQL`SELECT * FROM users WHERE user_uuid=${FB_user_id}`, {raw: true})
					.then(function(user){
						var userid = user[0].id;				
						redshift.query(SQL`UPDATE sessions SET userid=${userid} WHERE sess_uuid=${API_sess_uuid}`, {raw: true})
						.then(function(){
							//Check in each root node if intent is matched
							for (var i=0; i < dialog.root_nodes.length; i++) {
								// If intent is matched
								if (dialog.root_nodes[i].intent_name === message.nlpResponse.result.action) {
									
									fb_send(message, dialog.root_nodes[i].output, bot);				//send content
													
									/* if ( dialog.root_nodes[i].output.length > 1) {
										bot.startConversation(message, function(err,convo) {
											//For each message
											for (var j=0; j < dialog.root_nodes[i].output.length; j++) {
														convo.say(dialog.root_nodes[i].output[j].content);
														if (i < (dialog.root_nodes[i].output.length - 1) ) { convo.next() };
														if (i === (dialog.root_nodes[i].output.length - 1) ) { convo.stop() };
											};
										});
									}
									else {
										bot.reply(message, dialog.root_nodes[i].output.content);
									}	
 */
									//if found node has childs
									if (dialog.root_nodes[i].childs != ""){
										var input_context=dialog.root_nodes[i].id				//update input_context for next message
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE userid = ${userid};`, {raw: true})
										.then(function(){
											
											
											
										})
										.catch(function(err){
											console.log(err);
										});
									}
									else if (!dialog.root_nodes[i].childs){
										// Insert command to execute if found node has no child
										console.log('Found node has no child')
									}
									break;
								}
								// If no intent matched at all
								else { 
									console.log('no node found');
									bot.reply(message, 'no node found')
								}
							}	
						})
						.catch(function(err){
						console.log(err);
						});
					})
					.catch(function(err){
					console.log(err);
					});	
				})
				.catch(function(err){
					console.log(err);
				});
			})
			.catch(function(err){
			console.log(err);
			});
		}
		// If User already exists in DB:
		else {
			var userid=user[0].id;
			
			// Get past sessions from this user
			redshift.query(SQL`SELECT * FROM sessions WHERE userid = ${userid} ORDER BY id DESC;`, {raw: true})
			.then(function(session){
								
				
				var last_session = session[0].sess_uuid;		//Get last_session ID from DB
				
				// If user is still in the same session
				if (last_session === API_sess_uuid) {
					var input_context = session[0].context;					//GET context from current session from DB
					
					// If input context is a root node
					if (input_context[input_context.length -1] === 'r') {
						
						var current_node = parseInt(input_context);			// Convert current_node string to Int
						var current_node_childs = dialog.root_nodes[parseInt(input_context)].childs;	// Get current node childs
						var search_in_root_nodes = false;
						
						// Starts by searching in child nodes :
						if (search_in_root_nodes === false) {
							
							// Check each child node of the root node if the intent is matched :
							for (var i=0; i < current_node_childs.length; i++) {
								console.log(dialog.child_nodes[parseInt(current_node_childs[i])].intent_name);
								console.log(message.nlpResponse.result.action);
								// If intent is matched :
								if (dialog.child_nodes[parseInt(current_node_childs[i])].intent_name === message.nlpResponse.result.action) {
									
									
									fb_send(message, dialog.child_nodes[parseInt(current_node_childs[i])].output, bot);		//send content
									
									/* if ( dialog.child_nodes[parseInt(current_node_childs[i])].output.length > 1) {
										bot.startConversation(message, function(err,convo) {
											//For each message
											for (var j=0; j < dialog.child_nodes[parseInt(current_node_childs[i])].output.length; j++) {
														convo.say(dialog.child_nodes[parseInt(current_node_childs[i])].output[j].content);
														if (i < (dialog.child_nodes[parseInt(current_node_childs[i])].output.length - 1) ) { convo.next() };
														if (i === (dialog.child_nodes[parseInt(current_node_childs[i])].output.length - 1) ) { convo.stop() };
											};
										});
									}
									else {
										bot.reply(message, dialog.child_nodes[parseInt(current_node_childs[i])].output.content);
									} */					
									
									//if found node has childs
									if (dialog.child_nodes[parseInt(current_node_childs[i])].childs !== null && dialog.child_nodes[parseInt(current_node_childs[i])].childs.length >0){
										
										console.log('Current node has childs :');
										console.log(dialog.child_nodes[parseInt(current_node_childs[i])].childs);
										var input_context=dialog.child_nodes[parseInt(current_node_childs[i])].id;			//update input_context for next message
										
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE sess_uuid = ${last_session}`, {raw: true})
										.then(function(){
											console.log('Session '+last_session+' context updated to : '+input_context);
																																			
										})
										.catch(function(err){
											console.log(err);
										});
									}
									
									//if found node has NO childs
									else if (dialog.child_nodes[parseInt(current_node_childs[i])].childs == null || dialog.child_nodes[parseInt(current_node_childs[i])].childs.length == 0) { 
										// Insert command to execute if the found node has no child
										console.log('Found node has no child')
									};
									search_in_root_nodes = false;
									break;
								}					
								// If no intent is matched in child nodes :
								else { 
									search_in_root_nodes = true;
								}
							}
						}
						
						// Starts searching in root nodes :
						if (search_in_root_nodes === true){
							
							//Check in each root node if intent is matched
							for (var i=0; i < dialog.root_nodes.length; i++) {
								// If intent is matched
								if (dialog.root_nodes[i].intent_name === message.nlpResponse.result.action) {
									
									fb_send(message, dialog.root_nodes[i].output, bot);				//send content
													
									/* if ( dialog.root_nodes[i].output.length > 1) {
										bot.startConversation(message, function(err,convo) {
											//For each message
											for (var j=0; j < dialog.root_nodes[i].output.length; j++) {
														convo.say(dialog.root_nodes[i].output[j].content);
														if (i < (dialog.root_nodes[i].output.length - 1) ) { convo.next() };
														if (i === (dialog.root_nodes[i].output.length - 1) ) { convo.stop() };
											};
										});
									}
									else {
										bot.reply(message, dialog.root_nodes[i].output.content);
									} */	

									//if found node has childs
									if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs>0 ){
										var input_context=dialog.root_nodes[i].id				//update input_context for next message
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE sess_uuid = ${last_session};`, {raw: true})
										.then(function(){
											console.log('Session '+last_session+' context updated to : '+input_context);
											
										})
										.catch(function(err){
											console.log(err);
										});
									}
									
									//if found node has NO childs
									else if (dialog.root_nodes[i].childs ==null || dialog.root_nodes[i].childs.length ==0 ) {
										// Insert command to execute if found node has no child
										console.log('Found node has no child')
									}
									search_in_root_nodes = false;
									break;
								}
								// If no intent matched at all
								else { 
									
									console.log('no node found');
									bot.reply(message, 'no node found')
								}
							}
						}
						
					}
						
					// If input context is a child node
					else if ( input_context[input_context.length -1] === 'c' ){
						var current_node = parseInt(input_context);			// Convert current_node string to Int
						var current_node_childs = dialog.child_nodes[parseInt(input_context)].childs		// Get current node childs
						var search_in_root_nodes = false;
						
						// Starts by searching in child nodes :
						if (search_in_root_nodes === false) {
							
							// Check each child node of the root node if the intent is matched :
							for (var i=0; i < current_node_childs.length; i++) {
								
								// If intent is matched :
								if (dialog.child_nodes[parseInt(current_node_childs[i])].intent_name === message.nlpResponse.result.action) {
									
									fb_send(message, dialog.child_nodes[parseInt(current_node_childs[i])].output, bot);		//send content
									
									/* if ( dialog.child_nodes[parseInt(current_node_childs[i])].output.length > 1) {
										bot.startConversation(message, function(err,convo) {
											//For each message
											for (var j=0; j < dialog.child_nodes[parseInt(current_node_childs[i])].output.length; j++) {
														convo.say(dialog.child_nodes[parseInt(current_node_childs[i])].output[j].content);
														if (i < (dialog.child_nodes[parseInt(current_node_childs[i])].output.length - 1) ) { convo.next() };
														if (i === (dialog.child_nodes[parseInt(current_node_childs[i])].output.length - 1) ) { convo.stop() };
											};
										});
									}
									else {
										bot.reply(message, dialog.child_nodes[parseInt(current_node_childs[i])].output.content);
									} */
									
									search_in_root_nodes = false;								//do not search in root nodes
									
									//if found node has childs
									if (dialog.child_nodes[parseInt(current_node_childs[i])].childs !== null && dialog.child_nodes[parseInt(current_node_childs[i])].childs.length >0){
										
										console.log('Current node has childs : ');
										console.log(dialog.child_nodes[parseInt(current_node_childs[i])].childs);
										
										var input_context=dialog.child_nodes[parseInt(current_node_childs[i])].id				//update input_context for next message
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE userid = ${userid};`, {raw: true})
										.then(function(){
											console.log('Session '+last_session+' context updated to : '+input_context);
																																			
										})
										.catch(function(err){
											console.log(err);
										});
									}
									
									//if found node has NO childs
									else if (dialog.child_nodes[parseInt(current_node_childs[i])].childs == null || dialog.child_nodes[parseInt(current_node_childs[i])].childs.length == 0) {
										var input_context=""				//update input_context for next message
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE userid = ${userid};`, {raw: true})
										.then(function(){
											console.log('Session '+last_session+' context reset');
																																			
										})
										.catch(function(err){
											console.log(err);
										});
									};
									search_in_root_nodes = false;
									break;
								}
								// If no intent is matched in child nodes :
								else { 
									search_in_root_nodes = true;
									
								}
							}
						}
						
						// Starts searching in root nodes :
						if (search_in_root_nodes === true){
							//Check in each root node if intent is matched
							for (var i=0; i < dialog.root_nodes.length; i++) {
								// If intent is matched
								if (dialog.root_nodes[i].intent_name === message.nlpResponse.result.action) {
									
									fb_send(message, dialog.root_nodes[i].output, bot);				//send content
													
									/* if ( dialog.root_nodes[i].output.length > 1) {
										bot.startConversation(message, function(err,convo) {
											//For each message
											for (var j=0; j < dialog.root_nodes[i].output.length; j++) {
														convo.say(dialog.root_nodes[i].output[j].content);
														if (i < (dialog.root_nodes[i].output.length - 1) ) { convo.next() };
														if (i === (dialog.root_nodes[i].output.length - 1) ) { convo.stop() };
											};
										});
									}
									else {
										bot.reply(message, dialog.root_nodes[i].output.content);
									} */	

									//if found node has childs
									if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length > 0 ){
										var input_context=dialog.root_nodes[i].id				//update input_context for next message
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE userid = ${userid};`, {raw: true})
										.then(function(){
											
											console.log('Session '+last_session+' context updated to : '+input_context);
											
										})
										.catch(function(err){
											console.log(err);
										});
									}
									else if (dialog.root_nodes[i].childs == null || dialog.root_nodes[i].childs.length == 0) {
										// Insert command to execute if found node has no child
										console.log('Found node has no child')
									}
									search_in_root_nodes = false;
									break;
								}
								
								
								// If no intent matched at all
								else { 
									console.log('no node found');
									bot.reply(message, 'no node found')
								}
							}
						}	
					
					}
					
					
					// If there is NO input context from last message in the session.
					else {
						
						for (var i=0; i < dialog.root_nodes.length; i++) {
								// If intent is matched
								if (dialog.root_nodes[i].intent_name === message.nlpResponse.result.action) {
									
									fb_send(message, dialog.root_nodes[i].output, bot);				//send content
													
									/* if ( dialog.root_nodes[i].output.length > 1) {
										bot.startConversation(message, function(err,convo) {
											//For each message
											for (var j=0; j < dialog.root_nodes[i].output.length; j++) {
														convo.say(dialog.root_nodes[i].output[j].content);
														if (i < (dialog.root_nodes[i].output.length - 1) ) { convo.next() };
														if (i === (dialog.root_nodes[i].output.length - 1) ) { convo.stop() };
											};
										});
									}
									else {
										bot.reply(message, dialog.root_nodes[i].output.content);
									} */	

									//if found node has childs
									if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length > 0 ){
										var input_context=dialog.root_nodes[i].id				//update input_context for next message
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE userid = ${userid};`, {raw: true})
										.then(function(){
											
											console.log('Session '+last_session+' context updated to : '+input_context);
											
										})
										.catch(function(err){
											console.log(err);
										});
									}
									
									//if found node has NO child
									else if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length == 0 ){
										// Insert command to execute if found node has no child
										console.log('Found node has no child')
									}
								}
								// If no intent matched at all
								else { 
									console.log('no node found');
									bot.reply(message, 'no node found')
								}
							}
					};
				}
				
				// If new session started
				else {
					redshift.query(SQL`INSERT INTO sessions (sess_uuid, start_time, userid) VALUES (${API_sess_uuid},${time_stamp}, ${userid})`, {raw: true})
					.then(function(){
						
						//Check in each root node if intent is matched
						for (var i=0; i < dialog.root_nodes.length; i++) {
								// If intent is matched
								if (dialog.root_nodes[i].intent_name === message.nlpResponse.result.action) {
									
									fb_send(message, dialog.root_nodes[i].output, bot);				//send content
													
									/* if ( dialog.root_nodes[i].output.length > 1) {
										bot.startConversation(message, function(err,convo) {
											//For each message
											for (var j=0; j < dialog.root_nodes[i].output.length; j++) {
														convo.say(dialog.root_nodes[i].output[j].content);
														if (i < (dialog.root_nodes[i].output.length - 1) ) { convo.next() };
														if (i === (dialog.root_nodes[i].output.length - 1) ) { convo.stop() };
											};
										});
									}
									else {
										bot.reply(message, dialog.root_nodes[i].output.content);
									}	 */

									//if found node has childs
									if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length > 0){
										var input_context=dialog.root_nodes[i].id				//update input_context for next message
										redshift.query(SQL`UPDATE sessions SET context = ${input_context} WHERE userid = ${userid};`, {raw: true})
										.then(function(){
											
											
											
										})
										.catch(function(err){
											console.log(err);
										});
									}
									
									//if found node has NO child
									else if (dialog.root_nodes[i].childs == null && dialog.root_nodes[i].childs.length == 0) {
										// Insert command to execute if found node has no child
										console.log('Found node has no child')
									}
									search_in_root_nodes = false;
									break;
								}
								
								// If no intent matched at all								
								else { 
									console.log('no node found');
									bot.reply(message, 'no node found')
								}
							}
						
					})
					.catch(function(err){
						console.log(err);
					});
				};	
			})
			.catch(function(err){
				console.log(err);
			});
		}
	})
	.catch(function(err){
	  console.log(err);
	});		
})


/*
 // DIRECT TRANSIT BETWEEN API.AI AND FACEBOOK
controller.on('message_received', function(bot, message) {
	console.log('API.AI ANSWER :');
	console.log(message.nlpResponse);
	//If API.AI answer has more than 1 message
	if ( message.fulfillment.messages.length > 1) {   
		bot.startConversation(message, function(err,convo) {
			console.log(message);
			//For each message
			for (var i=0; i < message.fulfillment.messages.length; i++) {	
				// make sure the message is for facebook platform
				if ( message.fulfillment.messages[i].platform === 'facebook') {	
					switch (message.fulfillment.messages[i].type) {
					//In case the message type is 0, i.e. only message
					case 0:
						console.log(typeof(message.fulfillment.messages[i].speech));
						convo.say(message.fulfillment.messages[i].speech);
						if (i < (message.fulfillment.messages.length - 1) ) { convo.next() };
						if (i === (message.fulfillment.messages.length - 1) ) { convo.stop() };
						break;
					//In case the message type is 1, i.e. cards
					case 1:
						var card_opt={}; 	// object with single card 
						var card_opts=[];	// object with all the cards
						var button_opt={};	// object with a single button
						var button_opts=[];	// object with all the buttons for 1 card		
						while ( message.fulfillment.messages[i].type === 1) {
							for ( var j=0; j< message.fulfillment.messages[i].buttons.length; j++) {
								button_opt = {
												'type': 'web_url',
												'url': message.fulfillment.messages[i].buttons[j].postback,
												'title': message.fulfillment.messages[i].buttons[j].text,
											};
								button_opts = button_opts.concat(button_opt);
							};
							card_opt = {
											"title": message.fulfillment.messages[i].title,
											"image_url": message.fulfillment.messages[i].imageUrl,
											"subtitle": message.fulfillment.messages[i].subtitle,
											"buttons": button_opts
										};
							card_opts = card_opts.concat(card_opt);
							button_opts=[];
							i++;						
						};
						convo.say({
							attachment: {
								'type': 'template',
								'payload': {
									'template_type': 'generic',
									'elements': card_opts
								}
							}
						});
						if (i < (message.fulfillment.messages.length - 1) ) { convo.next() };
						if (i === (message.fulfillment.messages.length - 1) ) { convo.stop() };
						i--;
						break;
					//In case the message type is 2, i.e. quick replies
					case 2:						
						var quick_replies_opt={};	//object with one quick reply
						var quick_replies_opts=[];	//object with one all the quick replies
						for ( var j=0; j< message.fulfillment.messages[i].replies.length; j++) {
							quick_replies_opt = {
													"content_type": "text",
													"title": message.fulfillment.messages[i].replies[j],
													"payload": message.fulfillment.messages[i].replies[j],
												};
							quick_replies_opts = quick_replies_opts.concat(quick_replies_opt);
												
						};													
						convo.say({
							text: message.fulfillment.messages[i].title,
							quick_replies: quick_replies_opts,
						});
						if (i < (message.fulfillment.messages.length - 1) ) { convo.next() };
						if (i === (message.fulfillment.messages.length - 1) ) { convo.stop() };
						break;
					default:	
						break;
					};
				
				};
			};
		});
	}
	else {
		bot.replyWithTyping(message, message.fulfillment.messages.speech);
	}
	
});
*/

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
