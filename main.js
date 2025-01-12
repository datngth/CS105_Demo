//CREATE C LANGUAGE SHADER CODE 

import * as glMatrix from './lib/common.js';
import * as mat4 from './lib/mat4.js'

// Because Java script won't run on GPU so build your own shaders
var Init = function()
{
    loadTextResource('./shaders/shader.vs.glsl', function(vsErr, vsText){
        if(vsErr){
            alert('Falal error getting vertex shader (see console)');
            console.error(vsErr);
        } else{
            loadTextResource('./shaders/shader.fs.glsl', function(fsErr, fsText){
                if(fsErr){
                    alert('Falal error getting fragment shader (see console)');
                    console.error(fsErr);
                } else{
                    main(vsText, fsText);
                }
            });
        }
    });
};

var main= function(vertexShaderText, fragmentShaderText){
    //init canvas
    /** @type {HTMLCanvasElement} */
    var canvas = document.getElementById("glcanvas"); 
    //init webgl
    /** @type {WebGLRenderingContext} */
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    //resize function
    function resizer(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
        //console.log("resized");
    }

    // Resize window event Listenner;
    window.addEventListener('resize', resizer);
    resizer();

    // Draw back ground
    gl.clearColor(0.75,0.85,0.8,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Enable depth test to draw face at the correct depth
    gl.enable(gl.DEPTH_TEST);
    // Enable CULL_FACE to only draw the front face
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    //
    // Create shader
    //
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    // Tell web gl which shaderSource we are using
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);
    
    //check compile shader
    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.error('ERROR compiling vertex shader', gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    
    //check compile shader
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.error('ERROR compiling fragment shader', gl.getShaderInfoLog(fragmentShader));
        return;
    }
    
    //create program like in C
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    //check for error when linking shader
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error('ERROR linking program', gl.getProgramInfoLog(program));
        return;
    }

    //
    // Create vertices for buffer
    //
    var [boxVertices, boxIndices] = createBoxVertexAndIndices(-3,0,0);
    var [sphereVertices, sphereIndices] = createSphereVertexAndIndices(3,0,0,240);
    
    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);
    
    // Tell WebGL which program we are using
    gl.useProgram(program);

    // Create uniform matrix from program.
    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    
    // Camera posistion
    var camPos = [0,0, -10]

    // Init some value for matrices
    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, camPos, [0,0,0], [0,1,0]);
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth/canvas.clientHeight,0.1,1000.0);
    
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    // Mouse event handler
    mouseControl(window, camPos);
    

	//
	// Main render loop
	//
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);
	var loop = function () {
		// Update camera position
        mat4.lookAt(viewMatrix,camPos, [0,0,0], [0,1,0]);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        // Draw background
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        // Draw box
        createBufferFromVerticesAndIndices(gl, boxVertices, boxIndices);
        getAttribData(gl, positionAttribLocation, colorAttribLocation);
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        // Draw sphere
        createBufferFromVerticesAndIndices(gl, sphereVertices, sphereIndices);
        getAttribData(gl, positionAttribLocation, colorAttribLocation);
        gl.drawElements(gl.TRIANGLES, sphereIndices.length, gl.UNSIGNED_SHORT, 0);
		
        requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
};

Init();