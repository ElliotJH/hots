import sys

from twisted.python import log
from twisted.internet import reactor

from autobahn.twisted import websocket

from game import Game


GAME = Game()


class Protocol(websocket.WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        if isBinary:
            print("Binary message received: {0} bytes".format(len(payload)))
        else:
            print("Text message received: {0}".format(payload.decode('utf8')))

        self.sendMessage(payload, isBinary)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))


class Server(websocket.WebSocketServerFactory):

    def __init__(self, url):
        super(self, Server).__init__(
            self,
            url,
            debug=False,
            debugCodePaths=False,
        )

        self.clients = []
        self.ticks = 0
        self.tick()

    def tick(self):
        self.ticks += 1
        self.broadcast('tick')
        reactor.callLater(1, self.tick)


if __name__ == '__main__':
    log.startLogging(sys.stdout)

    factory = Server("ws://0.0.0.0:9000")

    reactor.listenTCP(9000, factory)
    reactor.run()
