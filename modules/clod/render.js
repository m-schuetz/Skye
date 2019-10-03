

var magnifier = {
	position: new Vector3(-0.55, 0.9, 0),
	radius: 0.05,
};

getCLODState = function(pointcloud){

	if(typeof renderCLODState === "undefined"){
		renderCLODState = new Map();
	}

	if(!renderCLODState.has(pointcloud)){

		

		
		let originalBuffer = pointcloud.getComponent(GLBuffer);

		if(originalBuffer == null){
			return null;
		}

		let shaderSource = `${rootDir}/modules/clod/filter_points.cs`;
		let shader = new Shader([{type: gl.COMPUTE_SHADER, path: shaderSource}]);
		shader.watch();

		let filteredBuffer = new GLBuffer();
		let filteringBuffer = new GLBuffer();

		{ // setup filtered buffer
			filteredBuffer.attributes = originalBuffer.attributes;
			filteredBuffer.vao = gl.createVertexArray();
			filteredBuffer.vbo = gl.createBuffer();
			filteredBuffer.count = 0;

			let filteredBufferSize = 16 * 10 * 1000 * 1000;
			gl.namedBufferData(filteredBuffer.vbo, filteredBufferSize, 0, gl.DYNAMIC_DRAW);

			gl.bindVertexArray(filteredBuffer.vao);
			gl.bindBuffer(gl.ARRAY_BUFFER, filteredBuffer.vbo);

			let stride = filteredBuffer.attributes.reduce( (a, v) => a + v.bytes, 0);

			for(let attribute of filteredBuffer.attributes){
				gl.enableVertexAttribArray(attribute.location);

				gl.vertexAttribPointer(
					attribute.location, 
					attribute.count, 
					attribute.type, 
					attribute.normalize, 
					stride, 
					attribute.offset);	
			}

			let ssDrawParameters = gl.createBuffer();
			let bufferDrawParameters = new ArrayBuffer(4 * 4);
			gl.namedBufferData(ssDrawParameters, bufferDrawParameters.byteLength, bufferDrawParameters, gl.DYNAMIC_READ);
			//gl.namedBufferData(ssDrawParameters, bufferDrawParameters.byteLength, bufferDrawParameters, gl.DYNAMIC_DRAW);

			filteredBuffer.indirect = {
				ssbo: ssDrawParameters,
			};
		}

		{ // setup filtering buffer
			filteringBuffer.attributes = originalBuffer.attributes;
			filteringBuffer.vao = gl.createVertexArray();
			filteringBuffer.vbo = gl.createBuffer();
			filteringBuffer.count = 0;

			let filteringBufferSize = 16 * 10 * 1000 * 1000;
			gl.namedBufferData(filteringBuffer.vbo, filteringBufferSize, 0, gl.DYNAMIC_DRAW);

			gl.bindVertexArray(filteringBuffer.vao);
			gl.bindBuffer(gl.ARRAY_BUFFER, filteringBuffer.vbo);

			let stride = filteringBuffer.attributes.reduce( (a, v) => a + v.bytes, 0);

			for(let attribute of filteringBuffer.attributes){
				gl.enableVertexAttribArray(attribute.location);

				gl.vertexAttribPointer(
					attribute.location, 
					attribute.count, 
					attribute.type, 
					attribute.normalize, 
					stride, 
					attribute.offset);	
			}

			let ssDrawParameters = gl.createBuffer();
			let bufferDrawParameters = new ArrayBuffer(4 * 4);
			gl.namedBufferData(ssDrawParameters, bufferDrawParameters.byteLength, bufferDrawParameters, gl.DYNAMIC_DRAW);

			filteringBuffer.indirect = {
				ssbo: ssDrawParameters,
			};
		}

		log(`created new clod state for ${pointcloud.name}`);

		let state = {
			shader: shader,
			originalBuffer: originalBuffer,
			filteredBuffer: filteredBuffer,
			filteringBuffer: filteringBuffer,
			currentOffset: 0,
		};

		renderCLODState.set(pointcloud, state);
	}

	return renderCLODState.get(pointcloud);
};

updateCLOD = function(pointcloud, view, proj){

	let state = getCLODState(pointcloud);

	if(state == null){
		return;
	}

	let cam = camera;
	if(DEBUG_USER_FILTER_CAM){
		cam = cameras.filter;

		view = cam.world.getInverse();
		proj = cam.projectionMatrix;
	}
	

	let shader = state.shader;
	let originalBuffer = state.originalBuffer;
	let filteredBuffer = state.filteredBuffer;
	let filteringBuffer = state.filteringBuffer;
	let ssDrawParameters = filteringBuffer.indirect.ssbo;

	let batchOffset = state.currentOffset;

	gl.useProgram(shader.program);

	if(batchOffset === 0){
		let drawParameters = new Int32Array([0, 1, 0, 0]);
		gl.namedBufferSubData(ssDrawParameters, 0, drawParameters.byteLength, drawParameters.buffer);
	}

	gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, originalBuffer.vbo);
	gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, filteringBuffer.vbo);
	gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, ssDrawParameters);

	let world = pointcloud.world;

	let transform = new Matrix4();

	transform.copy(Matrix4.IDENTITY);
	transform.multiply(proj).multiply(view).multiply(world);


	let scale;
	{
		let v1 = new Vector3(0, 0, 0).applyMatrix4(world);
		let v2 = new Vector3(1, 1, 1).normalize().applyMatrix4(world);

		scale = v1.distanceTo(v2);
	}

	let CLOD;
	{
		let u = (USER_STUDY_LOD_MODIFIER + 1) / 2;	
		CLOD = u * CLOD_RANGE[0] + (1 - u) * CLOD_RANGE[1];
	}

	let cpos = new Vector3(0, 0, 0).applyMatrix4(cam.transform);

	let shader_data = shader.uniformBlocks.shader_data;

	//log(`1: ${proj.elements.map(v => v.toFixed(2))}`);
	//log(`1: ${cam.fov}`);

	shader_data.setFloat32Array("transform", transform.elements);
	shader_data.setFloat32Array("world", world.elements);
	shader_data.setFloat32Array("view", view.elements);
	shader_data.setFloat32Array("proj", proj.elements);
	shader_data.setFloat32Array("screenSize", new Float32Array([cam.size.width, cam.size.height]));
	shader_data.setFloat32Array("pivot", new Float32Array([cpos.x, cpos.y, cpos.z, 0.0]));

	shader_data.setFloat32("CLOD", CLOD);
	shader_data.setFloat32("spacing", pointcloud.spacing);
	shader_data.setFloat32("scale", scale);
	shader_data.setFloat32("time", now());

	//log(transform.elements.map(v => v.toFixed(2)));
	//log("2 " + view.elements.map(v => v.toFixed(2)));

	//log(CLOD);
	//log(cpos);

	shader_data.bind();
	shader_data.submit();

	gl.uniform1i(21, batchOffset);

	GLTimerQueries.mark("filter-start");

	let numPoints = originalBuffer.count;

	let currentBatchSize = CLOD_BATCH_SIZE;
	if(batchOffset + CLOD_BATCH_SIZE > numPoints){
		currentBatchSize = numPoints - batchOffset;

	}
	gl.uniform1i(22, currentBatchSize);

	let groups = [currentBatchSize / 128 + 1, 1, 1];
	gl.memoryBarrier(gl.ALL_BARRIER_BITS);
	gl.dispatchCompute(...groups);
	gl.memoryBarrier(gl.ALL_BARRIER_BITS);

	//gl.memoryBarrier(gl.ALL_BARRIER_BITS);

	GLTimerQueries.mark("filter-end");


	batchOffset = batchOffset + CLOD_BATCH_SIZE;
	if(batchOffset > numPoints){
		batchOffset = 0;

		state.filteredBuffer = filteringBuffer;
		state.filteringBuffer = filteredBuffer;

		if(true){
			// taken from https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
			const numberWithCommas = (x) => {
				return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}

			let resultBuffer = new ArrayBuffer(4 * 4);
			gl.getNamedBufferSubData(ssDrawParameters, 0, resultBuffer.byteLength, resultBuffer);
		
			let acceptedCount = new DataView(resultBuffer).getInt32(0, true);
			//log("=====");
			//log("accepted: " + numberWithCommas(acceptedCount));

			let key = `accepted (${pointcloud.name})`;
			setDebugValue(key, numberWithCommas(acceptedCount));
			//setDebugValue("accepted", numberWithCommas(acceptedCount));
			//log(numberWithCommas(acceptedCount));
		}
	}

	state.currentOffset = batchOffset;



	gl.useProgram(0);
};

actualCLODRender = function(pointcloud, view, proj, target){


	let state = getCLODState(pointcloud);

	if(state == null){
		return;
	}

	let cam = camera;
	if(DEBUG_USER_FILTER_CAM){
		cam = cameras.filter;
	}

	GLTimerQueries.mark("clod-start");

	let originalBuffer = state.originalBuffer;
	let filteredBuffer = state.filteredBuffer;

	let material = pointcloud.getComponent(GLMaterial, {or: GLMaterial.DEFAULT});
	let shader = material.shader;

	gl.useProgram(shader.program);

	let world = pointcloud.world;

	let transform = new Matrix4();

	transform.copy(Matrix4.IDENTITY);
	transform.multiply(proj).multiply(view).multiply(world);

	if(DEBUG_USER_FILTER_CAM){
		view = cam.world.getInverse();
		proj = cam.projectionMatrix;
	}

	let cpos = new Vector3(0, 0, 0).applyMatrix4(cam.transform);

	let centralView;
	let centralProj;
	if(vr.isActive()){
		let hmdPose = new Matrix4().set(vr.getHMDPose());
		//centralView = hmdPose;
		centralView = camera.world.getInverse();
		centralProj = camera.projectionMatrix;
	}else{
		centralView = view;
		centralProj = proj;
	}

	let centralTransform = new Matrix4();
	centralTransform.copy(Matrix4.IDENTITY);
	centralTransform.multiply(centralProj).multiply(centralView).multiply(world);

	let scale;
	{
		let v1 = new Vector3(0, 0, 0).applyMatrix4(world);
		let v2 = new Vector3(1, 1, 1).normalize().applyMatrix4(world);

		scale = v1.distanceTo(v2);
	}

	let u = (USER_STUDY_LOD_MODIFIER + 1) / 2;
	let usCLOD = u * CLOD_RANGE[0] + (1 - u) * CLOD_RANGE[1];

	let colorMultiplier = USER_STUDY_BLENDING ? 0.05 : 1.0;

	let shader_data = shader.uniformBlocks.shader_data;

	//log(`2: ${centralProj.elements.map(v => v.toFixed(2))}`);
	//log(`2: ${cam.fov}`);

	shader_data.setFloat32Array("transform", transform.elements);
	shader_data.setFloat32Array("world", world.elements);
	shader_data.setFloat32Array("view", view.elements);
	shader_data.setFloat32Array("proj", proj.elements);
	shader_data.setFloat32Array("centralView", centralView.elements);
	shader_data.setFloat32Array("centralProj", centralProj.elements);
	shader_data.setFloat32Array("centralTransform", centralTransform.elements);
	shader_data.setFloat32Array("screenSize", new Float32Array([cam.size.width, cam.size.height]));
	shader_data.setFloat32Array("pivot", new Float32Array([cpos.x, cpos.y, cpos.z, 0.0]));

	shader_data.setFloat32("CLOD", usCLOD);
	shader_data.setFloat32("spacing", pointcloud.spacing);
	shader_data.setFloat32("scale", scale);
	shader_data.setFloat32("time", now());
	shader_data.setFloat32("colorMultiplier", colorMultiplier);
	shader_data.setFloat32("minMilimeters", pointcloud.minMilimeters);
	shader_data.setFloat32("pointSize", pointcloud.pointSize);

	//log(cpos);
	//log(usCLOD);

	//log(centralTransform.elements.map(v => v.toFixed(2)));
	//log("1 " + centralView.elements.map(v => v.toFixed(2)));

	//gl.bindBufferBase(gl.UNIFORM_BUFFER, 4, shader_data.bufferID);
	shader_data.bind();
	shader_data.submit();


	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gradientTexture.type, gradientTexture.handle);
	gl.uniform1i(shader.uniforms.uGradient, 0);

	gl.bindBuffer(gl.DRAW_INDIRECT_BUFFER, filteredBuffer.indirect.ssbo);

	gl.bindVertexArray(filteredBuffer.vao);

	//gl.enable(gl.BLEND);
	//gl.blendFunc(gl.ONE, gl.ONE);
	//gl.disable(gl.DEPTH_TEST);

	gl.drawArraysIndirect(material.glDrawMode, 0);

	//gl.bindVertexArray(originalBuffer.vao);
	//gl.drawArrays(material.glDrawMode, 0, originalBuffer.count);

	gl.bindBuffer(gl.DRAW_INDIRECT_BUFFER, 0);

	gl.useProgram(0);

	GLTimerQueries.mark("clod-end");
};

renderCLOD = function(pointcloud, view, proj, target){

	GLTimerQueries.mark("render-clod-start");

	//let state = getCLODState(pointcloud);

	//log("lala");

	//updateCLOD(pointcloud, view, proj, target);


	actualCLODRender(pointcloud, view, proj, target);

	

	//fboPrev.setSize(target.width, target.height);
	//fboPrev.setNumColorAttachments(target.numColorAttachments);

	//gl.blitNamedFramebuffer(target.handle, fboPrev.handle, 
	//	0, 0, target.width, target.height, 
	//	0, 0, fboPrev.width, fboPrev.height, 
	//	gl.COLOR_BUFFER_BIT, gl.LINEAR);


	GLTimerQueries.mark("render-clod-end");

	//state.round++;


};

"render_clod.js"