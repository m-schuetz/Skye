

var frameCount = 0;


var drawImage = function(texture, x, y){

};


var renderBox = function(box, view, proj, target){

	if(typeof renderLinesShader === "undefined"){
		let vsPath = "../../resources/shaders/lines.vs";
		let fsPath = "../../resources/shaders/lines.fs";
		let shader = new Shader([
			{type: gl.VERTEX_SHADER, path: vsPath},
			{type: gl.FRAGMENT_SHADER, path: fsPath},
		]);
		shader.watch();

		renderLinesShader = shader;
	}
	let shader = renderLinesShader;
	let shader_data = shader.uniformBlocks.shader_data;

	gl.useProgram(shader.program);

	// 12 lines, 2 vertices each line, for each node/box
	let numVertices = 12 * 2;
	let vertices = new Float32Array(numVertices * 4);
	let u32 = new Uint32Array(vertices);
	let color = 0xFF00FFFF;

	// uint32 bits to float bits, since we're feeding a float buffer
	color = new Float32Array(new Uint32Array([color]).buffer)[0];

	{
		let data = [
			// BOTTOM
			box.min.x, box.min.y, box.min.z, color,
			box.max.x, box.min.y, box.min.z, color,
			
			box.max.x, box.min.y, box.min.z, color,
			box.max.x, box.min.y, box.max.z, color,
			
			box.max.x, box.min.y, box.max.z, color,
			box.min.x, box.min.y, box.max.z, color,

			box.min.x, box.min.y, box.max.z, color,
			box.min.x, box.min.y, box.min.z, color,

			// TOP
			box.min.x, box.max.y, box.min.z, color,
			box.max.x, box.max.y, box.min.z, color,
			
			box.max.x, box.max.y, box.min.z, color,
			box.max.x, box.max.y, box.max.z, color,
			
			box.max.x, box.max.y, box.max.z, color,
			box.min.x, box.max.y, box.max.z, color,

			box.min.x, box.max.y, box.max.z, color,
			box.min.x, box.max.y, box.min.z, color,

			// CONNECTIONS
			box.min.x, box.min.y, box.min.z, color,
			box.min.x, box.max.y, box.min.z, color,
			
			box.max.x, box.min.y, box.min.z, color,
			box.max.x, box.max.y, box.min.z, color,
			
			box.max.x, box.min.y, box.max.z, color,
			box.max.x, box.max.y, box.max.z, color,

			box.min.x, box.min.y, box.max.z, color,
			box.min.x, box.max.y, box.max.z, color];

		vertices.set(data, 0);

	}

	let buffer = vertices.buffer;

	let vao = gl.createVertexArray();
	let vbo = gl.createBuffer();
	gl.bindVertexArray(vao);
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, buffer.byteLength, buffer, gl.DYNAMIC_DRAW);

	let transform = new Matrix4();
	transform.copy(Matrix4.IDENTITY);
	transform.multiply(proj).multiply(view);

	{
		shader_data.setFloat32Array("transform", transform.elements);

		//gl.bindBufferBase(gl.UNIFORM_BUFFER, 4, shader_data.bufferID);
		shader_data.bind();
		shader_data.submit();
	}

	//let mat32 = new Float32Array(16);
	//mat32.set(transform.elements);

	//gl.uniformMatrix4fv(/*shader.uniforms.uTransform*/ 1, 1, gl.FALSE, mat32);

	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 16, 0);
	gl.vertexAttribPointer(1, 3, gl.UNSIGNED_BYTE, gl.TRUE, 16, 12);

	gl.drawArrays(gl.LINES, 0, vertices.length / 4);

	gl.bindBuffer(gl.ARRAY_BUFFER, 0);
	gl.deleteBuffers(1, new Uint32Array([vbo]));
	gl.disableVertexAttribArray(0);
	gl.disableVertexAttribArray(1);
	gl.bindVertexArray(0);

};


var renderLines = function(lines, view, proj){

	if(typeof renderLinesShader === "undefined"){
		let vsPath = "../../resources/shaders/lines.vs";
		let fsPath = "../../resources/shaders/lines.fs";
		let shader = new Shader([
			{type: gl.VERTEX_SHADER, path: vsPath},
			{type: gl.FRAGMENT_SHADER, path: fsPath},
		]);
		shader.watch();

		renderLinesShader = shader;
	}
	let shader = renderLinesShader;
	let shader_data = shader.uniformBlocks.shader_data;

	gl.useProgram(shader.program);
	
	
	let numVertices = lines.length / 2;
	let vertices = new Float32Array(numVertices * 4);
	let u32 = new Uint32Array(vertices);
	let color = 0xFF00FFFF;

	for(let i = 0; i < numVertices; i++){

		vertices[4 * i + 0] = lines[4 * i + 0];
		vertices[4 * i + 1] = lines[4 * i + 1];
		vertices[4 * i + 2] = lines[4 * i + 2];

		let color = lines[4 * i + 3];
		color = new Float32Array(new Uint32Array([color]).buffer)[0];

		vertices[4 * i + 3] = color;

	}

	// uint32 bits to float bits, since we're feeding a float buffer
	//color = new Float32Array(new Uint32Array([color]).buffer)[0];

	let buffer = vertices.buffer;

	let vao = gl.createVertexArray();
	let vbo = gl.createBuffer();
	gl.bindVertexArray(vao);
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, buffer.byteLength, buffer, gl.DYNAMIC_DRAW);

	let transform = new Matrix4();
	transform.copy(Matrix4.IDENTITY);
	transform.multiply(proj).multiply(view);

	{
		shader_data.setFloat32Array("transform", transform.elements);

		//gl.bindBufferBase(gl.UNIFORM_BUFFER, 4, shader_data.bufferID);
		shader_data.bind();
		shader_data.submit();
	}


	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 16, 0);
	gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, gl.TRUE, 16, 12);

	gl.drawArrays(gl.LINES, 0, numVertices);

	gl.bindBuffer(gl.ARRAY_BUFFER, 0);
	gl.deleteBuffers(1, new Uint32Array([vbo]));
	gl.disableVertexAttribArray(0);
	gl.disableVertexAttribArray(1);
	gl.bindVertexArray(0);

};


var renderSphere = function(position, scale, view, proj){

	if(typeof renderSphereShader === "undefined"){
		let vsPath = "../../resources/shaders/lines.vs";
		let fsPath = "../../resources/shaders/lines.fs";
		let shader = new Shader([
			{type: gl.VERTEX_SHADER, path: vsPath},
			{type: gl.FRAGMENT_SHADER, path: fsPath},
		]);
		shader.watch();

		renderSphereShader = shader;
	}
	let shader = renderSphereShader;
	let shader_data = shader.uniformBlocks.shader_data;

	gl.useProgram(shader.program);
	
	
	let color = 0xFF00FFFF;

	let points = [];
	for(let i = 0; i < 1000; i++){
		let x = (Math.random() - 0.5);
		let y = (Math.random() - 0.5);
		let z = (Math.random() - 0.5);
		let l = Math.sqrt(x * x + y * y + z * z);

		x = scale * (x / l) + position.x;
		y = scale * (y / l) + position.y;
		z = scale * (z / l) + position.z;

		points.push(x, y, z, color);
	}
	let numVertices = points.length / 4;

	let vertices = new Float32Array(points);

	let buffer = vertices.buffer;

	let vao = gl.createVertexArray();
	let vbo = gl.createBuffer();
	gl.bindVertexArray(vao);
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, buffer.byteLength, buffer, gl.DYNAMIC_DRAW);

	let transform = new Matrix4();
	transform.copy(Matrix4.IDENTITY);
	transform.multiply(proj).multiply(view);

	{
		shader_data.setFloat32Array("transform", transform.elements);

		//gl.bindBufferBase(gl.UNIFORM_BUFFER, 4, shader_data.bufferID);
		shader_data.bind();
		shader_data.submit();
	}

	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 16, 0);
	gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, gl.TRUE, 16, 12);

	gl.drawArrays(gl.POINTS, 0, numVertices);

	gl.bindBuffer(gl.ARRAY_BUFFER, 0);
	gl.deleteBuffers(1, new Uint32Array([vbo]));
	gl.disableVertexAttribArray(0);
	gl.disableVertexAttribArray(1);
	gl.bindVertexArray(0);

};

var renderDefault = function(node, view, proj, target){

	//log("lala");
	//return;

	let buffers = node.getComponents(GLBuffer);
	let material = node.getComponent(GLMaterial, {or: GLMaterial.DEFAULT});
	let shader = material.shader;
	let shader_data = shader.uniformBlocks.shader_data;

	//log(shader.program);

	let transform = new Matrix4();

	let world = node.world;

	transform.copy(Matrix4.IDENTITY);
	transform.multiply(proj).multiply(view).multiply(world);

	if(shader_data){
		shader_data.setFloat32Array("transform", transform.elements);
		shader_data.setFloat32Array("world", world.elements);
		shader_data.setFloat32Array("view", view.elements);
		shader_data.setFloat32Array("proj", proj.elements);
		//shader_data.setFloat32Array("screenSize", new Float32Array([cam.size.width, cam.size.height]));
		shader_data.setFloat32("time", now());


		//gl.bindBufferBase(gl.UNIFORM_BUFFER, 4, shader_data.bufferID);
		shader_data.bind();
		shader_data.submit();

	}

	if(material.texture !== null && shader.uniforms.uTexture !== undefined){

		let texture = material.texture;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(texture.type, texture.handle);
		gl.uniform1i(shader.uniforms.uTexture, 0);
	}

	if(material.depthTest){
		gl.enable(gl.DEPTH_TEST);
	}else{
		gl.disable(gl.DEPTH_TEST);
	}

	if(material.depthWrite){
		gl.depthMask(true);
	}else{
		gl.depthMask(false);
	}

	//let isDesktopMirror = node.name === "desktop_mirror";

	for(let buffer of buffers){
		gl.bindVertexArray(buffer.vao);

		// FIXME shouldn't need to bind/unbind vbo from vao. trying bc. of compute shader
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);

		
		
		if(buffer.indirect){

			gl.bindBuffer(gl.DRAW_INDIRECT_BUFFER, buffer.indirect.ssbo);

			gl.drawArraysIndirect(material.glDrawMode, 0);

			gl.bindBuffer(gl.DRAW_INDIRECT_BUFFER, 0);

		}else{

			if(node.name === "desktop_mirror"){
				gl.drawArrays(gl.TRIANGLES, 0, buffer.count);
			}else if(node.name === "skybox"){
				gl.drawArrays(gl.TRIANGLES, 0, buffer.count);
			}else {	

				//gl.enable(gl.BLEND);
				//
				//gl.blendColor(0, 1, 1, 1);
				//gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE);
				//gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);

				

				gl.drawArrays(material.glDrawMode, 0, buffer.count);
			}

		}

		// FIXME shouldn't need to bind/unbind vbo from vao. trying bc. of compute shader
		gl.bindBuffer(gl.ARRAY_BUFFER, 0);
	}

	gl.disable(gl.BLEND);

	//if(node.boundingBoxWorld){
	//	renderBox(node.boundingBoxWorld, view, proj, target);
	//}
}


var renderBuffers = function(view, proj, target){


	let start = now();

	
	let stack = [scene.root];


	//let numNodes = 0;
	//let numPoints = 0;
	let activeProgram = null;

	//log("===");

	let renderNode = (node) => {

		let state = getRenderState();
		
		let material = node.getComponent(GLMaterial, {or: GLMaterial.DEFAULT});
		let shader = material.shader;
		let shader_data = shader.uniformBlocks.shader_data;

		//if(activeProgram !== shader.program){
			gl.useProgram(shader.program);
		//	activeProgram = shader.program;
		//}

		//gl.useProgram(shader.program);

		
		
		if(node.name === "desktop_mirror"){
			gl.activeTexture(gl.TEXTURE0 + 0);
			//gl.bindTexture(gl.TEXTURE_2D, desktopTextureCopy);
			gl.bindTexture(gl.TEXTURE_2D, state.fboDesktopCopy.textures[0]);
			gl.generateMipmap(gl.TEXTURE_2D);


			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_ANISOTROPY, 16.0);
			
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		}

		// if(USER_STUDY_BLENDING){
		// 	gl.enable(gl.BLEND);
		// 	gl.blendFunc(gl.ONE, gl.ONE);
		// 	gl.disable(gl.DEPTH_TEST);
		// }else{
		// 	gl.disable(gl.BLEND);
		// 	gl.enable(gl.DEPTH_TEST);
		// }

		//log(node.name);

		if(node instanceof PointCloudOctree){
			renderPointCloudOctree(node, view, proj, target);
		}
		else if(node instanceof PointCloudProgressive){

			if(typeof renderDebug !== "undefined"){
				renderDebug(node, view, proj, target);
			}else{
			//renderComputeLL(node, view, proj, target);
			//renderPointCloudCompute(node, view, proj, target);
			//renderComputeHQS(node, view, proj, target);
			renderPointCloudProgressive(node, view, proj, target);
			//renderPointCloudBasic(node, view, proj, target);
			//renderDefault(node, view, proj, target);
			}
		}
		else if(node instanceof PointCloudBasic){
			//renderPointCloudCompute(node, view, proj, target);
			//renderPointCloudProgressive(node, view, proj, target);

			//log(node.transform.elements)

			//log(node.name);
			renderDefault(node, view, proj, target);
		}
		else if(node instanceof PointCloudExp){
			//renderPointCloudCompute(node, view, proj, target);
			//renderPointCloudProgressive(node, view, proj, target);

			if(USER_STUDY_RENDER_CLOD){
				renderCLOD(node, view, proj, target);
			}
		}
		else{
			if(RENDER_DEFAULT_ENABLED){
				renderDefault(node, view, proj, target);
			}
		}

		gl.bindTexture(gl.TEXTURE_2D, 0);
	};

	while(stack.length > 0){
		let node = stack.pop();

		if(!node.visible){
			continue;
		}

		renderNode(node);

		//stack.push(...node.children);
		for(let i = node.children.length - 1; i >= 0; i--){
			stack.push(node.children[i]);
		}
	}

	for(let command of scene.drawQueue){
		if(command.name === "drawLines"){
			renderLines(command.lines, view, proj);
		}else if(command.name === "drawSphere"){
			renderSphere(command.position, command.scale, view, proj);
		}else if(command.name === "drawBox"){
			renderBox(command.box, view, proj);
		}else if(command.name === "drawNode"){
			renderNode(command.node);
		}
	}

	gl.depthMask(true);

	let duration = now() - start;
	let durationMS = (duration * 1000).toFixed(3);
	setDebugValue("duration.cp.renderBuffers", `${durationMS}ms`);
	//setDebugValue("#nodes", `${numNodes}`);
	//setDebugValue("#points", `${numPoints}`);

}



if( typeof getRenderState === "undefined"){

	getRenderState = () => {

		if( typeof renderState === "undefined"){

			let csDrawImage;
			{ // distribution shader
				let path = "../../resources/shaders/drawImage.cs";
				
				let shader = new Shader([{type: gl.COMPUTE_SHADER, path: path}]);
				shader.watch();

				csDrawImage = shader;
			}

			let cursorTexture;
			{
				let data = new Uint8Array(4 * 64 * 64);
				let texture = new GLTexture(64, 64, data);

				gl.bindTexture(gl.TEXTURE_2D, texture.handle);

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP);

				gl.bindTexture(gl.TEXTURE_2D, 0);

				cursorTexture = texture;
			}

			let fboDesktop = new Framebuffer();
			fboDesktop.setSize(4096, 4096);

			let fboDesktopCopy = new Framebuffer();
			fboDesktopCopy.setSize(1280, 720);

			renderState = {
				csDrawImage: csDrawImage,
				cursorTexture: cursorTexture,
				fboDesktop: fboDesktop,
				fboDesktopCopy: fboDesktopCopy,
			};
		}

		

	
		return renderState;
	};
}

var render = function(){

	GLTimerQueries.mark("render-start");
	let start = now();

	let state = getRenderState();

	if(vr.isActive()){

	}else{
		camera.updateMatrixWorld();
	}

	frameCount++;

	camera.aspect = window.width / window.height;
	camera.updateProjectionMatrix();

	//gl.disable(gl.CULL_FACE);
	//gl.enable(gl.VERTEX_PROGRAM_POINT_SIZE);
	//gl.disable(gl.VERTEX_PROGRAM_POINT_SIZE);
	//gl.disable(gl.POINT_SPRITE);
	gl.enable(gl.VERTEX_PROGRAM_POINT_SIZE);

	for(let listener of listeners.render){
		listener();
	}

	if(vr.isActive()){
		renderVR();
	}else{
		renderRegular();
	}	

	if(desktopMirrorEnabled){
		let desktopTexture = acquireDesktopTexture();
		state.fboDesktop.textures[0] = desktopTexture.handle;

		// draw cursor
		if(desktopTexture.hasChanged){ 

			let cursor = getCursorData();
			// TODO regenerating texture every frame is SUPER SLOW
			//let texture = new GLTexture(cursor.width, cursor.height, cursor.data);

			//log(`width: ${cursor.width}, height: ${cursor.height}, bytes: ${cursor.data.byteLength}, type: ${cursor.type}, pitch: ${cursor.pitch}`);

			// TODO as of 2018/09/05, this code reduces fps from 1500 to 1250

			let texture = state.cursorTexture;

			gl.bindTexture(gl.TEXTURE_2D, texture.handle);

			
			//gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 
			//	cursor.width, cursor.height, 
			//	gl.RGBA, gl.UNSIGNED_BYTE, cursor.data);

			let ui8 = new Uint8Array(cursor.data);
			for(let i = 0; i < cursor.data.byteLength; i = i + 4){
				let a = ui8[i + 0];
				let r = ui8[i + 1];
				let g = ui8[i + 2];
				let b = ui8[i + 3];

				ui8[i + 0] = r;
				ui8[i + 1] = r;
				ui8[i + 2] = r;
				ui8[i + 3] = a;
			}

			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
				cursor.width, cursor.height, 0,
				gl.RGBA, gl.UNSIGNED_BYTE, cursor.data);

			gl.bindTexture(gl.TEXTURE_2D, 0);

			//log(cursor.data.byteLength);


			gl.bindFramebuffer(gl.FRAMEBUFFER, state.fboDesktop.handle);

			gl.viewport(0, 0, 1280, 720);

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, state.fboDesktop.textures[0], 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, 0, 0);

			//gl.clearColor(0, 0, 1, 1);
			//gl.clear(gl.COLOR_BUFFER_BIT);

			gl.disable(gl.DEPTH_TEST);
			gl.depthMask(false);


			let quad = $("image_space_quad");
			let buffer = quad.getComponent(GLBuffer);
			let material = quad.getComponent(GLMaterial, {or: GLMaterial.DEFAULT});
			let shader = material.shader;
			gl.useProgram(shader.program);

			gl.activeTexture(gl.TEXTURE0 + 0);
			gl.bindTexture(gl.TEXTURE_2D, texture.handle);
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_ANISOTROPY, 16.0);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP);

			gl.uniform2f(0, 
				2 * (cursor.x + cursor.width / 2) / 1280 - 1, 
				2 * (cursor.y + cursor.height / 2) / 720 - 1);

			gl.uniform2f(1, cursor.width, cursor.height);

			gl.enable(gl.BLEND);

			if(cursor.type === 1){
				//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				gl.blendFunc(gl.ONE_MINUS_DST_COLOR, gl.ZERO);
				//log("invert");
			}else{
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			}

			gl.bindVertexArray(buffer.vao);
			gl.drawArrays(material.glDrawMode, 0, buffer.count);
			gl.bindVertexArray(0);

			gl.disable(gl.BLEND);

			gl.enable(gl.DEPTH_TEST);
			gl.depthMask(true);

			gl.blitNamedFramebuffer(state.fboDesktop.handle, state.fboDesktopCopy.handle, 
				0, 0, 1280, 720, 
				0, 0, 1280, 720, 
				gl.COLOR_BUFFER_BIT, gl.NEAREST);

			gl.bindFramebuffer(gl.FRAMEBUFFER, 0);


		}
	}

	scene.drawQueue = [];

	GLTimerQueries.mark("render-end");
	GLTimerQueries.measure("render", "render-start", "render-end");

	//GLTimerQueries.enabled = true;
	GLTimerQueries.resolve();
	
	//log(GLTimerQueries.measures.length);

	//log(GLTimerQueries.measures[40000].start.handle)
	//log(GLTimerQueries.measures[40000].end.timestamp)

	let duration = now() - start;
	let durationMS = (duration * 1000).toFixed(3);
	setDebugValue("duration.cp.render", `${durationMS}ms`);

	


}


// var render = function(){

// 	gl.clearColor(0, 1, 0, 1);
// 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// }

"render.js"