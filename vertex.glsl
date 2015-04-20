precision highp float;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

attribute vec3 position;
attribute vec4 color;

varying vec4 fColor;

void main() {
	gl_PointSize = 5.0;
	gl_Position = projection * view * model * vec4(position, 1.0);
	fColor = color;
}