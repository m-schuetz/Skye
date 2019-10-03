

if($("desktop_mirror")){

	$("desktop_mirror").position.set(0., 1.15, -0.6);
	$("desktop_mirror").scale.set(0.9, 0.9, 0.9)

	$("desktop_mirror").updateMatrixWorld();
}

if($("heidentor")){

	let node = $("heidentor");

	let s = 0.1;
	node.world.elements.set([
		s, 0, 0, 0, 
		0, 0, s, 0, 
		0, s, 0, 0, 
		1.5, 0.5, -0.5, 1, 
	]);

}


// window.x = window.monitorWidth / 2;
// window.y = 0;
// window.width = window.monitorWidth / 2;
// window.height = window.monitorHeight;

// window.x = 1281;
// window.y = 31;
// window.width  = 1278;
// window.height = 1368;

window.width = 1600;
window.height = 1137;
window.x  = 2560;
window.y = 23;

log(view.position);

camera.near = 0.1;
camera.far = 10000;

CLOD_RANGE = [0.2, 0.2];
POINT_BUDGET_RANGE = [500 * 1000, 4 * 1000 * 1000];
USER_STUDY_TW = 0.001;

CLOD_BATCH_SIZE = 20 * 1000 * 1000;
LOD_UPDATES_ENABLED = false;
LOD_UPDATES_ENABLED = true;

USER_STUDY_RENDER_OCTREE = false;
USER_STUDY_RENDER_CLOD = true;

USER_STUDY_BLENDING = false;
EDL_ENABLED = true;
RENDER_DEFAULT_ENABLED = true;

USER_STUDY_OCTREE_MODE = "ADAPTIVE";
USER_STUDY_OCTREE_POINT_SIZE = 4;



USER_STUDY_LOD_MODIFIER = 0;

MSAA_SAMPLES = 4;

reportState(true);