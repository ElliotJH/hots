import sys

from twisted.python import log
from twisted.internet import reactor

from autobahn.twisted import websocket

from game import Game

TICK_RATE = 0.01


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
            self.factory.game.receive_message(
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
        self.game = Game()
        self.ticks = 0
        self.tick()

    def tick(self):
        self.ticks += 1
        self.game.tick()
        reactor.callLater(TICK_RATE, self.tick)

    def register(self, connection):
        self.game.add_player(connection)

    def unregister(self, connection):
        self.game.remove_player(connection)


if __name__ == '__main__':
    log.startLogging(sys.stdout)

    factory = Server('ws://0.0.0.0:9000')

    reactor.listenTCP(9000, factory)
    reactor.run()
