
getRenderBasicState = function(target){


	if(typeof renderBasicMap === "undefined"){
		renderBasicMap = new Map();
	}

	if(!renderBasicMap.has(target)){

		let shader;
		{ // normal point cloud material 
			let vsPath = "../../resources/shaders/pointcloud_basic.vs";
			let fsPath = "../../resources/shaders/pointcloud.fs";
			
			shader = new Shader([
				{type: gl.VERTEX_SHADER, path: vsPath},
				{type: gl.FRAGMENT_SHADER, path: fsPath},
			]);
			shader.watch();
		}


		let state = {
			shader: shader,
		};

		renderBasicMap.set(target, state);
	}

	return renderBasicMap.get(target);
};

renderPointCloudBasic = function(pointcloud, view, proj, target){

	GLTimerQueries.mark("render-basic-start");

	//let {shReproject, shAdd, csCreateIBO} = pointcloud;
	let state = getRenderBasicState(target);
	let shader = state.shader;
	let shader_data = shader.uniformBlocks.shader_data;

	let mat32 = new Float32Array(16);
	let transform = new Matrix4();
	let world = pointcloud.transform;
	transform.copy(Matrix4.IDENTITY);
	transform.multiply(proj).multiply(view).multiply(world);
	//mat32.set(transform.elements);

	shader_data.setFloat32Array("transform", transform.elements);

	shader_data.bind();
	shader_data.submit();

	{
		gl.useProgram(shader.program);

		let pointsLeft = pointcloud.numPoints;
		let batchSize = 134 * 1000 * 1000;

		for(let buffer of pointcloud.glBuffers){
			
			gl.bindVertexArray(buffer.vao);

			let numPoints = Math.max(Math.min(pointsLeft, batchSize), 0);

			//numPoints = 1000000;
			gl.drawArrays(gl.POINTS, 0, numPoints);
			//gl.drawArrays(gl.POINTS, 0, 1000000);

			pointsLeft = pointsLeft - batchSize;
		}

		gl.bindVertexArray(0);
	}
	
	gl.useProgram(0);

	GLTimerQueries.mark("render-basic-end");
	GLTimerQueries.measure("render.basic", "render-basic-start", "render-basic-end");

	state.round++;


};

"render_pointcloud_basic.js"