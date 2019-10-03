
#pragma once

#include <vector>

#include "v8.h"

#include "modules/progressive/ProgressiveLoader.h"
#include "modules/progressive/ProgressiveBINLoader.h"

using std::vector;

using v8::CopyablePersistentTraits;
using v8::Persistent;
using v8::Object;
using v8::Array;
using v8::Isolate;
using v8::ObjectTemplate;
using v8::Local;


class LoadData {
public:

	ProgressiveLoader* loader = nullptr;
	double tStartUpload = 0;
	double tEndUpload = 0;

	LoadData() {

	}

};


class BinLoadData {
public:

	ProgressiveBINLoader* loader = nullptr;
	double tStartUpload = 0;
	double tEndUpload = 0;

	BinLoadData() {

	}
};

struct SetAttributeDescriptor {
	string name = "";

	bool useScaleOffset = false;
	double scale = 1.0;
	double offset = 0.0;

	bool useRange = false;
	double rangeStart = 0.0;
	double rangeEnd = 1.0;
};

shared_ptr<LoadData> loadLasProgressive(string file);

shared_ptr<BinLoadData> loadBinProgressive(string file);

void setAttribute(vector<SetAttributeDescriptor> attributes);


//void uploadHook(shared_ptr<LoadData> loadData);



//void binaryUploadHook(BinLoadData* loader);


