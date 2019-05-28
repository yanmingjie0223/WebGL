#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D u_Sampler;

varying vec2 v_TexCoord;
varying vec3 v_LightColor;

void main() {
    vec4 txColor = texture2D(u_Sampler, v_TexCoord);
    gl_FragColor = vec4(txColor.rgb * v_LightColor, txColor.a);
}