/**************************************
*	Función suscruta a la pulsación de una notificación
*   Recupera la url pasada por parámetro. Si existe establece el foco y sino abre una ventana nueva
*
***************************************/
self.addEventListener('notificationclick', function(event) {
    // Close notification.
	var datos = event.notification.data;
	var url = datos[0];
	var found = false;
    event.notification.close();    
	
	event.waitUntil(
			// Solo recuperamos las ventanas - type: 'window'
			  clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(clientList) {	  
				    for (i = 0; i < clientList.length; i++) {
				    	var urlAux = clientList[i].url;
				      if (urlAux.indexOf(url) > -1 ) {
				        found = true;
						clientList[i].focus();				
				        break;
				      }
				    }
				    if(!found){
			             clients.openWindow(url);
			             
			        }
				})	
	);  

});

/**************************************
*	Método que localiza la ventana destino y envía el mensaje
*
***************************************/
function dispatcherMSG(url,datosEnviar){
	if(typeof datosEnviar != "string")
		datosEnviar = JSON.stringify(datosEnviar);
	
		// Solo recuperamos las ventanas - type: 'window'
	  clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(clientList) {	  
		    for (i = 0; i < clientList.length; i++) {
		    	var urlAux = clientList[i].url;
		      if (urlAux.indexOf(url) > -1 ) {
		        clientList[i].postMessage(datosEnviar);			
		        break;
		      }
		    }

		});	

	
}

/**************************************
*	Método que recibe los mensajes y comprueba si el mensaje es para nosotros
*
***************************************/
self.onmessage = function (evt) {
	console.info('Mensaje:', evt.data);
	try{
		var mensaje = JSON.parse(evt.data);
	}catch(e){
		/* El campo data del evento no es una cadena JSON válida:
		 * Puede que el mensaje no sea para la funcion despacharMSG y haya que dejarlo pasar
		 * por si hay otra función suscrita al onMessage que lo está esperando. 
		 */
		 
		 /*
		  * Si el evento es nuestro deberá contener informacion en evt.data
		  */
		if(evt.data!=null&&evt.data!=undefined){
		/* html2html.js solo se pasará un string (Compatibilidad navegadores antiguos Ej: IE8 */
			if(typeof evt.data == "string"){
			/* 
			 * Se considera que un mensaje procederá de nuestra librerías si tiene los campos: "datos" y "callBackLib" o "lit_funcion" 
			 */ 
				if(evt.data.indexOf("datos")!=-1&&((evt.data.indexOf("callBackLib")!=-1)||(evt.data.indexOf("lit_funcion")!=-1))){
					/*
					 * Se entiende que el mensaje procede de nuestra libreria y como no es un JSON válido, se lanza un error
					 */
					err.name = "Ocurrió un problema al despachar el mensaje";
					err.message = "Ocurrió un problema al despachar el mensaje";
					throw err;
				}/*
				  * Si el mensaje no tiene los campos: "datos" ni "callBackLib" o "lit_funcion", se considera que no ha sido generado por nuestra libreria 
				  * y se deja pasar por si lo está esperando otra función suscrita al onmessage
				  */
			}/*
			  * Si el mensaje no es de tipo string (y por tanto, no es compatible con IE8) se entiende que el mensaje no es para esta función, 
			  * por lo que se deja pasar por si lo está esperando otra función suscrita al onmessage
			  */
		}

	}
	if(mensaje!=undefined && mensaje!=null && mensaje.datos!=undefined && mensaje.datos!=null){
		var destino = mensaje.datos.ventanaDestino||null;
		if(destino != null){
			mensaje.datos.ventanaDestino = evt.source.url;
			dispatcherMSG(destino,mensaje);
		}
	}
}
