

#include "modules/progressive/progressive.h"

#include <iostream>
#include <memory>

using std::cout;
using std::endl;
using std::make_shared;

static bool loadingLAS = false;

// TODO bad
static ProgressiveLoader* loader = nullptr;

void binaryUploadHook(shared_ptr<BinLoadData> loadData) {

	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();

	schedule([loadData]() {

		if (!loadData->loader->isDone()) {
			binaryUploadHook(loadData);
		} else {
			loadData->tEndUpload = now();
			double duration = loadData->tEndUpload - loadData->tStartUpload;
			cout << "upload duration: " << duration << "s" << endl;
		}
	});
};


void uploadHook(shared_ptr<LoadData> loadData) {
	auto start = now();
	//cout << "chunks.size(): " << loader->loader->chunks.size() << endl;

	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();
	loadData->loader->uploadNextAvailableChunk();

	schedule([loadData]() {

		if (!loadData->loader->isDone()) {
			uploadHook(loadData);
		} else {
			loadData->tEndUpload = now();
			double duration = loadData->tEndUpload - loadData->tStartUpload;
			cout << "upload duration: " << duration << "s" << endl;


			//{ // OUT OF CORE - FLUSHING
			//
			//	double tStartFlush = now();
			//
			//	auto& chunks = loader->chunks;
			//
			//	for (Attribute& attribute : loader->loader->getAttributes()) {
			//
			//
			//		string file = loader->loader->file;
			//		string folder = file + "/../.progressive/";
			//		string filename = folder + attribute.name + ".bin";
			//		fs::create_directories(folder);
			//
			//		std::fstream myfile = std::fstream(filename, std::ios::out | std::ios::binary);
			//		//FILE* myfile = fopen(filename.c_str(), "wb");
			//
			//		for (auto points : chunks) {
			//			auto& as = points->attributes;
			//			auto a = std::find_if(as.begin(), as.end(), [&attribute](const Attribute& a) {return a.name == attribute.name; });
			//
			//			if (a == as.end()) {
			//				cout << "damn!" << endl;
			//			} else {
			//				BArray* data = (*a).data;
			//				//fwrite(data->data, 1, data->size, myfile);
			//				myfile.write(reinterpret_cast<const char*>(data->data), data->size);
			//			}
			//		}
			//		
			//		myfile.close();
			//		//fclose(myfile);
			//	}
			//
			//	double tEndFlush = now();
			//	double duration = tEndFlush - tStartFlush;
			//	cout << "duration(flush): " << duration << "s" << endl;
			//
			//}

			loadingLAS = false;
		}
	});

	auto duration = now() - start;
	//cout << "uploadHook(): " << duration << "s" << endl;
};

shared_ptr<LoadData> loadLasProgressive(string file) {

	//ProgressiveLoader* loader = new ProgressiveLoader(file);
	loader = new ProgressiveLoader(file);
	shared_ptr<LoadData> load = make_shared<LoadData>();
	load->tStartUpload = now();
	//load.tStart = now();

	load->loader = loader;

	uploadHook(load);

	return load;
}

shared_ptr<BinLoadData> loadBinProgressive(string file) {

	ProgressiveBINLoader* loader = new ProgressiveBINLoader(file);
	shared_ptr<BinLoadData> load = make_shared<BinLoadData>();
	load->tStartUpload = now();

	load->loader = loader;

	binaryUploadHook(load);

	return load;
}


void setAttribute(vector<SetAttributeDescriptor> attributes) {

	if (loader == nullptr) {
		return;
	}

	static atomic<int> pointsUploaded = 0;
	static atomic<int> chunkIndex = 0;

	double tStart = now();

	pointsUploaded = 0;
	chunkIndex = 0;

	// TODO creating mutex pointer ... baaad
	mutex* mtx = new mutex();

	vector<uint32_t> chunkOffsets = {0};
	for (auto& chunk : loader->chunks) {
		uint32_t chunkOffset = chunkOffsets[chunkOffsets.size() - 1] + chunk->size;
		chunkOffsets.push_back(chunkOffset);
	}

	auto setAttributeTask = [attributes, mtx, tStart, chunkOffsets]() {

		auto lasloader = loader->loader;

		auto findAttribute = [lasloader](string name, Points* chunk) {

			auto attributes = chunk->attributes;

			auto it = std::find_if(attributes.begin(), attributes.end(), [name](LASLoaderThreaded::Attribute& a) {
				return a.name == name;
			});

			if (it == attributes.end()) {
				return attributes[0];
			} else {
				return *it;
			}
		};

		while (true) {

			mtx->lock();

			if (chunkIndex >= loader->chunks.size()) {

				schedule([tStart](){
					double duration = now() - tStart;

					cout << "attribute upload duration: " << duration << "s" << endl;
				});

				mtx->unlock();
				break;
			}

			auto chunk = loader->chunks[chunkIndex];
			int currentChunkIndex = chunkIndex;
			chunkIndex++;
			mtx->unlock();

			int chunkSize = chunk->size;
			void* data = malloc(chunkSize * 4);
			uint32_t* target = reinterpret_cast<uint32_t*>(data);
			uint8_t* tu8 = reinterpret_cast<uint8_t*>(target);
			uint16_t* tu16 = reinterpret_cast<uint16_t*>(target);

			int targetByteOffset = 0;
			int packing = 4;
			if (attributes.size() == 2) {
				packing = 2;
			}if (attributes.size() > 2) {
				packing = 1;
			}

			for (SetAttributeDescriptor requestedAttribute : attributes) {

				string name = requestedAttribute.name;
				

				auto attribute = findAttribute(requestedAttribute.name, chunk);

				auto source = attribute.data->data;

				if(requestedAttribute.useScaleOffset){
					
					double scale = requestedAttribute.scale;
					double offset = requestedAttribute.offset;

					if (attributes.size() == 1) {
						if (attribute.elementSize == 1) {
							ProgressiveLoader::transformAttribute<uint8_t, float>(source, target, chunkSize, scale, offset, targetByteOffset);
						} else if (attribute.elementSize == 2) {
							ProgressiveLoader::transformAttribute<uint16_t, float>(source, target, chunkSize, scale, offset, targetByteOffset);
						} else if (attribute.elementSize == 4) {
							ProgressiveLoader::transformAttribute<uint32_t, float>(source, target, chunkSize, scale, offset, targetByteOffset);
						}
					} else if (attributes.size() == 2) {
						if (attribute.elementSize == 1) {
							ProgressiveLoader::transformAttribute<uint8_t, uint16_t>(source, target, chunkSize, scale, offset, targetByteOffset);
						} else if (attribute.elementSize == 2) {
							ProgressiveLoader::transformAttribute<uint16_t, uint16_t>(source, target, chunkSize, scale, offset, targetByteOffset);
						} else if (attribute.elementSize == 4) {
							ProgressiveLoader::transformAttribute<uint32_t, uint16_t>(source, target, chunkSize, scale, offset, targetByteOffset);
						}
					} else if (attributes.size() > 2) {
						if (attribute.elementSize == 1) {
							ProgressiveLoader::transformAttribute<uint8_t, uint8_t>(source, target, chunkSize, scale, offset, targetByteOffset);
						} else if (attribute.elementSize == 2) {
							ProgressiveLoader::transformAttribute<uint16_t, uint8_t>(source, target, chunkSize, scale, offset, targetByteOffset);
						} else if (attribute.elementSize == 4) {
							ProgressiveLoader::transformAttribute<uint32_t, uint8_t>(source, target, chunkSize, scale, offset, targetByteOffset);
						}
					}
				} else if (requestedAttribute.useRange) {

					double start = requestedAttribute.rangeStart;
					double end = requestedAttribute.rangeEnd;

					if (attributes.size() == 1) {
						if (attribute.elementSize == 1) {
							ProgressiveLoader::transformAttributeRange<uint8_t, float>(source, target, chunkSize, start, end, targetByteOffset);
						} else if (attribute.elementSize == 2) {
							ProgressiveLoader::transformAttributeRange<uint16_t, float>(source, target, chunkSize, start, end, targetByteOffset);
						} else if (attribute.elementSize == 4) {
							ProgressiveLoader::transformAttributeRange<uint32_t, float>(source, target, chunkSize, start, end, targetByteOffset);
						}
					} else if (attributes.size() == 2) {
						if (attribute.elementSize == 1) {
							ProgressiveLoader::transformAttributeRange<uint8_t, uint16_t>(source, target, chunkSize, start, end, targetByteOffset);
						} else if (attribute.elementSize == 2) {
							ProgressiveLoader::transformAttributeRange<uint16_t, uint16_t>(source, target, chunkSize, start, end, targetByteOffset);
						} else if (attribute.elementSize == 4) {
							ProgressiveLoader::transformAttributeRange<uint32_t, uint16_t>(source, target, chunkSize, start, end, targetByteOffset);
						}
					} else if (attributes.size() > 2) {
						if (attribute.elementSize == 1) {
							ProgressiveLoader::transformAttributeRange<uint8_t, uint8_t>(source, target, chunkSize, start, end, targetByteOffset);
						} else if (attribute.elementSize == 2) {
							ProgressiveLoader::transformAttributeRange<uint16_t, uint8_t>(source, target, chunkSize, start, end, targetByteOffset);
						} else if (attribute.elementSize == 4) {
							ProgressiveLoader::transformAttributeRange<uint32_t, uint8_t>(source, target, chunkSize, start, end, targetByteOffset);
						}
					}
				}

				targetByteOffset += packing;
			}

			int offset = chunkOffsets[currentChunkIndex];

			schedule([data, target, offset, chunkSize, tStart]() {
				loader->uploadChunkAttribute(target, offset, chunkSize);
				//cout << "uploaded a chunk" << endl;

				free(data);
			});


		}

		//mtx->unlock();
		//delete mtx;

	};

	thread t1(setAttributeTask);
	thread t2(setAttributeTask);
	thread t3(setAttributeTask);

	t1.detach();
	t2.detach();
	t3.detach();
}

