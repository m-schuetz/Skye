

if($("desktop_mirror")){

	$("desktop_mirror").position.set(0.8, 1.15, -0.6);
	$("desktop_mirror").scale.set(0.9, 0.9, 0.9)

	$("desktop_mirror").updateMatrixWorld();
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



camera.near = 0.01;
camera.far = 10000;

// MATTERHORN
//USER_STUDY_POINT_BUDGET = 1.7 * 1000 * 1000;
//CLOD = 0.77337131777;
// CLOD_RANGE = [0.5, 3];
// POINT_BUDGET_RANGE = [100 * 1000, 3 * 1000 * 1000];
// USER_STUDY_TW = 0.0005;

// ENDEAVOR
// POINT_BUDGET = 4 * 1000 * 1000;
// CLOD = 1.277337131777;
// POINT_BUDGET = 2.2 * 1000 * 1000;
// CLOD = 1.477337131777;
// CLOD = 2;
CLOD_RANGE = [1, 3];
POINT_BUDGET_RANGE = [500 * 1000, 4 * 1000 * 1000];
USER_STUDY_TW = 0.001;

//POINT_BUDGET = 1 * 1000 * 1000;
//CLOD = 2.877337131777;
CLOD_BATCH_SIZE = 20 * 1000 * 1000;
LOD_UPDATES_ENABLED = false;
LOD_UPDATES_ENABLED = true;

USER_STUDY_RENDER_OCTREE = false;
USER_STUDY_RENDER_CLOD = true;

USER_STUDY_BLENDING = false;
EDL_ENABLED = true;
RENDER_DEFAULT_ENABLED = false;

USER_STUDY_OCTREE_MODE = "ADAPTIVE";
USER_STUDY_OCTREE_POINT_SIZE = 4;

USER_STUDY_LOD_MODIFIER = 0;

MSAA_SAMPLES = 4;

GLTimerQueries.enabled = true;


US_setMethodA = function(){
	USER_STUDY_RENDER_OCTREE = true;
	USER_STUDY_RENDER_CLOD = false;
	USER_STUDY_OCTREE_MODE = "ADAPTIVE";

	let snRight = $("vr.controller.right");
	snRight.getComponent(GLMaterial).texture = texRightSelA;
};

US_setMethodB = function(){
	USER_STUDY_RENDER_OCTREE = true;
	USER_STUDY_RENDER_CLOD = false;
	USER_STUDY_OCTREE_MODE = "FIXED";

	let snRight = $("vr.controller.right");
	snRight.getComponent(GLMaterial).texture = texRightSelB;
};

US_setMethodC = function(){
	USER_STUDY_RENDER_OCTREE = false;
	USER_STUDY_RENDER_CLOD = true;

	let snRight = $("vr.controller.right");
	snRight.getComponent(GLMaterial).texture = texRightSelC;
};

US_setMethodA();

log(texRightSelC.width);


var testcases = {

	MATTERHORN: () => {
		CLOD_RANGE = [0.7, 0.7];
		POINT_BUDGET_RANGE = [2 * 1000 * 1000, 2 * 1000 * 1000];
		USER_STUDY_TW = 0.0005;

		USER_STUDY_BLENDING = false;
		EDL_ENABLED = false;
		RENDER_DEFAULT_ENABLED = true;
		USER_STUDY_OCTREE_POINT_SIZE = 3;
	},
	MATTERHORN_ADDITIVE: () => {
		CLOD_RANGE = [0.7, 0.7];
		POINT_BUDGET_RANGE = [100 * 1000, 2 * 1000 * 1000];
		USER_STUDY_TW = 0.0005;

		USER_STUDY_BLENDING = true;
		EDL_ENABLED = false;
		RENDER_DEFAULT_ENABLED = false;
	},
	ENDEAVOR_COLOR: () => {
		CLOD_RANGE = [1.6, 1.6];
		POINT_BUDGET_RANGE = [3 * 1000 * 1000, 3 * 1000 * 1000];
		USER_STUDY_TW = 0.001;

		USER_STUDY_BLENDING = false;
		EDL_ENABLED = false;
		RENDER_DEFAULT_ENABLED = false;
		$("endeavor_oct").pointSize = 1;
		$("endeavor_clod").pointSize = 1;
	},
	ENDEAVOR_EDL: () => {
		CLOD_RANGE = [2.3, 2.3];
		POINT_BUDGET_RANGE = [1.5 * 1000 * 1000, 1.5 * 1000 * 1000];
		USER_STUDY_TW = 0.001;

		USER_STUDY_BLENDING = false;
		EDL_ENABLED = true;
		RENDER_DEFAULT_ENABLED = false;

		$("endeavor_oct").pointSize = 0.8;
		$("endeavor_clod").pointSize = 0.8;
	},
	ENDEAVOR_ADDITIVE: () => {
		CLOD_RANGE = [1.7, 1.7];
		POINT_BUDGET_RANGE = [2 * 1000 * 1000, 2 * 1000 * 1000];
		USER_STUDY_TW = 0.001;

		USER_STUDY_BLENDING = true;
		EDL_ENABLED = false;
		RENDER_DEFAULT_ENABLED = false;

		$("endeavor_oct").pointSize = 0.6;
		$("endeavor_clod").pointSize = 0.6;
	},
	ENDEAVOR_SMALL_POINTS: () => {
		CLOD_RANGE = [2.6, 2.6];
		POINT_BUDGET_RANGE = [1.5 * 1000 * 1000, 1.5 * 1000 * 1000];
		USER_STUDY_TW = 0.001;

		USER_STUDY_BLENDING = false;
		EDL_ENABLED = false;
		RENDER_DEFAULT_ENABLED = false;

		$("endeavor_oct").pointSize = 0.3;
		$("endeavor_clod").pointSize = 0.3;
	},

};

reportState(false);