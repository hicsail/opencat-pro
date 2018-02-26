server.route({
    path: '/cards',
    method: 'GET',
    handler: function (request, reply) {

        reply.view('cards', { 
            posts: getPosts(), 
            cards: getCards()
        });
    }
});

const getPosts = function (request, reply) {

    ...
    reply(posts);
};

const getCards = function (request, reply) {

    ...
    reply(cards);
};

server.route({
    path: '/cards',
    method: 'GET',
    config: {
        pre: [
            [
                { method: getPosts, assign: 'posts' },
                { method: getCards, assign: 'cards' }
            ]
        ],
        handler: function (request, reply) {

            reply.view('cards', { 
                posts: request.pre.posts, 
                cards: request.pre.cards
            });
        }
    },
});