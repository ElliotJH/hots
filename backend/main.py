import sys

from twisted.python import log
from twisted.internet import reactor

from autobahn.twisted import websocket

from game import Game

TICK_RATE = 0.1


class Protocol(websocket.WebSocketServerProtocol):

    def onOpen(self):
        self.factory.register(self)

    def onMessage(self, payload, isBinary):
        if isBinary:
            return

        print(payload.decode('utf8'))

    def connectionLost(self, reason):
        super(Protocol, self).connectionLost(reason)
        self.factory.unregister(self)


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
