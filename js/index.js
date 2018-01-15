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

/*RETURN THE CURRENT DATE IN FUNCTION OF THE TIMESTAMP*/
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
		var canvas = document.getElementById("canvas");
		var confirmation = document.getElementById("confirmation");
		var cancel = document.getElementById("cancel");

		/*VARIABLE THAT STORE IF YES OR NO A BIKE HAS ALREADY BEEN RESERVATED*/
		var reservationStatus = sessionStorage.setItem("reservation", false);

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
				/*IF A BIKE HAS ALREADY BEEN RESERVATED IN THE STATION*/
				if(document.getElementById("addressFooter") && document.getElementById("addressFooter").textContent == address){
					bikesAvailable = stations.available_bikes - 1;
				}else{
					bikesAvailable = stations.available_bikes;
				}
				lastUpdate = getDate(stations.last_update);

				/*REMOVE THE PARAGRAPH BELOW*/
				if(document.getElementById("makeAChoice")){
					document.getElementById("makeAChoice").remove();
				}

				/*DISPLAYS THE INFORMATIONS OF STATIONS*/
				stationStatus.setAttribute("style", "position: absolute; left: 10px;");
				stationStatus = getStationStatus(stationStatus, bikesAvailable, address, numberOfPlaces, lastUpdate);
				stationStatusContainer.appendChild(stationStatus);

				/*BIKE RESERVATION*/
				document.getElementById("reservation").addEventListener("click", function(){
					/*IF A BIKE IS AVAILABLE*/
					if(bikesAvailable!=0 && bikesAvailable != stations.available_bikes - 1){

						stationStatusContainer.style.display = "none";
						canvas = resizeCanvas(canvas);
						canvas.style.display = "block";
						confirmation.style.display = "block";
						cancel.style.display = "block";
						writeInCanvas(canvas, address, numberOfPlaces, bikesAvailable);

						/*IF THE USER WANT TO EXIT THE RESERVATION*/
						document.addEventListener("keyup", function(event){
							if(event.keyCode === 27){
								stationStatusContainer.style.display = "block";
								canvas.style.display = "none";
								confirmation.style.display = "none";
								cancel.style.display = "none";
								clearSignature();
							}
						});
						cancel.addEventListener("click", function(){
							stationStatusContainer.style.display = "block";
							canvas.style.display = "none";
							confirmation.style.display = "none";
							cancel.style.display = "none";
							clearSignature();
						});

						/*DECLARE VARIABLE FOR COUNTDOWN*/
						var countdown;
						/*IF THE USER WANT TO CONFIRM THE RESERVATION*/
						confirmation.addEventListener("click", function(){
							/*IF THE USER HAS SIGNED BEFORE CONFIRM*/
							var signature = hasSigned();
							if(signature){
								/*RESET THE COUNTDOWN IF A RESERVATION HAS ALREADY BEEN MADE BEFORE*/
								clearInterval(countdown);

								reservationStatus = true;
								displayReservationStatus(reservationStatus, address);
								countdown = setInterval(function(){
									doCountdown(countdown);
								}, 1000);

								/*UPDATE THE NUMBER OF BIKES AVAILABLE IN THE STATION*/
								stationStatus = getStationStatus(stationStatus, bikesAvailable - 1, address, numberOfPlaces, lastUpdate);
								stationStatusContainer.appendChild(stationStatus);

								stationStatusContainer.style.display = "block";
								canvas.style.display = "none";
								confirmation.style.display = "none";
								cancel.style.display = "none";
								clearSignature();

							}
						});
					}
				});
			});
		});

		/*DISPLAY THE RESERVATION STATUS*/
		displayReservationStatus(reservationStatus, address);

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

/*FUNCTION THAT RETURN THE STATION STATUS*/
function getStationStatus(stationStatus, bikesAvailable, address, numberOfPlaces, lastUpdate){
	stationStatus.innerHTML = "";
	if(bikesAvailable > 1){
		stationStatus.innerHTML = "<p style='height: 5vh; width: 24vw;'><u>Adresse</u> : " + address + "</p> <br><p>" + numberOfPlaces + " places <br>" + bikesAvailable + " vélos disponibles</p> <br><p>Dernière mise à jour : " + lastUpdate + "</p><br><br> <div style='position: absolute; left: 50%; transform: translate(-50%, 0);'><button id='reservation'>Réserver</button></div>";
	}else{
		stationStatus.innerHTML = "<p style='height: 5vh; width: 24vw;'><u>Adresse</u> : " + address + "</p> <br><p>" + numberOfPlaces + " places <br>" + bikesAvailable + " vélo disponible</p> <br><p>Dernière mise à jour : " + lastUpdate + "</p><br><br> <div style='position: absolute; left: 50%; transform: translate(-50%, 0);'><button id='reservation'>Réserver</button></div>";
	}
	return stationStatus;
}

/*FUNCTION THAT DISPLAY THE RESERVATION STATUS IN THE FOOTER*/
function displayReservationStatus(reservationStatus, address){
	var footer = document.querySelector("footer");
	if(reservationStatus){
		footer.innerHTML = "<h3>1 vélo a été reservé à la station : <span id='addressFooter'>" + address +"</span><br> Durée restante : <span id='countdown'>20 min 0 s<span>";

	}else{
		footer.innerHTML = "<h3>Aucun vélo n'a été reservé.</h3>";	
	}
}

/*COUNTDOWN FUNCTION (SET TO 20 MIN)*/
function doCountdown(countdown){
	/*COLLECT THE REMAINING TIME IN THE COUNTDOWN*/
	var time = document.getElementById("countdown").textContent;
	minutes = time.substr(0, 2);
	seconds = time.substr(6, 3);

	seconds = seconds - 1;

	if(seconds < 0){
		minutes = minutes - 1;
		seconds = 59;
	}

	document.getElementById("countdown").textContent = minutes + " min " + seconds + " s";

	if(minutes == 0 && seconds == 0){
		stopCountdown(countdown);
	}
}

/*FUNCTION THAT STOP THE COUNTDOWN*/
function stopCountdown(countdown){
	clearInterval(countdown);
	displayReservationStatus(false, false);
}

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
/*DEFINTION OF THE FUNCTION REDRAW*/
function redraw(){
	//context.clearRect(0, 0, canvas.width, canvas.height);

	context.strokeStyle = "#323232";
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

/*DEFINTION OF A FUNCTION THAT RESIZE THE CANVAS ACCORDING TO THE GOOGLE MAPS DIMENSIONS AND TO THE VIEWPORT DIMENSIONS*/
function resizeCanvas(canvas){
	canvas.setAttribute('width', $(window).width() + "px");
	canvas.setAttribute('height', $(window).height()*0.85 + "px");
	return canvas;
}

/*FUNCTION THAT DISPLAY THE INFORMATION OF THE WANTED STATION FOR BIKE RESERVATION*/
function writeInCanvas(canvas, address, numberOfPlaces, bikesAvailable){
	var details = "Détails de la station";
	var reservation = "Pour réserver votre vélo, veuillez signer en dessinant sur l'espace grisé.";

	context.font = "15px Cabin";
	context.strokeText(details, 10, 25);
	context.fillText("Adresse : " + address, 10, 50);
	context.fillText(numberOfPlaces + " places", 10, 75);
	context.fillText("Réservation d'un vélo.", 10, 150);
	context.strokeText(reservation, 10, 250);
	if(bikesAvailable < 2){
		context.fillText(bikesAvailable + " vélo disponible", 10, 100);
	}else{
		context.fillText(bikesAvailable + " vélos disponibles", 10, 100);
	}
}

/*FUNVTION THAT CLEAR THE SIGNATURE FROM THE CANVAS*/
function clearSignature(){
	clickX.length = 0;
	clickY.length = 0;
	clickDrag.length = 0;
}

/*FUNCTION THAT ALLOWS TO KNOW IF THE USER HAS SIGNED*/
function hasSigned(){
	if(clickY.length != 0 || clickX.length != 0){
		return true;
	}else{
		return false;
	}
}