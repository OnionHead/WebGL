var shaderProgram, shaderVertexPositionAttribute, shaderProjectionMatrixUniform, shaderModelViewMatrixUniform, shaderTexCoordAttribute;
var projectionMatrix, modelViewMatrix, currentTime, duration, rotationAxis, shaderSamplerUniform, okToRun = false, webGLTexture;

function initWebgl(canvas){
  var gl = null;
  var msg ="Your browser does not support WebGL";

  try {
    gl = canvas.getContext("experimental-webgl");
  }catch(e){
    msg = "Error creating WebGL context: "+ e.toString();
  }

  if(!gl){
    console.error(msg);
  }

  return gl;
}

function initViewport(gl, canvas){
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function createCube(gl){
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
  var verts = [
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

     -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  var texCoordBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  var textureCoords = [
    // Front face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Back face
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    // Top face
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    // Bottom face
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
    // Right face
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    // Left face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  
  var cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

  var cubeIndices = [
    0, 1, 2,      0, 2, 3,    // Front face
    4, 5, 6,      4, 6, 7,    // Back face
    8, 9, 10,     8, 10, 11,  // Top face
    12, 13, 14,   12, 14, 15, // Bottom face
    16, 17, 18,   16, 18, 19, // Right face
    20, 21, 22,   20, 22, 23  // Left face
  ];
  
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

  return {
    buffer: vertexBuffer,
    texCoordBuffer, texCoordBuffer,
    indices: cubeIndexBuffer,
    vertSize: 3,
    nVerts: 24,
    texCoordSize: 2,
    nTexCoords: 24,
    nIndices: 36,
    primtype: gl.TRIANGLES
  }
}

function initMatrices(canvas){
  modelViewMatrix = mat4.create();
  projectionMatrix = mat4.create();

  mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -4]);
  mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);

  rotationAxis = vec3.create();
  vec3.normalize(rotationAxis, [1, 1, 1]);
}

function createShader(gl, str, type){
  var shader = false;

  if(type == 'fragment'){
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  }else if(type == 'vertex'){
    shader = gl.createShader(gl.VERTEX_SHADER);
  }

  if(!shader){
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader( shader );

  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function initShader(gl){
  var vertexShaderSource = document.querySelector("#vertexShaderSource").textContent;
	var fragmentShaderSource = document.querySelector("#fragmentShaderSource").textContent;

  var vertexShader = createShader(gl, vertexShaderSource, "vertex");
  var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");

  shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);

  gl.linkProgram(shaderProgram);

  shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
  gl.enableVertexAttribArray(shaderVertexPositionAttribute);

  shaderTexCoordAttribute = gl.getAttribLocation(shaderProgram, "texCoord");
  gl.enableVertexAttribArray(shaderTexCoordAttribute);
  
  shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
  shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
  shaderSamplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

  if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
    console.error("Could not initialize shaders");
  }
}

function handleTextureLoaded(gl, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.bindTexture(gl.TEXTURE_2D, null);

  okToRun = true;
}

function initTexture(gl) {
  webGLTexture = gl.createTexture();
  webGLTexture.image = new Image();
  webGLTexture.image.onload = function () {
    handleTextureLoaded(gl, webGLTexture)
  }
  webGLTexture.image.src = "webgl-logo-256.jpg";
}

function draw(gl, obj){
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);
  
  gl.useProgram(shaderProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
  gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
  gl.vertexAttribPointer(shaderTexCoordAttribute, obj.texCoordSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

  gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
  gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, modelViewMatrix);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, webGLTexture);
  gl.uniform1i(shaderSamplerUniform, 0);

  gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
}

function animate(){
  var now = Date.now();
  var deltat = now - currentTime;
  
  currentTime = now;

  var fract = deltat / duration;
  var angle = (Math.PI * 2 * fract);

  mat4.rotate(modelViewMatrix, modelViewMatrix, angle, rotationAxis);
}

function run(gl, cube){
  requestAnimationFrame(function(){
    run(gl, cube);
  });

  if(okToRun){
    draw(gl, cube);
    animate();
  }
}

function init(){
  var canvas = document.querySelector("#webgl");
  var gl = initWebgl(canvas);

  currentTime = Date.now();
  duration = 5000;

  initViewport(gl, canvas);
  initMatrices(canvas);
  
  var obj = createCube(gl);

  initShader(gl);
  initTexture(gl);
  run(gl, obj);
}

init();