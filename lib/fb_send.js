// Facebook sender
function fb_send(fb_bot, message, fb_message) {
	
	try{
			if ( fb_message.length > 1) {
				fb_bot.startConversation(message, function(err,convo) {
					
					//For each message
					for (let m=0; m < fb_message.length; m++ ) {
						
						convo.say(fb_message[m].content)
						.then(function(){
							if (m < (fb_message.length - 1) ) { convo.next() };
							if (m == (fb_message.length - 1) ) { convo.stop() };
						})
						.catch(function(err){
							console.log(err)
						});
						
					};
				});
			}
			else {
				fb_bot.replyWithTyping(message, fb_message.content);
			}
		
	}catch(err){
		console.log(err);
	}
};

module.exports = fb_send; 