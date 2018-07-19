/**
 * Librería encargada de la comunicación AJAX y mediante WebSockets
 * 
 */
var client2server = function() {
	var webSocket = new WebSocket("ws://localhost:8080/TFG/websocketendpoint");

	var textarea = "";
	var message = "";
	
	var inicializar = function () {
		textarea = document.getElementById("area");
		textarea.value = "";
		message = document.getElementById("message");				
	}	
	
	//Nos aseguramos de que el documento este cargado para recuperar los elementos
	document.addEventListener('DOMContentLoaded', inicializar());
	

	
	var timeOutPeticiones = 5000;
	var almacenTimeOutsPeticiones=[];
	var contadorIdentificadorTimeOut=0;
	
	/**************************************	
	 * Función que se ejecuta nada más cargarse la librería y que se registra a los diferentes eventos websockets
	 * 
	 ***************************************/
	var registroEventos = function(){		
		webSocket.onopen = function(event){ wsOpen(event);};
		webSocket.onmessage = function(message){ wsGetMessage(message);};
		webSocket.onerror = function(event){ wsError(event);};
		webSocket.onclose = function(event){ wsClose(event);};		
	}();

	/**************************************
	 * Función que se ejecuta cuando se abre la conexión con el websocket configurado
	 * 
	 ***************************************/
	var wsOpen = function(event){
		textarea.value += "Conectado ... \n";
	}
	/**************************************
	 * Función para enviar un mensaje al websocket
	 * 
	 ***************************************/
	var fwsEnviaMensaje = function (){
		webSocket.send(message.value);
		textarea.value += "Enviado : " + message.value + "\n";
		message.value = "";
	}
	/**************************************
	 * Función para desconectar la comunicación websocket
	 * 
	 ***************************************/
	var fwsDesconecta = function (){
		webSocket.close();
	}
	/**************************************
	 * Método que se ejecuta cuando recibimos un mensaje desde el websocket
	 * 
	 ***************************************/
	var wsGetMessage = function (message){
		if(message && message.data)
			textarea.value += "Recibido : " + message.data + "\n";
	}
	/**************************************
	 * Método invocado siempre que se cierre la conexión con el servidor
	 * 
	 ***************************************/
	var wsClose = function (event){
		textarea.value += "Desconectado ... \n";
	}
	/**************************************
	 * Método invocado en caso de cualquier error en el websocket
	 * 
	 ***************************************/
	var wsError = function (event){
		var mensaje = "Error!! \n";
		textarea.value += mensaje
	}

	/**************************************
	*	Método que genera la estructura para realizar solicitudes. Esta estructura debe ser igual en todas las solicitudes
	*
	***************************************/
	var crearParametrosSolicitud = function(callBackAPP,timeOut){
		var parametrosSolicitud = {};
		parametrosSolicitud["callBackAPP"]=(callBackAPP!=undefined)?callBackAPP:null;
		parametrosSolicitud["timeOut"]=(timeOut!=undefined)?timeOut:null;
		return parametrosSolicitud;
	}	
	
	/**************************************
	*	Método que cancela la petición realizada al finalizar el tiempo de timeOut y ejecuta la callBack aplicativa con el error de timeout.
	*	
	***************************************/
	var abortarPeticion = function (callBackApp,idTimeout,request){
		eliminarTimeOut(idTimeout);
		if(request!=null){
			request.abort();
			request=null;
		}
		var jsonObject={};
		jsonObject.error="TimeOut. Ha ocurrido un problema con la petición.";
		var respuesta=JSON.stringify(jsonObject);
		if(callBackApp)
			ejecutarCallBack(callBackApp,[respuesta]);	
	}
	
	/**************************************
	 * Función encargada de ejecutar las callback aplicativas
	 * 
	 ***************************************/	
	var ejecutarCallBack = function (callBackApp,datos){
		if(datos && datos != "")
			window[callBackApp].apply(null,datos);
		else
			window[callBackApp].call();
	}
	
	/**************************************
	*	Método encargado de eliminar el timeOut. En caso de que el retorno sea false significa que ha sido liberado ya.
	*			Retorno: Si NO elimina: false
	*						SI elimina: true
	*
	***************************************/
	var eliminarTimeOut = function (idTimeOut){
		if(almacenTimeOutsPeticiones[idTimeOut]==null){
			return false;
		}
		clearTimeout(almacenTimeOutsPeticiones[idTimeOut]);
		almacenTimeOutsPeticiones[idTimeOut]=null;
		delete almacenTimeOutsPeticiones[idTimeOut];
		return true;
	}
	/**************************************
	*	Método que proporciona un nuevo identificador cada vez que es llamado.
	*	Este método es el encargado de generar un id nuevo a cada timeOut
	*
	***************************************/
	var getNewIdTimeOut = function (){
		contadorIdentificadorTimeOut=contadorIdentificadorTimeOut+1;
		return contadorIdentificadorTimeOut;
	}	
	
	/**************************************
	*	Genera el objeto HttpObject
	*
	***************************************/
	var fgetHttpObjectHTML = function () {
		
		var xmlhttp=null;
		if (window.XMLHttpRequest){
			xmlhttp = new XMLHttpRequest();
		}else if (window.ActiveXObject){
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return xmlhttp;
	}
	
	/**************************************
	*	Función invocada para manejar el cambio de estado de la request. Ante un cambio con un httpstatus entre 200 y 400 realizamos
	*	la llamada a la función callback especificada.
	*
	***************************************/
	var fgetReadyStateHandlerHTML = function (req,callbackApp,idTimeOut){
			return function (){
			  	if (req.readyState == 4){
					if (req.status >= 200 && req.status < 400){
						var eliminado=eliminarTimeOut(idTimeOut);
						// Si ya se ejecuto la callBack por un timeout, eliminado es false.
						if(eliminado){
							if(callbackApp){
								if(req.responseText)
									ejecutarCallBack(callbackApp,[req.responseText]);
								else
									ejecutarCallBack(callbackApp,null);
							}
						}
					}else if(req.status==0){
						// No hacemos nada. Se puede dar por varios casos. Dejamos salir por timeout
					}else{
						var eliminado=eliminarTimeOut(idTimeOut);
						// Si ya se ejecuto la callBack por un timeout, eliminado es false.
						if(eliminado){
							var jsonObject={};
							var respuesta=[];
							jsonObject.error="Error "+req.status;
							respuesta[0]=JSON.stringify(jsonObject);						
							if(callbackApp)
								ejecutarCallBack(callbackApp,respuesta);
						}
					}
					req.onreadystatechange=function(){}
					req.abort();
					req=null;
			   }
		  }
	}	
	
	/**************************************
	*	Función invocada para comprobar si los datos tienen formato JSON
	*	
	***************************************/	
	var comprobarParametrosJSON = function (parametros){
		//Comprobamos que los parámetros sean JSON y los parseamos
		try{
			return JSON.parse(parametros);
		}catch(e){
			var err = new Error("ERROR");
			err.name = 'Error datos';
			err.message = "Error al formatear datos.NO JSON";
			throw err;			
		}
	}
	
	/**************************************
	* Método que nos permite la ejecucion de una peticion AJAX
	* 
	***************************************/
	var htmlPeticionAJAX = function (url,parametros,callBackAPP){
		if($ESAPI && $ESAPI.validator().isValidInput("URLContext", url, "URL", url.length, false)){
			var idTimeout=getNewIdTimeOut();		
			var req=fgetHttpObjectHTML();
			try{
				var datos = null;
				if(parametros){
					// Solo permitimos formato JSON. Lo convertimos a String para el envío
					parametros = comprobarParametrosJSON(parametros);
					parametros = JSON.stringify(parametros);
					datos = "DATOS="+parametros+"&hash="+Math.random();
				}else{
					datos="hash="+Math.random();
				}
					
				req.onreadystatechange=fgetReadyStateHandlerHTML(req,callBackAPP,idTimeout);
				req.open("POST",url,true);
				req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");	
				// incluimos estas cabeceras para no permitir el cacheo
				// HTTP 1.0
				req.setRequestHeader("Pragma", "no-cache");
				// HTTP 1.1
				req.setRequestHeader("Cache-Control", "no-cache");
	
				almacenTimeOutsPeticiones[idTimeout]=setTimeout(function(){abortarPeticion(callBackAPP,idTimeout,req)}, timeOutPeticiones);
				
				req.send(datos);
			}catch (e){
				var err = new Error("ERROR");
				err.name = 'Error Comunicación';
				err.message = "Error al realizar la llamada AJAX";
				throw err;
			}
		}else{
			console.log("La URL informada no era correcta");
		}
	}	

	return{		
		/************************************************************************************************************************
		* Funciones públicas
		* 
		************************************************************************************************************************/ 
		wsEnviaMensaje : function () {
			fwsEnviaMensaje();
		},
		wsDesconecta : function (){
			fwsDesconecta();
		},
		ajax : function (url,parametros,callBackAPP) {
			htmlPeticionAJAX(url,parametros,callBackAPP);
		}
	};
	
}(); 
