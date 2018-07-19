package servlet;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.owasp.esapi.ESAPI;

@WebServlet("/ajax")
public class AjaxServlet extends javax.servlet.http.HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

    public void init(){
    	
    	System.out.println("***************************************************** Arrancando AjaxServlet");
    }

    /**
     * Solo implementamos el método doPost porque los ficheros solo pueden venir vía post
     * Se encarga de obtener los ficheros y campos enviados, y encaminar al controlador front
     * 
     */
    protected void doPost(HttpServletRequest request,HttpServletResponse response) throws ServletException, IOException {
    	System.out.println("Recibida peticion");
    	try{
    		String datos = request.getParameter("DATOS");    		    		
    		    	
    		String respuesta = "[{'origen':'Soy "+request.getServerPort()+"'}"; 
            if(datos == null || "".equals(datos)) {
            	datos = ",{'warning':'En la petición no había parámetros'}";            	
            }
            respuesta +=datos;
            respuesta +="]";            
            responder(request,response,respuesta);

    	}catch(Throwable th){
    		th.printStackTrace();
    		responder(request,response,"{'Error': 'Se ha producido un error al procesar los datos enviados'}");
    	}                
    } 
    
    public void responder(HttpServletRequest request,HttpServletResponse response, String message){
        PrintWriter writer = null;
		try {
			informarCabeceras(response);
			writer = response.getWriter();
	        writer.println(message);
	        writer.flush();
		} catch (IOException e) {
			e.printStackTrace();
		}finally{
			if(writer != null)
				writer.close();			
		}        
        
    }
    
    public void informarCabeceras(HttpServletResponse response){
		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");        
    }    
        
    
}
