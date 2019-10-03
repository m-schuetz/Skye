
var updateVRControllers = function(){
	if(vr.isActive()){
		let snLeft = $("vr.controller.left");
		let snRight = $("vr.controller.right");

		//{ // update button states
		//	let stateLeft = vr.getControllerStateLeft();
		//	let stateRight = vr.getControllerStateRight();
		//}

		if(false){ // update pose
			let rightPose = vr.getRightControllerPose();
			let leftPose = vr.getLeftControllerPose();

			if(rightPose){
				snRight.transform.set(rightPose);
				snRight.world.set(rightPose);
				snRight.visible = true;
			}else{
				snRight.visible = false;
			}

			if(leftPose){
				snLeft.transform.set(leftPose);
				snLeft.world.set(leftPose);
				snLeft.visible = true;
			}else{
				snLeft.visible = false;
			}
		}

	}else{
		let snLeft = $("vr.controller.left");
		let snRight = $("vr.controller.right");

		if(snLeft) snLeft.visible = false;
		if(snRight) snRight.visible = false;
	}
};

var updateCamera = function(){

	let {near, far} = camera;

	//let [near, far] = [1000, 1000];

	//log(camera.fov);

	if(vr.isActive()){
		
		//let [near, far] = [1, 1000];
		let hmdPose = new Matrix4().set(vr.getHMDPose());
		let leftProj = new Matrix4().set(vr.getLeftProjection(near, far));
		let rightProj = new Matrix4().set(vr.getRightProjection(near, far));

		camera.position = new Vector3(0, 0, 0).applyMatrix4(hmdPose);
		camera.transform = hmdPose;
		camera.world = hmdPose;
		camera.updateProjectionMatrix();
		//camera.projectionMatrix = rightProj;
		camera.fov = 90;

		let size = vr.getRecommmendedRenderTargetSize();
		camera.size = size;
	}else{
		camera.updateMatrixWorld();
		controls.update(window.timeSinceLastFrame);

		camera.position.copy(view.position);
		camera.updateMatrixWorld();
		camera.lookAt(view.getPivot());
		camera.updateMatrixWorld();

		camera.size = {width: window.width, height: window.height};
	}

	camera.updateProjectionMatrix();

	//log(camera.projectionMatrix.elements);
};

var updateSpot = function(){

	return;
	
	let nodes = [
		$("spot_6")
	];

	for(let node of nodes){
		let t = now();
		let y = 1 + 0.5 * Math.sin(3 * t);

		node.position.y = y;
		node.updateMatrixWorld();
	}


	return;


};

// if($("test_brush")){

// 	let brushNode = $("test_brush");

// 	brushNode.buffer.count = 0;

// }

var lastDragPos = null;
var dragStartTime = null;
var updateControllerBrushing = function(){

	let snRight = $("vr.controller.right");

	if(!vr.isActive() || snRight == null || snRight.visible === false){
		return;
	}

	let posWorld = snRight.position.clone().applyMatrix4(snRight.world);
	let state = vr.getControllerStateRight();

	if(state.pressed[OVRButtonID.SteamVR_Trigger]){
		
		if(lastDragPos === null){
			lastDragPos = posWorld;
			return;
		}

		if(dragStartTime === null){
			dragStartTime = now();
		}

		let lineResolution = 0.01;
		let pointsPerStop = 50;
		let spreadRadius = 0.01;

		let distance = posWorld.distanceTo(lastDragPos);
		if(distance < lineResolution){
			return;
		}

		let brushNode = $("test_brush");

		if(!brushNode){
			return;
		}

		let stride = brushNode.buffer.stride;

		let data = new ArrayBuffer(pointsPerStop * stride);
		let view = new DataView(data);

		let t = now();
		let tSinceStart = now() -  dragStartTime;
		let px = posWorld.x;
		let py = posWorld.y;
		let pz = posWorld.z;

		//log(tSinceStart);
		//spreadRadius *= 5 * ( Math.abs(Math.sin(10 * tSinceStart )));

		

		let spectral = [
			new Vector3(158,1,66),
			new Vector3(213,62,79),
			new Vector3(244,109,67),
			new Vector3(253,174,97),
			new Vector3(254,224,139),
			new Vector3(255,255,191),
			new Vector3(230,245,152),
			new Vector3(171,221,164),
			new Vector3(102,194,165),
			new Vector3(50,136,189),
			new Vector3(94,79,162),
		];

		let spectralIndex = parseInt(Math.min((t % 1) * spectral.length, spectral.length - 1));
		// log(spectralIndex);
		let spectralColor = spectral[spectralIndex];

		spreadRadius = 0.000001;
		spreadRadius = 0.01;

		for(let i = 0; i < pointsPerStop; i++){

			let x = px + 2 * (Math.random() - 0.5) * spreadRadius;
			let y = py + 2 * (Math.random() - 0.5) * spreadRadius;
			let z = pz + 2 * (Math.random() - 0.5) * spreadRadius;

			let dp = Math.sqrt(
				(px - x) ** 2 + 
				(py - y) ** 2 + 
				(pz - z) ** 2);
			//let dn = dp / spreadRadius;

			size = 25;

			let [r, g, b, a] = [...spectralColor.toArray(), 255];
			//let [r, g, b, a] = [255, 0, 0, 255];
			//let [r, g, b, a] = [0, 255, 0, 255];


			view.setFloat32(stride * i + 0, x, true);
			view.setFloat32(stride * i + 4, y, true);
			view.setFloat32(stride * i + 8, z, true);

			view.setFloat32(stride * i + 12, px, true);
			view.setFloat32(stride * i + 16, py, true);
			view.setFloat32(stride * i + 20, pz, true);

			view.setFloat32(stride * i + 24,  r / 255.0, true);
			view.setFloat32(stride * i + 28,  g / 255.0, true);
			view.setFloat32(stride * i + 32,  b / 255.0, true);
			view.setFloat32(stride * i + 36,  a / 255.0, true);

			view.setFloat32(stride * i + 40, size, true);
			view.setFloat32(stride * i + 44, t, true);
			view.setFloat32(stride * i + 48, Math.random(), true);

		}


		brushNode.addData(data);
		lastDragPos = posWorld;

	}else{
		lastDragPos = null;
		dragStartTime = null;
	}

	
};


var tmDragStart = null;
var updateTriggerMove = function(){

	let snRight = $("vr.controller.right");

	if(!vr.isActive() || snRight == null || snRight.visible === false){
		return;
	}

	let nodes = [
		$("endeavor_clod"), 
		$("endeavor_oct"),
		$("matterhorn120_oct"),
		$("matterhorn120_clod"),
		$("spot_endeavor"),
		$("spot_endeavor_2"),
		$("spot_matterhorn"),
		$("tup"),
	].filter(node => node !== null);

	let triggerPosWorld = snRight.position.clone().applyMatrix4(snRight.world);

	//let nodesPosWorld = nodes.map( node => new Vector3(0, 0, 0).applyMatrix4(node.transform));

	{ // RIGHT CONTROLLER
		let state = vr.getControllerStateRight();

		if(state.pressed[OVRButtonID.Axis0]){
			let [x, y] = state.axis;

			let a = (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);

			let s1 = Math.PI / 2;
			let s2 = s1 + 2 * Math.PI / 3;
			let s3 = s2 + 2 * Math.PI / 3;

			if(a > s1 && a < s2){
				//USER_STUDY_RENDER_OCTREE = true;
				//USER_STUDY_RENDER_CLOD = false;
				//USER_STUDY_OCTREE_MODE = "ADAPTIVE";
				US_setMethodA();
			}else if(a > s2 && a < s3){
				//USER_STUDY_RENDER_OCTREE = false;
				//USER_STUDY_RENDER_CLOD = true;
				US_setMethodC();
			}else{
				//USER_STUDY_RENDER_OCTREE = true;
				//USER_STUDY_RENDER_CLOD = false;
				//USER_STUDY_OCTREE_MODE = "FIXED";
				US_setMethodB();
			}


		}

		let triggerPressed = state.pressed[OVRButtonID.SteamVR_Trigger];
		if(triggerPressed && tmDragStart === null){

			let nodeTransforms = new Map(nodes.map( node => [node, node.world.clone()] ));

			tmDragStart = {
				triggerPos: triggerPosWorld,
				nodeTransforms: nodeTransforms,
				//nodePos: nodePosWorld,
				//nodeTransform: node.transform.clone()
			};

		}else if(triggerPressed){

			let diff = new Vector3().subVectors(triggerPosWorld, tmDragStart.triggerPos);

			

			//let newNodeTransform = tmDragStart.nodeTransform.multiply(diffTransform);
			//let newNodeTransform = diffTransform.multiply(tmDragStart.nodeTransform);

			for(let node of nodes){
				let diffTransform = new Matrix4().makeTranslation(diff.x, diff.y, diff.z);
				let startNodeTransform = tmDragStart.nodeTransforms.get(node);
				let newNodeTransform = diffTransform.multiply(startNodeTransform);

				node.world.copy(newNodeTransform);

				//log(node.name);
			}

		}else{
			tmDragStart = null;
		}
		
	}


	{ // LEFT CONTROLLER
		let state = vr.getControllerStateLeft();

		if(state.pressed[OVRButtonID.Axis0]){
			let [x, y] = state.axis;

			let a = (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);

			let s1 = 0;
			let s2 = Math.PI;

			if(a > s1 && a < s2){
				USER_STUDY_LOD_MODIFIER += 0.05;
				USER_STUDY_LOD_MODIFIER = Math.min(USER_STUDY_LOD_MODIFIER, 1);
			}else{
				USER_STUDY_LOD_MODIFIER -= 0.05;
				USER_STUDY_LOD_MODIFIER = Math.max(USER_STUDY_LOD_MODIFIER, -1);
			}
		}
	}

	

}


var selectedNode = null;
var desktopUV = new Vector3();
var updatePicking = function(){

	let snRight = $("vr.controller.right");

	if(!vr.isActive() || snRight == null || snRight.visible === false){
		return;
	}

	let posWorld = snRight.position.clone().applyMatrix4(snRight.world);

	if(selectedNode){

		let state = vr.getControllerStateRight();

		if(!state.pressed[OVRButtonID.SteamVR_Trigger]){

			if(desktopUV){
				let text = `\$("${selectedNode.name}")`;

				let x = parseInt(desktopUV.x * 1280);
				let y = parseInt(720 - desktopUV.y * 720);

				insertTextAt(text, x, y);
			}

			selectedNode = null;
		}else{
			let tmpNode = new MeshNode("tmp", selectedNode.buffer, selectedNode.material);
			tmpNode.position.copy(posWorld);
			tmpNode.position.y += 0.05;
			let s = 0.04;
			tmpNode.scale.set(s, s, s);

			let t = now();
			let dx = tmpNode.position.x + Math.cos(t);
			let dz = tmpNode.position.z + Math.sin(t);

			tmpNode.lookAt(dx, tmpNode.position.y, dz);

			tmpNode.updateMatrixWorld();

			scene.drawNode("intersection", {
				node: tmpNode,
				position: posWorld, 
				scale: 0.01,
			});
		}

		
	}

	//let posWorld = snRight.position.clone().applyMatrix4(snRight.world);
	let dirWorld = snRight.getDirectionWorld();

	{
		let dir4 = new Vector4(0, -0, -1, 0).normalize();

		dir4.applyMatrix4(snRight.world);

		dirWorld = new Vector3(dir4.x, dir4.y, dir4.z);
	}


	let endWorld = new Vector3();

	endWorld.x = posWorld.x + 10 * dirWorld.x;
	endWorld.y = posWorld.y + 10 * dirWorld.y;
	endWorld.z = posWorld.z + 10 * dirWorld.z;
	let color = 0xFF00FFFF;

	lines = [
		posWorld.x, posWorld.y, posWorld.z, color,
		endWorld.x, endWorld.y, endWorld.z, 0x000000FF,
	];

	lines = [];
	let p = posWorld.clone();
	let d = dirWorld.clone();
	let res = 1;
	let grav = 0.02;

	for(let i = 0; i < 40; i++){

		let p1 = p.clone();
		let p2 = p1.clone().add(d.clone().multiplyScalar(res));

		p.copy(p2);
		
		d.y = d.y - grav;

		let c = 0xFF0000FF;

		lines.push(p1.x, p1.y, p1.z, c);
		lines.push(p2.x, p2.y, p2.z, c);

		//if(p2.y < 0){
		//	break;
		//}
	}

	let ray = new Ray(posWorld, dirWorld);

	let closest = {
		I: null,
		distance: Infinity,
		node: null,
	};

	scene.root.traverse( node => {

		

		let box = node.boundingBoxWorld;

		//let I = ray.intersectBox(box);
		let I = Intersections.boxLinesIntersection(box, lines);



		if(!I){
			return false;
		}

		let campos = new Vector3(0, 0, 0).applyMatrix4(camera.world);
		let distance = campos.distanceTo(I);

		if(distance < closest.distance){

			if(node instanceof MeshNode){
				closest = {
					I: I,
					distance: distance,
					node: node,
				};
			}
		}else{
			return false;
		}

		if(node.name === "desktop_mirror"){
			I = node.intersect(ray);

			if(!I){
				return;
			}

			let box = node.boundingBoxWorld;
			let boxSize = box.getSize();

			let uv = new Vector3().subVectors(I, box.min);
			uv.x = uv.x / boxSize.x;
			uv.y = uv.y / boxSize.y;
			uv.z = uv.z / boxSize.z;

			desktopUV = uv;

		}else{
			desktopUV = null;
		}

		return true;
		
	});

	
	//log(closest.node.constructor.name);
	if(closest.node instanceof MeshNode){

		let node = closest.node;
		let I = closest.I;
		let distance = closest.distance;
		let box = node.boundingBoxWorld;

		let state = vr.getControllerStateRight();

		if(selectedNode == null && node instanceof MeshNode && state.pressed[OVRButtonID.SteamVR_Trigger]){
			selectedNode = node;
		}

		scene.drawBox("intersection", box);

		let numLines = lines.length / (4 * 2);

		for(let i = 0; i < numLines; i++){

			let startXYZ = lines.slice(8 * i, 8 * i + 3);
			let endXYZ = lines.slice(8 * i + 4, 8 * i + 7);

			let start = new Vector3(...startXYZ);
			let end = new Vector3(...endXYZ);


			if(start.distanceTo(I) < start.distanceTo(end)){
				lines = lines.slice(0, i * 8 + 4);
				lines.push(I.x, I.y, I.z, 0xFF0000FF);

				

				break;
			}

		}

		scene.drawSphere("I", {
			position: I,
			scale: 0.01 * distance,
		});

	}

	scene.drawLines("controller", lines);

}

var lastUpdate = now();

var update = function() {

	//return;1.177

	//CLOD = 1 + 0.3 * Math.sin(now());
	//POINT_BUDGET = 1.5 * 1000 * 1000 + 0.1 * 1000 * 1000* Math.sin(now());;

	//{
	//	var t = now();
	//	
	//	CLOD = 1.5 + Math.cos(t) * 0.5;

	//	POINT_BUDGET = 2 * 1000 * 1000 + Math.cos(t) * 1 * 1000 * 1000;
	//}

	let start = now();

	for(let listener of listeners.update){
		listener();
	}

	updateCamera();

	updateVRControllers();

	updateSpot();

	updateControllerBrushing();

	//updatePicking();

	//updateTriggerMove();
	
	

	//{
	//	

	//	updateCLOD(pointcloud, view, proj, target);
	//}


	//if( (now() - lastUpdate) > 0.1){
	//	updateCLOD();

	//	lastUpdate = now();
	//}


	scene.root.update();

	let duration = now() - start;
	let durationMS = (duration * 1000).toFixed(3);
	setDebugValue("duration.cp.update", `${durationMS}ms`);

	{
		//log(view.position);
		//log(view.getPivot());

		let pos = view.position.toArray().map(v => v.toFixed(3)).join(", ");
		let target = view.getPivot().toArray().map(v => v.toFixed(3)).join(", ");

		setDebugValue("setView", 
`view.set(
	[${pos}], 
	[${target}]
);`);

	}
	
};

// var update = function() {

// }

"update.js"