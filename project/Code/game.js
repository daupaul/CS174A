function showInstructions(){ //for showing instruction page
	$("#newstart-button").show();
	$("#gl-canvas").css("background", "url(texture/newinstructions.jpg)");
	$("#instructions-button").hide();
	$("#start-button").hide();
}

function levelUp(){ //for showing levelup page
	gamePlay=false;
	$(".end").hide();
	$("#results").hide();
    clearGamePage(); //clear game stage and show levelup page
	$(".continue").show();
	$("#gl-canvas").css("background", "url(texture/levelupnew.jpg)");
}

function gameOver() {
	currlevel = prelevel -1;
	if(currlevel<1) //show different messages depending on whether a level has been completed or not
		showGameOver();
	else{
		showCompleteLevel();
		$("h2").html("YOU FINISHED LEVEL " + currlevel +" !");
	}
	gamePlay = false;
	$(".end").show();
	$("#results").hide();
	clearGamePage();
}

function showGameOver(){
	$(".end").hide();
	$("#results").hide();
	clearGamePage();
    $("#gl-canvas").css("background", "url(texture/gameoverbeach.jpg)");
}

function showCompleteLevel(){
	$(".end").hide();
	$("#results").hide();
	clearGamePage();
    $("#gl-canvas").css("background", "url(texture/completelevel.jpg)");
}

function quit() {
	$(".end").hide();
	$("#results").hide();
	clearGamePage();
    $(".begin").show();
    $(".new").hide();
    $("#gl-canvas").css("background", "url(texture/newbeach.jpg)");
}

function clearGamePage(){ //clear game page to display other bg
	grid = Array(maxRows+1);
    rowCnt = 0;
    curBall.x = 0;
    curBall.y = 0;
    curBall.dx = 0;
    curBall.dy = 0;
    rabbitAngle = 0;

	clearInterval(timer);
	enableKeyControls = false;
    music.pause();
	music = backgroundMusic;
	music.currentTime = 0;
	music.play();
}

function restart() {
    $(".end").hide();
    $("#results").show();
		gamePlay = true;
    goal = 15 + level*5; //goal num increases as level goes up
    balls = 30; //always allocate 30 balls at beginning of each level

    grid = Array(maxRows+1);
    rowCnt = 0;
    curBall.x = 0;
    curBall.y = 0;
    curBall.dx = 0;
    curBall.dy = 0;
    rabbitAngle = 0;

    clearInterval(timer);
    enableKeyControls = true;
    for(var i=0; i<6; i++){
			newRow();
	}
    $(".continue").hide();
    $("#newstart-button").hide();
    $(".new").hide();
    music.pause();
    music = gameMusic;
    music.currentTime = 0;
    music.play();
    $("#gl-canvas").css("background", "url(texture/beachrabbit.jpg)");
}

document.addEventListener('keydown', function(event) {
	if(enableKeyControls) {
		if(event.keyCode==32){ //spacebar: shoot
	        if(curBall.dy==0){ //so that we can't shoot while ball is moving
	        	shoot();
	        	balls-=1;
	        	if(sound){ //play sound if music is on
	        		shootSound.play();
	        		shootSound.currentTime=0;
	        	}
	        }
		}
		else if(event.keyCode==37){ //left
			if(rabbitAngle<85)
				rabbitAngle+=3;
		}
		else if(event.keyCode==39){ //right
			if(rabbitAngle>-85)
				rabbitAngle-=3;
		}
		else if(event.keyCode==67){ //c: change ball
			var store = curBall.color;
	    curBall.color = nextBall.color;
	    nextBall.color=store;
		}
		else if(event.keyCode==81){ //q: quit
			prelevel=level;
	        level = 1;
	        gameOver();
		}
		else if(event.keyCode==82){ //r: restart
			level = 1;
	    restart();
		}
		else if(event.keyCode==83){ //s: music on/off
			sound = !sound;
	        if (sound)
	       		music.play();
	       	else
	        	music.pause();
		}
	}
});
