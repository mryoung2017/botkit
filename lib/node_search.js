
function node_search(dialog, current_node, current_node_childs, current_node_fallback, message){
	if (current_node_childs != null) {
		//Check in each child node if title is matched
		for (let i=0; i < current_node_childs.length; i++) {
			// If title is matched :
			if (dialog.child_nodes[parseInt(current_node_childs[i])].title.toLowerCase() === message.text.toLowerCase()) {

				//if found child node has childs
				if (dialog.child_nodes[parseInt(current_node_childs[i])].childs != null && dialog.child_nodes[parseInt(current_node_childs[i])].childs.length > 0){
					return {
						id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
						input_context: dialog.child_nodes[parseInt(current_node_childs[i])].id,
						output: dialog.child_nodes[parseInt(current_node_childs[i])].output,
						tag: dialog.child_nodes[parseInt(current_node_childs[i])].tag
						}
				}
				//if found node has NO childs but a fallback
				else if (dialog.child_nodes[parseInt(current_node_childs[i])].fallback != null || dialog.child_nodes[parseInt(current_node_childs[i])].fallback.length == 0) {
					return {
						id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
						input_context : dialog.child_nodes[parseInt(current_node_childs[i])].id,
						output : dialog.child_nodes[parseInt(current_node_childs[i])].output,
						tag: dialog.child_nodes[parseInt(current_node_childs[i])].tag
						}
				}
				//if found node has NO childs and NO fallback
				else {
					return {
						id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
						input_context : "null",
						output : dialog.child_nodes[parseInt(current_node_childs[i])].output,
						tag: dialog.child_nodes[parseInt(current_node_childs[i])].tag
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
							output : dialog.child_nodes[parseInt(current_node_childs[i])].output,
							tag: dialog.child_nodes[parseInt(current_node_childs[i])].tag
							}
					}
					//if found node has NO childs but a fallback
					else if (dialog.child_nodes[parseInt(current_node_childs[i])].fallback != null || dialog.child_nodes[parseInt(current_node_childs[i])].fallback.length == 0) {
						return {
							id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
							input_context : dialog.child_nodes[parseInt(current_node_childs[i])].id,
							output : dialog.child_nodes[parseInt(current_node_childs[i])].output,
							tag: dialog.child_nodes[parseInt(current_node_childs[i])].tag
							}
					}
					//if found node has NO childs and NO fallback
					else {
						return {
							id: dialog.child_nodes[parseInt(current_node_childs[i])].uuid,
							input_context : "null",
							output : dialog.child_nodes[parseInt(current_node_childs[i])].output,
							tag: dialog.child_nodes[parseInt(current_node_childs[i])].tag
							}
					};
					search_in_root_nodes = false;
					search_in_fallback_node = false;
					break;
				}
				// If no intent is matched in child nodes :
				else {
					if (current_node_fallback != null) {
						var search_in_fallback_node = true;
					}
					else {
						var search_in_root_nodes = true;
					}
				}
			}
		}
	};
	if (search_in_fallback_node || current_node_childs != null && current_node_childs.length == 0 && current_node_fallback != null){
		console.log("fallback node found : "+parseInt(current_node_fallback));
		if (dialog.fallback_nodes[parseInt(current_node_fallback)].parent_node.length > 0) {
			if (dialog.fallback_nodes[parseInt(current_node_fallback)].childs.length > 0 || dialog.fallback_nodes[parseInt(current_node_fallback)].fallback != null) {
				return {
					id: dialog.fallback_nodes[parseInt(current_node_fallback)].uuid,
					input_context : dialog.fallback_nodes[parseInt(current_node_fallback)].id,
					output : dialog.fallback_nodes[parseInt(current_node_fallback)].output,
					tag: dialog.fallback_nodes[parseInt(current_node_fallback)].tag
					}
			}
			else {
				return {
					id: dialog.fallback_nodes[parseInt(current_node_fallback)].uuid,
					input_context : "null",
					output : dialog.fallback_nodes[parseInt(current_node_fallback)].output,
					tag: dialog.fallback_nodes[parseInt(current_node_fallback)].tag
					}
			}
		}
		else {
			return {
				id: dialog.fallback_nodes[parseInt(current_node_fallback)].uuid,
				input_context : current_node,
				output : dialog.fallback_nodes[parseInt(current_node_fallback)].output,
				tag: dialog.fallback_nodes[parseInt(current_node_fallback)].tag
				}
		}
	}
	// If current node has no child or the intent was not matched in child nodes
	else if (current_node_childs == null || search_in_root_nodes) {
		//Check in each root node if intent is matched
		for (var i=0; i < dialog.root_nodes.length; i++) {
			// If intent is matched
			if (dialog.root_nodes[i].title.toLowerCase() === message.text.toLowerCase()) {
				if (dialog.root_nodes[i].childs != null && dialog.root_nodes[i].childs.length > 0 || dialog.root_nodes[i].fallback != null){
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : dialog.root_nodes[i].id,
						output : dialog.root_nodes[i].output,
						tag: dialog.root_nodes[i].tag
						}
				}
				//if found root node has NO childs
				else if (dialog.root_nodes[i].childs == null || dialog.root_nodes[i].childs.length ==0 ) {
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : "null",
						output : dialog.root_nodes[i].output,
						tag: dialog.root_nodes[i].tag
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
						output : dialog.root_nodes[i].output,
						tag: dialog.root_nodes[i].tag
						}
				}
				//if found root node has NO childs
				else if (dialog.root_nodes[i].childs == null || dialog.root_nodes[i].childs.length ==0 ) {
					return {
						id: dialog.root_nodes[i].uuid,
						input_context : "null",
						output : dialog.root_nodes[i].output,
						tag: dialog.root_nodes[i].tag
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
						output : dialog.fallback_nodes[0].output,
						tag: dialog.root_nodes[i].tag
						}
			}
		}
	};


}



module.exports = node_search;
