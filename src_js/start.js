

const rootDir = "../../";
const jsDir = "../../src_js";
const resourceDir = "../../resources";

watchJS(`${jsDir}/defines.js`);
runJSFile(`${rootDir}/modules/math/module.js`);
watchJS(`${jsDir}/PointAttributes.js`);
watchJS(`${jsDir}/PotreeLoader.js`);
watchJS(`${jsDir}/scene/SceneNode.js`);
watchJS(`${jsDir}/scene/Camera.js`);
watchJS(`${jsDir}/scene/MeshNode.js`);
watchJS(`${jsDir}/scene/Scene.js`);
watchJS(`${jsDir}/GL.js`);
watchJS(`${jsDir}/scene/Mesh.js`);
watchJS(`${jsDir}/Framebuffer.js`);
watchJS(`${jsDir}/OrbitControls.js`);
watchJS(`${jsDir}/View.js`);
watchJS(`${jsDir}/utils.js`);
watchJS(`${jsDir}/libs/BinaryHeap.js`);
watchJS(`${jsDir}/vr.js`);

watchJS(`${jsDir}/OBJLoader.js`);
watchJS(`${jsDir}/scene/BrushNode.js`);

watchJS(`${jsDir}/render/render.js`);
watchJS(`${jsDir}/render/render_vr.js`);
watchJS(`${jsDir}/render/render_regular.js`);
watchJS(`${jsDir}/render/render_pointcloud_basic.js`);
watchJS(`${jsDir}/scene/PointCloudBasic.js`);

watchJS(`${jsDir}/Shader.js`);



let fbo = new Framebuffer();
fbo.setNumColorAttachments(2);

let desktopMirrorEnabled = true;

{
	GLMaterial.DEFAULT = new GLMaterial();
	let vsPath = "../../resources/shaders/mesh.vs";
	let fsPath = "../../resources/shaders/mesh.fs";
	let shader = new Shader([
		{type: gl.VERTEX_SHADER, path: vsPath},
		{type: gl.FRAGMENT_SHADER, path: fsPath},
	]);
	shader.watch();
	GLMaterial.DEFAULT.shader = shader;
}

let gradientImage = loadImage(`../../resources/images/gradient_spectral_2d.png`);
let gradientTexture = new GLTexture(gradientImage.width, gradientImage.height, gradientImage.data);
{
	gl.bindTexture(gl.TEXTURE_2D, gradientTexture.handle);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindTexture(gl.TEXTURE_2D, 0);
}

let listeners = {
	update: [],
	render: [],
};

GLTimerQueries.enabled = false;

runJSFile(`${jsDir}/scripts/createDefaultScene.js`);
//runJSFile(`${jsDir}/scripts/createScene.js`);
//runJSFile(`${jsDir}/scripts/createPointCloudScene.js`);
//runJSFile(`${jsDir}/scripts/createControllers.js`);

//runJSFile(`${jsDir}/scripts/createSpot.js`);
//watchJS(`${jsDir}/scripts/createSpotNew.js`);
//runJSFile(`${jsDir}/scripts/createBlub.js`);

watchJS(`${jsDir}/update.js`);


runJSFile(`${rootDir}/modules/compute/module.js`);
watchJS(`${rootDir}/modules/compute_ll/render.js`);
watchJS(`${rootDir}/modules/compute_hqs/render.js`);
runJSFile(`${rootDir}/modules/progressive/module.js`);
runJSFile(`${rootDir}/modules/octree/module.js`);
runJSFile(`${rootDir}/modules/clod/module.js`);
runJSFile(`${rootDir}/modules/build/module.js`);

watchJS(`${jsDir}/execute.js`);
// watchJS(`${jsDir}/execute2.js`);







