

if( typeof getRenderRegularState === "undefined"){

	getRenderRegularState = () => {

		if( typeof renderRegularState === "undefined"){
			let fboEDL = new Framebuffer();

			
			let vsPath = "../../resources/shaders/edl.vs";
			let fsPath = "../../resources/shaders/edl.fs";
			let fsPathMSAA = "../../resources/shaders/edlMSAA.fs";

			let edlShaderMSAA = new Shader([
				{type: gl.VERTEX_SHADER, path: vsPath},
				{type: gl.FRAGMENT_SHADER, path: fsPathMSAA},
			]);
			edlShaderMSAA.watch();

			let edlShader = new Shader([
				{type: gl.VERTEX_SHADER, path: vsPath},
				{type: gl.FRAGMENT_SHADER, path: fsPath},
			]);
			edlShader.watch();

			renderRegularState = {
				fboEDL: fboEDL,
				edlShader: edlShader,
				edlShaderMSAA: edlShaderMSAA,
			};
		}

		return renderRegularState;
	}

}

var renderRegular = function() {

	let start = now();

	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);

	//gl.depthFunc(gl.LESS);
	//gl.clipControl(gl.LOWER_LEFT, gl.NEGATIVE_ONE_TO_ONE );
	//gl.clearDepth(1);

	gl.clipControl(gl.LOWER_LEFT, gl.ZERO_TO_ONE);
	gl.clearDepth(0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.GREATER);
	//gl.depthFunc(gl.GEQUAL);

	fbo.setSize(window.width, window.height);
	fbo.setSamples(MSAA_SAMPLES);

	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.handle);

	gl.viewport(0, 0, fbo.width, fbo.height);
	
	{
		let u = 0.5 * Math.sin(20 * now()) + 0.5;
		let v = u * 0.5 + 0.3;
		gl.clearColor(v, 0, 0, 1);
	}

	gl.clearColor(0, 0, 0, 1);
	//gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	let pointsRendered = 0;

	let view = camera.world.getInverse();
	let proj = camera.projectionMatrix;

	

	renderBuffers(view, proj, fbo);

	// Eye Dome Lighting
	if(EDL_ENABLED && getRenderRegularState().edlShader.compiled){

		GLTimerQueries.mark("edl-start");

		let isquad = $("image_space_quad");
		let buffer = isquad.getComponent(GLBuffer);
		
		let state = getRenderRegularState();
		let fboEDL = state.fboEDL;

		let samples = fbo.samples;

		let shader = (samples === 1) ? state.edlShader : state.edlShaderMSAA;
		let shader_data = shader.uniformBlocks.shader_data;

		fboEDL.setSize(fbo.width, fbo.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fboEDL.handle);

		//gl.clearColor(Math.cos(5 * now()) * 0.1 + 0.5, 0, 0, 1);
		//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.useProgram(shader.program);

		let textureType = (samples === 1) ? gl.TEXTURE_2D : gl.TEXTURE_2D_MULTISAMPLE;
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(textureType, fbo.textures[0]);
		gl.uniform1i(shader.uniforms.uColor, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(textureType, fbo.depth);
		gl.uniform1i(shader.uniforms.uDepth, 1);

		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);
		gl.disable(gl.CULL_FACE);

		shader_data.setFloat32Array("screenSize", new Float32Array([camera.width, camera.height]));
		shader_data.setFloat32("time", now());
		shader_data.setFloat32("near", camera.near);
		shader_data.setFloat32("far", camera.far);
		shader_data.setFloat32("edlStrength", 0.4);
		shader_data.setFloat32("msaaSampleCount", fbo.samples);

		shader_data.bind();
		shader_data.submit();

		gl.bindVertexArray(buffer.vao);
		gl.drawArrays(gl.TRIANGLES, 0, buffer.count);
		gl.bindVertexArray(0);

		gl.enable(gl.DEPTH_TEST);
		gl.depthMask(true);
		
		gl.blitNamedFramebuffer(fboEDL.handle, 0, 
			0, 0, fboEDL.width, fboEDL.height, 
			0, 0, window.width, window.height, 
			gl.COLOR_BUFFER_BIT, gl.LINEAR);

		GLTimerQueries.mark("edl-end");
		GLTimerQueries.measure("render.edl", "edl-start", "edl-end");
		//GLTimerQueries.measure("render.edl", "edl-start", "edl-end", (duration) => {
		//	let ms = (duration * 1000).toFixed(3);
		//	setDebugValue("gl.render.edl", `${ms}ms`);
		//});

		//gl.blitNamedFramebuffer(fboEDL.handle, 0, 
		//	600, 400, 600 + 128, 400 + 128, 
		//	0, 0, 512, 512, 
		//	gl.COLOR_BUFFER_BIT, gl.NEAREST);
	}else{
		gl.bindFramebuffer(gl.FRAMEBUFFER, 0);
		gl.blitNamedFramebuffer(fbo.handle, 0, 
			0, 0, fbo.width, fbo.height, 
			0, 0, window.width, window.height, 
			gl.COLOR_BUFFER_BIT, gl.LINEAR);
	}



	
	

	//let duration = now() - start;
	//let durationMS = duration * 1000;
	//log(`${durationMS.toFixed(3)}ms`);

	

}


"render_regular.js"