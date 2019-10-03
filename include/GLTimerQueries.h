

#pragma once

#include "GL\glew.h"
//#include "GLFW\glfw3.h"

#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
#include <queue>
//#include <iomanip>
//#include <sstream>

using std::cout;
using std::endl;
using std::string;
using std::unordered_map;
using std::vector;
using std::deque;
using std::shared_ptr;
//using std::stringstream;

struct GLTMark {
	GLuint handle = -1;
	uint64_t timestamp = 0;

	GLTMark(GLuint handle) {
		this->handle = handle;
	}
};

struct GLTMeasure {
	string name;
	shared_ptr<GLTMark> start;
	shared_ptr<GLTMark> end;
};

class GLTimerQueries {

	GLTimerQueries() {

	}

	static GLTimerQueries* instance() {

		static GLTimerQueries* _instance = new GLTimerQueries();

		return _instance;
	}

public:

	bool enabled = true;
	unordered_map<string, shared_ptr<GLTMark>> marks;
	unordered_map<string, deque<double>> history;
	vector<shared_ptr<GLTMark>> marksToResolve;
	vector<GLTMeasure> measures;

	static void mark(string name) {

		GLTimerQueries* glt = GLTimerQueries::instance();

		if (!glt->enabled) {
			return;
		}

		GLuint handle;
		glGenQueries(1, &handle);

		//GLTMark* mark = new GLTMark{ handle, 0 };
		auto mark = std::make_shared<GLTMark>(handle);

		glQueryCounter(handle, GL_TIMESTAMP);

		glt->marks[name] = mark;
	}

	static void measure(string name, string start, string end) {
		GLTimerQueries* glt = GLTimerQueries::instance();

		if (!glt->enabled) {
			return;
		}

		shared_ptr<GLTMark> qStart = glt->marks[start];
		shared_ptr<GLTMark> qEnd = glt->marks[end];

		GLTMeasure measure{ name, qStart, qEnd };

		glt->measures.push_back(measure);

	}

	static void resolve() {
		GLTimerQueries* glt = GLTimerQueries::instance();

		if (!glt->enabled) {
			return;
		}

		for (auto it : glt->marks) {
			shared_ptr<GLTMark> mark = it.second;
			glt->marksToResolve.push_back(mark);
		}

		glt->marks.clear();

		vector<shared_ptr<GLTMark>> stillToResolve;
		for (shared_ptr<GLTMark> mark : glt->marksToResolve) {
			uint64_t result = 123;
			glGetQueryObjectui64v(mark->handle, GL_QUERY_RESULT_AVAILABLE, &result);
			bool timestampAvailable = result == GL_TRUE;

			if (timestampAvailable) {
				uint64_t timestamp = 123;
				glGetQueryObjectui64v(mark->handle, GL_QUERY_RESULT, &timestamp);

				mark->timestamp = timestamp;
				glDeleteQueries(1, &mark->handle);
			} else {
				stillToResolve.push_back(mark);
			}
		}
		glt->marksToResolve = stillToResolve;

		if (glt->marksToResolve.size() > 100) {
			cout << "WARNING: more than 100 queries active" << endl;
		}

		vector<GLTMeasure> unresolvedMeasures;
		for (GLTMeasure measure : glt->measures) {

			shared_ptr<GLTMark> start = measure.start;
			shared_ptr<GLTMark> end = measure.end;
			bool resolved = start->timestamp != 0 && end->timestamp != 0;

			if (resolved) {
				uint64_t nanos = end->timestamp - start->timestamp;
				double seconds = double(nanos) / 1'000'000'000.0;

				if (glt->history.find(measure.name) == glt->history.end()) {
					glt->history[measure.name] = deque<double>();
				}

				deque<double>& history = glt->history[measure.name];
				history.push_back(seconds);

				if (history.size() > 100) {
					history.pop_front();
				}
			} else {
				unresolvedMeasures.push_back(measure);
			}

		}
		glt->measures = unresolvedMeasures;
	}

	static unordered_map<string, deque<double>> getHistory() {
		GLTimerQueries* glt = GLTimerQueries::instance();

		return glt->history;
	}

	static unordered_map<string, vector<double>> getMeanMinMax() {

		GLTimerQueries* glt = GLTimerQueries::instance();

		unordered_map<string, vector<double>> result;

		for (auto it : glt->history) {
			string name = it.first;
			deque<double> history = it.second;

			double sum = 0;
			double mi = 0;
			double ma = 0;

			for(double value : history){
				sum += value;
				mi = min(mi, value);
				ma = max(ma, value);
			}

			double avg = sum / history.size();

			result[name] = { avg, mi, ma };

			//stringstream ssAvg;
			//stringstream ssMin;
			//stringstream ssMax;
			//ssAvg << std::setprecision(3) << std::setw(8) << (avg * 1000);
			//ssMin << std::setprecision(3) << std::setw(8) << (min * 1000);
			//ssMax << std::setprecision(3) << std::setw(8) << (max * 1000);
			
			//string msg = ssAvg.str() + "ms / " + ssMin.str() + "ms / " + ssMax.str() + "ms";
			//
			//return msg;
		}

		return result;
	}


};






