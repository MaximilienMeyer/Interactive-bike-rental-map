function ajaxGet(url, callback){
	var req=new XMLHttpRequest();
	//La requete est asynchrone lorsque le 3ème paramètre vaut "true" ou est absent
	req.open("GET", url);
	//Gestion de l'evenement indiquant la fin de la requete
	req.addEventListener("load", function(){
		//Si le serveur a reussi à traiter la requete
		if(req.status >= 200 && req.status < 400){
			//Appele la fonction callback en lui passant la réponse de la requete
			callback(req.responseText);
		}else{
			//Affichage des informations sur l'echec de traitement de la requete
			console.error(req.status + " " + req.statusText + " " + url);
		}
	});
	req.addEventListener("error", function(){
		//La requete n'a pas réussi à atteindre le serveur
		console.error("Erreur réseau avec l'URL " + url);
	})
	req.send(null);
}

function ajaxPost(url, data, callback, isJson){
	var req = new XMLHttpRequest();
	req.open("POST",url);
	req.addEventListener("load", function(){
		if(req.status >=200 && req.status < 400){
			//APPELLE LA FONCTION CALLBACK EN LUI PASSANT LA REPONSE DE LA REQUETE
			callback(req.responsetText);
		}else{
			console.error(req.status + " " + req.statusText + " " + url);
		}
	});
	req.addEventListener("error", function(){
		console.error("Erreur réseau avec l'URL " + url);
	});
	if(isJson){
		//DEFINIT LE CONTENU DE LA REQUETE COMME ETANT DU JSON
		req.setRequestHeader("Content-Type", "application/json");
		//TRANSFORME LA DONNÉE DU FORMAT JSON VERS LE FORMAT TEXTE AVANT L'ENVOI
		data = JSON.stringify(data);
	}
	req.send(data);
}