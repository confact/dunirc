/**
 * Place your JS-code here.
 */
$(function(){
  'use strict';
  
  var input = $(".msg");
  var log = $("#content");
  var logdiv = $(".content");
  var userlist = $("#userlist");
  var topic = $("#topic");
  var closed = false;
  var ws, timer;
  var users = new Array();
  var serverurl;

  var retries = 0;  
  var inlogcheck = true;
  
  //Settings
  var nick = "dun2";
  var ch = '#test'; 

  
  function wsconnect() {
            status('connecting...',false);
            ws = new WebSocket("ws://localhost:8089", "base64");

            ws.onopen = function() {
                status( 'connected\n',false);
                retries = 0;
                //ws.send( 'JOIN ' + ch +'\n' );
                //output( 'send: JOIN ' + ch + '\n' );
            };
            ws.onmessage = function(content) {
            	var e = window.atob(content.data);
            	var array = e.split(" ");
            	var server = array[0];
            	var nickname = array[0].split("!")[0].replace(":", "");
            	var action = array[1];
            	var userchannel = array[2];
            	if(array[3] != undefined) {
            		var param = array[3].substr(1,array[3].length) + " ";
            		for(var i = 4;i<array.length;i++)
            		{
            			param += array[i] + " ";
            		}
            	}
            	console.log(e);
            	console.log(action);
            	console.log(param);
                if ( e.match( /^PING (\S*)/i ) ) {
                    send( 'PONG ' + RegExp.$1 + '\n' );
                    status( '*PING*PONG*',false );
                }
                if(e.indexOf("Found your hostname") != -1 || e.indexOf("No Ident response") != -1) {
                	if(inlogcheck) {
	                	send( 'NICK '+nick+' \n');
	                	send( 'USER '+nick+' banankorv MP  : dunirc \n');
	                	status( 'Identifying',false );
	                	serverurl = server;
	                	inlogcheck = false;
	                }
                }
                if(param != undefined && param.indexOf("MODE "+nick+" :+i") != -1) {
                	send( 'JOIN ' + ch +'\n' );
                }
                if(action == "JOIN" && nickname == nick) {
                	mejoin(e);
                	
                } else if(action == "JOIN" && nickname != nick) {
                	status( nickname + " joined " + ch,false);
	                users.push(nickname);
	                genereateuserlist();
                }
                if(action == "PART" && nickname != nick) {
                	if(param != undefined) {
	                	status(nickname + " lefted " + ch +": "+param, false);
                	}
                	else {
	                	status(nickname + " lefted " + ch, false);
                	}
	                users.splice(users.indexOf(nickname), 1);
	                genereateuserlist();
                }
                if(action == "TOPIC") {
                	topic.text(ch+": "+param);
                		status("topic changed to: " + param + "(by " + nickname + ")");
                }
                if(action == "NICK") {
                	var newnick = userchannel.replace(":","");
                	users[users.indexOf(nickname)] = newnick;
                	genereateuserlist();
                	status(nickname +" changed nick to " + newnick, true);
                }
                if(action == "PRIVMSG") {
                	privmsg(nickname, param);
                }
                
            };
            ws.onclose = function() {
                status( 'websocket disconnected', false);
                retryOpeningWebSocket();
            };
            if (timer)
                clearTimeout(timer);
                timer = setInterval( ping, 100000 );
    }
    
    function mejoin(e) {
    	var foundit = false;
	    var topicvar = "";
        console.log("Fixing userlist");
        var newmsg = e.split("\r\n:");
        newmsg = newmsg[1].split(" ");
        console.log(newmsg);
        if(newmsg[1] == "MODE") {
	        status("created " + ch +" with this options: " + newmsg[3], false);
	        var newmsg = e.split("\r\n:");
	         	newmsg = newmsg[2].split(" ");
        }
        else {
        	if(newmsg[3] != "=" && newmsg[3] != "@")
        	{
            	topic.text(ch+": ");
            	
            	for(var i = 4;i<newmsg.length;i++)
            	{
                			topicvar += newmsg[i].replace(":", "") + " ";
                			
                }
                topic.append(topicvar);
                var newmsg2 = e.split("\r\n:");
                newmsg2 = newmsg2[2].split(" ");
                console.log(newmsg2);
                if(newmsg2[3] == "=" || newmsg2[3] == "@")
                {
	                		newmsg = e.split("\r\n:");
	                		newmsg = newmsg2[3].split(" ");
	                		foundit = true;
	            }
	            var newmsg3 = e.split("\r\n:");
	            newmsg3 = newmsg3[3].split(" ");
	            console.log(newmsg3);
	            if(newmsg3[3] == "=" || newmsg3[3] == "@")
	            {
	                		newmsg3 = e.split("\r\n:");
	                		newmsg = newmsg3[3].split(" ");
	                		foundit = true;
	            }
	        }
	        else if(newmsg[3] == "=" || newmsg[3] == "@") {
         	 	if(!foundit) {
	         		var newmsg = e.split("\r\n:");
	         		newmsg = newmsg[1].split(" ");
	         	}
	        }
	     }
                	
	     for(var i = 5;i<newmsg.length;i++)
	     {
		                var user = newmsg[i];
		                console.log(user);
		                user = user.replace(":", "");
		                users.push(user);
		                
	     }
	     if(topicvar != "") {
		     status("joined " + ch + " - Topic: "+topicvar, false);
	     }
	     else {
	     	status("joined " + ch, false);
	     }
	     genereateuserlist();
    }
    function retryOpeningWebSocket(){
    	if (retries < 2 && !closed) {            
        	setTimeout(wsconnect, 1000);            
        	retries++;
        }
    }
    
    function privmsg(nick, msg) {
    	var escaped = msg.replace( /&/, '&amp;', 'g' ).replace( /</, '&lt;', 'g' ).
                replace( />/, '&gt;', 'g' ).replace( /"/, '&quot;', 'g' );
	    var today=new Date();
        var h=today.getHours();
        var m=today.getMinutes();
        var s=today.getSeconds();
        output( "<tr><td>"+h+":"+m+":"+s +"</td><td> &lt;" + nick+'&gt; </td><td>' + escaped+"</td></tr>");
    }
    function status(msg, showclock) {
    	var escaped = msg.replace( /&/, '&amp;', 'g' ).replace( /</, '&lt;', 'g' ).
                replace( />/, '&gt;', 'g' ).replace( /"/, '&quot;', 'g' );
	    if(showclock) {
		    var today=new Date();
		    var h=today.getHours();
        	var m=today.getMinutes();
        	var s=today.getSeconds();
        	output( "<tr><td>"+h+":"+m+":"+s +"</td><td></td><td>" + escaped+"</td></tr>");
	    }
	    else {
		    output( "<tr><td></td><td></td><td>" + escaped+"</td></tr>");
	    }
    }
    function output(str) {
            log.append(str);
            logdiv.scrollTop(logdiv.height());
    }
    
    function genereateuserlist() {
    	users.sort();
    	userlist.html("");
	    $.each(users, function() { 
		    userlist.append("<tr><td>"+this+"</td></tr>");
  		});
    }
    
    function ping() {
            if (ws.readyState === undefined || ws.readyState > 1) {
            	 output("keeping connection alive");
	             send( '' );
            }  
    }
    
    function part() {
	    send( 'part ' + ch + '\n' );
        status( 'lefted ' + ch + '\n',false );
        users = new Array();
    }
    
    function close() {
    	inlogcheck = true;
    	closed = true;
    	users = new Array();
    	genereateuserlist();
    	log.html();
	    ws.close();
	    status( 'disconnected \n',false );
    }
    
    function send(data) {
    	var msg = window.btoa(data);
	    ws.send(msg);
    }
    
    
    
    input.keypress(function(event) {
      if (event.which == 13) {
        event.preventDefault();
    		if ( input.val() == '' )
                return;
            if ( input.val().match( /^\/nick (.*)/i ) ) {
            	nick = RegExp.$1;
                send( 'nick ' + nick + '\n' );
            } else if ( input.val().match( /^\/quote (.*)/i ) ) {
                send( RegExp.$1 + '\n' );
                output( 'raw send: ' + RegExp.$1 + '\n' );
            } else if ( input.val().match( /^\/quit(.*)/i ) ) {
                send( 'quit :' + (RegExp.$1 || 'Shagadelic') + '\n' );
            } else if ( input.val().substring(0, 5) == "/join") {
            	var variable = input.val().split(" ")[1];
                part();
                ch = variable;
                send( 'JOIN ' + ch + '\n' );
                console.log(RegExp.$1 + " - ch: " + ch);
            } else if ( input.val().substring(0, 5) == "/join") {
            
            } else if(input.val().substring(0, 6) == "/close" || input.val().substring(0, 5) == "/quit") {
	            close();
            } else if(input.val().substring(0, 8) == "/connect" || input.val().substring(0, 7) == "/server" && closed) {
	            wsconnect();
            } else {
                send( 'privmsg ' + ch + ' :' + input.val() + '\n' );
                privmsg(nick, input.val());
            }
            input.val('');
            try{ input.focus(); } catch(e) { };
       }
     });
     input.focus();
     wsconnect();
});