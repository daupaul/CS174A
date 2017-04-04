//environment variable
var canvas;
var gl;
var program;
var aspect = 960/540; 

//data of 6 spheres
var p_sun = -25;
var s_orbit = [10, 60, 40, 50, 20, 30];
var distance = [0, 8, 13, 17, 20, 11];
var size = [4, 2, 0.75, 1, 1.25, 0.4];

//points to set up triangles of spheres
var pointsArray = [];
var normalsArray = [];
var n_points= 0;
var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

//camera variable
var a_flag = false;
var eye = vec3(0, 0, 0);
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);
//default position of camera
var x = 0;
var y = -10;
var z = 0;

//orbiting variable for camera and planets
var time = 0.0;
var timer;

//movement of camera
var degree = 1; //default to move 1 degree at a time
var heading = 0;
var pitch = 25;

//stored variable for attaching and detaching
var t_eye = vec3(0, 0, 0);
var t_at = vec3(0, 0, 0);
var t_up = vec3(0, 1, 0);
var t_heading = 0; 
var t_pitch = 25; 
var t_x = 0; 
var t_y = -10;
var t_z = 0;

//buffer of three different number of vertices to form spheres
var l_pbuffer;
var l_nbuffer;
var m_pbuffer;
var m_nbuffer;
var h_pbuffer;
var h_nbuffer;

//transformation matrix
var camera_matrix;
var projection;

//send to vertex shader 
var uniform_l_position;
var vPosition;
var vNormal;

//light products for vertex shader
var uniform_ambientProduct;
var uniform_diffuseProduct;
var uniform_specularProduct;
var uniform_shininess;

//ambient lighting and shading variable 
var a_light = vec4(1.0, 0.7, 0.7, 1.0);
var a_surface;
var ambientProduct;

//diffuse lighting and shading variable
var d_light = vec4(0.5, 0.5, 0.5, 1.0);
var d_surface;
var diffuseProduct;

//specular lighting and shading variable
var s_light = vec4(0.8, 0.8, 0.8, 1.0);
var s_surface;
var specularProduct;

//shininess and position of light source
var shininess = 70;
var l_position = vec3(0.0, 0.0, 0.0);
var t_l_position = vec3(0.0, 0.0, 0.0);


//function to generate vertices and push it to array
function triangle(a, b, c, type) {

	if(type) { //flat shading
		var t1 = subtract(b, a);
		var t2 = subtract(c, a);
		var normal = normalize(cross(t1, t2));
		normal = vec4(normal);

		normalsArray.push(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
	}
	else { //smooth shading
		normalsArray.push(scale1(-1,a));
		normalsArray.push(scale1(-1,b));
		normalsArray.push(scale1(-1,c));
	}

	pointsArray.push(a); //push the points of triangels into the array
	pointsArray.push(b);
	pointsArray.push(c);

	n_points += 3; //keep track of the array
}

//function to generate different number of verteics based on complexity
function divideTriangle(a, b, c, n_vertex, type) {
    if ( n_vertex > 0 ) {
                
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle(a, ab, ac, n_vertex-1, type);
        divideTriangle(ab, b, bc, n_vertex-1, type);
        divideTriangle(bc, c, ac, n_vertex-1, type);
        divideTriangle(ab, bc, ac, n_vertex-1, type);
    }
    else { 
        triangle(a, b, c, type);
    }
}

//helper function to take four points and generate vertices
function tetrahedron(a, b, c, d, n_vertex, type) {
    divideTriangle(a, b, c, n_vertex, type);
    divideTriangle(d, c, b, n_vertex, type);
    divideTriangle(a, d, b, n_vertex, type);
    divideTriangle(a, c, d, n_vertex, type);
}

//we can specify the complexity(number of vertices) and shading type to generate spheres
function creat_sphere(index, level, type) {
	if(type == 2) { //Gouraud shading
		gl.uniform1f(uniform_perVertex, true);//enable vertex shader
		gl.uniform1f(uniform_perFragment, false);
		uniform_ambientProduct = gl.getUniformLocation(program, "ambientProduct");//send data to vertex shader
	    uniform_diffuseProduct = gl.getUniformLocation(program, "diffuseProduct");
	    uniform_specularProduct = gl.getUniformLocation(program, "specularProduct");
	    uniform_l_position = gl.getUniformLocation(program, "l_position");
	    uniform_shininess = gl.getUniformLocation(program, "shininess");
	}
	else if(type == 3) { //Phong shading
		gl.uniform1f(uniform_perVertex, false);
		gl.uniform1f(uniform_perFragment, true);//enable fragment shader
		uniform_ambientProduct = gl.getUniformLocation(program, "ambientProduct2");//send data to fragment shader
	    uniform_diffuseProduct = gl.getUniformLocation(program, "diffuseProduct2");
	    uniform_specularProduct = gl.getUniformLocation(program, "specularProduct2");
	    uniform_shininess = gl.getUniformLocation(program, "shininess2");
	}
	else {
		gl.uniform1f(uniform_perVertex, true);
		gl.uniform1f(uniform_perFragment, false);
		uniform_ambientProduct = gl.getUniformLocation(program, "ambientProduct");
	    uniform_diffuseProduct = gl.getUniformLocation(program, "diffuseProduct");
	    uniform_specularProduct = gl.getUniformLocation(program, "specularProduct");
	    uniform_l_position = gl.getUniformLocation(program, "l_position");
	    uniform_shininess = gl.getUniformLocation(program, "shininess");
	}

	if(level == 2) { //generate with the most number of vertices
		gl.bindBuffer(gl.ARRAY_BUFFER, h_pbuffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, h_nbuffer);
		gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	}
	else if(level == 1) { //generate with the second most number of vertices
		gl.bindBuffer(gl.ARRAY_BUFFER, m_pbuffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, m_nbuffer);
		gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	}
	else { //generate with the smallest number of vertices
		gl.bindBuffer(gl.ARRAY_BUFFER, l_pbuffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, l_nbuffer);
		gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	}
	
	//set uniform variables for light
	gl.uniform3fv(uniform_l_position, flatten(l_position));
	gl.uniform4fv(uniform_ambientProduct, flatten(ambientProduct));
    gl.uniform4fv(uniform_diffuseProduct, flatten(diffuseProduct));
    gl.uniform4fv(uniform_specularProduct, flatten(specularProduct));
    gl.uniform1f(uniform_shininess, shininess);
	
	//set up the rotation of sphere
	model_matrix = camera_matrix;
	model_matrix = mult(model_matrix, rotate(heading, [0, 1, 0])); //allow navigation to take place
	model_matrix = mult(model_matrix, rotate(pitch, [1, 0, 0]));
	model_matrix = mult(model_matrix, translate(vec3(x, y, z)));
	model_matrix = mult(model_matrix, translate(vec3(0, 0, p_sun)));
	if(index == 5) { //if we are generating the moon
		model_matrix = mult(model_matrix, rotate(time*s_orbit[2], [0, 1, 0])); //orbit around the second planet from the sun
		model_matrix = mult(model_matrix, translate(vec3(0, 0, distance[2]))); //distance from the sun
		model_matrix = mult(model_matrix, rotate(time*s_orbit[index], [0, 1, 0])); //set its own orbiting speed
		model_matrix = mult(model_matrix, translate(vec3(0, 0, 2))); //distance from the second planet
	}
	else { //generating other than the moon
		model_matrix = mult(model_matrix, rotate(time*s_orbit[index], [0, 1, 0])); //set orbiting speed around the sun
		model_matrix = mult(model_matrix, translate(vec3(0, 0, distance[index]))); //distance from the sun
	}
	model_matrix = mult(model_matrix, scale(vec3(size[index], size[index], size[index]))); //size of the planet
	
    gl.uniformMatrix4fv(uniform_model_matrix, false, flatten(model_matrix));
    gl.uniformMatrix4fv(uniform_pMatrix, false, flatten(projection));

	for( var i=0; i<n_points; i+=3) 
        gl.drawArrays(gl.TRIANGLES, i, 3); //draw the planet
	
}

//keyboard based navigation
document.onkeydown = function buttons()
{
	if(event.keyCode==37) //left arrow to rotate camera left
		heading-=degree;
	else if(event.keyCode==39) //right arrow to rotate camera right
		heading+=degree;
	else if(event.keyCode==38 && !a_flag) //up arrow to rotate camera up
		pitch-=degree;
	else if(event.keyCode==40 && !a_flag) //down arrow to rotate camera down
		pitch+=degree;
	else if(event.keyCode>=49 && event.keyCode<=57) //number key to change the rotation degree
		degree=event.keyCode-48;
	else if(event.keyCode==32 && !a_flag) { //space to move the camera forward
		z+=degree;
		l_position = vec3(0.0, 0.0, z);
	}
	else if(event.keyCode==82) { //r key to reset the view of camera
		y = -10;
		z = 0;
		heading = 0;
		pitch = 25;
		a_flag = false;
		degree = 1;
		eye = vec3(0, 0, 0);
		at = vec3(0, 0, 0);
		up = vec3(0, 1, 0);
		l_position = vec3(0.0, 0.0, 0.0);
		camera_matrix = lookAt(eye, at, up);

	}
	else if(event.keyCode==65 && a_flag==false) { //a key to attach to the second planet from the sun
		a_flag = true;	
		//if currently not in attached mode, store the current view variable
		t_eye = eye;
		t_at = at;
		t_up = up;
		t_heading = heading;
		t_pitch = pitch;
		t_x = x;
		t_y = y;
		t_z = z;
		t_l_position = l_position
		
	}
	else if(event.keyCode==68 && a_flag==true) { //d to detach from planet
		a_flag = false;
		
		//reset the view to the last time we hit 'a' key
		x = t_x;
		y = t_y;
		z = t_z;
		eye = t_eye;
		at = t_at;
		up = t_up;
		heading = t_heading;
		pitch = t_pitch;
		l_position = t_l_position

		camera_matrix = lookAt(eye, at, up);
	}
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
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	//set up for the lowest number of vertices
	tetrahedron(va, vb, vc, vd, 2, 1);
	
    l_pbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, l_pbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    l_nbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, l_nbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

	//set up for the second most number of vertices
	tetrahedron(va, vb, vc, vd, 3, 0);

    m_pbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, m_pbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    m_nbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, m_nbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
	
	//set up for the most number of vertices
	tetrahedron(va, vb, vc, vd, 4, 0);

    h_pbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, h_pbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    h_nbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, h_nbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
	
	//set up normal and position variable for shader
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);

    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, l_pbuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, l_nbuffer);
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);	
	
	//set up bool variable to enable different shading
	uniform_perVertex = gl.getUniformLocation(program, "perVertex");
	uniform_perFragment = gl.getUniformLocation(program, "perFragment");
	
	//default shading
	gl.uniform1f(uniform_perVertex, false);
	gl.uniform1f(uniform_perFragment, true);
	uniform_ambientProduct = gl.getUniformLocation(program, "ambientProduct2");
    uniform_diffuseProduct = gl.getUniformLocation(program, "diffuseProduct2");
    uniform_specularProduct = gl.getUniformLocation(program, "specularProduct2");
    uniform_shininess = gl.getUniformLocation(program, "shininess2");
	
	//set up transformation matrix
    uniform_model_matrix = gl.getUniformLocation(program, "model_matrix");
    uniform_pMatrix = gl.getUniformLocation(program, "pMatrix");
	
	//initialize camera position
	camera_matrix = lookAt(eye, at, up);
    projection = perspective(90, aspect, 0.001, 1000);
	
	//set up light position
	uniform_light_matrix = gl.getUniformLocation(program, "light_matrix");
	light_matrix = camera_matrix;
	light_matrix = mult(light_matrix, rotate(heading, [0, 1, 0])); //allow navigation to take place
	light_matrix = mult(light_matrix, rotate(pitch, [1, 0, 0]));
	light_matrix = mult(light_matrix, translate(vec3(x, y, z)));
	light_matrix = mult(light_matrix, translate(vec3(0, 0, p_sun)));
	gl.uniformMatrix4fv(uniform_light_matrix, false, flatten(light_matrix));
	
	//start the timer for orbiting and rotation
    timer = new Timer();
	
    render();
}

function render() {
	
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    time += timer.getElapsedTime() / 1000; //update time for orbiting and rotation

    //sun
	var temp = vec4(1.0, 0.1, 0.0, 1.0);
	a_surface = temp; //set up surface reflection constant
	d_surface = vec4(0.0, 0.0, 0.0, 1.0);
	s_surface = vec4(0.0, 0.0, 0.0, 1.0);
	ambientProduct = mult(a_light, a_surface); //get the product of each lighting
	diffuseProduct = mult(d_light, d_surface);
	specularProduct = mult(s_light, s_surface);
	creat_sphere(0, 2, 0); //generate the sun with the most number of certices

	//first planet
	temp = vec4(0.5, 0.7, 0.7, 1.0); //icy-gray color
	a_surface = temp; //set up surface reflection constant
	d_surface = vec4(0.5-0.1*size[1], 0.7, 0.7+0.1*size[1], 1.0) //adjustment based on size
	s_surface = temp;
	ambientProduct = mult(a_light, a_surface); //get the product of each lighting
	diffuseProduct = mult(d_light, d_surface);
	specularProduct = mult(s_light, s_surface);
	creat_sphere(1, 0, 1); //genrate the first planet withflat shading and  low complexity and 
	
	//second planet
	temp = vec4(0.0, 1.0, 0.8, 1.0); //watery blue-green
	a_surface = temp; //set up surface reflection constant
	d_surface = vec4(0.4, 1.0, 0.8-0.1*size[2], 1.0); //adjustment based on size
	s_surface = temp;
	ambientProduct = mult(a_light, a_surface); //get the product of each lighting
	diffuseProduct = mult(d_light, d_surface);
	specularProduct = mult(s_light, s_surface);
	creat_sphere(2, 1, 2); //generate the second planet with Gourand shading and medium complexity

	//third planet
	temp = vec4(0.0, 0.4, 0.8, 1.0); //smooth blue water
	s_light = vec4(1.0, 1.0, 1.0, 1.0);
	a_surface = temp; //set up surface reflection constant
	d_surface = temp;
	s_surface = vec4(1.0, 1.0, 1.0, 1.0); //shinny
	ambientProduct = mult(a_light, a_surface); //get the product of each lighting
	diffuseProduct = mult(d_light, d_surface);
	specularProduct = mult(s_light, s_surface);
	creat_sphere(3, 2, 3); //generate the third planet with Phong shading and high complexity
	
	//fourth planet
	temp = vec4(0.8, 0.4, 0.2, 1.0); //brownish-orange
	a_surface = temp; //set up surface reflection constant
	d_surface = vec4(0.8-0.1*size[4], 0.4, 0.2+0.1*size[4], 1.0); //adjustment based on size
	s_surface = vec4(0.1, 0.1, 0.1, 1.0); //dull appearance
	ambientProduct = mult(a_light, a_surface); //get the product of each lighting
	diffuseProduct = mult(d_light, d_surface);
	specularProduct = mult(s_light, s_surface);
	creat_sphere(4, 1, 3); //generate the fourth planet with Phong shading and medium complexity
	
	//fifth planet(moon)
	temp = vec4(0.3, 0.4, 0.5, 1.0);
	a_surface = temp; //set up surface reflection constant
	d_surface = vec4(0.6, 0.4, 0.5-0.3*size[5], 1.0); //adjustment based on size
	s_surface = temp;
	ambientProduct = mult(a_light, a_surface);
	diffuseProduct = mult(d_light, d_surface);
	specularProduct = mult(s_light, s_surface);
	creat_sphere(5, 1, 2); 

    if(a_flag) { 
    	//if attach is enabled, set the view to the same plane as that of the planet
		pitch=0;
		heading=0;
		y=0;
		z=0;
		l_position=vec3(0.0, 0.0, 0.0);
		
		var my_matrix = mat4();
		my_matrix = mult(my_matrix, translate(vec3(0, 0, 25))); //attach to the third planet
		my_matrix = mult(my_matrix, rotate(-time*s_orbit[3], [0, 1, 0]));
		my_matrix = mult(my_matrix, translate(vec3(0, 0, distance[3])));
	
		eye = vec3(my_matrix[0][0], my_matrix[0][1], my_matrix[0][2]); //reset the view
		at = vec3(0, 0, 0);
		up = vec3(0, 1, 0);
		camera_matrix = lookAt(eye, at, up);
	}

	// render
    window.requestAnimFrame(render);
}
