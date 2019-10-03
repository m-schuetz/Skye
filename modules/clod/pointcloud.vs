#version 450

// license: none, yet

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec4 aColor;

layout(location = 0) uniform int uNodeIndex;

layout(binding = 0) uniform sampler2D uGradient;

layout(std140, binding = 4) uniform shader_data{
	mat4 transform;
	mat4 world;
	mat4 view;
	mat4 proj;
	mat4 centralView;
	mat4 centralProj;
	mat4 centralTransform;

	vec2 screenSize;
	vec4 pivot;

	float CLOD;
	float scale;
	float spacing;
	float time;

	float minMilimeters;
	float pointSize;
	float colorMultiplier;
} ssArgs;

out vec3 vColor;
out float vPointSize;
out float vRadius;
out float vLinearDepth;


float rand(float n){
	return fract(cos(n) * 123456.789);
}


void main() {

	vec4 pos = ssArgs.transform * vec4(aPosition, 1.0);

	gl_Position = pos;

	vec4 projected = gl_Position / gl_Position.w;

	vec4 centralProjected = ssArgs.centralTransform * vec4(aPosition, 1.0);
	centralProjected.xyz = centralProjected.xyz / centralProjected.w;

	vLinearDepth = gl_Position.w;

	vColor = aColor.rgb * ssArgs.colorMultiplier;

	vec3 worldPos = (ssArgs.world * vec4(aPosition, 1)).xyz;

	float d = distance(worldPos, ssArgs.pivot.xyz);
	float dc = length(centralProjected.xy);
	
	float level = mod(aColor.a * 255, 128);
	float aRandom = rand(aPosition.x + aPosition.y + aPosition.z);

	float pointSpacing = ssArgs.scale * ssArgs.spacing / pow(2, level + aRandom);

	// targetSpacing dependant on camera distance
	//float targetSpacing = (d * ssArgs.CLOD / 1000);

	// dependent on cam distance and distance to center of screen
	//float targetSpacing = (d * ssArgs.CLOD) / (1000 * max(1 - 0.7 * dc , 0.3));
	float targetSpacing = (d * ssArgs.CLOD) / (1000 * max(1 - 0.7 * dc , 0.3));

	// reduce density away from center with the gaussian function
	// no significant improvement over 1 / (d - dc), so we've settled with the simpler one
	//float sigma = 0.4;
	//float gbc = (1 / (sigma * sqrt(2 * 3.1415))) * exp(-0.5 * pow( dc / sigma, 2.0 ));
	//targetSpacing = (1. * d * ssArgs.CLOD) / (1000 * gbc);

	float minPixels = 1;
	float maxPixels = 80;
	float sizeMultiplier = 1 * ssArgs.pointSize;

	float minMilimeters = ssArgs.scale * ssArgs.minMilimeters / sizeMultiplier;

	{ // point size based on target spacing
		float ws = max(targetSpacing, minMilimeters / 1000.0);

		float l = sizeMultiplier * 2 * ws;
		vec4 v1 = ssArgs.view * ssArgs.world * vec4(aPosition, 1.0);
		vec4 v2 = vec4(v1.x + l, v1.y + l, v1.z, 1.0);

		vec4 vp1 = ssArgs.proj * v1;
		vec4 vp2 = ssArgs.proj * v2;

		vec2 vs1 = vp1.xy / vp1.w;
		vec2 vs2 = vp2.xy / vp2.w;

		float ds = distance(vs1, vs2);
		float dp = ds * ssArgs.screenSize.y;

		gl_PointSize = (dp / 1) * 1;

		gl_PointSize = clamp(gl_PointSize, minPixels, maxPixels);

		vRadius = ws;
	}

	{ // adjust point size within blend-in range
		float zeroAt = pointSpacing;
		float fullAt = 0.8 * pointSpacing;
		
		float u = (targetSpacing - fullAt) / (zeroAt - fullAt);
		u = 1 - clamp(u, 0, 1);

		gl_PointSize = gl_PointSize * u;
	}

	vPointSize = gl_PointSize;

	gl_PointSize *= 0.8;
	//gl_PointSize = 5;
}

