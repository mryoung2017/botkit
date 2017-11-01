function GAD(user_data) {
  var session_data = require('../storage/sessions/'+user_data.last_session+'.json')
  var Gad_answers = [];
  for (var i = 0; i < session_data.messages.length; i++) {
    session_data.messages[i].tag
    if (session_data.messages[i].tag != undefined && session_data.messages[i].tag === "GAD") {
      Gad_answers.push(session_data.messages[i].content)
    }
  }
  var total_score = 0;
  for (var i = 0; i < Gad_answers.length; i++) {
    switch (Gad_answers[i]) {
      case "Not at all sure":
        break;
      case "Several days":
        total_score += 1;
        break;
      case "Over 1/2 of the days":
        total_score += 2;
        break;
      case "Nearly every day":
        total_score += 3;
        break;
      default:
        console.error("quick reply doesn't match the specified values in the GAD portion");
    }
  }
  console.log("Resultat du GAD est de "+ total_score);
  return ("your result is "+total_score)
  // if (total_score >= 15) {
  //   return "With the answers provided to all the questions asked, it appears to us that you seem to be presenting a severe anxiety that is strongly disabling you in your day to day life, causing you lots of problems."
  // }
  // else {
  //   return ""
  // }
}
module.exports = GAD;
