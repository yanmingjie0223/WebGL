attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;

uniform mat4 u_MvpMatrix;
uniform mat4 u_NormalMatrix;

varying vec4 v_Color;

void main() {
    gl_Position = u_MvpMatrix * a_Position;
    vec3 lightDirection = normalize(vec3(0.5, 3.0, 4.0));
    vec3 lightColor = vec3(0.0667, 0.8863, 0.3373);
    vec3 amblientColor = vec3(1.0, 1.0, 1.0);
    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
    float nDotL = max(dot(normal, lightDirection), 0.0);
    vec3 color = lightColor * a_Color.rgb * nDotL + amblientColor * a_Color.rgb;
    v_Color = vec4(color, a_Color.a);
}