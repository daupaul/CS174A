
var canvas;
var gl;
camera_matrix = mat4();

var translate_cubes = [ //position of each cube
    vec3(-10, 10, 10),
    vec3(10, -10, 10),
    vec3(10, 10, 10),
    vec3(10, 10, -10),
    vec3(-10, -10, 10),
    vec3(-10, 10, -10),
    vec3(10, -10, -10),
    vec3(-10, -10, -10)
];

var colors = [ //color of each cube
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0],
    [0.5, 0.5, 0.5, 1.0],
    [0.0, 0.5, 1.0, 1.0]
]

var vertices = [ //cube fill indices for use with single triangle strip
    vec3( -0.5, -0.5, -0.5 ),
    vec3( 0.5, -0.5, -0.5 ),
    vec3( -0.5, -0.5,  0.5 ),
    vec3( 0.5, -0.5,  0.5 ),
    vec3( 0.5, 0.5,  0.5 ),
    vec3( 0.5, -0.5, -0.5 ),
    vec3( 0.5, 0.5,  -0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5, 0.5, -0.5 ),
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5, 0.5,  0.5 ),
    vec3( 0.5, 0.5,  0.5 ),
    vec3( -0.5, 0.5, -0.5 ),
    vec3( 0.5, 0.5,  -0.5 )                
];

var b_vertices = [ //border indices
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )

];

var indices = [ //indices for cube border
    0, 1, 1, 2, 2, 3, 3, 0,
    4, 5, 5, 6, 6, 7, 7, 4,
    0, 4, 1, 5, 2, 6, 3, 7
    ];

var ch_vertices = [ //cross hair vertices
    vec3( -1, 0, 2 ),
    vec3( 1, 0, 2),
    vec3(0, 1, 2),
    vec3(0, -1, 2)
];

var n_vertices  = 14;
var n_border = 24;
var vBuffer;
var bBuffer;
var vPosition;
var c_rotate = 0; //color rotation
var fov = 60;
var ca_start = -30
var ch_flag = false; //cross hair enable
var rot = 3; //rotate and scale cube
var scl = 6;
var aspect = 960/540; //canvas.width/canvas.height

document.onkeydown = function buttons()
{
    if (event.keyCode == 67) //c for color rotation
        c_rotate++;   
    
    //control the position of the camera along the y-axis
    else if(event.keyCode == 38) //up arrow for moving world up, camera down
        camera_matrix = mult( translate (0, -.25, 0), camera_matrix); 
    
    else if(event.keyCode == 40) //down arrow for moving world down, camera up
        camera_matrix = mult( translate (0, .25, 0), camera_matrix);
    
    else if(event.keyCode == 37) //left arrow for rotating world right, camera left
        camera_matrix = mult (rotate( -9, vec3(0, 1, 0)), camera_matrix);
   
    else if (event.keyCode == 39) //right arrow for rotating world left, camera right
        camera_matrix = mult (rotate( 1, vec3(0, 1, 0)), camera_matrix);
    
     //control the position of the camera along the x-axis and z-axis
    else if (event.keyCode == 73) //i for forward
        camera_matrix = mult( translate (0, 0, .25), camera_matrix);
    
    else if (event.keyCode == 74) //j for left
        camera_matrix = mult( translate (.25, 0, 0), camera_matrix);

    else if (event.keyCode == 75) //k for right
        camera_matrix = mult( translate (-.25, 0, 0), camera_matrix); 

    else if (event.keyCode == 77) //m for backward
        camera_matrix = mult( translate (0, 0, -.25), camera_matrix); 
    
    else if (event.keyCode == 82) //r for reset
    {
        camera_matrix = mult( mat4(), translate (0, 0, -30)); //position the world
        fov = 60;
        ch_flag = false;
    }

    else if(event.keyCode == 78) //n for zoom in
        fov -= 0.25;

    else if (event.keyCode == 87) //w for zoom out
        fov += 0.25;
    
    else if  (event.keyCode == 187) //+ for cross hair
        ch_flag = !ch_flag;
}

window.onload = function init()
{
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
    
    //initialize buffers
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
    
    //buffer for border vertex   
    bBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(b_vertices), gl.STATIC_DRAW );
    
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    
    //buffer for cube vertex
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    
    //cross hair vertex
    chBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, chBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(ch_vertices), gl.STATIC_DRAW );
    
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
 
    //initialize camera view
    camera_matrix = mult( mat4(), translate (0, 0, ca_start));
    
    vColor_loc = gl.getUniformLocation(program, "vColor");
    model_matrix_loc = gl.getUniformLocation(program, "model_matrix");
    camera_matrix_loc = gl.getUniformLocation(program, "camera_matrix");
    projection_loc = gl.getUniformLocation(program, "projection");

    render();
}

function render()
{
    projection = perspective(fov, aspect, .1, 1000);
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    rot = (rot + 2) %360; //update rotation angle
    scl = (scl + 6);  //update scale size
    scale_val = Math.sin(scl)*.1 +1; //grow 10% of original size at most
    
    gl.uniformMatrix4fv(camera_matrix_loc, false, flatten(camera_matrix));
    gl.uniformMatrix4fv(projection_loc, false, flatten(projection));
    
    for(var i = 0; i < 8; i++) //draw 8 cubes
    {
        model_matrix = mult( mat4(), translate (translate_cubes[i])); //set up position of the cube
        
        gl.uniform4fv(vColor_loc, colors[(i + c_rotate)%8]); //choose cube color
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

        model_matrix = mult(model_matrix, rotate(rot , vec3(0, 1, 0))); //make cubes spin
        model_matrix = mult(model_matrix, scale(scale_val , scale_val, scale_val)); //make cube scale
        gl.uniformMatrix4fv(model_matrix_loc, false, flatten(model_matrix));
          
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, n_vertices ); //draw cube
        
        //draw white edges
        gl.uniform4fv(vColor_loc, vec4( 1.0, 1.0, 1.0, 1.0 ));
        gl.bindBuffer( gl.ARRAY_BUFFER, bBuffer );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        
        gl.drawElements( gl.LINES, n_border, gl.UNSIGNED_BYTE, 0 ); //draw outline
    }
         
    if (ch_flag) //cross hair
    {
        temp = mat4();
        temp = camera_matrix; //save camera matrix for cubes
        model_matrix = mat4();
        camera_matrix = mat4();
        
        projection = ortho(-10*aspect, 10*aspect, -10, 10, -10 ,10); //project crosshair
        
        gl.uniformMatrix4fv(model_matrix_loc, false, flatten(model_matrix));
        gl.uniformMatrix4fv(camera_matrix_loc, false, flatten(camera_matrix));
        gl.uniformMatrix4fv(projection_loc, false, flatten(projection));
        
        gl.uniform4fv(vColor_loc, vec4( 1.0, 1.0, 1.0, 1.0 ));
        gl.bindBuffer( gl.ARRAY_BUFFER, chBuffer );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        
        gl.drawArrays( gl.LINES, 0, 4 ); //draw crosshair
        
        camera_matrix = temp; //saved matrix
    }
    requestAnimFrame( render );
}

