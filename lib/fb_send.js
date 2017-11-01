var FilterTags = require('./FilterTags.js');

function fb_send(fb_bot, message, found_node, user_data) {

  var fb_message = found_node.output;

  var time_stamp = new Date(message.timestamp);

  var say = function(conv, msg){
    return new Promise(() => {return conv.say(msg)});
  }

  var getMessagesToFilter = function(fb_msg){
    var filtered_content = [];
    for (var i = 0; i < fb_msg.length; i++) {
      if (fb_msg[i].type == "0") {
        filtered_content.push(fb_msg[i].content);
      }
      else if (fb_msg[i].type == "2") {
        filtered_content.push(fb_msg[i].content.text);
      }
    }
    return filtered_content
  }

  var replaceTagsInMessages = function(fb_msg, filtered_content) {
    var filtered_msg = fb_msg;
    for (var i = 0; i < filtered_msg.length; i++) {
      if (filtered_msg[i].type == "0") {
        filtered_msg[i].content = filtered_content[i];
      }
      else if (filtered_msg[i].type == "2") {
        filtered_msg[i].content.text = filtered_content[i];
      }
    }
    return filtered_msg
  }

  let messages_to_filter = getMessagesToFilter(fb_message);
  let sync_promises = messages_to_filter.map(objet => FilterTags(objet, user_data));

  // var sent_at = [];

  if ( fb_message.length > 1) {
    var convo = {};
    // Resolves synchronously all filtering of tags in messages
    return Promise.all(sync_promises)
    // Then starts a conversation and replace all tags in the messages
    .then(function(filtered_content) {
      fb_bot.startConversation(message, (err,conv) => {convo = conv})
      return replaceTagsInMessages(fb_message, filtered_content);
    })
    // Then creates a promise for each message to handle asynchronously to be sent one by one
    .then(function(filtered_messages){

      let async_promises = filtered_messages.map(objet => say(convo, objet.content));
      var result = async_promises[0];

      async_promises.forEach(function(prom) {
        if(prom !== result) {
          result = result.then(function() {
            convo.next();
            return prom;
          });
        }
      });
      result;
      return;
    })
    .then(function(){
      let sent_at = new Date();
      var exchange_to_store = [{
        mess_uuid: message.mid,
        content: message.text,
        received_at: time_stamp,
        intent: message.intent,
        entity: message.entities,
        resp_uuid: found_node.id,
        tag: found_node.tag,
        sent_at: sent_at
      }];
      return exchange_to_store;
    })
    .catch((err) => {
      console.log(err);
    });
  }
  // If there is only one message in the content :
  else {
    // If content is only text
    if (fb_message[0].type === "0") {
      return FilterTags(fb_message[0].content, user_data)
      .then(function(filtered_message) {
        fb_bot.replyWithTyping(message, filtered_message);
      })
      .then(function() {
        let sent_at = new Date();
        var exchange_to_store = [{
          mess_uuid: message.mid,
          content: message.text,
          received_at: time_stamp,
          intent: message.intent,
          entity: message.entities,
          resp_uuid: found_node.id,
          tag: found_node.tag,
          sent_at: sent_at
        }];
        return exchange_to_store;
      })
    }
    // If content is quickreplies
    else if (fb_message[0].type === "2") {
      return FilterTags(fb_message[0].content.text, user_data)
      .then(function(filtered_message) {
        fb_message[0].content.text = filtered_message;
        fb_bot.replyWithTyping(message, fb_message[0].content);
      })
      .then(function() {
        let sent_at = new Date();
        var exchange_to_store = [{
          mess_uuid: message.mid,
          content: message.text,
          received_at: time_stamp,
          intent: message.intent,
          entity: message.entities,
          resp_uuid: found_node.id,
          tag: found_node.tag,
          sent_at: sent_at
        }];
        return exchange_to_store;
      })
    }
  };
};

module.exports = fb_send;
