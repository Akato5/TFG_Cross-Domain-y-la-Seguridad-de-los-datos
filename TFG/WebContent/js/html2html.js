/**
 * Librería encargada de la comunicación PostMessage y mediante Service Workers
 * 
 */
var html2html = function() {

	/**************************************
	* Variables necesarias para la comunicacion
	* 
	***************************************/
	var timeOutPeticiones = 5000;
	var almacenTimeOutsPeticiones=[];
	var contadorIdentificadorTimeOut=0;
	var contadorIdWindows = 0;
	var almacenFunciones = {};
	var dominiosPermitidos = ["http://localhost:8080","http://localhost:8090"];
	var dominioInvocacion = "http://localhost:8080";
	var dominioRespuesta = "http://localhost:8090";

	/**************************************
	* Literales para registrar las funciones
	* 
	***************************************/
	var lit_funcionDevolverDatos='devolverDatos';
	var lit_funcionEjecutarFuncion = "ejecutarFuncion";
	var lit_funcionObtenerDatosJsonHTMLcallBack = "obtenerDatosJsonHTMLcallBack";	
	
	/**************************************
	*	Método que recibe los mensajes y redirige a la función adecuada
	*
	***************************************/
	var despacharMSG = function (evt){
		if(isOrigenPermitido(evt)){	
			try{
				var mensaje = JSON.parse(evt.data);
			}catch(e){
					/* El campo data del evento no es una cadena JSON válida:
					 * Puede que el mensaje no sea para la funcion despacharMSG de html2html.js y haya que dejarlo pasar
					 * por si hay otra función suscrita al onMessage que lo está esperando. 
					 */
					 
					 /*
					  * Si el evento es nuestro deberá contener informacion en evt.data
					  */
					if(evt.data!=null&&evt.data!=undefined){
					/* html2html.js solo pasará un string (Compatibilidad navegadores antiguos Ej: IE8 */
						if(typeof evt.data == "string"){
						/* 
						 * Se considera que un mensaje procederá de nuestra librería si tiene los campos: "datos" y "callBackLib" o "lit_funcion" 
						 */ 
							if(evt.data.indexOf("datos")!=-1&&((evt.data.indexOf("callBackLib")!=-1)||(evt.data.indexOf("lit_funcion")!=-1))){
								/*
								 * Se entiende que el mensaje procede de nuestra librería y como no es un JSON válido, se lanza un error
								 */
								var err = new Error("ERROR");
								err.name = "Ocurrió un problema al despachar el mensaje";
								err.message = "Ocurrió un problema al despachar el mensaje";
								throw err;
							}/*
							  * Si el mensaje no tiene los campos: "datos" ni "callBackLib" o "lit_funcion", se considera que no ha sido generado por la libreria html2html.js 
							  * y se deja pasar por si lo está esperando otra función suscrita al onmessage
							  */
						}/*
						  * Si el mensaje no es de tipo string (y por tanto, no es compatible con IE8) se entiende que el mensaje no es para esta función, 
						  * por lo que se deja pasar por si lo está esperando otra función suscrita al onmessage
						  */
					}
			
			}
			if(mensaje!=undefined&&mensaje!=null&&mensaje.datos!=undefined&&mensaje.datos!=null){
				var parametrosSolicitud = mensaje.datos;
				
				var funcionAejecutar = null;
				
				if(parametrosSolicitud.respuestaSolicitud!=undefined && parametrosSolicitud.respuestaSolicitud!=null){
					funcionAejecutar=parametrosSolicitud.callBackLib;;
				}else{
					funcionAejecutar=parametrosSolicitud.lit_funcion;
				}
				var respuesta = null;
				
				if(funcionAejecutar!=null && funcionAejecutar!=undefined){
				/* Verificado que el mensaje debe ser procesado por esta función */
					if(funcionAejecutar==lit_funcionDevolverDatos){
						var respuesta = fgetDatosFather(evt.source,parametrosSolicitud,funcionAejecutar);
						mensaje.datos=respuesta;
						devolverRespuesta(evt,mensaje);
					}else if (almacenFunciones[funcionAejecutar] != undefined && almacenFunciones[funcionAejecutar] != null){
						if(parametrosSolicitud!=null)
							almacenFunciones[funcionAejecutar].apply(null,[parametrosSolicitud]);
						else
							almacenFunciones[funcionAejecutar].call();
					}
				}					
				 /*
				  * Si en el mensaje no viene informado ni callBackLib ni lit_funcion, entendemos que el mensaje no debe ser procesado por esta funcion 
				  * y que puede ser esperado por funciones de otra librería, por lo que, se le deja pasar.	
				  */

			}
			/* El mensaje recibido es un JSON pero no tiene los datos que se informan desde nuestra librería, por lo que se entiende que el mensaje no
			 * debe procesarse desde esta función y se le deja pasar porque puede estar siendo esperado por funciones de otra librería.
			 */
		}
	}	

	/**************************************
	*	función que llama a la función aplicativa, y que devuelve los datos de respuesta de esa función
	*
	***************************************/	
	var fgetDatosFather = function(windowIframeOrigen,parametrosSolicitud,funcionAejecutar){
		var datosEntrada={};

		if(funcionAejecutar){
			if(window[funcionAejecutar] && typeof (window[funcionAejecutar]) == "function"){
					datosEntrada = window[funcionAejecutar].call();
			}
		}
		parametrosSolicitud["respuestaSolicitud"]=JSON.stringify(datosEntrada);
		return parametrosSolicitud;
	}
	
	/**************************************
	*	Función que lanza una url mediante un window.open o mediante nuestro service worker
	*
	***************************************/	
	var flanzarUrl = function(url,serviceworker) {		
		if(url && $ESAPI && $ESAPI.validator().isValidInput("URLContext", url, "URL", url.length, false)){
			if(serviceworker && "serviceWorker" in navigator){
				lanzarUrlServiceWorker(url);
			}else{
				var childWin = window.open(url,"TFG");		
			}
		}else{
			var err = new Error("ERROR");
			err.name = "Error parámetro de entrada - Url incorrecta";
			err.message = "Se debe informar obligatorioamente una url";
			throw err;					
		}

	}
	
	/**************************************
	*	Función que lanza la url que se indique mediante Service Worker
	*
	***************************************/
	var lanzarUrlServiceWorker = function(url) {		
			navigator.serviceWorker.register('serviceworker.js').then(function(reg){
				// Solicitamos permisos al usuario para mostrarle notificaciones		
				Notification.requestPermission(function(result) {
							// result = 'allowed' | 'denied' | 'default'
							if (result !== 'denied') {
								navigator.serviceWorker.ready.then(function(registration) {									
									  var options = {
												body: 'Al pulsar se lanzará la Url :' + url,
												data: [url]
											  };                
									
									registration.showNotification('Lanzador de Url´s',options).then(function(NotificationEvent){
										console.log("notificado");
									}).catch(function(reason){
										console.log("ERROR al notificar al serviceWorker"+reason);
									});
								});
							}
						});							
					}).catch(function(reason) {
						console.log("ERROR al registrarse serviceWorker"+reason);
					});			
	}	

	/**************************************
	*	Método ejecutado nada más cargar la librería y que registra nuestro service Worker
	*
	***************************************/
	var registrarServiceWorker = function (){
		if("serviceWorker" in navigator){
			navigator.serviceWorker.register('serviceworker.js').then(function(reg){
				console.log("ServiceWorker registrado");
			}).catch(function(reason) {
				console.log("ERROR al registrarse serviceWorker"+reason);
			});
		}
	}();
	
	/**************************************
	*	Método ejecutado nada más cargar la librería y que se registra al evento message para poder recibir peticiones postMessage
	*
	***************************************/
	var registroEventoMessage = function (){	
		if(window.addEventListener){
			window.addEventListener("message",despacharMSG, false);			
		}else{
			window.attachEvent('onmessage',despacharMSG);
		}
								
		if("serviceWorker" in navigator)
			navigator.serviceWorker.addEventListener('message', despacharMSG);										
	}();
	
	/**************************************
	*	Método ejecutado para dejar de escuchar mensajes postMessage
	*
	***************************************/	
	var desregistroEventoMessage = function (){
		if(window.addEventListener){
			window.removeEventListener("message",despacharMSG, false);
		}else{
			window.detachEvent('onmessage',despacharMSG);
		}
		
		if(navigator.serviceWorker)
			navigator.serviceWorker.removeEventListener('message', despacharMSG);		
	};	

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
	*	Método encargado de comprobar si el origen del mensaje está entre los permitidos
	*	
	***************************************/
	var isOrigenPermitido = function(evt){
		var permitido = false;
		for(var elemento in dominiosPermitidos){
				if(evt.origin == dominiosPermitidos[elemento]){
					permitido = true;
					break;
				}					
		}		
		return permitido;		
	}

	/**************************************
	*	Método que cancela la petición realizada al finalizar el tiempo de timeOut.
	*	Tiene un control del timer para evitar el lanzamiento de la callback en caso de retornar la petición tras el timeOut.
	*	Elimina el timeOut asignado a la petición de la lista de los timer.
	*	
	***************************************/
	var abortarPeticion = function (parametrosSolicitud,request,error){
		eliminarTimeOut(parametrosSolicitud);
		var respuesta=[];
		objetoJSON={};
		if(error!=null && error!=undefined && error!="")
			objetoJSON.error=error;
		else
			objetoJSON.error="TimeOut. Ha ocurrido un problema con la petición.";
		respuesta[0]=objetoJSON;
		parametrosSolicitud["respuestaSolicitud"]=respuesta;
		tratarPeticionCallBackAPP(parametrosSolicitud);
	}
	/**************************************
	*	Método encargado de eliminar el timeOut. En caso de que el retorno sea false significa que ha sido liberado ya.
	*			Retorno: Si NO elimina: false
	*						SI elimina: true
	*	
	***************************************/	
	var eliminarTimeOut = function (parametrosSolicitud){
		var idTimeOut=parametrosSolicitud["timeOut"];
		if(almacenTimeOutsPeticiones[idTimeOut]==null){
			return false;
		}
		clearTimeout(almacenTimeOutsPeticiones[idTimeOut]);
		almacenTimeOutsPeticiones[idTimeOut]=null;
		delete almacenTimeOutsPeticiones[idTimeOut];
		return true;
	}	

	/**************************************
	*	Método que permite devolver una respuesta al origen de un mensaje PostMessage
	*	
	***************************************/
	var devolverRespuesta=function(evt,respuesta){
			var mensaje=JSON.stringify(respuesta);
			//Comprobamos si el origen es una ventana o un Service Worker
			// ventanaDestino solo estará informada en el caso del Service worker
			if(respuesta.datos.ventanaDestino)
				evt.source.postMessage(mensaje);
			else
				evt.source.postMessage(mensaje,dominioRespuesta);
	}

	/**************************************
	* 	Callback genérica para obtención de datos en formato JSON
	*	
	***************************************/
	var obtenerDatosJsonHTMLcallBack=function(respuesta){
		var eliminado=eliminarTimeOut(respuesta);
		// Si ya se ejecuto la callBack por un timeout, eliminado es false.
		if(eliminado){
			respuesta=obtenerDatosRespuestaJsonHTML(respuesta);
			tratarPeticionCallBackAPP(respuesta);
		}
	}

	/**************************************
	* 	Método para obtención de datos en formato JSON
	*	
	***************************************/
	var obtenerDatosRespuestaJsonHTML=function(respuesta){
		var respuestaSolicitud=respuesta["respuestaSolicitud"];
		var datosJSON=null;
		var retorno = [];
		if(respuestaSolicitud!=null && respuestaSolicitud!=undefined && respuestaSolicitud!="")
			datosJSON=JSON.parse(respuestaSolicitud);
		retorno[0]=datosJSON;
		respuesta["respuestaSolicitud"]=retorno;
		return respuesta;
	}
	/****************************************
	*	Método que provoca el lanzamiento de la función de callback informada por el usuario.
	*
	****************************************/
	var tratarPeticionCallBackAPP = function (parametrosSolicitud){
			var callBack=parametrosSolicitud["callBackAPP"];
			var parametrosCallBack=parametrosSolicitud["parametrosCallBackAPP"];
			var parametrosRespuestaSolicitud=parametrosSolicitud["respuestaSolicitud"];
			var parametros=null;
			try{
				if(parametrosRespuestaSolicitud!=undefined && parametrosRespuestaSolicitud!=null){
					parametros=parametrosRespuestaSolicitud;
				}
				if(parametros!=null && parametros.length>0 ){
					parametros=parametrosCallBack?parametros.concat(parametrosCallBack):parametros;
				}else{
					parametros=parametrosCallBack?parametrosCallBack:null;
				}
				if(callBack && window[callBack] && typeof (window[callBack]) == "function"){
					if(parametros!=null)
						window[callBack].apply(null,parametros);
					else
						window[callBack].call();
				}
			}catch(e){
				var err = new Error("ERROR");
				err.name = "Ocurrió un problea con el lanzamiento del callBackAPP";
				err.message = "Ocurrió un problea con el lanzamiento del callBackAPP";
				throw err;
			}
	}
	/********************************
	*	Método que genera la estructura para realizar solicitudes. Esta estructura debe ser igual en todas las solicitudes
	*
	*********************************/
	var crearParametrosSolicitud = function(lit_funcion,callBackLib,callBackAPP,parametrosCallBackAPP,respuestaSolicitud,timeOut,ventanaDestino){
		var parametrosSolicitud = {};
		parametrosSolicitud["lit_funcion"]=(lit_funcion!=undefined)?lit_funcion:null;
		parametrosSolicitud["callBackLib"]=(callBackLib!=undefined)?callBackLib:null;
		parametrosSolicitud["callBackAPP"]=(callBackAPP!=undefined)?callBackAPP:null;
		parametrosSolicitud["parametrosCallBackAPP"]=(parametrosCallBackAPP!=undefined)?parametrosCallBackAPP:null;
		parametrosSolicitud["respuestaSolicitud"]=(respuestaSolicitud!=undefined)?respuestaSolicitud:null;
		parametrosSolicitud["timeOut"]=(timeOut!=undefined)?timeOut:null;
		parametrosSolicitud["ventanaDestino"]=(ventanaDestino!=undefined)?ventanaDestino:null;
		return parametrosSolicitud;
	}
	/********************************
	*	Método que provoca la petición mediante postMessage.
	*
	*********************************/
	var htmlPeticion = function (controlador,lit_funcion,callBackAPP,parametrosCallBackAPP,timeOut,ventanaDestino){
		var idTimeout=getNewIdTimeOut();
		
		var parametrosSolicitud = crearParametrosSolicitud(lit_funcion,lit_funcionObtenerDatosJsonHTMLcallBack, callBackAPP,parametrosCallBackAPP,null,idTimeout,ventanaDestino);
			
		//Si se especifica una función de timeOut se ejecuta junto a su timeOut específico. Evita el tratamiento normal mediante
		//el método abortarPeticion
		var timeoutestablecido = timeOutPeticiones;
		if(timeOut){
			timeoutestablecido = timeOut;			
		}
		almacenTimeOutsPeticiones[idTimeout]=setTimeout(function(){abortarPeticion(parametrosSolicitud,null)}, timeOutPeticiones);
		
		var objJSON={};
		objJSON.literal=lit_funcion;
		objJSON.datos=parametrosSolicitud;
		
		var mensaje=JSON.stringify(objJSON);
		if(controlador){			
			if(navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller === controlador)
				controlador.postMessage(mensaje);
			else
				controlador.postMessage(mensaje,dominioInvocacion);
		}else{
			parametrosSolicitud["respuestaSolicitud"]=null;
			abortarPeticion(parametrosSolicitud,null,"Problema al realizar la comunicación, el destino no existe");
		}
	}	
	
	/********************************
	*	Método que dilucida si se tiene que enviar un postMessage directamente al window destino, o a través de un Service Worker
	*
	*********************************/	
	var fejecutarFuncion = function (windowTarget,funcionAEjecutar,callBackAPP,parametrosCallBackAPP,timeout){
		// Comprobamos que exista la ventana
		if(windowTarget){
			if((typeof windowTarget == "string") && navigator.serviceWorker && navigator.serviceWorker.controller){
				htmlPeticion(navigator.serviceWorker.controller,funcionAEjecutar,callBackAPP,parametrosCallBackAPP,timeout,windowTarget);
			}else if(windowTarget != this){
				htmlPeticion(windowTarget,funcionAEjecutar,callBackAPP,parametrosCallBackAPP,timeout);
			}
		}
	}
	
	/**********************************
	*	Método cuya finalidad es dar de alta las callbacks en una estructura de datos de manera que las tengamos centralizadas.
	*	Con esto podremos realizar la ejecución de la callback a la vuelta de la petición.
	*
	***********************************/
	var altaAlmacenFunciones = function () {
		almacenFunciones[lit_funcionObtenerDatosJsonHTMLcallBack] = obtenerDatosJsonHTMLcallBack;
	}();	
	
	return{		
		/************************************************************************************************************************
		* Funciones públicas
		************************************************************************************************************************/ 
		lanzarUrl : function (url,serviceworker) {
			flanzarUrl(url,serviceworker);
		},
		ejecutarFuncion : function (windowTarget,funcionAEjecutar,callBackAPP,parametrosCallBackAPP,timeout){
			fejecutarFuncion(windowTarget,funcionAEjecutar,callBackAPP,parametrosCallBackAPP,timeout);
		}
	};
	
}(); 	