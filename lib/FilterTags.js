var GAD = require('./mryoungfunctions/GAD.js');

function FilterTags(string, user_data) {

  var getFunctionCalls = function(str) {
    let fcts = [];
    let fct_starts = [];
    let fct_ends = [];

    //For each character, search for the tag %%
    for (i = 0; i < str.length; ++i) {
      if (str.substring(i, i + 2) == '%%') {
        //Gets the index of the beginning and end of the call in the string
        if (fct_starts.length == fct_ends.length) { //Push every two tags
          fct_starts.push(i + 2);
        }
        else {
          fct_ends.push(i);
        }
      }
    }
    // Checks if the number of tags is pair(i.e: if they are closed)
    if (fct_starts.length == fct_ends.length) {
      let new_str = str.slice(0, fct_starts[0]); //removes the calls from the string
      for (var i = 0; i < fct_starts.length; i++) {
        new_str += str.substring(fct_ends[i] +2,fct_starts[i+1]);
        let fct = str.substring(fct_starts[i],fct_ends[i]);
        fcts.push(fct); //push the functions to call later
      }
      return [fcts, new_str];
    }
    else {
      console.error('One of the function call is not closed or not open');
    }
  }

  var callfonction = function(fct_call) {
    return Promise.resolve(eval(fct_call));
  }

  let function_calls = getFunctionCalls(string);
  let promesses = function_calls[0].map(objet => callfonction(objet));
  let new_string = function_calls[1];

  return Promise.all(promesses)
  .then(function(results) {
    //For each result of the functions called, replace the %% by the result
    for (var i = 0; i < results.length; i++) {
      new_string = new_string.replace(/%%/, results[i]);
    };
    return new_string;
  })
  .catch((err) => {
    console.log(err);
  });
};

module.exports = FilterTags;
