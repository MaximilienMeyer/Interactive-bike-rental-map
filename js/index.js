/*--------------------------------- JAVASCRIPT --------------------------------*/

var slideIndex=1;
showSlides(slideIndex);

//PREVIOUS AND NEXT CONTROL
function plusSlides(n){
	showSlides(slideIndex += n);
}

//SLIDESHOW IMAGES CONTROL
function currentSlide(n){
	showSlides(slideIndex = n);
}

function showSlides(n){
	var i;

	//PICK UP SLIDES AND DOTS
	var slides = document.getElementsByClassName("slides");
	var dots = document.getElementsByClassName("dot");

	if(n>slides.length){
		slideIndex = 1;
	}
	if(n<1){
		slideIndex = slides.length;
	}
	for(i=0; i<slides.length; i++){
		slides[i].style.display="none";
	}
	for(i=0; i<dots.length; i++){
		dots[i].className = dots[i].className.replace("active", "");
	}
	slides[slideIndex-1].style.display = "block";
	dots[slideIndex-1].className += " active";

	/*HIDE THE PREVIOUS BUTTON ON FIRST SLIDE*/
	if(slideIndex === 1){
		document.getElementById("previous").style.display="none";
	}else{
		document.getElementById("previous").style.display="initial";	
	}
}

function getDate(lastUpdate){
	/*CREATION OF A NEW JS DATE OBJECT BASED ON THE TIMESTAMP*/
	var date = new Date(lastUpdate);
	var day = date.getDate();
	var month = date.getMonth() + 1;
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();

	/*IF THE DAY, MONTH, HOURS, MINUTES OR SECONDES CONTAINS ONLY ONE DIGIT*/
	if(day.toString().length < 2){
		day = "0" + day;
	}if(month.toString().length < 2){
		month = "0" + month;
	}if(hours.toString().length < 2){
		hours = "0" + hours;
	}if(minutes.toString().length < 2){
		minutes = "0" + minutes;
	}if(seconds.toString().length < 2){
		seconds = "0" + seconds;
	}

	var lastUpdate = "Le " + day + "/" + month + "/" + year + " à " + hours + "h" + minutes + "m" + seconds + "s";
	return lastUpdate;
}

/*GOOGLE MAP API INITIALIZATION WITH FOCUS ON LYON CITY HALL*/
function initMap(){
	var map = new google.maps.Map(document.getElementById("mapContainer"), {
		center: {
			lat: 45.767710,
			lng: 4.835717
		},
		zoom: 15
	});

	/*INITIALIZATION OF VELIB STATIONS MARKERS ACCORDING TO OPENDATA API OF LYON CITY*/
	/*COLLECT VELIB STATIONS*/
	ajaxGet("https://api.jcdecaux.com/vls/v1/stations?contract=Lyon&apiKey=fd8428f1882bf69ecc2e394cce1412d7962e8ab5", function(response){

		var marker, address, numberOfPlaces, bikesAvailable, lastUpdate;
		var stationStatusContainer = document.getElementById("stationStatus");
		var stationStatus = document.createElement("div");

		var stations = JSON.parse(response);
		stations.forEach(function(stations){
			lat = stations.position.lat;
			lng = stations.position.lng;

			/*CREATION OF MARKER FOR EACH VELIB STATION*/
			marker = new google.maps.Marker({
			position: {
				lat: lat,
				lng: lng
			},
			map: map
			});

			/*LISTEN TO A CLICK EVENT ON A MARKER*/
			marker.addListener('click', function(){
				/*COLLECT INFORMATIONS OF STATION*/
				address = stations.address;
				numberOfPlaces = stations.bike_stands;
				bikesAvailable = stations.available_bikes;
				lastUpdate = getDate(stations.last_update);

				/*REMOVE THE PARAGRAPH BELOW*/
				if(document.getElementById("makeAChoice")){
					document.getElementById("makeAChoice").remove();
				}

				/*DISPLAYS THE INFORMATIONS OF STATIONS*/
				stationStatus.innerHTML = "";
				if(bikesAvailable > 1){
					stationStatus.innerHTML = "<p style='height: 5vh; width: 24vw;'><u>Adresse</u> : " + address + "</p> <br><p>" + numberOfPlaces + " places <br>" + bikesAvailable + " vélos disponibles</p> <br><p>Dernière mise à jour : " + lastUpdate + "</p><br><br> <div style='position: absolute; left: 50%; transform: translate(-50%, 0);'><button id='reservation'>Réserver</button></div>";
				}else{
					stationStatus.innerHTML = "<p style='height: 5vh; width: 24vw;'><u>Adresse</u> : " + address + "</p> <br><p>" + numberOfPlaces + " places <br>" + bikesAvailable + " vélo disponible</p> <br><p>Dernière mise à jour : " + lastUpdate + "</p><br><br> <div style='position: absolute; left: 50%; transform: translate(-50%, 0);'><button id='reservation'>Réserver</button></div>";
				}
				stationStatus.setAttribute ("style", "position: absolute; left: 10px;");
				stationStatusContainer.appendChild(stationStatus);
			});

		});

		/*IF NO MARKER HAS BEEN CLICKED*/
		if(!address){
			var paragraph = document.createElement("p");
			paragraph.setAttribute("id", "makeAChoice");
			paragraph.setAttribute ("style", "text-align: center");
			paragraph.textContent = "Veuillez choisir une station en cliquant sur un marqueur de la carte.";
			stationStatusContainer.appendChild(paragraph);
		}
	});
}

/*BIKE RESERVATION*/
/*HIDE THE CANVAS UNTIL THE RESERVATION BUTTON HAS NOT BEEN SELECTED*/
var canvas = document.getElementById("canvas");
canvas.style.display = "none";


/*--------------------------------- JQUERY ----------------------------------*/

/*ARROW KEYS SLIDESHOW CONTROL*/
$(document).on('keyup', function(event){
	//IF THE LEFT ARROW (KEY CODE = 37) HAS BEEN PRESSED ON A SLIDE DIFFERENT THAN THE FIRST ONE
	if(event.which === 37 && slideIndex != 1){
		plusSlides(-1);
	//IF THE RIGHT ARROW (KEY CODE = 39) HAS BEEN PRESSED
	}if(event.which === 39){
		plusSlides(1);
	}
});

/*SIGNATURE WITH CANVAS API FOR RESERVATION*/
var context = document.getElementById("canvas").getContext("2d");

/*IF THE USER CLICK ON THE CANVAS, RECORD THE POSITION IN AN ARRAY WITH THE ADDCLICK FUNCTION*/
/*THE VARIABLE PAINT IS SET TO TRUE*/
/*AND REDRAW THE CANVAS*/
$('#canvas').mousedown(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
		
  paint = true;
  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
  redraw();
});

/*IF THE USER IS PRESSING DOWN THE MOUSE BUTTON (PAINT = TRUE), RECORD THE VALUE ON THE MOVEMENT AND RERDRAW THE CANVAS*/
$('#canvas').mousemove(function(e){
  if(paint){
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
    redraw();
  }
});
/*IF THE MARKER IF OUT OF THE PAPER (USER STOP PRESSING BUTTON OR LEAVE THE CANVAS AREA)*/
$('#canvas').mouseup(function(e){
  paint = false;
});
$('#canvas').mouseleave(function(e){
  paint = false;
});
/*DEFINTION OF THE ADDCLICK FUNCTION THAT SAVE THE CLICK POSTIONS*/
var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

function addClick(x, y, dragging){
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}
/*DEFINTION OF THE FUNCTION REDRAW THAT CLEAR THE CANVAS AND REDRAW IT*/
function redraw(){
 context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;
			
  for(var i=0; i < clickX.length; i++) {		
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
     }else{
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.stroke();
  }
}