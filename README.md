dunirc 0.0.1
============

A HTML5 irc-client, made with websocket and websockify.

support for autojoin, privmsg channel, topic, join, userlist, part, nick.

upcoming support: mode, kick and quit.

you can only chat in the channel so far.

Good to know
------------
* Tested mostly on a unrealircd server and a little on QuakeNet.
* nick and channel is set in the ircclient.js, this will be fixed as a jQuery lib soon.
* Only tested on firefox 16.0.2 so far.

commands:
---------
* /join
* /nick
* /topic
* /connect
* /close
* /quit

Requirements
------------
You'll need websockify to proxy the websocket to tcp.