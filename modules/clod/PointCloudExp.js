


if(typeof PointCloudExp === "undefined"){

	PointCloudExp = class PointCloudExp extends SceneNode{

		constructor(name, path){
			super(name);

			this.path = path;

			this.load();
		}

		async load(){


			log("load " + this.path);

			let file = openFile(this.path);

			let fileSize = file.fileSize();
			log("fileSize: " + fileSize);

			let numPoints = fileSize / 16;
			
			//let source = await file.readBytes(fileSize);
			//let sourceView = new DataView(source);

			let attributes = [
				new GLBufferAttribute("position", 0, 3, gl.FLOAT, gl.FALSE, 12, 0),
				new GLBufferAttribute("color", 1, 4, gl.UNSIGNED_BYTE, gl.TRUE, 4, 12),
				//new GLBufferAttribute("random", 2, 1, gl.FLOAT, gl.FALSE, 4, 16),
			];
			let bytesPerPoint = attributes.reduce( (a, v) => a + v.bytes, 0);

			let glBuffer = new GLBuffer();
			//glBuffer.setInterleaved(source, attributes, numPoints);
			this.components.push(glBuffer);

			glBuffer.attributes = attributes;

			gl.bindVertexArray(glBuffer.vao);
			gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer.vbo);
			gl.bufferData(gl.ARRAY_BUFFER, fileSize, 0, gl.DYNAMIC_DRAW);
			
			let stride = attributes.reduce( (a, v) => a + v.bytes, 0);

			for(let attribute of attributes){
				gl.enableVertexAttribArray(attribute.location);
				gl.vertexAttribPointer(
					attribute.location, 
					attribute.count, 
					attribute.type, 
					attribute.normalize, 
					stride, 
					attribute.offset);	
			}

			gl.bindVertexArray(0);

			{
				let vsPath = `${rootDir}/modules/clod/pointcloud.vs`;
				let fsPath = `${rootDir}/modules/clod/pointcloud.fs`;

				let shader = new Shader([
					{type: gl.VERTEX_SHADER, path: vsPath}, 
					{type: gl.FRAGMENT_SHADER, path: fsPath}, 
				]);
				shader.watch();
				let material = new GLMaterial();
				material.shader = shader;
				this.components.push(material);
			}

			let byteOffset = 0;
			let chunkSize = 100 * 1000 * 16;
			while(byteOffset < fileSize){

				let source = await file.readBytes(chunkSize);

				let view = new DataView(source);
				//let [x, y, z] = [view.getFloat32(0, true), view.getFloat32(4, true), view.getFloat32(8, true)];

				//log(`${x}, ${y}, ${z}`);

				//log("byteLenght: " + source.byteLength);
				//log(byteOffset + " / " + fileSize);

				gl.namedBufferSubData(glBuffer.vbo, byteOffset, source.byteLength, source);

				byteOffset += source.byteLength;
				glBuffer.count += source.byteLength / 16;
			}

			log("loaded " + this.path);
			file.close();
			
		}

	}
}

var lastUpdate = 0;
PointCloudExp.prototype.update = function(){

	let view = camera.transform.getInverse();
	let proj = camera.projectionMatrix;
	let pointcloud = this;

	//let {near, far} = camera;
	//let leftProj = new Matrix4().set(vr.getLeftProjection(near, far));
	//let rightProj = new Matrix4().set(vr.getRightProjection(near, far));

	//if( (now() - lastUpdate > 0.5)){
		if(USER_STUDY_RENDER_CLOD && LOD_UPDATES_ENABLED){
			updateCLOD(pointcloud, view, proj);

			//updateCLOD(pointcloud, view, rightProj);
		}

		lastUpdate = now();
	//}
};


"PointCloudExp.js"
