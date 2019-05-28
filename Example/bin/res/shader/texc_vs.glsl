attribute vec4 a_Color;
attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec2 a_TexCoord;

uniform mat4 u_ModelMatrix;
uniform mat4 u_MvpMatrix; // 模型矩阵（视图矩阵 * 模型矩阵 * 顶点坐标）
uniform mat4 u_NormalMatrix;
uniform vec3 u_LightColor;
uniform vec3 u_LightDirection;
uniform vec3 u_AmbientLightColor;
uniform vec4 u_Eye;

varying float v_Dist;
varying vec3 v_LightColor;
varying vec2 v_TexCoord;

void main(){
    gl_Position = u_MvpMatrix * a_Position;
    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
    float nDotL = max(dot(u_LightDirection, normal), 0.);
    v_LightColor = u_LightColor * nDotL + u_AmbientLightColor;
    v_TexCoord = a_TexCoord;
    v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);
    // v_Dist = gl_Position.w;
}