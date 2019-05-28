attribute vec4 a_Color;
attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec2 a_TexCoord;

uniform mat4 u_MvpMatrix;
uniform mat4 u_NormalMatrix;
uniform vec3 u_LightColor;
uniform vec3 u_LightDirection;
uniform vec3 u_AmbientLightColor;

varying vec4 v_Color;
varying vec3 v_LightColor;
varying vec2 v_TexCoord;

void main() {
    gl_Position = u_MvpMatrix * a_Position;
    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
    float nDotL = max(dot(u_LightDirection, normal), 0.0);
    v_LightColor = u_LightColor * nDotL + u_AmbientLightColor;
    v_TexCoord = a_TexCoord;
}