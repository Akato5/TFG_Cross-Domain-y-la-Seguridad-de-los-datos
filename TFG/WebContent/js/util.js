/*
 * Librería de utilidades para nuestras ventanas Index.html y child.html
 */
	var callServer = function (){
		var url=document.getElementById('urlAjax').value;
		var parametros = document.getElementById('parametros').value;
		var callBack = "callBackAPP";
		client2server.ajax(url,parametros,callBack);
	}
	
	var openModal = function (){
		var url=document.getElementById('url').value;
		var callBack = "callBackAPP";
		app2app.openModal(url, null, null,callBack);						
	}	
	
	var openInNewTab = function (sw) {
		try{
			var url=document.getElementById('url').value;
			html2html.lanzarUrl(url,sw);
		}catch(err){
			console.log("Error al lanzar URL");
		}
	}
	
	
	var callBackAPP = function (args){		
		alert("La respuesta del servidor es :"+args);
	}
	
	var devolverDatos = function (){
		var resp = {'origen':'Hola! Soy :'+document.location.origin};
		return resp;
	}
	
   var init = function (){
	    Base.esapi.properties.logging['ApplicationLogger'] = {
	        Level: org.owasp.esapi.Logger.ALL,
		    Appenders: [ new Log4js.ConsoleAppender() ],
	        LogUrl: true,
	        LogApplicationName: true,
	        EncodingRequired: true
	    };

	Base.esapi.properties.application.Name = "TFG";

	org.owasp.esapi.ESAPI.initialize();	   
	
   }
   
   // Función que asegura que inserta en el documento el origen del mismo
   var origen = function (){
	   document.write($ESAPI.encoder().encodeForHTML("Mi Origen es :"+document.location.origin));	   
   }
   
   // Función encargada de visualizar una u otra pestaña (Websocket - PostMessage y SW - AJAX)
   var openTab = function (evt, tabName) {
		var i, tabcontent, tablinks;
		tabcontent = document.getElementsByClassName("tabcontent");
		for (i = 0; i < tabcontent.length; i++) {
			tabcontent[i].style.display = "none";
		}
		tablinks = document.getElementsByClassName("tablinks");
		for (i = 0; i < tablinks.length; i++) {
			tablinks[i].className = tablinks[i].className.replace(" active", "");
		}
		document.getElementById(tabName).style.display = "block";
		evt.currentTarget.className += " active";
	} 
	

	var miCallBack = function (datosPadre, misDatos){
		var respuesta = JSON.stringify(datosPadre);	
		alert("Los datos devueltos son :" + respuesta);
		if(misDatos){
			var respuesta2 = JSON.stringify(misDatos);
			alert("Y estos eran mis datos :" + respuesta2);
		}
		
	}

	var recibirDatos = function (destino){
		var datosEntrada=document.getElementById('datos_entrada').value;
		// función que quiero ejecutar en el destino
		var litFuncion = 'devolverDatos';
		// identifico mi función de callback
		var litmiCallBack = 'miCallBack';
		
		html2html.ejecutarFuncion(destino,litFuncion,litmiCallBack,datosEntrada,1000);
		
	}

	var ejecutarFuncion = function (destino){
		var datosEntrada=document.getElementById('datos_entrada').value;
		// función que quiero ejecutar en el destino
		var litFuncion = 'devolverDatos';
		// identifico mi función de callback
		var litmiCallBack = 'miCallBack';
		
		var respuesta = null;
		
		try{
			if(destino[litFuncion] && typeof (destino[litFuncion]) == "function"){
				if(datosEntrada!=null)
					respuesta = destino[litFuncion].apply(null,[datosEntrada]);
				else
					respuesta = destino[litFuncion].call();
				
				if(respuesta)
					window[litmiCallBack].apply(null,[respuesta]);
				else
					window[litmiCallBack].call();				
			}
		}catch(err){
			console.log("Se ha producido un error :" + err.message);
		}					
	}		
	