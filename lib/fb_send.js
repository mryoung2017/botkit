function say(conv, msg){
	return new Promise(function(resolve, reject){
		a = conv.say(msg);
		if (a) {
			resolve(a)
		}
	})
}


function fb_send(fb_bot, message, fb_message) {

	try{
			var sent_at = [];
			if ( fb_message.length > 1) {
				fb_bot.startConversation(message, function(err,convo) {
					//For each message
					for (let m=0; m < fb_message.length; m++ ) {
						say(convo, fb_message[m].content)
						.then(function(){
							if (m < (fb_message.length - 1) ) {convo.next()};
							if (m == (fb_message.length - 1) ) {convo.stop();sent_at = new Date()};
						})
						.catch(function(err){
							console.log(err)
						});
					};
				});
			}
			else {
				fb_bot.replyWithTyping(message, fb_message[0].content);
				sent_at = new Date();
			};
			return sent_at;
	}catch(err){
		console.log(err);
	}
};

module.exports = fb_send;
