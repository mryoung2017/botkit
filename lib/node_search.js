
function node_search(dialog, current_node, current_node_childs, current_node_fallback, message){
	if (current_node_childs != null) {
		//Check in each child node if title is matched
		for (let i=0; i < current_node_childs.length; i++) {
			// If title is matched :
			if (dialog.child_nodes[parseInt(current_node_childs[i])].title === message.text) {

				//if found child node has childs
				if (dialog.child_nodes[parseInt(current_node_childs[i])].childs != null && dialog.child_nodes[parseInt(current_node_childs[i])].childs.length > 0){
					return {
						id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
						input_context : dialog.child_nodes[parseInt(current_node_childs[i])].id,
						output : dialog.child_nodes[parseInt(current_node_childs[i])].output
						}
				}
				//if found node has NO childs
				else if (dialog.child_nodes[parseInt(current_node_childs[i])].childs == null || dialog.child_nodes[parseInt(current_node_childs[i])].childs.length == 0) {

					return {
						id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
						input_context : "null",
						output : dialog.child_nodes[parseInt(current_node_childs[i])].output
						}
				};
				search_in_root_nodes = false;
				search_in_fallback_node = false;
				break;
			}
			// If no title is matched in child nodes :
			else {
				var search_intent_in_child_nodes = true;
			}
		};
		if (search_intent_in_child_nodes) {
		//Check in each child node if intent is matched
			for (let i=0; i < current_node_childs.length; i++) {
				// If intent is matched :
				if (dialog.child_nodes[parseInt(current_node_childs[i])].intent_name === message.nlpResponse.result.action) {

					//if found child node has childs
					if (dialog.child_nodes[parseInt(current_node_childs[i])].childs != null && dialog.child_nodes[parseInt(current_node_childs[i])].childs.length > 0){
						return {
							id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
							input_context : dialog.child_nodes[parseInt(current_node_childs[i])].id,
							output : dialog.child_nodes[parseInt(current_node_childs[i])].output
							}
					}
					//if found node has NO childs
					else if (dialog.child_nodes[parseInt(current_node_childs[i])].childs == null || dialog.child_nodes[parseInt(current_node_childs[i])].childs.length == 0) {

						return {
							id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
							input_context : "null",
							output : dialog.child_nodes[parseInt(current_node_childs[i])].output
							}
					};
					search_in_root_nodes = false;
					search_in_fallback_node = false;
					break;
				}
				// If no intent is matched in child nodes :
				else {
					if (current_node_fallback != "") {
						var search_in_fallback_node = true;
					}
					else {
						var search_in_root_nodes = true;
					}
				}
			}
		}
	};
	if (search_in_fallback_node){
		console.log("fallback node found : "+parseInt(current_node_fallback));
		return {
			id: dialog.fallback_nodes[parseInt(current_node_fallback)].uuid,
			input_context : current_node,
			output : dialog.fallback_nodes[parseInt(current_node_fallback)].output
			}
	}
	// If current node has no child or the intent was not matched in child nodes
	else if (current_node_childs == null || search_in_root_nodes) {
		//Check in each root node if intent is matched
		for (var i=0; i < dialog.root_nodes.length; i++) {
			// If intent is matched
			if (dialog.root_nodes[i].title === message.text) {
				if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length > 0 ){
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : dialog.root_nodes[i].id,
						output : dialog.root_nodes[i].output
						}
				}
				//if found root node has NO childs
				else if (dialog.root_nodes[i].childs == null || dialog.root_nodes[i].childs.length ==0 ) {
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : "null",
						output : dialog.root_nodes[i].output
						}
				}
				search_in_root_nodes = false;
				break;
			}
			else if (dialog.root_nodes[i].intent_name === message.nlpResponse.result.action) {
				//if found node has childs
				if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length > 0 ){
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : dialog.root_nodes[i].id,
						output : dialog.root_nodes[i].output
						}
				}
				//if found root node has NO childs
				else if (dialog.root_nodes[i].childs == null || dialog.root_nodes[i].childs.length ==0 ) {
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : "null",
						output : dialog.root_nodes[i].output
						}
				}
				search_in_root_nodes = false;
				break;
			}
			// If no intent matched at all
			else {

				console.log('no node found');
				return {
						id: dialog.fallback_nodes[0].uuid,
						input_context : current_node,
						output : dialog.fallback_nodes[0].output
						}
			}
		}
	};


}



module.exports = node_search;
