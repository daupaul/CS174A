//environment variable
var canvas;
var gl;

var index = 0;
var rot = 0;

//transformation adn color matrix
var vColor, camera_matrix, model_matrix, projection;
//buffer for positions and vertices
var vBuffer, nBuffer, tBuffer;

var numVertices = 36;
var rabbitAngle = 0;

//store ball vertices
var ballPoints = [];
var ballNormals = [];
var size = vec3(0.9, 0.9, 0.9);

//sound effect
var gameMusic = new Audio("sound/wreckingBall.mp3");
var shootSound = new Audio("sound/cannon.mp3");
var backgroundMusic = new Audio("sound/wreckingBall_cut.mp3");
var popSound = new Audio("sound/pop.wav");
var music;
var sound = true;

//sphere data
var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333,1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

//ambient lighting variable
var ambient_L = vec4(0.5, 0.5, 0.5, 1.0);
var ambient_Mat = vec4(1.0, 1.0, 1.0, 1.0);
var ambientProduct = mult(ambient_L, ambient_Mat);

//diffuse lighting variable
var diffuse_L = vec4(1.0, 1.0, 1.0, 1.0);
var diffuse_Mat = vec4(1.0, 1.0, 1.0, 1.0);
var diffuseProduct = mult(diffuse_L, diffuse_Mat);

//specular lighting variable
var specular_L = vec4(1.0, 1.0, 1.0, 1.0);
var specular_Mat = vec4(1.0, 1.0, 1.0, 1.0);
var specularProduct = mult(specular_L, specular_Mat);

var lightPosition = vec4(0.0, 15.0, 10.0, 1.0);
var shininess = 50;

//store line vertices
var lineColor = vec4(1,1,0,1);
var linePoints = [];
var lineNormals = [];

//vertex data
var vertices = [vec4( 1,  2, 0 ,1),
                vec4( 1, -1, 0, 1),
                vec4(-1,  2, 0, 1),
                vec4(-1, -1, 0, 1),
                vec4( 1,  2, 0, 1),
                vec4( 1, -1, 0, 1),
                vec4(-1,  2, 0, 1),
                vec4(-1, -1, 0, 1)];

//colors for six types of balls
var colors = [[0.7, 0.0, 0.0, 0.9],
              [0.9, 0.5, 0.2, 0.9],
              [1.0, 1.0, 0.0, 0.9],
              [0.0, 0.0, 1.0, 0.9],
              [0.4, 0.8, 0.6, 0.9],
              [0.8, 0.8, 0.8, 0.9]];

//game variable for balls
var goal = 20;
var balls = 30;
var maxRows = 10;
var rowCnt = 0;
var colCnt = 10;
var curBall = new Ball(0,0);
var nextBall = new Ball(-9,1);
var grid = Array(maxRows+1);
var level = 1;
var timer;
var enableKeyControls = false;
var gamePlay = false;

//texture variables
var texArr = [];
var texShp = [];
var texCoord = [vec2(0,0),
                vec2(0,1),
                vec2(1,1),
                vec2(1,0)];
var texture;


function Ball(x,y) { //ball data structure
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.draw = true;
    this.match = false;
    this.connected = false;
}


function start() {
    $(".begin").hide();
    restart();
}

window.onload = function init() {

    //set up environment
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl){alert("WebGL isn't available");}
    gl.viewport(0,0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);

    $(".new").hide();
    $("#results").hide();
    music = backgroundMusic;
    music.play();

    //set up background texture
    backTex = gl.createTexture();
    backTex.Img = new Image();
    backTex.Img.onload = function() { //activate texture map
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.Img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    //load shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //generate vertices for balls
    trace(vertices, linePoints, lineNormals);
    cubeTex(texArr, texCoord);
    ballTex();
    tetrahedron(va, vb, vc, vd, 3);

    //send variables to shaders
    vColor = gl.getUniformLocation(program, "vColor");
    //set up normal and position variable for shader
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(vNormal);
    var vTexCoord = gl.getAttribLocation(program, "texCoord");
    gl.enableVertexAttribArray(vTexCoord);
    model_matrix = gl.getUniformLocation(program, "model_matrix");
    projection = gl.getUniformLocation(program, "projection");
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),  flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),  flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),  shininess);

    //buffer for points
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    //buffer for normals
    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    //texture buffer
    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    setInterval(render,10);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rot += level*2; //rotation of balls based on level

    //play music
    if (typeof music.loop == 'boolean') {
        music.loop = true;
    } else {
        music.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
        music.play();
    }

    //set up camera view
    pMatrix = ortho(-10, 10, 0, 20, -10, 10);
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix));
    camera_matrix = mat4();
    camera_matrix = mult(camera_matrix, rotate(rabbitAngle,[0,0,1]));

    gl.bufferData(gl.ARRAY_BUFFER, flatten(lineNormals), gl.STATIC_DRAW);
    gl.uniform4fv(vColor, lineColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(lineNormals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);

    gl.uniformMatrix4fv(model_matrix, false, flatten(camera_matrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    //render shooting line
    if(gamePlay==true){
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(linePoints), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    }

    //set up physics calculation of shooting line
    var dx = 0, dy = 0;
    gl.uniform4fv(vColor, vec4(0.7, 0, 0, 0.8));
    for (var i = 0; i < 15; i++) {
        dx += 2 * Math.sin(radians(-rabbitAngle));
        dy += 2 * Math.cos(radians(-rabbitAngle));
        if (dx < -9) {
          camera_matrix = mat4();
          camera_matrix = mult(camera_matrix, rotate(-rabbitAngle,[0,0,1]));
          camera_matrix = mult(camera_matrix, scale(vec3(0.01, 0.5, 0.2)));
          camera_matrix = mult(translate(-18-dx, dy, 0), camera_matrix);
        }
        else if (dx > 9) {
          camera_matrix = mat4();
          camera_matrix = mult(camera_matrix, rotate(-rabbitAngle,[0,0,1]));
          camera_matrix = mult(camera_matrix, scale(vec3(0.01, 0.5, 0.2)));
          camera_matrix = mult(translate(18-dx, dy, 0), camera_matrix);
        }
        else {
            camera_matrix = mat4();
            camera_matrix = mult(camera_matrix, rotate(rabbitAngle,[0,0,1]));
            camera_matrix = mult(camera_matrix, scale(vec3(0.01, 0.5, 0.2)));
            camera_matrix = mult(translate(dx, dy, 0), camera_matrix);
        }
        gl.uniformMatrix4fv(model_matrix, false, flatten(camera_matrix));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, numVertices);
    }

    //set up ball texture
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(ballPoints), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texShp), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(ballNormals), gl.STATIC_DRAW);
    textureSetUp(document.getElementById("texImage"));

    //render the shooting ball
    for (var i = 1; i <= 10; i++) {
        curBall.y += curBall.dy/10;
        curBall.x += curBall.dx/10;
        if (curBall.x > 9 || curBall.x < -9) {
            curBall.dx *= -1;
            displayBall(curBall);
        }
    }

    for (var j = 0; j < rowCnt; j++) {
        for (var k = 0; k < grid[j].length; k++) {
            displayBall(grid[j][k]);
            grid[j][k].connected = false;
            grid[j][k].match = false;
        }
    }

    if(rowCnt > maxRows)
        return;

    //collision detection
    for (var j = rowCnt-1; j >= 0; j--) {
        for (var k = 0; k < grid[j].length; k++) {
            var dx = curBall.x.toFixed(1) - grid[j][k].x;
            var dy = curBall.y.toFixed(1) - grid[j][k].y;
            if (grid[j][k].draw && dx * dx + dy * dy <= 3) {
                if (curBall.x < -9 || curBall.x > 9) {
                    dx *= -1;
                }
                if (dx > 0) {
                    if (dy > -1 && dy < 1)
                        clone(j, k+1, curBall);
                    else if (dy > 1) {
                        if (grid[j].length % 2)
                            clone(j-1, k+1, curBall);
                        else
                            clone(j-1, k, curBall);
                    }
                    else {
                        if (grid[j+1] == null)
                            newBottomRow();
                        if (grid[j].length % 2)
                            clone(j+1, k+1, curBall);
                        else
                            clone(j+1, k, curBall);
                    }
                }
                else {
                    if (dy > -1 && dy < 1)
                        clone(j, k-1, curBall);
                    else if (dy > 1) {
                        if (grid[j].length % 2)
                            clone(j-1, k, curBall);
                        else
                            clone(j-1, k-1, curBall);
                    }
                    else {
                        if (grid[j+1] == null)
                            newBottomRow();
                        if (grid[j].length % 2)
                            clone(j+1, k, curBall);
                        else
                            clone(j+1, k-1, curBall);
                    }
                }
                curBall.x = 0;
                curBall.dx = 0;
                curBall.y = 0;
                curBall.dy = 0;
                curBall.color = nextBall.color;
                nextBall.color = colors[Math.floor(Math.random() * colors.length)];
                break;
            }
            else if (j == 0 && dx * dx + dy * dy <= 2) {
                clone(j, k, curBall);
                curBall.x = 0;
                curBall.dx = 0;
                curBall.y = 0;
                curBall.dy = 0;
                curBall.color = nextBall.color;
                nextBall.color = colors[Math.floor(Math.random() * colors.length)];
                break;
            }
            if(rowCnt > maxRows) {
                return;
            }
        }
    }

    displayBall(curBall);
    displayBall(nextBall);

    // display results
    $('#level').html("Level " + level + "- ");
    $('#goal').html("Ball left: " + balls + " Goal: " + goal);
}

//helper function to push vertex points
function quad(vert, pts, norm, a, b, c, d, n){
    for(var i=0; i <6; i++)
      norm.push(n);
    pts.push(vert[a]);
    pts.push(vert[c]);
    pts.push(vert[d]);
    pts.push(vert[a]);
    pts.push(vert[d]);
    pts.push(vert[b]);
}

//helper function to set up balls
function trace(vert, pts, norm){
    quad(vert, pts, norm, 0, 1, 2, 3, vec4(0, 0, 1, 0));
    quad(vert, pts, norm, 4, 0, 6, 2, vec4(0, 1, 0, 0));
    quad(vert, pts, norm, 4, 5, 0, 1, vec4(1, 0, 0, 0));
    quad(vert, pts, norm, 2, 3, 6, 7, vec4(1, 0, 1, 0));
    quad(vert, pts, norm, 6, 7, 4, 5, vec4(0, 1, 1, 0));
    quad(vert, pts, norm, 1, 5, 3, 7, vec4(1, 1, 0, 0));
}

//helper function to take four points and generate vertices
function tetrahedron(a, b, c, d, k) {
    divideTriangle(a, b, c, k);
    divideTriangle(d, c, b, k);
    divideTriangle(a, d, b, k);
    divideTriangle(a, c, d, k);
}

//function to initialize texture
function textureSetUp( img ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, img );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

//generate texture for balls
function ballTex() {
    var latBand = 60;
    var longBand = 60;

    for(var latCnt = 0; latCnt <= latBand; latCnt++) {
        for(var longCnt = 0; longCnt <= longBand; longCnt++) {
            var u = 1 - (longCnt/longBand);
            var v = 1 - (latCnt/latBand);
            texShp.push(u);
            texShp.push(v);
        }
    }
}

//function to generate vertices and push it to array
function triangle(a, b, c) {
    ballPoints.push(a);
    ballPoints.push(b);
    ballPoints.push(c);

    ballNormals.push(a);
    ballNormals.push(b);
    ballNormals.push(c);
    index += 3;
}

//function to generate triangles of balls
function divideTriangle(a, b, c, cnt) {
    if (cnt > 0) {
        var ab = mix(a, b, 0.5);
        var bc = mix(b, c, 0.5);
        var ac = mix(a, c, 0.5);

        ab = normalize(ab, true);
        bc = normalize(bc, true);
        ac = normalize(ac, true);

        divideTriangle(a, ab, ac, cnt - 1);
        divideTriangle(ab, b, bc, cnt - 1);
        divideTriangle(bc, c, ac, cnt - 1);
        divideTriangle(ab, bc, ac, cnt - 1);
    }
    else
        triangle(a, b, c);
}

//helper function to push vertices coordinates
function quadTex(arr, coord) {
    arr.push(coord[0]);
    arr.push(coord[1]);
    arr.push(coord[2]);
    arr.push(coord[0]);
    arr.push(coord[2]);
    arr.push(coord[3]);
}

//helper function to create texture vertices
function cubeTex(arr, coord) {
    for(var i=0; i < 6; i++)
        quadTex(arr, coord);
}

function matchesCnt(j, k, color) {
	var count = 1;
	grid[j][k].match = true;

	var neighbors = checkAdjBalls(j, k);

	for (var i = 0; i < neighbors.length; i++)
		count += matchesCntHelper(neighbors[i][0], neighbors[i][1], color);
	if (count > 2) {
		if (sound)
			popSound.play();
		removeBall();
	}
	return;
}

function matchesCntHelper(j, k, color) {
	var count = 0;
	var neighbors = 0;
	if (grid[j][k].color == color && !grid[j][k].match) {
		grid[j][k].match = true;

		neighbors = checkAdjBalls(j, k);

		for (var i = 0; i < neighbors.length; i++) {
			count += matchesCntHelper(neighbors[i][0], neighbors[i][1], color);
		}
		count++;
	}
	return count;
}

// check ajacent balls
function checkAdjBalls(j, k) {
	var cols = grid[j].length;
	var adjBalls = [];

	if (j < (rowCnt-1)) {
		if (k < 9)
			adjBalls = addBall(j+1, k, adjBalls);
		if (cols % 2 == 0 && k > 0) // even row
			adjBalls = addBall(j+1, k-1, adjBalls);
		else if (cols % 2 != 0 && k < cols) // odd row
			adjBalls = addBall(j+1, k+1, adjBalls);
	}

	if (j > 0) {
		if (k < 9)
			adjBalls = addBall(j-1, k, adjBalls);
		if (cols % 2 == 0 && k > 0) // even row
			adjBalls = addBall(j-1, k-1, adjBalls);
		else if (cols % 2 != 0 && k < cols) // odd row
			adjBalls = addBall(j-1, k+1, adjBalls);
	}

	if (k > 0)
		adjBalls = addBall(j, k-1, adjBalls);
	if (k < cols-1)
		adjBalls = addBall(j, k+1, adjBalls);

	return adjBalls;
}

// add ball if visible
function addBall(j, k, adjBalls) {
	if(grid[j][k].draw)
		adjBalls.push([j, k]);

	return adjBalls;
}

function removeBall() {
	// remove matched balls
	for (var j = 0; j < rowCnt; j++) {
		for (var k = 0; k < grid[j].length; k++) {
			if(grid[j][k].match) {
				goal -= 1;
            	grid[j][k].draw = false;
			}
		}
	}

	if(goal <= 0){
		level++;
		goal = 15 + level*5;
		balls = 30;
		levelUp();
	}

	var neighbors;
	for (var k = 0; k < grid[0].length; k++) {
		if (grid[0][k].draw) {
			grid[0][k].connected = true;
			neighbors = checkAdjBalls(0, k);
			for (var i = 0; i < neighbors.length; i++)
				connectBalls(neighbors[i][0],neighbors[i][1]);
		}
	}

	for (var j = 0; j < rowCnt; j++)
		for (var k = 0; k < grid[j].length; k++)
			if (!grid[j][k].connected && grid[j][k].draw)
				grid[j][k].draw = false;

	var confirmEmpty = false;
	var rows = rowCnt;

	for (var j = 0; j < rows; j++) {
		var isEmpty = true;

		if (!confirmEmpty) {
			for (var k = 0; k < grid[j].length; k++) {
				if (grid[j][k].draw) {
	            	isEmpty = false;
	            	break;
				}
			}
			if (isEmpty)
				confirmEmpty = true;
		}
		if (confirmEmpty) {
			rowCnt--;
			grid[j] = null;
		}

		if (rowCnt == 0)
			newRow();
	}

	if(rowCnt < 5)
		for(var i=0; i < 2; i++)
			newRow();
	return;
}

//check if the neighbos are connected
function connectBalls(j, k) {
	grid[j][k].connected = true;

	var neighbors = checkAdjBalls(j, k);

	for (var i = 0; i < neighbors.length; i++) {
		var nk = neighbors[i][1];
		var nj = neighbors[i][0];

		if (!grid[nj][nk].connected) {
			connectBalls(nj, nk);
			grid[nj][nk].connected = true;
		}
	}
	return;
}

function shoot() {
	if (curBall.dy == 0 && curBall.dx == 0) {
		curBall.dy = Math.cos(radians(-rabbitAngle))/2;
		curBall.dx = Math.sin(radians(-rabbitAngle))/2;
	}
	return;
}


// cpy balls
function clone(j, k, b) {
	if (grid[j][k] == null)
		return;
	grid[j][k].color = b.color;
	grid[j][k].draw = true;

	if (balls <= 0) {
		prelevel = level;
		level = 1;
		gameOver();
		return;
	}
	if(goal <= 0){
		level++;
		levelUp();
		return;
	}
	if(rowCnt > maxRows) {
		prelevel=level;
		level = 1;
		gameOver();
		return;
    }
	matchesCnt(j, k, b.color);
	return;
}

// add new row
function newRow() {
	var dy = curBall.dy;
	var dx = curBall.dx;
	curBall.dx = 0;
    curBall.dy = 0;

	// generate new row
	var newRow;
	if(grid[0] == null || grid[0].length % 2)
		newRow = Array(colCnt);
	else
		newRow = Array(colCnt-1);
	for (var i = 0; i < newRow.length; i++)
		newRow[i] = new Ball(2 * i -9 + colCnt - newRow.length, 19);

	// move current rows down
	for (var i = rowCnt; i > 0; i--) {
		for (var j = 0; j < grid[i-1].length; j++)
			grid[i-1][j].y -= 1.7;
		grid[i] = grid[i-1];
	}

	// add new row to top of playing field
	grid[0] = newRow;
	rowCnt++;

	curBall.dx = dx;
    curBall.dy = dy;

	if (rowCnt > maxRows) {
		gameOver();
		level = 1;
		return;
	}
}

// make new row in the bottom
function newBottomRow() {
	var newRow;

	if (grid[rowCnt-1].length % 2)
		newRow = Array(colCnt);
	else
		newRow = Array(colCnt-1);

	for (var i = 0; i < newRow.length; i++) {
		newRow[i] = new Ball(2 * i -9 + colCnt - newRow.length, 19 - rowCnt * 1.7);
		newRow[i].draw = false;
	}

	grid[rowCnt] = newRow;
	rowCnt++;
	return;
}

// apply the angle and shoot the ball
function shoot() {
	if (curBall.dx == 0 && curBall.dy == 0) {
		curBall.dx = Math.sin(radians(-rabbitAngle))/2;
		curBall.dy = Math.cos(radians(-rabbitAngle))/2;
	}
}

// display/draw balls on screen using gl.TRIANGLES
function displayBall(ball) {
	if (!ball.draw)
		return;

	var translation = vec3(ball.x, ball.y, 0);
	var color = ball.color;

	camera_matrix = mult(mat4(), translate(translation));
	camera_matrix = mult(camera_matrix, scale(size));
	camera_matrix = mult(camera_matrix, rotate(rot, vec3(1,1,1)));
	gl.uniform4fv(vColor, color);
	gl.uniformMatrix4fv(model_matrix, false, flatten(camera_matrix));

	for (var i=0; i<index; i+=3)
		gl.drawArrays( gl.TRIANGLES, i, 3 );
}
