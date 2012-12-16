/**
 * dunirc jQuery plugin
 */
(function(){
  'use strict';
  
  $.fn.dunirc = function(options) {
  
  var defaults = {
  	  server: "ws://localhost:8089",
	  nick: "dun2",
	  channel: "#test",
	  userlist: "userlist",
	  content: "content",
	  msg: ".msg",
	  topic: "topic",
	  scroll: true
  };
  
  var options = $.extend(defaults, options);
  
  
  var input;
  var log;
  var logdiv;
  var userlist;
  var topic;
  var closed = false;
  var ws, timer;
  var users = new Array();
  var serverurl;

  var retries = 0;  
  var inlogcheck = true;


  return this.each(function () {
  	 var obj = $(this);
  	 var topics = $("<div>").addClass("span10").attr('id', 'topic');
  	 topics.text("No Topic");
  	 
  	 var row = $("<div>").addClass("row");
  	 var content = $("<div>").addClass("span9 "+options.content);
  	 var contentTable = '<table class="table table-striped"><tbody id="'+options.content+'"></tbody></table>';
  	 content.append(contentTable);
  	 var userlistdiv = $("<div>").addClass("span2 "+options.userlist);
  	 var userTable = '<table class="table table-striped"><tbody id="'+options.userlist+'"></tbody></table>';
  	 userlistdiv.append(userTable);
  	 
  	 var msg = '<div class="write"><form action="#" id="'+options.msg.replace(".","").replace("#","")+'"><input type="text" value="" class="'+options.msg.replace(".","").replace("#","")+'" /></form></div>';
  	 
  	 row.append(content);
  	 row.append(userlistdiv);
  	 
  	 obj.html(topics).append(row).append(msg);
  	 //setup the objs
  	 input = $(options.msg);
  	 log = $("#"+options.content);
  	 logdiv = $("."+options.content);
  	 userlist = $("#"+options.userlist);
  	 topic = $("#"+options.topic);
  	 
  	 //fix input
  	 input.keypress(function(event) {
      if (event.which == 13) {
        event.preventDefault();
    		if ( input.val() == '' )
                return;
            if ( input.val().match( /^\/nick (.*)/i ) ) {
            	options.nick = RegExp.$1;
                send( 'nick ' + options.nick + '\n' );
            } else if ( input.val().match( /^\/quote (.*)/i ) ) {
                send( RegExp.$1 + '\n' );
                output( 'raw send: ' + RegExp.$1 + '\n' );
            } else if ( input.val().match( /^\/quit(.*)/i ) ) {
                send( 'quit :' + (RegExp.$1 || 'Shagadelic') + '\n' );
            } else if ( input.val().substring(0, 5) == "/join") {
            	var variable = input.val().split(" ")[1];
                part();
               options.channel= variable;
                send( 'JOIN ' +options.channel+ '\n' );
                console.log(RegExp.$1 + " - ch: " + options.channel);
            } else if ( input.val().substring(0, 5) == "/join") {
            
            } else if(input.val().substring(0, 6) == "/close" || input.val().substring(0, 5) == "/quit") {
	            close();
            } else if(input.val().substring(0, 8) == "/connect" || input.val().substring(0, 7) == "/server" && closed) {
	            wsconnect();
            } else if(input.val().substring(0, 6) == "/topic" || input.val().substring(0, 6) == "/title") {
            	var paramer = "";
            	var array = input.val().split(" ");
            	for(var i = 1;i<array.length;i++)
            	{
            			paramer += array[i] + " ";
            	}
	            send( 'topic ' +options.channel+ ' :' + paramer + '\n' );
            } else {
                send( 'privmsg ' +options.channel+ ' :' + input.val() + '\n' );
                privmsg(options.nick, input.val());
            }
            input.val('');
            try{ input.focus(); } catch(e) { };
       }
     });
  	 
  	 //fix the last thign and start the conenction
	 input.focus();
     wsconnect();
     return this;
  });
  
  function wsconnect() {
            status('connecting...',false);
            ws = new WebSocket(options.server, "base64");

            ws.onopen = function() {
                status( 'connected\n',false);
                retries = 0;
                //ws.send( 'JOIN ' +options.channel+'\n' );
                //output( 'send: JOIN ' +options.channel+ '\n' );
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
	                	send( 'NICK '+options.nick+' \n');
	                	send( 'USER '+options.nick+' banankorv MP  : dunirc \n');
	                	status( 'Identifying',false );
	                	serverurl = server;
	                	inlogcheck = false;
	                }
                }
                if(param != undefined && param.indexOf("MODE "+options.nick+" :+i") != -1) {
                	send( 'JOIN ' + options.channel +'\n' );
                }
                if(action == "JOIN" && nickname == options.nick) {
                	mejoin(e);
                	
                } else if(action == "JOIN" && nickname != options.nick) {
                	status( nickname + " joined " + options.channel,false);
	                users.push(nickname);
	                genereateuserlist();
                }
                if(action == "PART" && nickname != options.nick) {
                	if(param != undefined) {
	                	status(nickname + " lefted " +options.channel+": "+param, false);
                	}
                	else {
	                	status(nickname + " lefted " + options.channel, false);
                	}
	                users.splice(users.indexOf(nickname), 1);
	                genereateuserlist();
                }
                if(action == "TOPIC") {
                	topic.text(options.channel+": "+param);
                		status("topic changed to: " + param + "(by " + nickname + ")");
                }
                if(action == "NICK") {
                	var newnick = userchannel.replace(":","");
                	console.log(nickname);
                	console.log(newnick);
                	var snabela = false;
                	var index = jQuery.inArray(nickname, users);
                	if(index == -1)
                	{
	                	index = jQuery.inArray("@"+nickname, users);
	                	snabela = true;
                	}
                	
                	console.log(index);
                	if(index != -1) {
                		if(snabela) { users[index] = "@" + newnick; } else { users[index] = newnick; }
                		genereateuserlist();
                		status(nickname +" changed nick to " + newnick, true);
                		if(nickname == options.nick) {
                			options.nick = newnick;
                		}
                	}
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
	        status("created " +options.channel+" with this options: " + newmsg[3], false);
	        var newmsg = e.split("\r\n:");
	         	newmsg = newmsg[2].split(" ");
        }
        else {
        	if(newmsg[3] != "=" && newmsg[3] != "@")
        	{
            	topic.text(options.channel+": ");
            	
            	for(var i = 4;i<newmsg.length;i++)
            	{			
            				if(i == 4) {
	            				topicvar += newmsg[i].replace(":", "") + " ";
            				}
            				else {
	            				topicvar += newmsg[i] + " ";
            				}
                			
                			
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
		     status("joined " +options.channel+ " - Topic: "+topicvar, false);
	     }
	     else {
	     	status("joined " + options.channel, false);
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
        output( "<tr><td>"+h+":"+m+":"+s +"</td><td> &lt;" + nick+'&gt; </td><td id="message">' + escaped+"</td></tr>");
    }
    function status(msg, showclock) {
    	var escaped = msg.replace( /&/, '&amp;', 'g' ).replace( /</, '&lt;', 'g' ).
                replace( />/, '&gt;', 'g' ).replace( /"/, '&quot;', 'g' );
	    if(showclock) {
		    var today=new Date();
		    var h=today.getHours();
        	var m=today.getMinutes();
        	var s=today.getSeconds();
        	output( "<tr><td>"+h+":"+m+":"+s +"</td><td COLSPAN='2'>" + escaped+"</td></tr>");
	    }
	    else {
		    output( "<tr><td COLSPAN='3'>" + escaped+"</td></tr>");
	    }
    }
    function output(str) {
        log.append(str);
        if(options.scroll) {
        	var offsettopp = logdiv[0].scrollHeight;
        	console.log(offsettopp);
            logdiv.scrollTop(offsettopp);
        }
    }
    
    function genereateuserlist() {
    	users.sort();
    	userlist.html("");
	    $.each(users, function() { 
		    userlist.append('<tr><td><div class="dropdown">'+
    '<a class="dropdown-toggle" id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="/page.html">'+
    this+
    '<b class="caret"></b>'+
    '</a>'+
    '<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">'+
    '<li><a href="#">kick</a></li>'+
    '<li><a href="#">ban</a></li>'+
    '</ul>'+
    '</div></td></tr>');
  		});
    }
    
    function ping() {
            if (ws.readyState === undefined || ws.readyState > 1) {
            	 output("keeping connection alive");
	             send( '' );
            }  
    }
    
    function part() {
	    send( 'part ' +options.channel+ '\n' );
        status( 'lefted ' +options.channel+ '\n',false );
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
   }
})(jQuery);