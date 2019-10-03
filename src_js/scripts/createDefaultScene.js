

createDesktopMirror = function(){
	let aspect = 16 / 9;

	let vertices = new Float32Array([
		-0.3 * aspect, -0.3, 0, 0, 0,
		 0.3 * aspect, -0.3, 0, 1, 0,
		 0.3 * aspect,  0.3, 0, 1, 1,

		-0.3 * aspect, -0.3, 0, 0, 0,
		 0.3 * aspect,  0.3, 0, 1, 1,
		-0.3 * aspect,  0.3, 0, 0, 1,
	]);

	let attributes = [
		new GLBufferAttribute("position", 0, 3, gl.FLOAT, gl.FALSE, 12, 0),
		new GLBufferAttribute("uv", 2, 2, gl.FLOAT, gl.FALSE, 8, 12),
	];

	let buffer = new GLBuffer();
	buffer.set(vertices, attributes, 6);

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

	let sceneNode = new MeshNode("desktop_mirror", buffer, material);

	scene.root.add(sceneNode);
}


createImageSpaceQuad = function(){

	let vertices = new Float32Array([
		-1, -1, 0, 0, 0,
		 1, -1, 0, 1, 0,
		 1,  1, 0, 1, 1,

		-1, -1, 0, 0, 0,
		 1,  1, 0, 1, 1,
		-1,  1, 0, 0, 1,
	]);

	let attributes = [
		new GLBufferAttribute("position", 0, 3, gl.FLOAT, gl.FALSE, 12, 0),
		new GLBufferAttribute("uv", 1, 2, gl.FLOAT, gl.FALSE, 8, 12),
	];

	let buffer = new GLBuffer();
	buffer.set(vertices, attributes, 6);

	let vsPath = "../../resources/shaders/imageSpaceQuad.vs";
	let fsPath = "../../resources/shaders/imageSpaceQuad.fs";

	let shader = new Shader([
		{type: gl.VERTEX_SHADER, path: vsPath},
		{type: gl.FRAGMENT_SHADER, path: fsPath},
	]);
	shader.watch();

	let material = new GLMaterial();
	material.glDrawMode = gl.TRIANGLES;
	material.shader = shader;

	let sceneNode = new SceneNode("image_space_quad");
	sceneNode.components.push(material, buffer);
	sceneNode.visible = false;

	scene.root.add(sceneNode);
}

let view = new View();
let camera = new Camera();
let scene = new Scene();

let orbitControls = new OrbitControls(view);
let controls = orbitControls;

camera.fov = 60;
camera.far = 1000 * 1000;

let cameras = {
	main: new Camera(),
	filter: new Camera(),
	debug: new Camera(),
}

view.position.set(-2.7096674667729195, 5.112884171558154, 5.6011204817203994);
view.lookAt(-0.8075575002596201, 1, -0.7614239455653012);

//createDesktopMirror();
createImageSpaceQuad();

runJSFile(`${jsDir}/scripts/createSkybox.js`);
runJSFile(`${jsDir}/scripts/createGround.js`);

//runJSFile(`${jsDir}/scripts/createMethodLabels.js`);
//runJSFile(`${jsDir}/scripts/createSpot.js`);
//runJSFile(`${jsDir}/scripts/createBlub.js`);