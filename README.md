dunirc 0.0.2
============

A HTML5 irc-client, made with websocket and websockify.

support for autojoin, privmsg channel, topic, join, userlist, part, nick.

upcoming support: mode, kick and quit.

you can only chat in the channel so far.


Options
-------
in 0.0.2 dunirc is a jQuery plugin, this is how you can use it:

```
$("#dunirc").dunirc();
```

with options:
```
$("#dunirc").dunirc({
  	  server: "ws://localhost:8089",
	  nick: "dun2",
	  channel: "#test",
	  userlist: "userlist",
	  content: "content",
	  msg: ".msg",
	  topic: "topic",
	  scroll: true
  });

```

commands:
---------
* /join
* /nick
* /topic
* /connect
* /close
* /quit

Good to know
------------
* Tested mostly on a unrealircd server and a little on QuakeNet.
* nick and channel is set in the ircclient.js, this will be fixed as a jQuery lib soon.
* Only tested on firefox 16.0.2 so far.

Known Bugs
----------
* Issues when changing nick or when a user change nick, to update the userlist.

Requirements
------------
You'll need websockify to proxy the websocket to tcp.