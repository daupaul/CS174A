//environment variable
var canvas;
var gl;
var aspect = 960/540;

//navigation variables
var x = 0;
var y = 0;
var z = 0;

//vertices for cubes
var vertices = [
	vec3( 1, 1, 1),
	vec3(-1, 1, 1),
	vec3( 1,-1, 1),
	vec3( 1, 1,-1),
	vec3(-1,-1, 1),
	vec3(-1, 1,-1),
	vec3( 1,-1,-1),
	vec3(-1,-1,-1)   
];

//buffers for position and vertices
var pbuffer;
var vbuffer;
var vbuffer2;

//transformation matrix
var camera_matrix;
var projection;

//points to set up triangles of cube
var pointsArray = [];
var vArray = [];
var pointsArray2 = [];
var vArray2 = [];
var index = 0;

//texture mapping
var texture;
var texture2;

//camera variable
var eye = vec3(0, 0, 10);
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);

//event flag
var r_flag = false;
var s_flag = false;
var t_flag = false;

//rotation variable
var time = 0.0;
var timer;
var r1_speed = 0;
var r2_speed = 0;


//helper function to set up cube from array
function cube(vertices, points, vertex, coordinate){
    quad(vertices, points, vertex, 0, 2, 1, 4, coordinate);
    quad(vertices, points, vertex, 3, 0, 5, 1, coordinate);
    quad(vertices, points, vertex, 3, 6, 0, 2, coordinate);
    quad(vertices, points, vertex, 1, 4, 5, 7, coordinate);
    quad(vertices, points, vertex, 5, 7, 3, 6, coordinate);
    quad(vertices, points, vertex, 2, 6, 4, 7, coordinate);
}

//helper function to push vertex points
function quad(vertices, points, vertex, v1, v2, v3, v4, coordinate){
    if(coordinate == 0)
    {
	    vertex.push(vec2(0,0));
	    vertex.push(vec2(1,0));
	    vertex.push(vec2(1,1));
	    vertex.push(vec2(0,0));
	    vertex.push(vec2(1,1));
	    vertex.push(vec2(0,1));
	}
	else
	{
	    vertex.push(vec2(0.5-coordinate,0.5-coordinate));
	    vertex.push(vec2(1.5+coordinate,0.5-coordinate));
	    vertex.push(vec2(1.5+coordinate,1.5+coordinate));
	    vertex.push(vec2(0.5-coordinate,0.5-coordinate));
	    vertex.push(vec2(1.5+coordinate,1.5+coordinate));
	    vertex.push(vec2(0.5-coordinate,1.5+coordinate));
	}
	
	// push points
    points.push(vertices[v1]);
    points.push(vertices[v3]);
    points.push(vertices[v4]);
    points.push(vertices[v1]);
    points.push(vertices[v4]);
    points.push(vertices[v2]);
}


window.onload = function init() {

    //set up environment
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 ); //black background
    gl.enable(gl.DEPTH_TEST); //z-axis

    //load shaders
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    document.onkeydown = function(e) {
		e = e || window.event;
		if(e.keyCode===73) //i to move camera forward
			z+=0.1;
		else if(e.keyCode===79) //o to move camera backward
			z-=0.1;
		else if(e.keyCode===82) //r to rotate both cube
			r_flag = !r_flag;
		else if(e.keyCode===84) //t to rotate texture map of first cube
			t_flag = !t_flag;
		else if(e.keyCode===83) //s to scroll texture map of second cube
			s_flag = !s_flag;
	};

	texture = gl.createTexture(); //create texture object
    texture.image = new Image();
    texture.image.onload = function(){
		gl.bindTexture(gl.TEXTURE_2D, texture); //activate texture map
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); //use nearest neighbor filtering
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);
    }
	texture.image.src = "tsukemen.jpg";


	texture2 = gl.createTexture(); //create texture object
    texture2.image = new Image();
    texture2.image.onload = function(){
		gl.bindTexture(gl.TEXTURE_2D, texture2); //activate texture map
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture2.image); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); //Mip Mapping using tri-linear filtering
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
    }
	texture2.image.src = "menu.jpg";

	//set up vertices to draw cubes
    cube(vertices, pointsArray, vArray, 0);
	cube(vertices, pointsArray2, vArray2, 0.5); //zoomed out by 50%

	//buffer for position
    pbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	
	//buffer for the first cube vertex
	vbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vArray), gl.STATIC_DRAW);
	
	//buffer for the second cube vertex
	vbuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vArray2), gl.STATIC_DRAW);

    attribute_position = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(attribute_position);

    //send texture coordinates to shaders
	attribute_vertex = gl.getAttribLocation(program, "texCoord");
    gl.enableVertexAttribArray(attribute_vertex);

    gl.bindBuffer(gl.ARRAY_BUFFER, pbuffer);
    gl.vertexAttribPointer(attribute_position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.vertexAttribPointer(attribute_vertex, 2, gl.FLOAT, false, 0, 0);	
	
	//reference in the shader
    uniform_model_matrix = gl.getUniformLocation(program, "model_matrix");
    uniform_projection = gl.getUniformLocation(program, "projection");
	uniform_tex = gl.getUniformLocation(program, "tex");

	
	//initialize camera position
    camera_matrix = lookAt(eye, at, up);
    projection = perspective(50, aspect, 0.001, 1000);

	
	//start the timer for rotating features
    timer = new Timer();	
    gl.enable(gl.DEPTH_TEST);
	
    render();
}

function render() {
	
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    time += timer.getElapsedTime() / 1000; //update time for orbiting and rotation
	
	// if rotation is enabled, update the rotation variable
	if(r_flag) {
		r1_speed=time*120; //20 rpm
		r2_speed=time*180; //30 rpm
	}
		
	camera_matrix = lookAt(eye, at, up); //set up camera position
	gl.uniformMatrix4fv(uniform_projection, false, flatten(projection));
	
	if(t_flag) {
		var temp = vArray.slice();
		
		var degree = time*90*Math.PI/180; //texture rotate at 15 rpm

		for(var i=0; i<temp.length; i++) 
		{
			var p_x = temp[i][0];
			var p_y = temp[i][1];
			
			p_x = p_x-0.5;
			p_y = p_y-0.5;
			
			//rotate and translate back to the original position
			var temp1 = p_x*Math.cos(degree) + p_y*Math.sin(degree) + 0.5;
			var temp2 = -p_x*Math.sin(degree) + p_y*Math.cos(degree) + 0.5;

			//update the matrix
			temp[i] = [temp1, temp2];
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(temp), gl.STATIC_DRAW);
	}

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.vertexAttribPointer(attribute_vertex, 2, gl.FLOAT, false, 0, 0);

	//set up camera matrix
	model_matrix = camera_matrix;
	model_matrix = mult(model_matrix, translate(vec3(x,y,z)));
	model_matrix = mult(model_matrix, translate(vec3(-4, 0, 0)));
	model_matrix = mult(model_matrix, rotate(r1_speed, [0, 1, 0]));
	model_matrix = mult(model_matrix, scale(vec3(0.9, 0.9, 0.9)));
    gl.uniformMatrix4fv(uniform_model_matrix, false, flatten(model_matrix));
	
	//bind the first cube to texture
	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniform_tex, 0)

    //draw the cube
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	
	//if texture scrolling enabled
	if(s_flag) {		
	
		for(var i=0; i<vArray2.length; i++) {
			
			//scroll the translate the texture
			var temp1 = vArray2[i][0]+0.1;
			var temp2 = vArray2[i][1]+0;
			
			//updatet the matrix
			vArray2[i] = [temp1, temp2];
		}
		
		vbuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(vArray2), gl.STATIC_DRAW);
	}
		
	gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer2);
	gl.vertexAttribPointer(attribute_vertex, 2, gl.FLOAT, false, 0, 0); 
	
	//set up model-view matrix and bind
	model_matrix = camera_matrix;
	model_matrix = mult(model_matrix, translate(vec3(x,y,z)));
	model_matrix = mult(model_matrix, translate(vec3(4, 0, 0)));
	model_matrix = mult(model_matrix, rotate(r2_speed, [1, 0, 0]));
	model_matrix = mult(model_matrix, scale(vec3(0.9, 0.9, 0.9)));
    gl.uniformMatrix4fv(uniform_model_matrix, false, flatten(model_matrix));
	
	//set up camera matrix
	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(uniform_tex, 0)
	
	//draw the cube
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	
    window.requestAnimFrame(render);
}



