#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D u_Sampler;
uniform vec3 u_FogColor;
uniform vec2 u_FogDist;

varying vec2 v_TexCoord;
varying vec3 v_LightColor;
varying float v_Dist;

void main(){
    vec4 txColor = texture2D(u_Sampler, v_TexCoord);
    vec4 mColor = vec4(txColor.rgb * v_LightColor, txColor.a);
    float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
    vec3 color = mix(u_FogColor, vec3(mColor), fogFactor);
    gl_FragColor = vec4(color, mColor.a);
}