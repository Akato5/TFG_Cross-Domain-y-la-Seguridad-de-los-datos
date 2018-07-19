package websocket;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.owasp.esapi.ESAPI;
import org.owasp.esapi.ValidationErrorList;
import org.owasp.esapi.errors.ValidationException;



@ServerEndpoint("/websocketendpoint")
public class WebSocketServlet {
	static List<Session> sesiones = new ArrayList<Session>();
	@OnOpen
	public void onOpen(Session session){
	    sesiones.add(session);
	}

	@OnClose
	public void onClose(Session session){
	    sesiones.remove(session);
	}

	@OnMessage
	public void onMessage(String message, Session session){	   
		
		ValidationErrorList errorV = new ValidationErrorList();
		String inputvalidado = ESAPI.validator().getValidInput("educado", message, "educado", 400, false, errorV);
		
		System.out.println("Message from the client ORIGINAL: " + message + "|VALIDADO :"+ inputvalidado +" and your session is :"+session.getId());
	    for(Session sesion:sesiones) {
	    	try {
	    		if(sesion != session) {
	    			if(inputvalidado != null && !"".equalsIgnoreCase(inputvalidado))
	    				sesion.getBasicRemote().sendText(inputvalidado);
	    			else
	    				System.out.println("No se envía el mensaje :"+errorV.getError("educado").getUserMessage());
	    		}
			} catch (IOException e) {
				e.printStackTrace();
			}
	    }
	}
	
	@OnError	
	public void onError(Throwable e){
	    e.printStackTrace();
	}

	
	
}
