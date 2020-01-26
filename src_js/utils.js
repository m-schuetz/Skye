

debugSphere = function(parent, position, scale){
	let n = 50;

	let numPoints = n * n;
	let vertices = new Float32Array(numPoints * 4);
	let verticesU8 = new Uint8Array(vertices.buffer);
	let bytesPerPoint = 16;

	let vindex = 0;
	for(let i = 0; i < n; i++){
		for(let j = 0; j < n; j++){

			let u = 4 * Math.PI * i / n - Math.PI;
			let v = 4 * Math.PI * j / n - Math.PI;

			let radius = 1;
			let x = radius * Math.sin(u) * Math.sin(v); // + 0.05 * Math.cos(20 * v);
			let y = radius * Math.cos(u) * Math.sin(v); // + 0.05 * Math.cos(20 * u);
			let z = radius * Math.cos(v);

			let r = (u + Math.PI) / 2 * Math.PI;
			let g = (v + Math.PI) / 2 * Math.PI;
			let b = 0;

			[r, g, b] = [0.1, 0.22, 0.02];
			r = 255 * (x + radius) / (2 * radius);
			g = 255 * (y + radius) / (2 * radius);
			b = 255 * (z + radius) / (2 * radius);

			r = r < 200 ? 0 : r;
			g = g < 200 ? 0 : g;
			b = b < 200 ? 0 : b;

			vertices[4 * vindex + 0] = x;
			vertices[4 * vindex + 1] = y;
			vertices[4 * vindex + 2] = z;

			verticesU8[16 * vindex + 12] = r;
			verticesU8[16 * vindex + 13] = g;
			verticesU8[16 * vindex + 14] = b;
			verticesU8[16 * vindex + 15] = 255;

			vindex++;
		}
	}

	let vsPath = "../../resources/shaders/mesh.vs";
	let fsPath = "../../resources/shaders/mesh.fs";

	let shader = new Shader([
		{type: gl.VERTEX_SHADER, path: vsPath},
		{type: gl.FRAGMENT_SHADER, path: fsPath},
	]);
	shader.watch();

	let material = new GLMaterial();
	material.glDrawMode = gl.TRIANGLES;
	material.shader = shader;

	let sphere = new SceneNode("sphere_" + Math.random());
	let sphereBuffer = new GLBuffer();
	sphere.components.push(material, sphereBuffer);	

	parent.add(sphere);

	let attributes = [
		new GLBufferAttribute("position", 0, 3, gl.FLOAT, gl.FALSE, 12, 0),
		new GLBufferAttribute("color", 1, 3, gl.UNSIGNED_BYTE, gl.TRUE, 4, 12),
	];
	
	sphereBuffer.set(vertices, attributes, vindex);

	sphere.position.copy(position);
	sphere.scale.set(scale, scale, scale);
	sphere.updateMatrixWorld();

	return sphere;
}

/**
 * add separators to large numbers
 *
 * @param nStr
 * @returns
 */
addCommas = function(nStr) {
	nStr += '';
	let x = nStr.split('.');
	let x1 = x[0];
	let x2 = x.length > 1 ? '.' + x[1] : '';
	let rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
};

if(typeof GLTimerQueries === "undefined"){

	GLTimerQueries = class{

		constructor(){
			this.enabled = true;
			
		}

	}

	
}else{
	for(const [name, mark] of GLTimerQueries.marks){
		gl.deleteQuery(mark.handle);
	}
}

GLTimerQueries.history = new Map();
GLTimerQueries.marks = new Map();
GLTimerQueries.marksToResolve = [];
GLTimerQueries.measures = [];
GLTimerQueries.queue = [];

GLTimerQueries.mark = function (name) {

	if (!this.enabled) {
		return;
	}

	let query = gl.createQuery();

	let mark = {
		name: name,
		handle: query,
		refCount: 0,
		timestamp: null,
		cpuTime: now(),
	};

	gl.queryCounter(mark.handle, gl.TIMESTAMP);

	GLTimerQueries.marks.set(name, mark);
}

GLTimerQueries.measure = function (name, start, end, callback) {

	if (!this.enabled) {
		return;
	}

	let qStart = GLTimerQueries.marks.get(start);
	let qEnd = GLTimerQueries.marks.get(end);

	qStart.refCount++;
	qEnd.refCount++;

	let measure = {
		name: name,
		start: qStart,
		end: qEnd,
		callback: callback,
	};

	//GLTimerQueries.measures.set(name, measure);
	GLTimerQueries.measures.push(measure);

}

GLTimerQueries.resolve = function () {
	if (!this.enabled) {
		return;
	}

	let tStart = now();

	// resolve gl queries
	for (let [name, mark] of GLTimerQueries.marks) {
		GLTimerQueries.marksToResolve.push(mark);
	}

	GLTimerQueries.marks = new Map();

	let tStillToResolve = now();
	let stillToResolve = [];
	for (let mark of GLTimerQueries.marksToResolve) {

		let timestampAvailable = gl.getQueryObjectui64(mark.handle, gl.QUERY_RESULT_AVAILABLE) === gl.TRUE;

		if (timestampAvailable) {
			let timestamp = gl.getQueryObjectui64(mark.handle, gl.QUERY_RESULT);

			mark.timestamp = timestamp;
			gl.deleteQuery(mark.handle);
		} else {
			stillToResolve.push(mark);
		}
	}
	GLTimerQueries.marksToResolve = stillToResolve;

	// setDebugValue("debugval", GLTimerQueries.marksToResolve.length);

	if (GLTimerQueries.marksToResolve.length > 100) {
		log(`WARNING: more than 100 queries active`);
	}


	let tResolve = now();
	let unresolvedMeasures = [];
	for (let measure of GLTimerQueries.measures) {

		let { start, end } = measure;

		let resolved = start.timestamp !== null && end.timestamp !== null;

		if (resolved) {
			let nanos = end.timestamp - start.timestamp;
			let seconds = nanos / (1000000000);

			if (measure.callback) {
				measure.callback(seconds);
			}

			if (!GLTimerQueries.history.has(measure.name)) {
				GLTimerQueries.history.set(measure.name, []);
			}

			let history = GLTimerQueries.history.get(measure.name);
			history.push(seconds);

			if (history.length > 10) {
				history.shift();
			}

		} else {

			let outdated = now() - measure.start.cpuTime > 1.0;

			if (outdated) {

				GLTimerQueries.marksToResolve = GLTimerQueries.marksToResolve.filter(mark => ![measure.start, measure.end].includes(mark));

				gl.deleteQuery(measure.start.handle);
				gl.deleteQuery(measure.end.handle);
			} else {
				unresolvedMeasures.push(measure);
			}
		}
	}
	
	let tAverage = now();
	for (let [name, history] of GLTimerQueries.history) {
		let sum = 0;
		let min = Infinity;
		let max = -Infinity;
		for(let value of history){
			sum += value;
			min = Math.min(min, value);
			max = Math.max(max, value);
		}
		let avg = sum / history.length;

		let msAvg = (avg * 1000).toFixed(3);
		let msMin = (min * 1000).toFixed(3);
		let msMax = (max * 1000).toFixed(3);

		setDebugValue(`gl.${name}`, `{"mean": ${msAvg}, "min": ${msMin}, "max": ${msMax}}`);
	}


	GLTimerQueries.measures = unresolvedMeasures;

	let tEnd = now();
	let durationMS = (tEnd - tStart) * 1000;

	if (durationMS > 1) {
		log(`WARNING: resolving timer queries took ${durationMS.toFixed(3)}ms`);
	}
}


$ = (name) => {
	let result = null;

	scene.root.traverse( (node, level) => {
		if(node.name === name){
			result = node;
		}

		let carryOn = result === null;

		return carryOn;
	});

	return result;
}