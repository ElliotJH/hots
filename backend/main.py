import sys

from twisted.python import log
from twisted.internet import reactor

from autobahn.twisted import websocket

from game import Game, Lobby

TICK_RATE = 0.03


class Protocol(websocket.WebSocketServerProtocol):

    def onOpen(self):
        try:
            self.factory.register(self)
        except:
            import traceback
            traceback.print_exc()

    def onMessage(self, payload, isBinary):
        if isBinary:
            return

        try:
            self.factory.lobby.receive_message(
                self,
                payload.decode('utf8'),
            )
        except:
            import traceback
            traceback.print_exc()

    def connectionLost(self, reason):
        try:
            super(Protocol, self).connectionLost(reason)
            self.factory.unregister(self)
        except:
            import traceback
            traceback.print_exc()


class Server(websocket.WebSocketServerFactory):

    def __init__(self, url):
        super(Server, self).__init__(
            url,
            debug=False,
            debugCodePaths=False,
        )

        self.protocol = Protocol
        self.lobby = Lobby()
        self.ticks = 0
        self.tick()

    def tick(self):
        self.ticks += 1
        self.lobby.tick()
        reactor.callLater(TICK_RATE, self.tick)

    def register(self, connection):
        self.lobby.add_player(connection)

    def unregister(self, connection):
        self.lobby.remove_player(connection)


if __name__ == '__main__':
    log.startLogging(sys.stdout)

    factory = Server('ws://0.0.0.0:9000')

    reactor.listenTCP(9000, factory)
    reactor.run()
