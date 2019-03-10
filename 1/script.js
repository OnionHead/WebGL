var shaderProgram, shaderVertexPositionAttribute, shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;
var projectionMatrix, modelViewMatrix;

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

function createSquare(gl){
  var vertexBuffer;

  vertexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  var verts = [
    .5, .5, 0.0,
    -.5, .5, 0.0,
    .5, -.5, 0.0,
    -.5, -.5, 0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  var square = {
    buffer: vertexBuffer,
    vertSize: 3,
    nVerts: 4,
    primtype: gl.TRIANGLE_STRIP
  }

  return square;
}

function initMatrices(canvas){
  modelViewMatrix = mat4.create();
  projectionMatrix = mat4.create();

  mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -3.333]);
  mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);
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
  
  shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
  shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

  if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
    console.error("Could not initialize shaders");
  }
}

function draw(gl, obj){
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(shaderProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
  gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
  gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, modelViewMatrix);

  gl.drawArrays(obj.primtype, 0, obj.nVerts);
}

function init(){
  var canvas = document.querySelector("#webgl");
  var gl = initWebgl(canvas);

  initViewport(gl, canvas);
  initMatrices(canvas);
  
  var obj = createSquare(gl);

  console.log(obj);

  initShader(gl);
  draw(gl, obj);
}

init();