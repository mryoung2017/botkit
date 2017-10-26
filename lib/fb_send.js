var FilterTags = require('./FilterTags.js');

function fb_send(fb_bot, message, fb_message, user_data) {

  var say = function(conv, msg){
		return Promise.resolve(conv.say(msg))
	}

	// var sent_at = [];

	if ( fb_message.length > 1) {
		fb_bot.startConversation(message, function(err,convo) {
			//For each message
			for (let m=0; m < fb_message.length; m++ ) {
        switch(fb_message[m].type){
          case "0":
            return FilterTags(fb_message[m].content, user_data)
            .then(function(filtered_message) {
              say(convo, filtered_message)
              .then(function(){
                if (m < (fb_message.length - 1) ) {convo.next()};
                if (m == (fb_message.length - 1) ) {
									convo.stop();
									return new Date();
								};
              })
            })
          case "2":
            return FilterTags(fb_message[m].content.text, user_data)
            .then(function(filtered_message) {
              fb_message[m].content.text = filtered_message;
              say(convo, fb_message[m].content)
              .then(function(){
                if (m < (fb_message.length - 1) ) {convo.next()};
                if (m == (fb_message.length - 1) ) {
									convo.stop();
									return new Date();
								};
              })
            })
        }
			};
		});
	}
	else {
    switch(fb_message[0].type){
      case "0":
    		return FilterTags(fb_message[0].content, user_data)
    		.then(function(filtered_message) {
    			fb_bot.replyWithTyping(message, filtered_message);
					return new Date();
    		})
      case "2":
        return FilterTags(fb_message[0].content.text, user_data)
        .then(function(filtered_message) {
          fb_message[0].content.text = filtered_message;
          fb_bot.replyWithTyping(message, fb_message[0].content);
					return new Date();
        })
    }
	};
};

module.exports = fb_send;
