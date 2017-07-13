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

controller.setupWebserver(process.env.port || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if(ops.lt) {
            var tunnel = localtunnel(process.env.port || 3000, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
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
    "composer_input_disabled":true,
    "call_to_actions":[
        {
            "title":"My Skills",
            "type":"nested",
            "call_to_actions":[
                {
                    "title":"Hello",
                    "type":"postback",
                    "payload":"Hello"
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


//Action if a message is received


// DIRECT TRANSIT BETWEEN API.AI AND FACEBOOK
controller.on('message_received', function(bot, message) {
	console.log('API.AI ANSWER :');
	console.log(message.nlpResponse);
	//If API.AI answer has more than 1 message
	if ( message.fulfillment.messages.length > 1) {   
		bot.startConversation(message, function(err,convo) {
			//For each message
			for (var i=0; i < message.fulfillment.messages.length; i++) {	
				// make sure the message is for facebook platform
				if ( message.fulfillment.messages[i].platform === 'facebook') {	
					switch (message.fulfillment.messages[i].type) {
					//In case the message type is 0, i.e. only message
					case 0:
						convo.say(message.fulfillment.messages[i].speech);
						convo.next();
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




// apiai.hears for intents. in this example is 'hello' the intent
/* controller.hears(['smalltalk.greetings.hello'],'message_received',apiai.hears,function(bot, message) {
    bot.replyWithTyping(message, 'hello, its working!!');
});

// apiai.action for actions. in this example is 'user.setName' the action
controller.hears(['user.setName'],'message_received',apiai.action,function(bot, message) {
    // ...
}); */


/*  Actions when bot hears 

controller.hears(['attachment_upload'], 'message_received', function(bot, message) {
    var attachment = {
        "type":"image",
        "payload":{
            "url":"https://pbs.twimg.com/profile_images/803642201653858305/IAW1DBPw_400x400.png",
            "is_reusable": true
        }
    };

    controller.api.attachment_upload.upload(attachment, function (err, attachmentId) {
        if(err) {
            // Error
        } else {
            var image = {
                "attachment":{
                    "type":"image",
                    "payload": {
                        "attachment_id": attachmentId
                    }
                }
            };
            bot.replyWithTyping(message, image);
        }
    });
});

controller.hears(['code'], 'message_received,facebook_postback', function(bot, message) {
    controller.api.messenger_profile.get_messenger_code(2000, function (err, url) {
        if(err) {
            // Error
        } else {
            var image = {
                "attachment":{
                    "type":"image",
                    "payload":{
                        "url": url
                    }
                }
            };
            bot.replyWithTyping(message, image);
        }
    });
});

controller.hears(['quick'], 'message_received', function(bot, message) {

    bot.replyWithTyping(message, {
        text: 'Hey! This message has some quick replies attached.',
        quick_replies: [
            {
                "content_type": "text",
                "title": "Yes",
                "payload": "yes",
            },
            {
                "content_type": "text",
                "title": "No",
                "payload": "no",
            }
        ]
    });

});

controller.hears(['^hello', '^hi'], 'message_received,facebook_postback', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.replyWithTyping(message, 'Hello ' + user.name + '!!');
        } else {
            bot.replyWithTyping(message, 'Hello.');
        }
    });
});

controller.hears(['silent push reply'], 'message_received', function(bot, message) {
    reply_message = {
        text: "This message will have a push notification on a mobile phone, but no sound notification",
        notification_type: "SILENT_PUSH"
    }
    bot.replyWithTyping(message, reply_message)
})

controller.hears(['no push'], 'message_received', function(bot, message) {
    reply_message = {
        text: "This message will not have any push notification on a mobile phone",
        notification_type: "NO_PUSH"
    }
    bot.replyWithTyping(message, reply_message)
})

controller.hears(['structured'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {
        convo.ask({
            attachment: {
                'type': 'template',
                'payload': {
                    'template_type': 'generic',
                    'elements': [
                        {
                            'title': 'Classic White T-Shirt',
                            'image_url': 'http://petersapparel.parseapp.com/img/item100-thumb.png',
                            'subtitle': 'Soft white cotton t-shirt is back in style',
                            'buttons': [
                                {
                                    'type': 'web_url',
                                    'url': 'https://petersapparel.parseapp.com/view_item?item_id=100',
                                    'title': 'View Item'
                                },
                                {
                                    'type': 'web_url',
                                    'url': 'https://petersapparel.parseapp.com/buy_item?item_id=100',
                                    'title': 'Buy Item'
                                },
                                {
                                    'type': 'postback',
                                    'title': 'Bookmark Item',
                                    'payload': 'White T-Shirt'
                                }
                            ]
                        },
                        {
                            'title': 'Classic Grey T-Shirt',
                            'image_url': 'http://petersapparel.parseapp.com/img/item101-thumb.png',
                            'subtitle': 'Soft gray cotton t-shirt is back in style',
                            'buttons': [
                                {
                                    'type': 'web_url',
                                    'url': 'https://petersapparel.parseapp.com/view_item?item_id=101',
                                    'title': 'View Item'
                                },
                                {
                                    'type': 'web_url',
                                    'url': 'https://petersapparel.parseapp.com/buy_item?item_id=101',
                                    'title': 'Buy Item'
                                },
                                {
                                    'type': 'postback',
                                    'title': 'Bookmark Item',
                                    'payload': 'Grey T-Shirt'
                                }
                            ]
                        }
                    ]
                }
            }
        }, function(response, convo) {
            // whoa, I got the postback payload as a response to my convo.ask!
            convo.next();
        });
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'message_received', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.replyWithTyping(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'message_received', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.replyWithTyping(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.replyWithTyping(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.replyWithTyping(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.replyWithTyping(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});

controller.hears(['shutdown'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'], 'message_received', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.replyWithTyping(message,
            ':|] I am a bot. I have been running for ' + uptime + ' on ' + hostname + '.');
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
