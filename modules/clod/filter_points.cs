#version 450

// license: none, yet

layout(local_size_x = 128, local_size_y = 1) in;

struct Vertex{
	float x;
	float y;
	float z;
	uint colors;
};

layout(std430, binding = 0) buffer ssInputBuffer{
	Vertex inputBuffer[];
};

layout(std430, binding = 1) buffer ssTargetBuffer{
	Vertex targetBuffer[];
};

layout(std430, binding = 3) buffer ssDrawParameters{
	uint  count;
	uint  primCount;
	uint  first;
	uint  baseInstance;
} drawParameters;

layout(location = 21) uniform int uBatchOffset;
layout(location = 22) uniform int uBatchSize;

layout(std140, binding = 4) uniform shader_data{
	mat4 transform;
	mat4 world;
	mat4 view;
	mat4 proj;

	vec2 screenSize;
	vec4 pivot;

	float CLOD;
	float scale;
	float spacing;
	float time;
} ssArgs;


float rand(float n){
	return fract(cos(n) * 123456.789);
}

void main(){

	uint inputIndex = gl_GlobalInvocationID.x;

	if(inputIndex > uBatchSize){
		return;
	}

	inputIndex = inputIndex + uBatchOffset;

	Vertex v = inputBuffer[inputIndex];

	vec3 aPosition = vec3(v.x, v.y, v.z);
	float level = float((v.colors & 0xFF000000) >> 24);
	float aRandom = rand(v.x + v.y + v.z);

	vec4 projected = (ssArgs.transform * vec4(aPosition, 1));
	projected.xyz = projected.xyz / projected.w;

	// extented-frustum culling
	float extent = 2;
	if(abs(projected.x) > extent || abs(projected.y) > extent){
		return;
	}

	// near-clipping
	if(projected.w < 0){
		return;
	}

	vec3 worldPos = (ssArgs.world * vec4(aPosition, 1)).xyz;

	// without level randomization
	//float pointSpacing = uScale * uSpacing / pow(2, level);

	// with level randomization
	float pointSpacing = ssArgs.scale * ssArgs.spacing / pow(2, level + aRandom);

	float d = distance(worldPos, ssArgs.pivot.xyz);
	float dc = length(projected.xy);

	// targetSpacing dependant on camera distance
	//float targetSpacing = (ssArgs.CLOD / 1000) * d;

	// dependant on cam distance and distance to center of screen
	float targetSpacing = (d * ssArgs.CLOD) / (1000 * max(1 - 0.7 * dc , 0.3));

	// reduce density away from center with the gaussian function
	// no significant improvement over 1 / (d - dc), so we've settled with the simpler one
	//float sigma = 0.4;
	//float gbc = (1 / (sigma * sqrt(2 * 3.1415))) * exp(-0.5 * pow( dc / sigma, 2.0 ));
	//targetSpacing = (1. * d * ssArgs.CLOD) / (1000 * gbc);

	if(pointSpacing < targetSpacing){
		return;
	}

	int targetIndex = int(atomicAdd(drawParameters.count, 1));
	targetBuffer[targetIndex] = v;
}


