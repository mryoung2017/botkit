
function node_search(dialog, current_node, current_node_childs, current_node_fallback, message){
	if (current_node_childs != null) {
		//Check in each child node if title is matched
		for (let i=0; i < current_node_childs.length; i++) {

			var child_node = dialog.child_nodes[parseInt(current_node_childs[i])];

			// If title is matched :
			if (child_node.title.toLowerCase() === message.text.toLowerCase()) {

				var has_fallback_or_child = child_node.childs != null && child_node.childs.length > 0
				|| child_node.fallback != null && child_node.fallback.length > 0;

				//if found child node has childs
				if (has_fallback_or_child){
					return {
						id: child_node.uuid,
						input_context: child_node.id,
						output: child_node.output,
						tag: child_node.tag
					}
				}
				//if found node has NO childs and NO fallback
				else {
					return {
						id: child_node.uuid,
						input_context : "null",
						output : child_node.output,
						tag: child_node.tag
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

				var child_node = dialog.child_nodes[parseInt(current_node_childs[i])];
				// If intent is matched :
				if (child_node.intent_name === message.nlpResponse.result.action) {

					var has_fallback_or_child =
					child_node.childs != null
					&& child_node.childs.length > 0
					|| child_node.fallback != null
					&& child_node.fallback.length > 0;

					//if found child node has childs
					if (has_fallback_or_child){
						return {
							id: child_node.uuid,
							input_context : child_node.id,
							output : child_node.output,
							tag: child_node.tag
						}
					}
					//if found node has NO childs and NO fallback
					else {
						return {
							id: child_node.uuid,
							input_context : "null",
							output : child_node.output,
							tag: child_node.tag
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
	if (search_in_fallback_node){
		console.log("fallback node found : "+parseInt(current_node_fallback));

		var fallback_node = dialog.fallback_nodes[parseInt(current_node_fallback)];

		var not_default_fallback = fallback_node.parent_node != null
		&& fallback_node.parent_node.length > 0;

		if (not_default_fallback) {

			var has_fallback_or_child =
			fallback_node.childs != null
			&&	fallback_node.childs.length > 0
			|| fallback_node.fallback != null
			&& fallback_node.fallback.length > 0;

			if (has_fallback_or_child) {
				return {
					id: fallback_node.uuid,
					input_context : fallback_node.id,
					output : fallback_node.output,
					tag: fallback_node.tag
				}
			}
			else {
				return {
					id: fallback_node.uuid,
					input_context : "null",
					output : fallback_node.output,
					tag: fallback_node.tag
				}
			}
		}
	}
	// If current node has no child or the intent was not matched in child nodes
	else if (current_node_childs == null || search_in_root_nodes) {
		//Check in each root node if title is matched
		for (var i=0; i < dialog.root_nodes.length; i++) {

			var root_node = dialog.root_nodes[i];
			// If intent is matched
			if (root_node.title.toLowerCase() === message.text.toLowerCase()) {

				var has_fallback_or_child =
				root_node.childs != null && root_node.childs.length > 0
				||	root_node.fallback != null && root_node.childs.fallback > 0;

				if (has_fallback_or_child){
					return {
						id: root_node.uuid,
						input_context : root_node.id,
						output : root_node.output,
						tag: root_node.tag
					}
				}
				else {
					return {
						id: root_node.uuid,
						input_context : "null",
						output : root_node.output,
						tag: root_node.tag
					}
				}
				search_in_root_nodes = false;
				break;
			}
		}
		//Check in each root node if intent is matched
		for (var i=0; i < dialog.root_nodes.length; i++) {

			var root_node = dialog.root_nodes[i];

			if (root_node.intent_name === message.nlpResponse.result.action) {

				var has_fallback_or_child =
				root_node.childs != null && root_node.childs.length > 0
				||	root_node.fallback != null && root_node.childs.fallback > 0;

				if (has_fallback_or_child){
					return {
						id: root_node.uuid,
						input_context : root_node.id,
						output : root_node.output,
						tag: root_node.tag
					}
				}
				else {
					return {
						id: root_node.uuid,
						input_context : "null",
						output : root_node.output,
						tag: root_node.tag
					}
				}
				search_in_root_nodes = false;
				break;
			}
			// If no intent and title matched at all, give the default fallback:
			else {
				console.log('no node found');
				return {
					id: dialog.fallback_nodes[0].uuid,
					input_context : current_node,
					output : dialog.fallback_nodes[0].output,
					tag: "null"
				}
			}
		}
	}
};


module.exports = node_search;
