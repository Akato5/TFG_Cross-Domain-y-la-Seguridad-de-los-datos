	
/**
 * Librería para lanzar en un iframe, dentro de un elemento Dialog de HTML5, la url indicada por parámetro
 */
var app2app = function() {
	/*******************
	callBackAPP ->Nombre de la función callBack aplicativa -> String ->NO OBLIGATORIO
	parametrosCallBackAPP ->Array de parámetros del callback del aplicativo.(No se pueden introducir namespace)->Array ->NO OBLIGATORIO
	************/
	var fshowModal = function (url, parametros, opciones,callBackAPP,parametrosCallBack) {
		if(url){
			if($ESAPI && $ESAPI.validator().isValidInput("URLContext", url, "URL", url.length, false)){
				parametros = parametros || null;
				opciones = opciones || 'dialogWidth:650px;dialogTop:50px;dialogHeight:450px';
				if (window.HTMLDialogElement){
						var dialog = document.createElement('dialog');
						dialog = document.body.appendChild(dialog);
						dialog.setAttribute('style', opciones.replace(/dialog/gi, ''));
						dialog.innerHTML = '<a href="#" id="dialogClose" >&times;</a><iframe id="dialog-body" src="' + url + '"></iframe>';
						document.getElementById('dialog-body').contentWindow.dialogArguments = parametros;
						document.getElementById('dialogClose').addEventListener('click', function(e) {
							e.preventDefault();
							dialog.close();
						});
						dialog.showModal();
			    
						dialog.addEventListener('close', function() {
							var returnValue = null;
							try{
								returnValue = document.getElementById('dialog-body').contentWindow.returnValue;
							}catch(err){
								// Se ha producido algún problema de crossDomain
							}
							document.body.removeChild(dialog);
							//ejecutar callback
							if(returnValue){
								_executeCallback(returnValue)
							}
						});
				}else {
					if(window.showModalDialog){
						var returnValue=window.showModalDialog(url, parametros, opciones);
						//ejecutar callback
						_executeCallback(returnValue)
					}else{
						alert("1. If you use FireFox: dom.dialog_element.enabled preference (needs to be set to true) \n2. Dialog in Edge is not supported");
					}
							
				}
						
		
				var _executeCallback = function (returnValue){
					if (callBackAPP!=null && typeof(callBackAPP) != "undefined" && callBackAPP!= undefined ){	
						if(parametrosCallBack==null|| typeof(parametrosCallBack) == "undefined" || parametrosCallBack == undefined)
							parametrosCallBack= new Array();
						parametrosCallBack.push(returnValue);
						window[callBackAPP].apply(null,[parametrosCallBack]);
					}
				}
			}
		}
	};

	/*******************
	callBackAPP ->Nombre de la función callBack aplicativa -> String ->NO OBLIGATORIO
	parametrosCallBackAPP ->Array de parámetros del callback del aplicativo. ->NO OBLIGATORIO
	************/
	var closeModal = function (){
		if (window.HTMLDialogElement){
			var dialog = parent.document.getElementsByTagName ('dialog') [0].close();		
		}else{
			window.close();
		}
	};

	return{		
		/************************************************************************************************************************
		* Funciones públicas
		************************************************************************************************************************/ 
		openModal : function (url, parametros, opciones,callBackAPP,parametrosCallBack) {			
				fshowModal(url, parametros, opciones,callBackAPP,parametrosCallBack);
		}
	};
	
}(); 
