
#include <iostream>
#include <chrono>
#include <unordered_map>
#include <vector>
#include <filesystem>
#include <cstdlib>
#include <iomanip>
#include <random>
#include <thread>

#include "GL\glew.h"
#include "GLFW\glfw3.h"

#include "modules/progressive/ProgressiveLoader.h"
#include "modules/progressive/progressive.h"
#include "modules/progressive/ProgressiveBINLoader.h"

#include "GLTimerQueries.h"


using std::unordered_map;
using std::vector;
using std::cout;
using std::endl;
using std::chrono::high_resolution_clock;
using std::chrono::duration;
using std::chrono::duration_cast;
using std::thread;

using namespace LASLoaderThreaded;

namespace fs = std::experimental::filesystem;

static long long start_time = std::chrono::high_resolution_clock::now().time_since_epoch().count();

//int numPointsUploaded = 0;

//ProgressiveLoader* loader = nullptr;
//ProgressiveBINLoader* binLoader = nullptr;

double now() {
	auto now = std::chrono::high_resolution_clock::now();
	long long nanosSinceStart = now.time_since_epoch().count() - start_time;

	double secondsSinceStart = double(nanosSinceStart) / 1'000'000'000;

	return secondsSinceStart;
}

#include "Application.h"
#include "V8Helper.h"
#include "utils.h"
#include "Shader.h"

struct GLUpdateBuffer{
	void* mapPtr = nullptr;
	uint32_t size = 0;
	GLuint handle = 0;
	void* data = nullptr;
};

static GLUpdateBuffer updateBuffer = GLUpdateBuffer();

static void APIENTRY debugCallback(GLenum source, GLenum type, GLuint id, GLenum severity, GLsizei length, const GLchar* message, const void* userParam) {


	if (
		severity == GL_DEBUG_SEVERITY_NOTIFICATION 
		|| severity == GL_DEBUG_SEVERITY_LOW 
		|| severity == GL_DEBUG_SEVERITY_MEDIUM
		) {
		return;
	}

	cout << message << endl;
}


void error_callback(int error, const char* description){
	fprintf(stderr, "Error: %s\n", description);
}

static void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods){

	cout << "key: " << key << ", scancode: " << scancode << ", action: " << action << ", mods: " << mods << endl;

	if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS) {
		glfwSetWindowShouldClose(window, GLFW_TRUE);
	}

	KeyEvent data = { key, scancode, action, mods };

	Application::instance()->dispatchKeyEvent(data);
}

static void cursor_position_callback(GLFWwindow* window, double xpos, double ypos){
	//cout << "xpos: " << xpos << ", ypos: " << ypos << endl;
	MouseMoveEvent data = { xpos, ypos };

	Application::instance()->dispatchMouseMoveEvent(data);
}

void scroll_callback(GLFWwindow* window, double xoffset, double yoffset){
	MouseScrollEvent data = { xoffset, yoffset };

	Application::instance()->dispatchMouseScrollEvent(data);
}

void mouse_button_callback(GLFWwindow* window, int button, int action, int mods){
	//if (button == GLFW_MOUSE_BUTTON_RIGHT && action == GLFW_PRESS)
	//	popup_menu();

	MouseButtonEvent data = { button, action, mods };

	if (action == GLFW_PRESS) {
		Application::instance()->dispatchMouseDownEvent(data);
	} else if(action == GLFW_RELEASE) {
		Application::instance()->dispatchMouseUpEvent(data);
	}
}

//string ObjectToString(v8::Isolate* isolate, Local<Value> value) {
//	String::Utf8Value utf8_value(isolate, value);
//	return string(*utf8_value);
//}

//double startUpload = 0.0;
//double endUpload = 0.0;

uint64_t frameCount = 0;


void writeState() {

	stringstream text;

	text << R"V0G0N(

<html>
<head>
	<meta http-equiv="refresh" content = "1">
<style>
tr:nth-child(even) {background: rgb(245, 245, 245)}
tr:nth-child(odd) {background: #FFF}
table{
	border-collapse: collapse;
}
td{
	border: 1px solid rgb(200, 200, 200);
	font-family: "Consolas";
	padding: 6px 13px 6px 13px;
	margin: 0px;
}
pre{
	font-family: "Consolas";
}
</style>
</head>
<body>
<script>
// see https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function clipboardCopy(text){
	let textArea = document.createElement("textarea");

	textArea.style.position = 'fixed';
	textArea.style.top = 0;
	textArea.style.left = 0;
	textArea.style.width = '2em';
	textArea.style.height = '2em';
	textArea.style.padding = 0;
	textArea.style.border = 'none';
	textArea.style.outline = 'none';
	textArea.style.boxShadow = 'none';
	textArea.style.background = 'transparent';
	textArea.value = text;

	document.body.appendChild(textArea);

	textArea.select();

	 try {
		let success = document.execCommand('copy');
			if(success){
				console.log("copied text to clipboard");
			}else{
				console.log("copy to clipboard failed");
			}
	} catch (err) {
		console.log("error while trying to copy to clipboard");
	}

	document.body.removeChild(textArea);
}

function getEntry(key){
	const trs = Array.from(document.querySelectorAll("tr"));
	
	for(const tr of trs){
		const tds = tr.querySelectorAll("td");
		if(tds[1].textContent === key){
			return tds[2].textContent;
		}
	}

	return null;
}

</script>

	)V0G0N";


	text << "<table>" << endl;
	
	//cout << "============" << endl;
	for (auto& entry : V8Helper::instance()->debugValue) {

		text << "	<tr>" << endl;
		text << "		<td>" << entry.first << "</td>" << endl;
		text << "		<td><pre>" << entry.second << "</pre></td>" << endl;
		text << "	</tr>" << endl;
		//text << entry.first << ": " << entry.second << endl;
	}
	//cout << "== end of frame ==" << endl;

	text << "</table>" << endl;

	text << R"V0G0N(

<script>
	{ // add copy buttons
		const rows = document.querySelectorAll("tr");
		for(const row of rows){
			const el = document.createElement("td");
			el.innerHTML = "&#128203;"; 
			const cells = row.querySelectorAll("td");
			const last = cells[cells.length - 1];
			const content = last.textContent;

			el.onclick = (function(text){
				return function(){
					clipboardCopy(text);
				}
			})(content);

			row.insertBefore(el, row.firstChild);
		}
	}
</script>

</body>
</html>

)V0G0N";

	string strText = text.str();

	//thread t([strText]() {
		string path = "./state.html";

		std::ofstream file;
		file.open(path);

		file << strText << endl;

		file.close();
	//});

	//t.detach();
}



void createWriteStateThread() {
	thread* writeStateThread = new thread([]() {
		
		while (true) {

			writeState();

			std::this_thread::sleep_for(std::chrono::milliseconds(500));
		}

		

	});

	writeStateThread->detach();
}


int main() {

	cout << std::setprecision(3) << std::fixed;
	cout << "<main> " << "(" << now() << ")" << endl;

	//{
	//	cout << "building js package" << endl;
	//
	//	std::system("cd ../../ & rollup -c");
	//}
	//cout << "<built> " << "(" << now() << ")" << endl;

	glfwSetErrorCallback(error_callback);

	if (!glfwInit()) {
		// Initialization failed
	}

	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 5);
	//glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_COMPAT_PROFILE);
	glfwWindowHint(GLFW_FLOATING, GLFW_TRUE);
	glfwWindowHint(GLFW_DECORATED, false);

	int numMonitors;
	GLFWmonitor** monitors = glfwGetMonitors(&numMonitors);

	GLFWwindow* window = nullptr;

	cout << "<20> " << "(" << now() << ")" << endl;

	cout << "<create windows>" << endl;
	if (numMonitors > 1) {
		const GLFWvidmode * modeLeft = glfwGetVideoMode(monitors[0]);
		const GLFWvidmode * modeRight = glfwGetVideoMode(monitors[1]);

		window = glfwCreateWindow(modeRight->width, modeRight->height - 300, "Simple example", nullptr, nullptr);

		if (!window) {
			glfwTerminate();
			exit(EXIT_FAILURE);
		}

		glfwSetWindowPos(window, modeLeft->width, 0);
	} else {
		const GLFWvidmode * mode = glfwGetVideoMode(monitors[0]);

		window = glfwCreateWindow(mode->width / 2, mode->height / 2, "Simple example", nullptr, nullptr);

		if (!window) {
			glfwTerminate();
			exit(EXIT_FAILURE);
		}

		glfwSetWindowPos(window, mode->width / 2, 2 * mode->height / 3);
	}

	cout << "<windows created> " << "(" << now() << ")" << endl;

	cout << "<set input callbacks>" << endl;
	glfwSetKeyCallback(window, key_callback);
	glfwSetCursorPosCallback(window, cursor_position_callback);
	glfwSetScrollCallback(window, scroll_callback);
	glfwSetMouseButtonCallback(window, mouse_button_callback);

	glfwMakeContextCurrent(window);
	glfwSwapInterval(0);

	GLenum err = glewInit();
	if (GLEW_OK != err) {
		/* Problem: glewInit failed, something is seriously wrong. */
		fprintf(stderr, "glew error: %s\n", glewGetErrorString(err));
	}

	cout << "<glewInit done> " << "(" << now() << ")" << endl;

	glEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS);
	glDebugMessageControl(GL_DONT_CARE, GL_DONT_CARE, GL_DONT_CARE, 0, NULL, GL_TRUE);
	glDebugMessageCallback(debugCallback, NULL);

	//high_resolution_clock::time_point start = high_resolution_clock::now();
	//high_resolution_clock::time_point previous = start;

	int fpsCounter = 0;
	//high_resolution_clock::time_point lastFPSTime = start;
	double start = now();
	double tPrevious = start;
	double tPreviousFPSMeasure = start;


	V8Helper::instance()->window = window;
	V8Helper::instance()->setupV8();
	createWriteStateThread();

	cout << "<V8 has been set up> " << "(" << now() << ")" << endl;

	{
		cout << "<run start.js>" << endl;
		string code = loadFileAsString("../../src_js/start.js");
		V8Helper::instance()->runScript(code);
	}

	cout << "<start.js was executed> " << "(" << now() << ")" << endl;

	auto updateJS = V8Helper::instance()->compileScript("update();");
	auto renderJS = V8Helper::instance()->compileScript("render();");

	{

		int numPoints = 30'000'000;
		int bytesPerPoint = 16;

		updateBuffer.size = numPoints * bytesPerPoint;

		glCreateBuffers(1, &updateBuffer.handle);

		{// map buffer method, see https://www.slideshare.net/CassEveritt/approaching-zero-driver-overhead/85
			GLbitfield mapFlags = GL_MAP_WRITE_BIT | GL_MAP_PERSISTENT_BIT | GL_MAP_COHERENT_BIT;
			GLbitfield storageFlags = mapFlags | GL_DYNAMIC_STORAGE_BIT;

			glNamedBufferStorage(updateBuffer.handle, updateBuffer.size, nullptr, storageFlags);

			updateBuffer.mapPtr = glMapNamedBufferRange(updateBuffer.handle, 0, updateBuffer.size, mapFlags);
		}

		//{ // bufferData method
		//	
		//	glNamedBufferData(updateBuffer.handle, updateBuffer.size, nullptr, GL_DYNAMIC_DRAW);

		//	updateBuffer.data = malloc(10'000'000 * 16);
		//}
	}

	V8Helper::_instance->registerFunction("loadLASProgressive", [](const FunctionCallbackInfo<Value>& args) {
		if (args.Length() != 1) {
			V8Helper::_instance->throwException("loadLASProgressive requires 1 arguments");
			return;
		}

		String::Utf8Value fileUTF8(args[0]);
		string file = *fileUTF8;

		auto loadData = loadLasProgressive(file);
		auto loader = loadData->loader;

		auto isolate = Isolate::GetCurrent();
		Local<ObjectTemplate> lasTempl = ObjectTemplate::New(isolate);
		auto objLAS = lasTempl->NewInstance();

		auto lNumPoints = v8::Integer::New(isolate, loader->loader->header.numPoints);

		auto lHandles = Array::New(isolate, loader->ssVertexBuffers.size());
		for (int i = 0; i < loader->ssVertexBuffers.size(); i++) {
			auto lHandle = v8::Integer::New(isolate, loader->ssVertexBuffers[i]);
			lHandles->Set(i, lHandle);
		}
		objLAS->Set(String::NewFromUtf8(isolate, "handles"), lHandles);
		objLAS->Set(String::NewFromUtf8(isolate, "numPoints"), lNumPoints);

		{
			Local<ObjectTemplate> boxTempl = ObjectTemplate::New(isolate);
			auto objBox = lasTempl->NewInstance();

			auto& header = loader->loader->header;

			auto lMin = Array::New(isolate, 3);
			lMin->Set(0, v8::Number::New(isolate, header.minX));
			lMin->Set(1, v8::Number::New(isolate, header.minY));
			lMin->Set(2, v8::Number::New(isolate, header.minZ));

			auto lMax = Array::New(isolate, 3);
			lMax->Set(0, v8::Number::New(isolate, header.maxX));
			lMax->Set(1, v8::Number::New(isolate, header.maxY));
			lMax->Set(2, v8::Number::New(isolate, header.maxZ));

			objBox->Set(String::NewFromUtf8(isolate, "min"), lMin);
			objBox->Set(String::NewFromUtf8(isolate, "max"), lMax);

			objLAS->Set(String::NewFromUtf8(isolate, "boundingBox"), objBox);
		}

		auto pObjLAS = Persistent<Object, CopyablePersistentTraits<Object>>(isolate, objLAS);

		args.GetReturnValue().Set(objLAS);
	});

	V8Helper::_instance->registerFunction("setAttribute", [](const FunctionCallbackInfo<Value>& args) {
		if (args.Length() != 1) {
			V8Helper::_instance->throwException("setAttribute requires 1 arguments");
			return;
		}

		Isolate* isolate = Isolate::GetCurrent();

		auto obj = args[0]->ToObject(isolate);
		auto length = obj->Get(String::NewFromUtf8(isolate, "length"))->Uint32Value();
		auto array = Local<Array>::Cast(args[0]);

		vector<SetAttributeDescriptor> requestedAttributes;

		for (int i = 0; i < length; i++) {
			auto obji = array->Get(i)->ToObject(isolate);
			auto strName = String::NewFromUtf8(isolate, "name", NewStringType::kNormal).ToLocalChecked();
			auto strScale = String::NewFromUtf8(isolate, "scale", NewStringType::kNormal).ToLocalChecked();
			auto strOffset = String::NewFromUtf8(isolate, "offset", NewStringType::kNormal).ToLocalChecked();
			auto strRange = String::NewFromUtf8(isolate, "range", NewStringType::kNormal).ToLocalChecked();

			Local<Value> bla = obji->Get(strName);
			String::Utf8Value utf8Name(isolate, bla);

			string name = *utf8Name;

			bool hasScale = obji->Has(strScale);
			bool hasRange = obji->Has(strRange);
			
			if (hasScale) {
				double scale = obji->Get(strScale)->NumberValue();
				double offset = obji->Get(strOffset)->NumberValue();

				SetAttributeDescriptor a;
				a.name = name;
				a.useScaleOffset = true;
				a.scale = scale;
				a.offset = offset;
				requestedAttributes.emplace_back(a);
			} else if (hasRange) {

				auto rangeArray = obji->Get(strRange).As<v8::Array>();

				double rangeStart = rangeArray->Get(0)->NumberValue();
				double rangeEnd = rangeArray->Get(1)->NumberValue();

				SetAttributeDescriptor a;
				a.name = name;
				a.useRange = true;
				a.rangeStart = rangeStart;
				a.rangeEnd = rangeEnd;
				requestedAttributes.emplace_back(a);
			}

			
		}

		setAttribute(requestedAttributes);
	});

	V8Helper::_instance->registerFunction("loadBINProgressive", [](const FunctionCallbackInfo<Value>& args) {
		if (args.Length() != 1) {
			V8Helper::_instance->throwException("loadLBINProgressive requires 1 arguments");
			return;
		}

		String::Utf8Value fileUTF8(args[0]);
		string file = *fileUTF8;

		auto load = loadBinProgressive(file);
		auto loader = load->loader;

		auto isolate = Isolate::GetCurrent();
		Local<ObjectTemplate> lasTempl = ObjectTemplate::New(isolate);
		auto objLAS = lasTempl->NewInstance();

		auto lNumPoints = v8::Integer::New(isolate, loader->loader->numPoints);

		auto lHandles = Array::New(isolate, loader->ssVertexBuffers.size());
		for (int i = 0; i < loader->ssVertexBuffers.size(); i++) {
			auto lHandle = v8::Integer::New(isolate, loader->ssVertexBuffers[i]);
			lHandles->Set(i, lHandle);
		}
		objLAS->Set(String::NewFromUtf8(isolate, "handles"), lHandles);
		objLAS->Set(String::NewFromUtf8(isolate, "numPoints"), lNumPoints);

		auto pObjLAS = v8::Persistent<Object, v8::CopyablePersistentTraits<v8::Object>>(isolate, objLAS);

		// TODO might have to initialize point size right away since upload hook 
		// doesn't update js object anymore
		//binaryUploadHook(loader, pObjLAS);

		args.GetReturnValue().Set(objLAS);
	});



	cout << "<entering first render loop> " << "(" << now() << ")" << endl;

	while (!glfwWindowShouldClose(window)){

		//cout << frameCount << endl;

		// ----------------
		// TIME
		// ----------------

		//high_resolution_clock::time_point now = high_resolution_clock::now();
		//double nanosecondsSinceLastFrame = double((now - previous).count());
		//double nanosecondsSinceLastFPSMeasure = double((now - lastFPSTime).count());
		//
		//double timeSinceLastFrame = nanosecondsSinceLastFrame / 1'000'000'000;
		//double timeSinceLastFPSMeasure = nanosecondsSinceLastFPSMeasure / 1'000'000'000;

		double tCurrent = now();
		double timeSinceLastFrame = tCurrent - tPrevious;
		tPrevious = tCurrent;

		double timeSinceLastFPSMeasure = tCurrent - tPreviousFPSMeasure;

		if(timeSinceLastFPSMeasure >= 1.0){
			double fps = double(fpsCounter) / timeSinceLastFPSMeasure;
			stringstream ssFPS; 
			ssFPS << fps;
			

			V8Helper::instance()->debugValue["FPS"] = ssFPS.str();
			
			// ----------------
			// PRINT MESSAGES
			// ----------------
			if (Application::instance()->reportState) {
				cout << "============" << endl;
				for (auto &entry : V8Helper::instance()->debugValue) {
					cout << entry.first << ": " << entry.second << endl;
				}
				cout << "== end of frame ==" << endl;
			}

			// write state to self-refreshing html file
			//writeState();

			tPreviousFPSMeasure = tCurrent;
			fpsCounter = 0;
		}
		V8Helper::instance()->timeSinceLastFrame = timeSinceLastFrame;

		// ----------------

		EventQueue::instance->process();

		if(false){ // GL TIMER MEASUREMENS
			GLTimerQueries::resolve();

			for (auto it : GLTimerQueries::getMeanMinMax()) {

				string name = it.first;
				double avg = it.second[0];
				double mi = it.second[1];
				double ma = it.second[2];

				stringstream ssAvg;
				stringstream ssMin;
				stringstream ssMax;
				ssAvg << std::setprecision(3) << std::setw(8) << (avg * 1000);
				ssMin << std::setprecision(3) << std::setw(8) << (mi * 1000);
				ssMax << std::setprecision(3) << std::setw(8) << (ma * 1000);

				string msg = ssAvg.str() + "ms / " + ssMin.str() + "ms / " + ssMax.str() + "ms";
			
				V8Helper::instance()->debugValue[name] = msg;
			}

			for (auto it : GLTimerQueries::getHistory()) {

				string name = it.first;
				deque<double>& values = it.second;

				stringstream ss;
				ss << std::setprecision(3);
				int i = 0;
				for (double value : values) {
					ss << (value * 1000) << ", ";

					i++;
					if (i > 20) {
						ss << " ...";
						break;
					}
				}

				string key = name + ".history";
				string msg = ss.str();
				V8Helper::instance()->debugValue[key] = msg;

			}
		}


		//if (loadingLAS) {
		//	cout << "tslf: " << timeSinceLastFrame << endl;
		//}

		if (timeSinceLastFrame > 0.016) {
			cout << "too slow! time since last frame: " << int(timeSinceLastFrame * 1000.0) << "ms" << endl;
		}

		{
			static double toggle = now();
			static int missedFrames = 0;

			if (timeSinceLastFrame > 0.016) {
				missedFrames++;
			}

			if(now() - toggle >= 1.0){

				string msg = "";
				if (missedFrames == 0) {
					msg = std::to_string(missedFrames);
				} else {
					msg = "<b style=\"color:red\">" + std::to_string(missedFrames) + "</b>";
				}
				V8Helper::instance()->debugValue["#missed frames"] = msg;

				missedFrames = 0;
				toggle = now();
			}

		}


		// ----------------
		// RENDER WITH JAVASCRIPT
		// ----------------
		
		//Application::instance()->lockScreenCapture();
		updateJS->Run(V8Helper::instance()->context);
		renderJS->Run(V8Helper::instance()->context);
		//Application::instance()->unlockScreenCapture();


		// ----------------
		// swap and events
		// ----------------
		glfwSwapBuffers(window);
		glfwPollEvents();

		fpsCounter++;
		frameCount++;
	}

	glfwDestroyWindow(window);
	glfwTerminate();
	exit(EXIT_SUCCESS);

	return 0;
}