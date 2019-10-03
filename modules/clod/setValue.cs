#version 450

layout(local_size_x = 128, local_size_y = 1) in;

layout(std430, binding = 0) buffer ssBuffer{
	int targetBuffer[];
};

layout(std140, binding = 0) uniform shader_data{
	int count;
	int value;
} ssArgs;

void main(){

	uint index = gl_GlobalInvocationID.x;

	if(index > ssArgs.count){
		return;
	}

	targetBuffer[index] = ssArgs.value;
}


