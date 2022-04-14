
""" 
Will start a websocket server
Create player objects when they connect
"""

from threading import Thread
import time
from twisted.python import log
from twisted.internet import reactor
from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory

import WordManager
import PlayerManager
import Player
import Network
import PacketHandler
import GameManager

def StartServer():
    print("Loading Wordlist..")
    WordManager.LoadWords();

    print("Starting Network..")
    factory = WebSocketServerFactory("ws://localhost:443")
    factory.protocol = Network.Websocket
    # factory.setProtocolOptions(maxConnections=2)

    reactor.listenTCP(443, factory)
    Thread(target=reactor.run, args=(False,)).start()

    '''
    TEST Create a board
    creator = Player.Player(None)
    creator.name = "SERVER"
    GameManager.createBoard(True, 2, "EN", creator)
    '''
    
    while 1:
        time.sleep(0.2)
        
        # update players i.e packet queues
        for player in PlayerManager.GetPlayers():
            if not player.mWebsocket.packetQueue.empty():
                packet = player.mWebsocket.packetQueue.get()
                PacketHandler.Handle(player, packet)
        
        # update players
        PlayerManager.update()
        
        # update boards
        GameManager.update()

        

                    
