#version 450

layout(location = 0) out vec4 out_color;


layout(location = 1) uniform mat4 uTransform;
layout(location = 4) uniform mat4 uProj;

//layout (depth_greater) out float gl_FragDepth;
layout (depth_less) out float gl_FragDepth;

//in vec2 vUV;
in vec3 vColor;
in float vPointSize;
in float vRadius;
in float vLinearDepth;

//layout(binding = 0) uniform sampler2D uTexture;
//layout(location = 0) uniform float uR;
//layout(location = 1) uniform float uG;
//layout(location = 2) uniform float uB;
//layout(location = 123) uniform vec3 uRGB;

void make3DShape(){
	float d = 2 * length(gl_PointCoord.xy - 0.5);

	float linearDepth = vLinearDepth + 4 * d * vRadius;
	vec4 projected = uProj * vec4(0, 0, -linearDepth, 1);
	float depth = projected.z / projected.w;
	gl_FragDepth = depth;
}

void main() {
	//out_color = vec4(uRGB, 1.0);
	out_color = vec4(vColor, 1.0);
	//out_color = vec4(1, 1, 1, 1.0);

	
	//out_color = vec4(1, 1, 1, 1);

	//make3DShape();

	// if(gl_FragCoord.x < 800){
	// 	discard;
	// }

	//discard;

	// if(gl_FragCoord.x > 798 && gl_FragCoord.x < 802){
	// 	out_color = vec4(0, 0, 0, 255);
	// }
	

}

